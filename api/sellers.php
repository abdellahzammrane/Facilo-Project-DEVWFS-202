<?php
require __DIR__ . '/../includes/bootstrap.php';

$pdo = getDatabase();

// GET /api/sellers.php?id=3   (profil public + annonces actives du vendeur)
if (method() !== 'GET') {
    fail('Méthode non autorisée.', 405);
}
$id = (int)($_GET['id'] ?? 0);

$stmt = $pdo->prepare('SELECT id, name, company_name, city, website, avatar_url, created_at FROM users WHERE id = ?');
$stmt->execute([$id]);
$seller = $stmt->fetch();
if (!$seller) {
    fail('Vendeur introuvable.', 404);
}

$ads = $pdo->prepare(
    "SELECT a.id, a.title, a.price, a.city, a.created_at,
            (SELECT image_url FROM ad_images WHERE ad_id = a.id ORDER BY id LIMIT 1) AS image
     FROM ads a WHERE a.user_id = ? AND a.status = 'active' AND a.expires_at > NOW() ORDER BY a.created_at DESC"
);
$ads->execute([$id]);
$list = $ads->fetchAll();

ok(['seller' => $seller + ['ads_count' => count($list)], 'ads' => $list]);
