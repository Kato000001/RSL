<?php
// 1. おまじない（これはJSONという形式でデータを返しますよ、という宣言）
header('Content-Type: application/json');

// 2. データベース接続設定ファイルを読み込む
require_once '../config/database.php';

// 3. どの期間のデータが欲しいか受け取る（今はとりあえず「今日(daily)」固定で動かします）
$period = isset($_GET['period']) ? $_GET['period'] : 'daily';

try {
    // 4. データベースに接続
    // 4. データベースに接続
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // --- A. サマリーデータ（上の4つのカード用）の取得 ---
    // 今日の合計金額、客数（取引数）を計算
    $sql_summary = "SELECT 
                        SUM(total_amount) as total_sales, 
                        COUNT(*) as customer_count 
                    FROM transactions 
                    WHERE DATE(created_at) = CURDATE()";
    
    $stmt = $pdo->query($sql_summary);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);

    // --- B. 取引明細（下のテーブル用）の取得 ---
    // 取引時刻、商品名、単価、個数、小計、その取引の合計を取得
    $sql_details = "SELECT 
                        t.created_at as time,
                        d.product_name,
                        d.price,
                        d.quantity,
                        d.subtotal,
                        t.total_amount
                    FROM transactions t
                    JOIN transaction_details d ON t.id = d.transaction_id
                    WHERE DATE(t.created_at) = CURDATE()
                    ORDER BY t.created_at DESC";

    $stmt = $pdo->query($sql_details);
    $details = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. 取得したデータを整理してJavaScriptに送る
    echo json_encode([
        'success' => true,
        'summary' => [
            'sales' => number_format($summary['total_sales'] ?? 0),
            'count' => $summary['customer_count'] ?? 0,
            'average' => $summary['customer_count'] > 0 ? number_format($summary['total_sales'] / $summary['customer_count']) : 0
        ],
        'details' => $details
    ]);

} catch (PDOException $e) {
    // エラーが起きた場合はエラーメッセージを返す
    echo json_encode([
        'success' => false, 
        'error' => "データ取得に失敗しました: " . $e->getMessage()
    ]);
}
?>