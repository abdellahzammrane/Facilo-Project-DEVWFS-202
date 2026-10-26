<?php
require __DIR__ . '/../includes/bootstrap.php';

$action = action();
$pdo    = getDatabase();

const AD_STATUSES = ['active', 'sold', 'hidden'];
const AD_LIFETIME_DAYS = 30; // durée de vie d'une annonce, prolongeable

// Annonce appartenant à l'utilisateur, sinon 404/403
function owned_ad(PDO $pdo, int $adId, int $uid): array
{
    $stmt = $pdo->prepare('SELECT * FROM ads WHERE id = ?');
    $stmt->execute([$adId]);
    $ad = $stmt->fetch();
    if (!$ad) {
        fail('Annonce introuvable.', 404);
    }
    if ((int)$ad['user_id'] !== $uid) {
        fail('Action non autorisée.', 403);
    }
    return $ad;
}

function check_category(PDO $pdo, int $categoryId): void
{
    $stmt = $pdo->prepare('SELECT id FROM categories WHERE id = ?');
    $stmt->execute([$categoryId]);
    if (!$stmt->fetch()) {
        fail('Catégorie invalide.');
    }
}

// GET /api/ads.php?action=categories   => catégories avec leurs sous-catégories (children)
if ($action === 'categories' && method() === 'GET') {
    $rows = $pdo->query('SELECT id, name, parent_id FROM categories ORDER BY name')->fetchAll();
    $tree = [];
    foreach ($rows as $r) {
        if ($r['parent_id'] === null) {
            $tree[$r['id']] = ['id' => (int)$r['id'], 'name' => $r['name'], 'children' => []];
        }
    }
    foreach ($rows as $r) {
        if ($r['parent_id'] !== null && isset($tree[$r['parent_id']])) {
            $tree[$r['parent_id']]['children'][] = ['id' => (int)$r['id'], 'name' => $r['name']];
        }
    }
    ok(['categories' => array_values($tree)]);
}

// GET /api/ads.php?action=list&q=&category_id=&city=&min_price=&max_price=&page=&limit=
if ($action === 'list' && method() === 'GET') {
    $page   = max(1, (int)($_GET['page'] ?? 1));
    $limit  = min(50, max(1, (int)($_GET['limit'] ?? 12)));
    $offset = ($page - 1) * $limit;

    // Les annonces expirées ne sont plus visibles
    $where  = ["a.status = 'active'", 'a.expires_at > NOW()'];
    $params = [];

    if (!empty($_GET['q'])) {
        $like = '%' . str($_GET['q'], 100) . '%';
        $where[] = '(a.title LIKE ? OR a.description LIKE ?)';
        array_push($params, $like, $like);
    }
    if (!empty($_GET['category_id'])) {
        $where[] = 'a.category_id = ?';
        $params[] = (int)$_GET['category_id'];
    }
    if (!empty($_GET['city'])) {
        $where[] = 'a.city LIKE ?';
        $params[] = '%' . str($_GET['city'], 100) . '%';
    }
    if (isset($_GET['min_price']) && is_numeric($_GET['min_price'])) {
        $where[] = 'a.price >= ?';
        $params[] = (float)$_GET['min_price'];
    }
    if (isset($_GET['max_price']) && is_numeric($_GET['max_price'])) {
        $where[] = 'a.price <= ?';
        $params[] = (float)$_GET['max_price'];
    }
    $whereSql = implode(' AND ', $where);

    $count = $pdo->prepare("SELECT COUNT(*) FROM ads a WHERE $whereSql");
    $count->execute($params);
    $total = (int)$count->fetchColumn();

    $stmt = $pdo->prepare(
        "SELECT a.id, a.title, a.price, a.city, a.category_id, a.created_at,
                (SELECT image_url FROM ad_images WHERE ad_id = a.id ORDER BY id LIMIT 1) AS image
         FROM ads a WHERE $whereSql
         ORDER BY a.created_at DESC LIMIT $limit OFFSET $offset"
    );
    $stmt->execute($params);

    ok(['ads' => $stmt->fetchAll(), 'page' => $page, 'limit' => $limit, 'total' => $total]);
}

