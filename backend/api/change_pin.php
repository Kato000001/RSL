<?php
// backend/api/change_pin.php

session_start();
require_once '../config/database.php';

header('Content-Type: application/json; charset=utf-8');

// ログインチェック
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    echo json_encode(['success' => false, 'message' => '認証されていません。ログインしてください。']);
    exit;
}

$raw_data = file_get_contents('php://input');
$data = json_decode($raw_data, true);

$current_pin = isset($data['current_pin']) ? $data['current_pin'] : '';
$new_pin     = isset($data['new_pin'])     ? $data['new_pin']     : '';

// バリデーション
if (empty($current_pin) || strlen($current_pin) !== 4 || !ctype_digit($current_pin)) {
    echo json_encode(['success' => false, 'message' => '現在のPINが正しくありません。']);
    exit;
}
if (empty($new_pin) || strlen($new_pin) !== 4 || !ctype_digit($new_pin)) {
    echo json_encode(['success' => false, 'message' => '新しいPINは4桁の数字で入力してください。']);
    exit;
}

try {
    // 現在のPINが正しいか確認
    $stmt = $pdo->prepare("SELECT id FROM admins WHERE pin_code = :pin LIMIT 1");
    $stmt->execute([':pin' => $current_pin]);
    $admin = $stmt->fetch();

    if (!$admin) {
        echo json_encode(['success' => false, 'message' => '現在のパスコードが正しくありません。']);
        exit;
    }

    // トランザクション開始：全レコード削除 → 新PINをINSERT
    // これにより、古いPIN・不正に増えたレコードをすべて排除し
    // 新しいPIN1件のみが有効な状態を保証する
    $pdo->beginTransaction();

    $pdo->exec("DELETE FROM admins");

    $stmt = $pdo->prepare("INSERT INTO admins (pin_code) VALUES (:new_pin)");
    $stmt->execute([':new_pin' => $new_pin]);

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'パスコードを変更しました。']);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'データベースエラーが発生しました。']);
}
?>
