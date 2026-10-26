<?php
function str($value, int $max = 255): string
{
    return mb_substr(trim((string)$value), 0, $max);
}

function require_fields(array $data, array $fields): void
{
    foreach ($fields as $f) {
        if (!isset($data[$f]) || trim((string)$data[$f]) === '') {
            fail("Champ obligatoire : $f");
        }
    }
}

function valid_price($value): float
{
    if (!is_numeric($value) || $value < 0 || $value > 99999999) {
        fail('Prix invalide.');
    }
    return round((float)$value, 2);
}

// Année facultative (véhicules, produits...) : entre 1900 et l'année prochaine
function valid_year($value): ?int
{
    if ($value === null || trim((string)$value) === '') {
        return null;
    }
    $y = (int)$value;
    if (!ctype_digit(trim((string)$value)) || $y < 1900 || $y > (int)date('Y') + 1) {
        fail('Année invalide.');
    }
    return $y;
}

// Nom d'utilisateur facultatif : 3 à 30 caractères (lettres, chiffres, _ . -)
function valid_username($value): ?string
{
    $v = trim((string)$value);
    if ($v === '') {
        return null;
    }
    if (!preg_match('/^[A-Za-z0-9_.-]{3,30}$/', $v)) {
        fail("Nom d'utilisateur invalide (3 à 30 caractères : lettres, chiffres, _ . -).");
    }
    return $v;
}

// Site web facultatif : URL http(s) valide
function valid_url($value): ?string
{
    $v = trim((string)$value);
    if ($v === '') {
        return null;
    }
    if (mb_strlen($v) > 255 || !filter_var($v, FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $v)) {
        fail('Site web invalide (doit commencer par http:// ou https://).');
    }
    return $v;
}
