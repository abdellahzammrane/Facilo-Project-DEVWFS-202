<?php
use Cloudinary\Cloudinary;

// Vérifie puis envoie UNE image à Cloudinary, retourne l'URL sécurisée
function upload_image(array $file, string $folder = 'facilo'): string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        fail('Fichier image invalide.');
    }
    if ($file['size'] > 4 * 1024 * 1024) {
        fail('Image trop lourde (4 Mo max).');
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
        fail('Format accepté : JPG, PNG ou WEBP.');
    }

    $cloudinary = new Cloudinary(getenv('CLOUDINARY_URL'));
    $result = $cloudinary->uploadApi()->upload($file['tmp_name'], ['folder' => $folder]);
    return $result['secure_url'];
}

// Normalise $_FILES['images'] (un ou plusieurs fichiers) en liste de fichiers
function uploaded_images(string $field = 'images', int $max = 5): array
{
    if (empty($_FILES[$field])) {
        return [];
    }
    $f = $_FILES[$field];
    if (!is_array($f['name'])) {
        $f = array_map(fn($v) => [$v], $f);
    }
    $files = [];
    $count = count($f['name']);
    for ($i = 0; $i < $count && count($files) < $max; $i++) {
        if ($f['error'][$i] === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        $files[] = [
            'name'     => $f['name'][$i],
            'tmp_name' => $f['tmp_name'][$i],
            'size'     => $f['size'][$i],
            'error'    => $f['error'][$i],
        ];
    }
    return $files;
}
