<?php
/**
 * save_share.php — Backend de partage chiffré pour Conductor (RadioTools.be)
 *
 * GET  ?getID=<id>  → Renvoie le blob chiffré du fichier correspondant.
 * POST <JSON>       → Sauvegarde le payload chiffré. Retourne le shareId.
 *
 * Les fichiers sont stockés sous : shares/NomEmission__ID.json
 * Contenu du fichier : { "encryptedPayload": "<base64>" }
 * Le serveur ne peut PAS lire les données (chiffrées côté client, clé dans l'URL #hash).
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Réponse au preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

define('SHARES_DIR', __DIR__ . '/shares/');
define('MAX_AGE_JOURS', 30);

// --- Nettoyage automatique des fichiers de plus de 30 jours ---
function nettoyerAnciensPartages() {
    if (!is_dir(SHARES_DIR)) return;
    $limite = time() - (MAX_AGE_JOURS * 86400);
    foreach (glob(SHARES_DIR . '*.json') as $fichier) {
        if (filemtime($fichier) < $limite) {
            @unlink($fichier);
        }
    }
}

// --- Créer le dossier shares/ si nécessaire ---
if (!is_dir(SHARES_DIR)) {
    if (!mkdir(SHARES_DIR, 0755, true)) {
        http_response_code(500);
        echo json_encode(['erreur' => 'Impossible de créer le dossier shares/.']);
        exit;
    }
}

// Nettoyage à chaque requête (léger)
nettoyerAnciensPartages();

// ============================================================
// MODE GET : ?getID=<id>
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['getID'])) {
    $idBrut = $_GET['getID'];

    // L'ID doit être exactement 32 caractères hexadécimaux
    if (!preg_match('/^[a-f0-9]{32}$/', $idBrut)) {
        http_response_code(400);
        echo json_encode(['erreur' => 'Format d\'ID invalide.']);
        exit;
    }

    // Recherche du fichier correspondant à l'ID
    $correspondances = glob(SHARES_DIR . '*__' . $idBrut . '.json');

    if (empty($correspondances)) {
        http_response_code(404);
        echo json_encode(['erreur' => 'Partage introuvable ou expiré.']);
        exit;
    }

    $contenu = file_get_contents($correspondances[0]);
    if ($contenu === false) {
        http_response_code(500);
        echo json_encode(['erreur' => 'Impossible de lire le fichier.']);
        exit;
    }

    echo $contenu;
    exit;
}

// ============================================================
// MODE POST : Sauvegarder / mettre à jour un partage
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $corps = file_get_contents('php://input');
    $donnees = json_decode($corps, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($donnees)) {
        http_response_code(400);
        echo json_encode(['erreur' => 'Corps JSON invalide.']);
        exit;
    }

    // Champs attendus
    $shareId          = isset($donnees['shareId'])          ? $donnees['shareId']          : null;
    $nomEmission      = isset($donnees['showName'])         ? trim($donnees['showName'])    : '';
    $payloadChiffre   = isset($donnees['encryptedPayload']) ? $donnees['encryptedPayload']  : null;

    if (empty($payloadChiffre)) {
        http_response_code(400);
        echo json_encode(['erreur' => 'Payload chiffré manquant.']);
        exit;
    }

    // Valider le shareId existant si fourni
    if ($shareId !== null && !preg_match('/^[a-f0-9]{32}$/', $shareId)) {
        http_response_code(400);
        echo json_encode(['erreur' => 'Format de shareId invalide.']);
        exit;
    }

    // Sanitize le nom de l'émission pour le nom de fichier
    $nomSanitize = preg_replace('/[^a-zA-Z0-9À-ÿ\s\-]/u', '', $nomEmission);
    $nomSanitize = preg_replace('/\s+/', '_', trim($nomSanitize));
    if (empty($nomSanitize)) {
        $nomSanitize = 'Emission';
    }

    // Si mise à jour : supprimer l'ancien fichier (gère aussi le changement de nom)
    if ($shareId !== null) {
        foreach (glob(SHARES_DIR . '*__' . $shareId . '.json') as $ancienFichier) {
            @unlink($ancienFichier);
        }
    } else {
        // Générer un nouvel ID unique et sécurisé (32 caractères hex)
        $shareId = bin2hex(random_bytes(16));
    }

    // Construire le nom de fichier : NomEmission__ID.json
    $nomFichier = $nomSanitize . '__' . $shareId . '.json';
    $chemin = SHARES_DIR . $nomFichier;

    // Stocker uniquement le payload chiffré (le serveur ne peut pas lire les données)
    $contenu = json_encode(
        ['encryptedPayload' => $payloadChiffre],
        JSON_UNESCAPED_UNICODE
    );

    if (file_put_contents($chemin, $contenu) === false) {
        http_response_code(500);
        echo json_encode(['erreur' => 'Impossible d\'écrire le fichier.']);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        'succes'   => true,
        'shareId'  => $shareId,
        'fichier'  => $nomFichier
    ]);
    exit;
}

// Méthode non autorisée
http_response_code(405);
echo json_encode(['erreur' => 'Méthode non autorisée.']);
