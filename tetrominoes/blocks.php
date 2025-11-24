<?php

/**
 * SCRIPTING2 – Aangeleverde backend voor Tetromino-opdracht
 *
 * Endpoints:
 *   GET  blocks.php
 *        -> alle blokken als JSON
 *
 *   GET  blocks.php?block=L
 *        -> details van één blok (op basis van letter/naam)
 *
 *   POST blocks.php  (Content-Type: application/json of form-data)
 *        -> nieuw blok toevoegen, wordt opgeslagen in blocks.json
 */

// ------------------------------------------------------------
// Basisconfiguratie
// ------------------------------------------------------------

// Pad naar het JSON-bestand met blokdata (consolidated in `data/`)
const BLOCKS_FILE = __DIR__ . '/data/blocks.json';

// Eenvoudige CORS headers zodat je dit ook lokaal kunt testen
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS (preflight) direct afvangen
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// Antwoord altijd als JSON
header('Content-Type: application/json; charset=utf-8');

// ------------------------------------------------------------
// Helper: blocks.json laden of initialiseren
// ------------------------------------------------------------
function loadBlocks(): array
{
  if (!file_exists(BLOCKS_FILE)) {
    // Als het bestand nog niet bestaat: initialiseer met de 7 standaard tetrominoes
    $defaultBlocks = getDefaultBlocks();
    file_put_contents(BLOCKS_FILE, json_encode($defaultBlocks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return $defaultBlocks;
  }

  $raw = file_get_contents(BLOCKS_FILE);
  $data = json_decode($raw, true);

  if (!is_array($data)) {
    // Fallback als JSON corrupt is
    $data = getDefaultBlocks();
  }

  return $data;
}

// ------------------------------------------------------------
// Helper: blocks.json opslaan
// ------------------------------------------------------------
function saveBlocks(array $blocks): bool
{
  return (bool) file_put_contents(
    BLOCKS_FILE,
    json_encode($blocks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
  );
}

// ------------------------------------------------------------
// Default tetromino data (7 blokken)
// ------------------------------------------------------------
function getDefaultBlocks(): array
{
  return [
    [
      'name'        => 'I',
      'color'       => '#00FFFF',
      'description' => 'De I-block is een lange rechte staaf van vier blokjes.',
      'image'       => 'images/Tetromino_I.svg',
      // 4x4 matrix, 1 = blok, 0 = leeg
      'matrix'      => [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    [
      'name'        => 'O',
      'color'       => '#FFFF00',
      'description' => 'De O-block is een vierkant van 2 bij 2 blokjes.',
      'image'       => 'images/Tetromino_O.svg',
      'matrix'      => [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    [
      'name'        => 'T',
      'color'       => '#800080',
      'description' => 'De T-block heeft een T-vorm met drie blokjes op een rij en één in het midden erboven.',
      'image'       => 'images/Tetromino_T.svg',
      'matrix'      => [
        [0, 1, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    [
      'name'        => 'S',
      'color'       => '#00FF00',
      'description' => 'De S-block bestaat uit twee rijen van twee blokjes die verspringen.',
      'image'       => 'images/Tetromino_S.svg',
      'matrix'      => [
        [0, 1, 1, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    [
      'name'        => 'Z',
      'color'       => '#FF0000',
      'description' => 'De Z-block is de spiegeling van de S-block.',
      'image'       => 'images/Tetromino_Z.svg',
      'matrix'      => [
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    [
      'name'        => 'J',
      'color'       => '#0000FF',
      'description' => 'De J-block lijkt op een omgekeerde L met een blokje links onderaan.',
      'image'       => 'images/Tetromino_J.svg',
      'matrix'      => [
        [1, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    [
      'name'        => 'L',
      'color'       => '#FFA500',
      'description' => 'De L-block heeft drie blokjes op een rij met één blokje rechts onderaan.',
      'image'       => 'images/Tetromino_L.svg',
      'matrix'      => [
        [0, 0, 1, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
  ];
}

// ------------------------------------------------------------
// Helper: JSON-body inlezen (voor POST)
// ------------------------------------------------------------
function readJsonBody(): array
{
  $raw = file_get_contents('php://input');
  if (!$raw) {
    return [];
  }

  $data = json_decode($raw, true);
  if (!is_array($data)) {
    return [];
  }

  return $data;
}

// ------------------------------------------------------------
// Router op basis van HTTP-methode
// ------------------------------------------------------------
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
  case 'GET':
    handleGet();
    break;

  case 'POST':
    handlePost();
    break;

  default:
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    break;
}

// ------------------------------------------------------------
// GET handler
// ------------------------------------------------------------
function handleGet(): void
{
  $blocks = loadBlocks();

  // ?block=L -> 1 blok teruggeven
  if (isset($_GET['block']) && $_GET['block'] !== '') {
    $needle = strtoupper(trim($_GET['block']));

    foreach ($blocks as $block) {
      if (strtoupper($block['name']) === $needle) {
        echo json_encode($block, JSON_UNESCAPED_UNICODE);
        return;
      }
    }

    http_response_code(404);
    echo json_encode(['error' => 'Block not found']);
    return;
  }

  // Anders: alle blokken
  echo json_encode($blocks, JSON_UNESCAPED_UNICODE);
}

// ------------------------------------------------------------
// POST handler – nieuw blok toevoegen
// ------------------------------------------------------------
function handlePost(): void
{
  // Ondersteun zowel JSON body als form-data
  $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

  // If JSON body, parse JSON. Otherwise use $_POST (form-data / multipart)
  if (stripos($contentType, 'application/json') !== false) {
    $input = readJsonBody();
  } else {
    $input = $_POST;
  }

  // If matrix came as JSON string in form-data, decode it
  if (isset($input['matrix']) && is_string($input['matrix'])) {
    $decoded = json_decode($input['matrix'], true);
    if (is_array($decoded)) {
      $input['matrix'] = $decoded;
    }
  }

  // Handle uploaded file (optional)
  $uploadedImagePath = '';
  if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
    $u = $_FILES['image_file'];
    // Basic validation
    $allowed = ['image/png','image/svg+xml','image/jpeg','image/gif'];
    $finfoType = mime_content_type($u['tmp_name']);
    if (!in_array($finfoType, $allowed)) {
      http_response_code(400);
      echo json_encode(['error' => 'Ongeldig afbeeldingsformaat']);
      return;
    }

    // Ensure images directory exists
    $imagesDir = __DIR__ . '/images';
    if (!is_dir($imagesDir)) mkdir($imagesDir, 0755, true);

    $ext = pathinfo($u['name'], PATHINFO_EXTENSION);
    $safeBase = preg_replace('/[^A-Za-z0-9._-]/', '_', pathinfo($u['name'], PATHINFO_FILENAME));
    $unique = $safeBase . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $target = $imagesDir . '/' . $unique;

    if (!move_uploaded_file($u['tmp_name'], $target)) {
      http_response_code(500);
      echo json_encode(['error' => 'Kon bestand niet opslaan']);
      return;
    }

    // relative path for client
    $uploadedImagePath = 'images/' . $unique;
  }

  $name        = isset($input['name']) ? strtoupper(trim($input['name'])) : '';
  $color       = isset($input['color']) ? trim($input['color']) : '';
  $description = isset($input['description']) ? trim($input['description']) : '';
  $image       = isset($input['image']) ? trim($input['image']) : '';
  $matrix      = $input['matrix'] ?? null;

  // If we uploaded a file, prefer that path
  if ($uploadedImagePath !== '') {
    $image = $uploadedImagePath;
  }

  // Eenvoudige validatie
  if ($name === '' || $color === '' || $description === '' || $image === '' || $matrix === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields (name, color, description, image, matrix)']);
    return;
  }

  if (!is_array($matrix) || count($matrix) !== 4) {
    http_response_code(400);
    echo json_encode(['error' => 'Matrix must be a 4x4 array']);
    return;
  }

  foreach ($matrix as $row) {
    if (!is_array($row) || count($row) !== 4) {
      http_response_code(400);
      echo json_encode(['error' => 'Matrix must be a 4x4 array']);
      return;
    }
  }

  $blocks = loadBlocks();

  // Check of de naam al bestaat
  foreach ($blocks as $block) {
    if (strtoupper($block['name']) === $name) {
      http_response_code(409);
      echo json_encode(['error' => 'Block with this name already exists']);
      return;
    }
  }

  $newBlock = [
    'name'        => $name,
    'color'       => $color,
    'description' => $description,
    'image'       => $image,
    'matrix'      => $matrix,
  ];

  $blocks[] = $newBlock;

  if (!saveBlocks($blocks)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save data']);
    return;
  }

  http_response_code(201);
  echo json_encode($newBlock, JSON_UNESCAPED_UNICODE);
}
