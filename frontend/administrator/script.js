// --- 時計をリアルタイムで動かす処理 ---
function updateClock() {
    const now = new Date();
    
    // 日付のフォーマット (例: 2024/05/20 (月))
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
    const dayOfWeek = daysOfWeek[now.getDay()];
    
    const dateString = `${year}/${month}/${day} (${dayOfWeek})`;
    
    // 時間のフォーマット (例: 14:35:12)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    // HTMLを書き換え
    document.getElementById('current-date').textContent = dateString;
    document.getElementById('current-time').textContent = timeString;
}

// 1秒に1回（1000ミリ秒ごと）時計を更新する
setInterval(updateClock, 1000);
updateClock(); // ページ読み込み時にすぐ1回目を実行


// --- 画面遷移（リンク）の処理 ---

// 「ホームへ」ボタン（一つ上のフォルダにある index.html へ戻る）
document.getElementById('btn-home').addEventListener('click', function() {
    window.location.href = '../index.html';
});

// 「ログアウト」ボタン（同じフォルダにある masterlogin.html へ戻る）
document.getElementById('btn-logout').addEventListener('click', function() {
    window.location.href = 'masterlogin.html';
});