<?php
// backend/api/admin_login.php

// セッションを開始（ログイン状態を保持するため）
session_start();

// データベース接続設定を読み込む
require_once '../config/database.php';

// フロントエンド(JavaScript)から送られてきたJSONデータを受け取る
$raw_data = file_get_contents('php://input');
$data = json_decode($raw_data, true);

// 送信されたPINコードを変数に格納（無い場合は空文字）
$pin = isset($data['pin']) ? $data['pin'] : '';

// 画面に返すデータ（初期値は失敗）
$response = ['success' => false, 'message' => ''];

// 入力チェック（空、または4桁ではない場合）
if (empty($pin) || strlen($pin) !== 4) {
    $response['message'] = '4桁の暗証番号を入力してください。';
    echo json_encode($response);
    exit;
}

try {
    // データベースからPINコードが一致する管理者を検索
    $stmt = $pdo->prepare("SELECT id FROM admins WHERE pin_code = :pin LIMIT 1");
    $stmt->execute([':pin' => $pin]);
    $admin = $stmt->fetch();

    if ($admin) {
        // 一致するデータがあればログイン成功
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_id'] = $admin['id'];
        $response['success'] = true;
    } else {
        // 一致しなければログイン失敗
        $response['message'] = 'パスワードが間違っています。';
    }
} catch (PDOException $e) {
    // データベースエラーが発生した場合
    $response['message'] = 'サーバーエラーが発生しました。';
}

// 結果をJSON形式でフロントエンドに返す
header('Content-Type: application/json; charset=utf-8');
echo json_encode($response);
?>