// GET /api/ads.php?action=get&id=12
if ($action === 'get' && method() === 'GET') {
    $id = (int)($_GET['id'] ?? 0);
    $stmt = $pdo->prepare(
        'SELECT a.id, a.title, a.description, a.price, a.city, a.status, a.created_at,
                a.ad_type, a.ad_year, a.expires_at, (a.expires_at <= NOW()) AS expired,
                a.category_id, c.name AS category_name,
                c.parent_id AS parent_category_id, pc.name AS parent_category_name,
                u.id AS seller_id, u.name AS seller_name, u.company_name AS seller_company,
                u.city AS seller_city, u.website AS seller_website, u.avatar_url AS seller_avatar
         FROM ads a
         JOIN users u ON u.id = a.user_id
         JOIN categories c ON c.id = a.category_id
         LEFT JOIN categories pc ON pc.id = c.parent_id
         WHERE a.id = ?'
    );
    $stmt->execute([$id]);
    $ad = $stmt->fetch();

    // Une annonce non active ou expirée n'est visible que par son propriétaire
    $hidden = $ad && ($ad['status'] !== 'active' || (int)$ad['expired'] === 1);
    if (!$ad || ($hidden && (int)$ad['seller_id'] !== current_user_id())) {
        fail('Annonce introuvable.', 404);
    }
    $ad['expired'] = (int)$ad['expired'] === 1;

    $imgs = $pdo->prepare('SELECT id, image_url FROM ad_images WHERE ad_id = ? ORDER BY id');
    $imgs->execute([$id]);
    $ad['images'] = $imgs->fetchAll();

    ok(['ad' => $ad]);
}

// GET /api/ads.php?action=mine   (mes annonces, tous statuts)
if ($action === 'mine' && method() === 'GET') {
    $uid  = require_auth();
    $stmt = $pdo->prepare(
        "SELECT a.id, a.title, a.price, a.city, a.status, a.category_id, a.created_at,
                a.ad_type, a.ad_year, a.expires_at, (a.expires_at <= NOW()) AS expired,
                (SELECT image_url FROM ad_images WHERE ad_id = a.id ORDER BY id LIMIT 1) AS image
         FROM ads a WHERE a.user_id = ? ORDER BY a.created_at DESC"
    );
    $stmt->execute([$uid]);
    ok(['ads' => $stmt->fetchAll()]);
}

// POST /api/ads.php?action=create
//   (multipart: title, description, price, city, category_id [catégorie ou sous-catégorie], ad_type?, ad_year?, images[])
if ($action === 'create' && method() === 'POST') {
    $uid = require_auth();
    $d   = input();
    require_fields($d, ['title', 'description', 'price', 'city', 'category_id']);

    $title = str($d['title'], 150);
    $desc  = str($d['description'], 5000);
    $price = valid_price($d['price']);
    $city  = str($d['city'], 100);
    $cat   = (int)$d['category_id'];
    check_category($pdo, $cat);
    $type  = isset($d['ad_type']) && trim((string)$d['ad_type']) !== '' ? str($d['ad_type'], 50) : null;
    $year  = valid_year($d['ad_year'] ?? null);

    // Upload d'abord : si une image est invalide, rien n'est enregistré
    $urls = [];
    foreach (uploaded_images('images', 5) as $file) {
        $urls[] = upload_image($file, 'facilo/ads');
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'INSERT INTO ads (user_id, category_id, title, description, price, city, ad_type, ad_year, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ' . AD_LIFETIME_DAYS . ' DAY))'
    );
    $stmt->execute([$uid, $cat, $title, $desc, $price, $city, $type, $year]);
    $adId = (int)$pdo->lastInsertId();

    $ins = $pdo->prepare('INSERT INTO ad_images (ad_id, image_url) VALUES (?, ?)');
    foreach ($urls as $url) {
        $ins->execute([$adId, $url]);
    }
    $pdo->commit();

    $exp = $pdo->prepare('SELECT expires_at FROM ads WHERE id = ?');
    $exp->execute([$adId]);
    ok(['id' => $adId, 'images' => $urls, 'expires_at' => $exp->fetchColumn()], 201);
}

