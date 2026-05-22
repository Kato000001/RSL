<?php
header('Content-Type: application/json; charset=UTF-8');

// データベース接続設定
$host = 'localhost';
$dbname = 'yasaiya_pos'; // 👈 お使いのデータベース名に書き換えてください
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB接続失敗: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// --- 1. 商品一覧の取得 (GET) ---
if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM products ORDER BY product_id ASC");
        $products = $stmt->fetchAll();
        echo json_encode(['success' => true, 'products' => $products]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// --- 2. 商品の追加・変更・削除 (POST) ---
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    if ($action === 'save') {
        $p_id = $input['product_id'] ?? '';
        $name = $input['name'] ?? '';
        $price = intval($input['price'] ?? 0);
        $category = $input['category'] ?? '';
        
        // ⭕ JavaScriptから配列または文字列で届く季節の属性をカンマ区切りの文字列（例: "春,特売"）に変換
        $seasonal_attrs = $input['seasonal_attributes'] ?? '';
        if (is_array($seasonal_attrs)) {
            $seasonal_attrs = implode(',', $seasonal_attrs);
        }

        if (!$p_id || !$name) {
            echo json_encode(['success' => false, 'error' => '商品IDと商品名は必須です']);
            exit;
        }

        try {
            // すでに商品IDが存在するか確認
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE product_id = ?");
            $stmt->execute([$p_id]);
            $exists = $stmt->fetchColumn();

            if ($exists) {
                // 更新 (UPDATE)
                $sql = "UPDATE products SET name = ?, price = ?, category = ?, seasonal_attributes = ? WHERE product_id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$name, $price, $category, $seasonal_attrs, $p_id]);
            } else {
                // 新規追加 (INSERT)
                $sql = "INSERT INTO products (product_id, name, price, category, seasonal_attributes) VALUES (?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$p_id, $name, $price, $category, $seasonal_attrs]);
            }
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'delete') {
        $p_id = $input['product_id'] ?? '';
        if (!$p_id) {
            echo json_encode(['success' => false, 'error' => '商品IDが指定されていません']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM products WHERE product_id = ?");
            $stmt->execute([$p_id]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }
}