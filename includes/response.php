<?php
header('Content-Type: application/json; charset=utf-8');

function json_response(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function ok(array $data = [], int $code = 200): void
{
    json_response(['success' => true] + $data, $code);
}

function fail(string $message, int $code = 400): void
{
    json_response(['success' => false, 'message' => $message], $code);
}

// Corps de la requête : JSON ou formulaire (FormData / x-www-form-urlencoded)
function input(): array
{
    $json = json_decode(file_get_contents('php://input'), true);
    return is_array($json) ? $json : $_POST;
}

function method(): string
{
    return $_SERVER['REQUEST_METHOD'];
}

function action(): string
{
    return $_GET['action'] ?? '';
}
