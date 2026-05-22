<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

// 1. レジ画面（JavaScript）から送られてきたデータを受け取る
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// データが空っぽだったらエラーを返す
if (!$data) {
    echo json_encode(['success' => false, 'error' => 'データがありません']);
    exit;
}

try {
    // ⭕ database.php で既に生成されている $pdo インスタンスをそのまま使用します

    // トランザクションの開始
    $pdo->beginTransaction();

    // 2. transactionsテーブルに保存する
    $stmt = $pdo->prepare("INSERT INTO transactions (total_amount, tax_amount, received_amount, change_amount) VALUES (:total, :tax, :received, :change)");
    $stmt->execute([
        ':total'    => $data['total_amount'],
        ':tax'      => $data['tax_amount'],
        ':received' => $data['received_amount'],
        ':change'   => $data['change_amount']
    ]);

    // 取引IDを取得
    $transaction_id = $pdo->lastInsertId();

    // 3. transaction_detailsテーブルに保存する
    $stmt_details = $pdo->prepare("INSERT INTO transaction_details (transaction_id, product_name, price, quantity, subtotal) VALUES (:t_id, :name, :price, :qty, :subtotal)");

    foreach ($data['items'] as $item) {
        $stmt_details->execute([
            ':t_id'     => $transaction_id,
            ':name'     => $item['name'],
            ':price'    => $item['price'],
            ':qty'      => $item['qty'],
            ':subtotal' => $item['subtotal']
        ]);
    }

    // すべて成功したら確定
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => '保存完了！']);

} catch (Exception $e) {
    // エラー時はロールバック
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'error' => "データベースの保存に失敗しました: " . $e->getMessage()]);
}
?>