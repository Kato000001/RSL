<?php
header('Content-Type: application/json');
require_once '../config/database.php';

// 1. レジ画面（JavaScript）から送られてきたデータを受け取る
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// データが空っぽだったらエラーを返す
if (!$data) {
    echo json_encode(['success' => false, 'error' => 'データがありません']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ★重要：「トランザクション」の開始
    // （途中でエラーが起きたら、保存を全部取り消すための安全装置です）
    $pdo->beginTransaction();

    // 2. transactions（取引ごとの合計）テーブルに保存する
    $stmt = $pdo->prepare("INSERT INTO transactions (total_amount, tax_amount, received_amount, change_amount) VALUES (:total, :tax, :received, :change)");
    $stmt->execute([
        ':total' => $data['total_amount'],
        ':tax' => $data['tax_amount'],
        ':received' => $data['received_amount'],
        ':change' => $data['change_amount']
    ]);

    // 今保存した取引の「ID（整理番号）」を取得する
    $transaction_id = $pdo->lastInsertId();

    // 3. transaction_details（買った商品の明細）テーブルに保存する
    // 商品は複数ある可能性があるので、ループ（繰り返し）で一つずつ保存します
    $stmt_details = $pdo->prepare("INSERT INTO transaction_details (transaction_id, product_name, price, quantity, subtotal) VALUES (:t_id, :name, :price, :qty, :subtotal)");

    foreach ($data['items'] as $item) {
        $stmt_details->execute([
            ':t_id' => $transaction_id,
            ':name' => $item['name'],
            ':price' => $item['price'],
            ':qty' => $item['qty'],
            ':subtotal' => $item['subtotal']
        ]);
    }

    // ★すべて成功したら、保存を確定（コミット）する！
    $pdo->commit();

    // JavaScriptに「成功したよ！」と返事をする
    echo json_encode(['success' => true, 'message' => '保存完了！']);

} catch (Exception $e) {
    // 途中でエラーが起きたら、保存を取り消す（ロールバック）
    $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => "データベースの保存に失敗しました: " . $e->getMessage()]);
}
?>