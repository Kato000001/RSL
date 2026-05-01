// お会計画面のjavascript

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
    // 1つ前の商品が未確定なら自動的に定額で確定する
    if (cartItems.length > 0) {
        const lastItem = cartItems[cartItems.length - 1];
        if (!lastItem.isPriced) {
            lastItem.price = lastItem.defaultPrice;
            lastItem.isPriced = true;
        }
    }

    // 新しい商品を未確定状態で追加
    cartItems.push({ 
        name: name, 
        defaultPrice: parseInt(defaultPrice), 
        price: 0, 
        isPriced: false
    });
    renderReceipt(); 
}

function applyDefaultPrice() {
    if (cartItems.length === 0) return;
    const lastItem = cartItems[cartItems.length - 1];
    
    if (!lastItem.isPriced) {
        lastItem.price = lastItem.defaultPrice;
        lastItem.isPriced = true;
        renderReceipt();
    }
}

function addManualEntry() {
    const inputPrice = parseInt(currentInputValue);
    if (inputPrice <= 0) return;

    if (cartItems.length > 0) {
        const lastItem = cartItems[cartItems.length - 1];
        if (!lastItem.isPriced) {
            lastItem.price = inputPrice;
            lastItem.isPriced = true;
            clearInput();
            renderReceipt();
            return;
        }
    }

    cartItems.push({ 
        name: '手入力商品', 
        defaultPrice: inputPrice, 
        price: inputPrice, 
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
        subtotal += item.price; 
        const row = document.createElement('div');
        
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

    receiptListElement.scrollTop = receiptListElement.scrollHeight;

    const taxRate = 0.08;
    const tax = Math.floor(subtotal * taxRate);
    const total = subtotal + tax; 

    subtotalElement.innerText = subtotal.toLocaleString();
    taxElement.innerText = tax.toLocaleString();
    totalElement.innerText = total.toLocaleString();
}

// ==========================================
// 4. 取消・修正機能（新機能）
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
        cartItems.pop(); 
        clearInput();    
        renderReceipt(); 
    }
}