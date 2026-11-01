<?php
require __DIR__ . '/../includes/bootstrap.php';

$action = action();

// POST /api/auth.php?action=register
//   {name, email, password, username?, company_name?, address?, city?, phone?, website?}
if ($action === 'register' && method() === 'POST') {
    $d = input();
    require_fields($d, ['name', 'email', 'password']);

    $name  = str($d['name'], 100);
    $email = strtolower(str($d['email'], 150));
    $pass  = (string)$d['password'];
    $phone = isset($d['phone']) ? str($d['phone'], 30) : null;
    $city  = isset($d['city']) ? str($d['city'], 100) : null;
    $username = valid_username($d['username'] ?? null);
    $company  = isset($d['company_name']) && trim((string)$d['company_name']) !== '' ? str($d['company_name'], 150) : null;
    $address  = isset($d['address']) && trim((string)$d['address']) !== '' ? str($d['address'], 255) : null;
    $website  = valid_url($d['website'] ?? null);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail('Email invalide.');
    }
    if (strlen($pass) < 8) {
        fail('Mot de passe : 8 caractères minimum.');
    }

    $pdo = getDatabase();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO users (name, email, password_hash, phone, city, username, company_name, address, website)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT), $phone, $city,
                        $username, $company, $address, $website]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            if (str_contains($e->getMessage(), 'username')) {
                fail("Ce nom d'utilisateur est déjà utilisé.", 409);
            }
            fail('Cet email est déjà utilisé.', 409);
        }
        throw $e;
    }

    $id = (int)$pdo->lastInsertId();
    set_auth_cookie(create_token($id));
    ok(['user' => ['id' => $id, 'name' => $name, 'email' => $email]], 201);
}

// POST /api/auth.php?action=login   {email, password}  (le champ email accepte aussi le nom d'utilisateur)
if ($action === 'login' && method() === 'POST') {
    $d = input();
    require_fields($d, ['password']);
    $ident = trim((string)($d['email'] ?? $d['username'] ?? ''));
    if ($ident === '') {
        fail('Champ obligatoire : email');
    }
    $byEmail = str_contains($ident, '@');

    $stmt = getDatabase()->prepare(
        'SELECT id, name, email, password_hash, avatar_url FROM users WHERE ' . ($byEmail ? 'email' : 'username') . ' = ?'
    );
    $stmt->execute([$byEmail ? strtolower(str($ident, 150)) : str($ident, 30)]);
    $user = $stmt->fetch();

    if (!$user || !password_verify((string)$d['password'], $user['password_hash'])) {
        fail('Email ou mot de passe incorrect.', 401);
    }

    set_auth_cookie(create_token((int)$user['id']));
    unset($user['password_hash']);
    ok(['user' => $user]);
}

// POST /api/auth.php?action=logout
if ($action === 'logout' && method() === 'POST') {
    clear_auth_cookie();
    ok(['message' => 'Déconnecté.']);
}

// GET /api/auth.php?action=me   (utilisateur connecté, sinon 401)
if ($action === 'me' && method() === 'GET') {
    $uid  = require_auth();
    $stmt = getDatabase()->prepare(
        'SELECT id, name, email, username, company_name, address, phone, city, website, avatar_url, created_at
         FROM users WHERE id = ?'
    );
    $stmt->execute([$uid]);
    $user = $stmt->fetch();
    if (!$user) {
        clear_auth_cookie();
        fail('Utilisateur introuvable.', 401);
    }
    ok(['user' => $user]);
}

fail('Action inconnue.', 404);
