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



// --- 状態管理 ---
let currentInputValue = '0'; // テンキーで入力中の金額
let cartItems = [];          // レジに打ち込んだ商品のリスト（カート）

// --- HTML要素の取得 ---
const displayElement = document.getElementById('input-display');
const receiptListElement = document.getElementById('receipt-list');
const subtotalElement = document.getElementById('subtotal-display');
const taxElement = document.getElementById('tax-display');
const totalElement = document.getElementById('total-display');


// --- 1. テンキー関連の処理 ---

// 数字ボタンが押された時
function inputNum(num) {
    if (currentInputValue === '0' && num !== '.') {
        if (num === '00') return; // 最初から「00」は入力させない
        currentInputValue = num;
    } else {
        // 桁数が多すぎないように制限（9桁まで）
        if (currentInputValue.length < 9) {
            currentInputValue += num;
        }
    }
    updateInputDisplay();
}

// AC（クリア）ボタンが押された時
function clearInput() {
    currentInputValue = '0';
    updateInputDisplay();
}

// 右上の「入力中金額」の画面を更新する
function updateInputDisplay() {
    displayElement.innerText = Number(currentInputValue).toLocaleString(); // カンマ区切りにする
}


// --- 2. 商品をレシートに追加する処理 ---

// 商品ボタン（キャベツなど）が押された時
function addProduct(name, defaultPrice) {
    // もし1つ前の商品が「金額未確定」のまま次の商品を押されたら、
    // 自動的に定額で確定してあげる（親切設計）
    if (cartItems.length > 0) {
        const lastItem = cartItems[cartItems.length - 1];
        if (!lastItem.isPriced) {
            lastItem.price = lastItem.defaultPrice;
            lastItem.isPriced = true;
        }
    }

    // 新しい商品を「未確定（price: 0）」の状態でカートに入れる
    cartItems.push({ 
        name: name, 
        defaultPrice: parseInt(defaultPrice), 
        price: 0, 
        isPriced: false // ★ここがミソ！まだ金額が決まっていないという目印
    });
    renderReceipt(); 
}

// 「定額」ボタンが押された時の処理
function applyDefaultPrice() {
    if (cartItems.length === 0) return;
    
    const lastItem = cartItems[cartItems.length - 1];
    
    // 最後の商品の金額が未確定なら、ボタンに書かれている金額をセットする
    if (!lastItem.isPriced) {
        lastItem.price = lastItem.defaultPrice;
        lastItem.isPriced = true;
        renderReceipt();
    }
}

// 「決定」ボタンが押された時の処理（手入力を反映）
function addManualEntry() {
    const inputPrice = parseInt(currentInputValue);
    if (inputPrice <= 0) return;

    if (cartItems.length > 0) {
        const lastItem = cartItems[cartItems.length - 1];
        // 最後の商品の金額が未確定なら、テンキーの入力金額をセットする
        if (!lastItem.isPriced) {
            lastItem.price = inputPrice;
            lastItem.isPriced = true;
            clearInput();
            renderReceipt();
            return; // ここで終了
        }
    }

    // 未確定の商品が無い場合は、今まで通り「手入力商品」として新しく追加
    cartItems.push({ 
        name: '手入力商品', 
        defaultPrice: inputPrice, 
        price: inputPrice, 
        isPriced: true 
    });
    clearInput();
    renderReceipt();
}


// --- 3. 左側のレシート画面と合計金額を更新する処理 ---

function renderReceipt() {
    // 一度リストを空にする（重複描画を防ぐため）
    receiptListElement.innerHTML = '';
    let subtotal = 0;

    // カートの中身を1つずつ取り出してHTMLを作る
    cartItems.forEach(item => {
        subtotal += item.price; // 小計を足していく

        const row = document.createElement('div');
        
        // ★未確定状態の時は、文字色をオレンジにして分かりやすくする
        const isWaiting = !item.isPriced; 
        const nameColor = isWaiting ? 'text-orange-600' : 'text-gray-800';
        const priceText = isWaiting ? '---' : item.price.toLocaleString();
        
        row.className = `flex items-center border-b border-gray-100 pb-2 ${isWaiting ? 'bg-orange-50' : ''}`;
        
        row.innerHTML = `
            <div class="w-[50%] font-bold ${nameColor} truncate pr-2">${item.name}</div>
            <div class="w-[25%] text-right font-mono text-gray-600 text-base">${priceText}</div>
            <div class="w-[25%] text-right font-mono font-bold ${nameColor}">${priceText}</div>
        `;
        
        receiptListElement.appendChild(row);
    });

    // 商品が増えたら、自動的に一番下までスクロールさせる
    receiptListElement.scrollTop = receiptListElement.scrollHeight;

    // --- 金額の計算（消費税8%の場合） ---
    const taxRate = 0.08;
    const tax = Math.floor(subtotal * taxRate); // 消費税（切り捨て）
    const total = subtotal + tax;               // 税込の合計金額

    // 画面の金額表示を更新
    subtotalElement.innerText = subtotal.toLocaleString();
    taxElement.innerText = tax.toLocaleString();
    totalElement.innerText = total.toLocaleString();
}