// POST /api/ads.php?action=update&id=12   (champs optionnels + images[] ajoutées)
if ($action === 'update' && method() === 'POST') {
    $uid  = require_auth();
    $adId = (int)($_GET['id'] ?? 0);
    owned_ad($pdo, $adId, $uid);
    $d = input();

    $sets = [];
    $params = [];
    if (isset($d['title']))       { $sets[] = 'title = ?';       $params[] = str($d['title'], 150); }
    if (isset($d['description'])) { $sets[] = 'description = ?'; $params[] = str($d['description'], 5000); }
    if (isset($d['price']))       { $sets[] = 'price = ?';       $params[] = valid_price($d['price']); }
    if (isset($d['city']))        { $sets[] = 'city = ?';        $params[] = str($d['city'], 100); }
    if (isset($d['category_id'])) {
        check_category($pdo, (int)$d['category_id']);
        $sets[] = 'category_id = ?';
        $params[] = (int)$d['category_id'];
    }
    if (isset($d['ad_type']))     { $sets[] = 'ad_type = ?';     $params[] = str($d['ad_type'], 50) ?: null; }
    if (isset($d['ad_year']))     { $sets[] = 'ad_year = ?';     $params[] = valid_year($d['ad_year']); }
    if (isset($d['status'])) {
        if (!in_array($d['status'], AD_STATUSES, true)) {
            fail('Statut invalide.');
        }
        $sets[] = 'status = ?';
        $params[] = $d['status'];
    }

    // Nouvelles images (5 au total maximum)
    $cnt = $pdo->prepare('SELECT COUNT(*) FROM ad_images WHERE ad_id = ?');
    $cnt->execute([$adId]);
    $room = max(0, 5 - (int)$cnt->fetchColumn());
    $urls = [];
    foreach (uploaded_images('images', $room) as $file) {
        $urls[] = upload_image($file, 'facilo/ads');
    }

    if ($sets) {
        $params[] = $adId;
        $pdo->prepare('UPDATE ads SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
    }
    $ins = $pdo->prepare('INSERT INTO ad_images (ad_id, image_url) VALUES (?, ?)');
    foreach ($urls as $url) {
        $ins->execute([$adId, $url]);
    }

    if (!$sets && !$urls) {
        fail('Rien à modifier.');
    }
    ok(['message' => 'Annonce mise à jour.', 'new_images' => $urls]);
}

// POST /api/ads.php?action=extend&id=12   (prolonger de 30 jours à la demande de l'annonceur)
// Si l'annonce est encore valide, +30 jours s'ajoutent à la date d'expiration ; si elle est expirée, 30 jours à partir de maintenant.
if ($action === 'extend' && method() === 'POST') {
    $uid  = require_auth();
    $adId = (int)($_GET['id'] ?? 0);
    owned_ad($pdo, $adId, $uid);
    $pdo->prepare(
        'UPDATE ads SET expires_at = DATE_ADD(GREATEST(expires_at, NOW()), INTERVAL ' . AD_LIFETIME_DAYS . ' DAY) WHERE id = ?'
    )->execute([$adId]);
    $exp = $pdo->prepare('SELECT expires_at FROM ads WHERE id = ?');
    $exp->execute([$adId]);
    ok(['message' => 'Annonce prolongée.', 'expires_at' => $exp->fetchColumn()]);
}

// POST /api/ads.php?action=delete_image&id=5   (id = id de la ligne ad_images)
if ($action === 'delete_image' && method() === 'POST') {
    $uid  = require_auth();
    $stmt = $pdo->prepare(
        'SELECT i.id FROM ad_images i JOIN ads a ON a.id = i.ad_id WHERE i.id = ? AND a.user_id = ?'
    );
    $stmt->execute([(int)($_GET['id'] ?? 0), $uid]);
    if (!$stmt->fetch()) {
        fail('Image introuvable.', 404);
    }
    $pdo->prepare('DELETE FROM ad_images WHERE id = ?')->execute([(int)$_GET['id']]);
    ok(['message' => 'Image supprimée.']);
}

// POST /api/ads.php?action=delete&id=12
if ($action === 'delete' && method() === 'POST') {
    $uid  = require_auth();
    $adId = (int)($_GET['id'] ?? 0);
    owned_ad($pdo, $adId, $uid);
    $pdo->prepare('DELETE FROM ads WHERE id = ?')->execute([$adId]); // images + favoris supprimés en cascade
    ok(['message' => 'Annonce supprimée.']);
}

fail('Action inconnue.', 404);
