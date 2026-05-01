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
let cartItems = [];          // レジに打ち込んだ商品のリスト

// --- HTML要素の取得 ---
const displayElement = document.getElementById('input-display');
const receiptListElement = document.getElementById('receipt-list');
const subtotalElement = document.getElementById('subtotal-display');
const taxElement = document.getElementById('tax-display');
const totalElement = document.getElementById('total-display');

// ==========================================
// 1. テンキー関連の処理
// ==========================================
function inputNum(num) {
    if (currentInputValue === '0' && num !== '.') {
        if (num === '00') return; // 最初から「00」は入力させない
        currentInputValue = num;
    } else {
        if (currentInputValue.length < 9) {
            currentInputValue += num;
        }
    }
    updateInputDisplay();
}

function clearInput() {
    currentInputValue = '0';
    updateInputDisplay();
}

function updateInputDisplay() {
    displayElement.innerText = Number(currentInputValue).toLocaleString();
}

// ==========================================
// 2. 商品をレシートに追加・確定する処理
// ==========================================
function addProduct(name, defaultPrice) {
    // もし1つ前に押した商品が「未確定」の場合
    if (cartItems.length > 0) {
        const lastItem = cartItems[cartItems.length - 1];
        if (!lastItem.isPriced) {
            // ①同じ名前の商品なら、個数（数量）を1つ増やすだけ
            if (lastItem.name === name) {
                lastItem.quantity++;
                renderReceipt();
                return; // ここで処理を終わる
            } else {
                // ②違う商品を押した場合は、前の商品を「定額」で自動確定させる
                lastItem.unitPrice = lastItem.defaultUnitPrice;
                lastItem.isPriced = true;
            }
        }
    }

    // 新しい商品を「数量1」「未確定」状態でカートに追加
    cartItems.push({ 
        name: name, 
        defaultUnitPrice: parseInt(defaultPrice), 
        unitPrice: 0,   // まだ単価は決まっていない
        quantity: 1,    // 数量
        isPriced: false // 未確定マーク
    });
    renderReceipt(); 
}

// 「定額」ボタンを押した時
function applyDefaultPrice() {
    if (cartItems.length === 0) return;
    const lastItem = cartItems[cartItems.length - 1];
    
    // 金額が未確定なら、商品のデフォルト価格を「単価」としてセット
    if (!lastItem.isPriced) {
        lastItem.unitPrice = lastItem.defaultUnitPrice;
        lastItem.isPriced = true;
        renderReceipt();
    }
}

// 「決定」ボタンを押した時（手入力の金額を反映）
function addManualEntry() {
    const inputPrice = parseInt(currentInputValue);
    if (inputPrice <= 0) return;

    if (cartItems.length > 0) {
        const lastItem = cartItems[cartItems.length - 1];
        // 金額が未確定なら、テンキーの入力額を「単価」としてセット
        if (!lastItem.isPriced) {
            lastItem.unitPrice = inputPrice;
            lastItem.isPriced = true;
            clearInput();
            renderReceipt();
            return;
        }
    }

    // 未確定の商品が無い場合は、独立した手入力商品として追加
    cartItems.push({ 
        name: '手入力商品', 
        defaultUnitPrice: inputPrice, 
        unitPrice: inputPrice, 
        quantity: 1,
        isPriced: true 
    });
    clearInput();
    renderReceipt();
}

// ==========================================
// 3. 左側のレシート画面の更新処理
// ==========================================
function renderReceipt() {
    receiptListElement.innerHTML = '';
    let subtotal = 0;

    cartItems.forEach(item => {
        // 金額が確定している場合は「単価 × 個数」で合計を出す
        const itemTotalPrice = item.isPriced ? (item.unitPrice * item.quantity) : 0;
        subtotal += itemTotalPrice; 
        
        const row = document.createElement('div');
        const isWaiting = !item.isPriced; 
        const nameColor = isWaiting ? 'text-orange-600' : 'text-gray-800';
        
        // 確定済なら計算結果を表示、未確定なら「---」
        const unitPriceText = isWaiting ? '---' : item.unitPrice.toLocaleString();
        const totalPriceText = isWaiting ? '---' : itemTotalPrice.toLocaleString();
        
        // 数量が2以上の場合はバッジを表示する
        const quantityBadge = item.quantity > 1 
            ? `<span class="text-xs bg-${isWaiting ? 'orange' : 'gray'}-200 text-${isWaiting ? 'orange' : 'gray'}-700 px-2 py-0.5 rounded-full ml-2">x${item.quantity}</span>` 
            : '';

        row.className = `flex items-center border-b border-gray-100 pb-2 ${isWaiting ? 'bg-orange-50' : ''}`;
        
        row.innerHTML = `
            <div class="w-[50%] font-bold ${nameColor} truncate pr-2 flex items-center">
                ${item.name} ${quantityBadge}
            </div>
            <div class="w-[25%] text-right font-mono text-gray-600 text-base">${unitPriceText}</div>
            <div class="w-[25%] text-right font-mono font-bold ${nameColor}">${totalPriceText}</div>
        `;
        
        receiptListElement.appendChild(row);
    });

    receiptListElement.scrollTop = receiptListElement.scrollHeight;

    const taxRate = 0.08;
    const tax = Math.floor(subtotal * taxRate);
    const total = subtotal + tax; 

    subtotalElement.innerText = subtotal.toLocaleString();
    taxElement.innerText = tax.toLocaleString();
    totalElement.innerText = total.toLocaleString();
}

// ==========================================
// 4. 取消・修正機能
// ==========================================

// 「全取消（AC）」ボタン
function clearCart() {
    if (cartItems.length > 0) {
        const isConfirm = confirm('レシートの商品をすべて取り消しますか？');
        if (isConfirm) {
            cartItems = []; 
            clearInput();   
            renderReceipt(); 
        }
    } else {
        clearInput();
    }
}

// 「1つ取消」ボタン
function removeLastItem() {
    if (cartItems.length > 0) {
        const lastItem = cartItems[cartItems.length - 1];
        
        // 直前の商品が未確定、かつ数量が2以上ある場合は個数を1つ減らす
        if (!lastItem.isPriced && lastItem.quantity > 1) {
            lastItem.quantity--;
        } else {
            // 数量が1、または既に金額確定済みの場合は行ごと丸々消す
            cartItems.pop(); 
        }
        
        clearInput();    
        renderReceipt(); 
    }
}