<?php
// Chargé en premier par chaque fichier de api/
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/validate.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/cloudinary.php';
require_once __DIR__ . '/../config/db.php';

// Toute erreur non prévue => JSON 500 (le détail va dans les logs Vercel)
set_exception_handler(function (Throwable $e) {
    error_log($e->getMessage());
    fail('Erreur serveur. Consultez les logs Vercel.', 500);
});
