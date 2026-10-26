<?php
require __DIR__ . '/../includes/bootstrap.php';

$action = action();
$uid    = require_auth();
$pdo    = getDatabase();

// GET /api/profile.php?action=get
if ($action === 'get' && method() === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT id, name, email, username, company_name, address, phone, city, website, avatar_url, created_at
         FROM users WHERE id = ?'
    );
    $stmt->execute([$uid]);
    ok(['user' => $stmt->fetch()]);
}

// POST /api/profile.php?action=update   (multipart: name?, username?, company_name?, address?, phone?, city?, website?, avatar?)
if ($action === 'update' && method() === 'POST') {
    $d = input();
    $sets = [];
    $params = [];

    if (isset($d['name'])) {
        $name = str($d['name'], 100);
        if ($name === '') {
            fail('Le nom ne peut pas être vide.');
        }
        $sets[] = 'name = ?';
        $params[] = $name;
    }
    if (isset($d['phone'])) { $sets[] = 'phone = ?'; $params[] = str($d['phone'], 30) ?: null; }
    if (isset($d['city']))  { $sets[] = 'city = ?';  $params[] = str($d['city'], 100) ?: null; }
    if (isset($d['username']))     { $sets[] = 'username = ?';     $params[] = valid_username($d['username']); }
    if (isset($d['company_name'])) { $sets[] = 'company_name = ?'; $params[] = str($d['company_name'], 150) ?: null; }
    if (isset($d['address']))      { $sets[] = 'address = ?';      $params[] = str($d['address'], 255) ?: null; }
    if (isset($d['website']))      { $sets[] = 'website = ?';      $params[] = valid_url($d['website']); }

    if (!empty($_FILES['avatar']) && $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE) {
        $sets[] = 'avatar_url = ?';
        $params[] = upload_image($_FILES['avatar'], 'facilo/avatars');
    }

    if (!$sets) {
        fail('Rien à modifier.');
    }
    $params[] = $uid;
    try {
        $pdo->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            fail("Ce nom d'utilisateur est déjà utilisé.", 409);
        }
        throw $e;
    }
    ok(['message' => 'Profil mis à jour.']);
}

// POST /api/profile.php?action=change_password   {current_password, new_password}
if ($action === 'change_password' && method() === 'POST') {
    $d = input();
    require_fields($d, ['current_password', 'new_password']);
    if (strlen((string)$d['new_password']) < 8) {
        fail('Nouveau mot de passe : 8 caractères minimum.');
    }

    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$uid]);
    $hash = $stmt->fetchColumn();
    if (!$hash || !password_verify((string)$d['current_password'], $hash)) {
        fail('Mot de passe actuel incorrect.', 401);
    }

    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash((string)$d['new_password'], PASSWORD_DEFAULT), $uid]);
    ok(['message' => 'Mot de passe modifié.']);
}

fail('Action inconnue.', 404);
