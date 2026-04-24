// ==========================================
// 時計のリアルタイム更新
// ==========================================
function updateCheckoutClock() {
    const now = new Date();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const day = days[now.getDay()];
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.getElementById('checkout-date').textContent = `${year}/${month}/${date} (${day})`;
    document.getElementById('checkout-time').textContent = `${hours}:${minutes}:${seconds}`;
}

setInterval(updateCheckoutClock, 1000);
updateCheckoutClock();


// ==========================================
// テンキー入力処理 (簡易版)
// ==========================================
let currentInput = "0";

function inputNum(val) {
    if (currentInput === "0") {
        if(val !== "0" && val !== "00") {
            currentInput = val;
        }
    } else {
        currentInput += val;
    }
    updateDisplay();
}

function clearInput() {
    currentInput = "0";
    updateDisplay();
}

function updateDisplay() {
    // 3桁ごとにカンマを入れる処理
    const num = parseInt(currentInput, 10);
    document.getElementById('input-display').textContent = num.toLocaleString();
}