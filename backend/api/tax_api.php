<?php
// backend/api/tax_api.php
header('Content-Type: application/json; charset=utf-8');
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

// --- GET: 現在の税率を取得 ---
if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT tax_rate FROM tax_settings ORDER BY id DESC LIMIT 1");
        $row = $stmt->fetch();
        if ($row) {
            echo json_encode(['success' => true, 'tax_rate' => (int)$row['tax_rate']]);
        } else {
            // レコードが無い場合はデフォルト8%を返す
            echo json_encode(['success' => true, 'tax_rate' => 8]);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// --- POST: 税率を更新 ---
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $tax_rate = isset($input['tax_rate']) ? intval($input['tax_rate']) : null;

    if ($tax_rate === null || $tax_rate < 0 || $tax_rate > 99) {
        echo json_encode(['success' => false, 'error' => '税率は0〜99の整数で指定してください']);
        exit;
    }

    try {
        // レコードがあればUPDATE、なければINSERT（UPSERT）
        $stmt = $pdo->query("SELECT COUNT(*) FROM tax_settings");
        $count = $stmt->fetchColumn();

        if ($count > 0) {
            $stmt = $pdo->prepare("UPDATE tax_settings SET tax_rate = :rate, updated_at = CURRENT_TIMESTAMP ORDER BY id DESC LIMIT 1");
        } else {
            $stmt = $pdo->prepare("INSERT INTO tax_settings (tax_rate) VALUES (:rate)");
        }

        $stmt->execute([':rate' => $tax_rate]);
        echo json_encode(['success' => true]);

    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'error' => '不正なリクエストです']);
?>