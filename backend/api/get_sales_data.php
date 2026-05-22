<?php
// 1. おまじない（これはJSONという形式でデータを返しますよ、という宣言）
header('Content-Type: application/json');

// 2. データベース接続設定ファイルを読み込む
require_once '../config/database.php';

// 3. どの期間のデータが欲しいか受け取る（daily = 今日だけ / all = 全期間）
// ⭕ デフォルトは「all」にして、過去データも含めて全て表示されるようにします
$period = isset($_GET['period']) ? $_GET['period'] : 'all';

try {
    // 4. データベースに接続
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ⭕ 選択された期間（period）に応じて、SQLの条件（WHERE句）を動的に切り替える
    $where_clause = "";
    if ($period === 'daily') {
        // 今日だけの場合の条件
        $where_clause = "WHERE DATE(created_at) = CURDATE()";
    } elseif ($period === 'all') {
        // 全期間の場合は条件なし（すべて取得）
        $where_clause = "";
    } else {
        // それ以外（念のためのフォールバック。必要に応じて今月・今週なども追加可能）
        $where_clause = "";
    }

    // --- A. サマリーデータ（上の4つのカード用）の取得 ---
    // 選択された期間の合計金額、客数（取引数）を計算
    $sql_summary = "SELECT 
                        SUM(total_amount) as total_sales, 
                        COUNT(*) as customer_count 
                    FROM transactions 
                    $where_clause";
    
    $stmt = $pdo->query($sql_summary);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);

    // --- B. 取引明細（下のテーブル用）の取得 ---
    // 取引時刻、商品名、単価、個数、小計、その取引の合計を取得
    // ※WHERE句のテーブル名を明示するため、t.created_at に書き換えます
    $where_clause_details = "";
    if ($period === 'daily') {
        $where_clause_details = "WHERE DATE(t.created_at) = CURDATE()";
    }

    $sql_details = "SELECT 
                        t.created_at as time,
                        d.product_name,
                        d.price,
                        d.quantity,
                        d.subtotal,
                        t.total_amount
                    FROM transactions t
                    JOIN transaction_details d ON t.id = d.transaction_id
                    $where_clause_details
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