<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

const TOKEN_DURATION = 7 * 24 * 3600; // 7 jours

function jwt_secret(): string
{
    $secret = getenv('JWT_SECRET');
    if (!$secret) {
        fail('Configuration serveur manquante (JWT_SECRET).', 500);
    }
    return $secret;
}

function create_token(int $userId): string
{
    $now = time();
    return JWT::encode(
        ['sub' => $userId, 'iat' => $now, 'exp' => $now + TOKEN_DURATION],
        jwt_secret(),
        'HS256'
    );
}

function is_https(): bool
{
    return (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
        || (($_SERVER['HTTPS'] ?? '') === 'on');
}

function set_auth_cookie(string $token): void
{
    setcookie('token', $token, [
        'expires'  => time() + TOKEN_DURATION,
        'path'     => '/',
        'secure'   => is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function clear_auth_cookie(): void
{
    setcookie('token', '', [
        'expires'  => time() - 3600,
        'path'     => '/',
        'secure'   => is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

// Retourne l'id de l'utilisateur connecté, ou null
function current_user_id(): ?int
{
    $token = $_COOKIE['token'] ?? null;
    if (!$token) {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.+)/i', $header, $m)) {
            $token = $m[1];
        }
    }
    if (!$token) {
        return null;
    }
    try {
        $decoded = JWT::decode($token, new Key(jwt_secret(), 'HS256'));
        return (int)$decoded->sub;
    } catch (Throwable $e) {
        return null;
    }
}

function require_auth(): int
{
    $id = current_user_id();
    if (!$id) {
        fail('Connexion requise.', 401);
    }
    return $id;
}
