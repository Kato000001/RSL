// --- 状態管理 ---
let cart = []; // カートに入っている商品のリスト
let currentInput = "0"; // テンキーで入力中の金額

// --- 日時表示の更新 ---
function updateClock() {
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    document.getElementById('checkout-date').innerText = dateStr;
    document.getElementById('checkout-time').innerText = timeStr;
}
setInterval(updateClock, 1000);
updateClock(); // 初回実行

// --- 商品ボタンを押した時 ---
function addProduct(name, price) {
    cart.push({ name: name, price: price });
    updateReceipt();
}

// --- テンキーの数字を押した時 ---
function inputNum(num) {
    if (currentInput === "0") {
        currentInput = num;
    } else {
        currentInput += num;
    }
    updateDisplay();
}

// --- 定額ボタンを押した時（入力中金額へ反映するだけ） ---
function applyDefaultPrice(price) {
    currentInput = price.toString();
    updateDisplay();
}

// --- テンキーの「入力クリア」 ---
function clearInput() {
    currentInput = "0";
    updateDisplay();
}

// --- テンキーの「決定」を押した時 ---
function addManualEntry() {
    const price = parseInt(currentInput, 10);
    if (price > 0) {
        addProduct('手入力/定額', price); // レシートに追加
        clearInput(); // 入力中金額をリセット
    }
}

// --- テンキーの「全取消(AC)」 ---
function clearCart() {
    if(confirm('レシートの内容をすべて取り消しますか？')) {
        cart = [];
        updateReceipt();
        clearInput();
    }
}

// --- テンキーの「1つ取消」 ---
function removeLastItem() {
    if (cart.length > 0) {
        cart.pop(); // 一番最後に追加した商品を削除
        updateReceipt();
    }
}

// --- 右側の入力中金額ディスプレイを更新 ---
function updateDisplay() {
    const display = document.getElementById('input-display');
    if (display) {
        // カンマ区切りにして表示
        display.innerText = Number(currentInput).toLocaleString();
    }
}

// --- 左側のレシートと合計金額を更新 ---
function updateReceipt() {
    const list = document.getElementById('receipt-list');
    list.innerHTML = '';
    
    let subtotal = 0;
    
    cart.forEach(item => {
        subtotal += item.price;
        const row = document.createElement('div');
        row.className = 'flex justify-between border-b border-gray-200 pb-2 text-gray-700';
        row.innerHTML = `
            <span class="w-[50%] font-bold">${item.name}</span>
            <span class="w-[25%] text-right font-mono text-gray-500">¥${item.price.toLocaleString()}</span>
            <span class="w-[25%] text-right font-mono font-bold">¥${item.price.toLocaleString()}</span>
        `;
        list.appendChild(row);
    });
    
    // スクロールを自動的に一番下にする
    list.scrollTop = list.scrollHeight;
    
    // 合計金額の計算（野菜などを想定し、軽減税率8%で仮計算）
    const taxRate = 0.08;
    const tax = Math.floor(subtotal * taxRate); 
    const total = subtotal + tax;
    
    document.getElementById('subtotal-display').innerText = subtotal.toLocaleString();
    document.getElementById('tax-display').innerText = tax.toLocaleString();
    document.getElementById('total-display').innerText = total.toLocaleString();
}

// 初期化
updateDisplay();
updateReceipt();