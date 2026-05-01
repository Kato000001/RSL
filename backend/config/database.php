<?php
// backend/config/database.php

// データベースの接続情報 (環境に合わせて変更してください)
$host = 'localhost';     // データベースのホスト名
$dbname = 'yasaiya_pos'; // データベース名
$username = 'root';      // MySQLのユーザー名 (XAMPP/MAMP等のデフォルトはroot)
$password = '';          // MySQLのパスワード (環境に合わせて入力)

try {
    // PDOインスタンスの作成
    $pdo = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,        // エラー時は例外を投げる
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,   // データを連想配列で取得
            PDO::ATTR_EMULATE_PREPARES => false,                // SQLインジェクション対策
        ]
    );
} catch (PDOException $e) {
    // 接続エラー時の処理（本来は画面に出さずログに書くのが安全です）
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'データベース接続に失敗しました: ' . $e->getMessage()]);
    exit;
}
?>