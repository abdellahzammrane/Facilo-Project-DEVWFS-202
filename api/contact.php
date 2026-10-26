<?php
require __DIR__ . '/../includes/bootstrap.php';

// POST /api/contact.php   {name, email, subject, message}
if (method() !== 'POST') {
    fail('Méthode non autorisée.', 405);
}

$d = input();
require_fields($d, ['name', 'email', 'subject', 'message']);

$email = strtolower(str($d['email'], 150));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('Email invalide.');
}

getDatabase()->prepare(
    'INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)'
)->execute([str($d['name'], 100), $email, str($d['subject'], 150), str($d['message'], 3000)]);

ok(['message' => 'Message envoyé. Merci !'], 201);
