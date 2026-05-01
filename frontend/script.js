// ==========================================
// 時計のリアルタイム更新ロジック
// ==========================================
function updateClock() {
    const now = new Date();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const day = days[now.getDay()];
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // HTMLのid要素を探して、現在の時刻に書き換える
    document.getElementById('current-date').textContent = `${year}/${month}/${date} (${day})`;
    document.getElementById('current-time').textContent = `${hours}:${minutes}:${seconds}`;
}

// 1秒に1回、時計の更新処理を実行する
setInterval(updateClock, 1000);
updateClock(); // 画面を開いた瞬間に1回すぐ実行


// ==========================================
// ボタンのクリックイベント処理
// ==========================================

// 「お会計」ボタンが押された時の処理
document.getElementById('checkout-btn').addEventListener('click', () => {
    // 実際にはここに、別画面(checkout)への遷移処理などを書きます
    alert('お会計画面へ移動します（現在準備中）');
});

// 「管理者メニュー」ボタンが押された時の処理
document.getElementById('admin-btn').addEventListener('click', () => {
    // 実際にはここに、パスワード入力画面の表示などを書きます
    alert('管理者メニューを開きます（現在準備中）');
});