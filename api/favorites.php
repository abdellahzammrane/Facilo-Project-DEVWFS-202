<?php
require __DIR__ . '/../includes/bootstrap.php';

$action = action();
$uid    = require_auth();
$pdo    = getDatabase();

// GET /api/favorites.php?action=list   (annonces favorites, pour favorites.html)
if ($action === 'list' && method() === 'GET') {
    $stmt = $pdo->prepare(
        "SELECT a.id, a.title, a.price, a.city, a.status, a.created_at,
                (SELECT image_url FROM ad_images WHERE ad_id = a.id ORDER BY id LIMIT 1) AS image
         FROM favorites f JOIN ads a ON a.id = f.ad_id
         WHERE f.user_id = ? AND a.status = 'active' AND a.expires_at > NOW()
         ORDER BY f.created_at DESC"
    );
    $stmt->execute([$uid]);
    ok(['ads' => $stmt->fetchAll()]);
}

// GET /api/favorites.php?action=ids   (juste les ids, pour colorer les coeurs)
if ($action === 'ids' && method() === 'GET') {
    $stmt = $pdo->prepare('SELECT ad_id FROM favorites WHERE user_id = ?');
    $stmt->execute([$uid]);
    ok(['ids' => array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN))]);
}

// POST /api/favorites.php?action=toggle   {ad_id}  => ajoute ou retire
if ($action === 'toggle' && method() === 'POST') {
    $d = input();
    require_fields($d, ['ad_id']);
    $adId = (int)$d['ad_id'];

    $exists = $pdo->prepare('SELECT id FROM ads WHERE id = ?');
    $exists->execute([$adId]);
    if (!$exists->fetch()) {
        fail('Annonce introuvable.', 404);
    }

    $del = $pdo->prepare('DELETE FROM favorites WHERE user_id = ? AND ad_id = ?');
    $del->execute([$uid, $adId]);
    if ($del->rowCount() > 0) {
        ok(['favorite' => false]);
    }

    $pdo->prepare('INSERT INTO favorites (user_id, ad_id) VALUES (?, ?)')->execute([$uid, $adId]);
    ok(['favorite' => true]);
}

fail('Action inconnue.', 404);
