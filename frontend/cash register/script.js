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
    
    const dateEl = document.getElementById('checkout-date');
    const timeEl = document.getElementById('checkout-time');
    if (dateEl) dateEl.textContent = `${year}/${month}/${date} (${day})`;
    if (timeEl) timeEl.textContent = `${hours}:${minutes}:${seconds}`;
}

setInterval(updateCheckoutClock, 1000);
updateCheckoutClock();

// --- 状態管理 ---
let currentInputValue = '0'; // テンキーで入力中の金額
let cartItems = [];          // カート内の商品リスト
let needResetInput = false;  // 次の数字入力で表示をリセットするか
let amountTendered = 0;      // 預り金
let isTenderMode = false;    // 預り金入力モード中かどうか

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
    if (needResetInput) {
        currentInputValue = '0';
        needResetInput = false;
    }

    if (currentInputValue === '0' && num !== '.') {
        if (num === '00') return; 
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
    isTenderMode = false; 
    updateInputDisplay();
}

/**
 * 入力表示と枠色の更新
 */
function updateInputDisplay() {
    const containerEl = document.getElementById('input-container');
    const badgeEl = document.getElementById('mode-badge');

    // 数字の表示更新
    if (displayElement) {
        displayElement.innerText = Number(currentInputValue).toLocaleString();
    }

    // 枠色とバッジの制御
    if (containerEl) {
        if (isTenderMode) {
            // 【預り金モード】青系に変更
            containerEl.classList.replace('bg-cyan-50', 'bg-blue-50');
            containerEl.classList.replace('border-cyan-100', 'border-blue-500');
            if (displayElement) {
                displayElement.classList.replace('text-cyan-700', 'text-blue-700');
            }
            if (badgeEl) {
                badgeEl.classList.replace('text-transparent', 'text-white');
                badgeEl.classList.replace('bg-transparent', 'bg-blue-600');
            }
        } else {
            // 【通常モード】元のシアンに戻す
            containerEl.classList.replace('bg-blue-50', 'bg-cyan-50');
            containerEl.classList.replace('border-blue-500', 'border-cyan-100');
            if (displayElement) {
                displayElement.classList.replace('text-blue-700', 'text-cyan-700');
            }
            if (badgeEl) {
                badgeEl.classList.replace('text-white', 'text-transparent');
                badgeEl.classList.replace('bg-blue-600', 'bg-transparent');
            }
        }
    }
}

// ==========================================
// 2. 預り金・商品追加・確定の処理
// ==========================================

function setTenderedAmount() {
    isTenderMode = true;     
    currentInputValue = '0'; 
    updateInputDisplay();
    needResetInput = false;
}

function confirmPrice() {
    const inputNumValue = parseInt(currentInputValue);

    if (isTenderMode) {
        amountTendered = inputNumValue;
        isTenderMode = false; 
        needResetInput = true;
        renderReceipt();      
        updateInputDisplay(); // 枠色を元に戻すために呼び出し
        return;
    }

    if (inputNumValue <= 0) return;

    if (cartItems.length > 0) {
        const lastItem = cartItems[cartItems.length - 1];
        if (!lastItem.isPriced) {
            lastItem.unitPrice = inputNumValue;
            lastItem.isPriced = true;
            needResetInput = true;
            renderReceipt();
            return;
        }
    }

    cartItems.push({ 
        name: '手入力商品', 
        defaultUnitPrice: inputNumValue, 
        unitPrice: inputNumValue, 
        quantity: 1,
        isPriced: true 
    });
    needResetInput = true;
    renderReceipt();
}

function addProduct(name, defaultPrice) {
    isTenderMode = false; 
    updateInputDisplay(); // モード解除に合わせて色を戻す

    if (cartItems.length > 0) {
        const lastItem = cartItems[cartItems.length - 1];
        if (!lastItem.isPriced) {
            if (lastItem.name === name) {
                lastItem.quantity++;
                renderReceipt();
                return;
            } else {
                lastItem.unitPrice = lastItem.defaultUnitPrice;
                lastItem.isPriced = true;
            }
        }
    }

    cartItems.push({ 
        name: name, 
        defaultUnitPrice: parseInt(defaultPrice), 
        unitPrice: 0,
        quantity: 1,
        isPriced: false 
    });
    renderReceipt(); 
}

function applyDefaultPrice() {
    if (cartItems.length === 0) return;
    const lastItem = cartItems[cartItems.length - 1];
    
    if (!lastItem.isPriced) {
        currentInputValue = lastItem.defaultUnitPrice.toString();
        updateInputDisplay();
        needResetInput = true; 
    }
}

// ==========================================
// 3. 左側のレシート画面 & 計算の更新処理
// ==========================================
function renderReceipt() {
    if (!receiptListElement) return;
    receiptListElement.innerHTML = '';
    let subtotal = 0;

    cartItems.forEach(item => {
        const itemTotalPrice = item.isPriced ? (item.unitPrice * item.quantity) : 0;
        subtotal += itemTotalPrice; 
        
        const row = document.createElement('div');
        const isWaiting = !item.isPriced; 
        const nameColor = isWaiting ? 'text-orange-600' : 'text-gray-800';
        
        const unitPriceText = isWaiting ? '---' : item.unitPrice.toLocaleString();
        const totalPriceText = isWaiting ? '---' : itemTotalPrice.toLocaleString();
        
        const quantityBadge = item.quantity > 1 
            ? `<span class="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2">x${item.quantity}</span>` 
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

    if (subtotalElement) subtotalElement.innerText = subtotal.toLocaleString();
    if (taxElement) taxElement.innerText = tax.toLocaleString();
    if (totalElement) totalElement.innerText = total.toLocaleString();

    const tenderedDisp = document.getElementById('tendered-display');
    const changeDisp = document.getElementById('change-display');

    if (tenderedDisp) {
        tenderedDisp.innerText = amountTendered.toLocaleString();
    }
    if (changeDisp) {
        const change = amountTendered > 0 ? amountTendered - total : 0;
        changeDisp.innerText = (change >= 0 ? change : 0).toLocaleString();
    }
}

// ==========================================
// 4. 取消・修正機能
// ==========================================
function clearCart() {
    if (cartItems.length > 0 || amountTendered > 0) {
        const isConfirm = confirm('レシート内容と預り金をすべてクリアしますか？');
        if (isConfirm) {
            cartItems = []; 
            amountTendered = 0;
            isTenderMode = false;
            clearInput();   
            renderReceipt(); 
        }
    } else {
        clearInput();
    }
}

function removeLastItem() {
    if (cartItems.length > 0) {
        const lastItem = cartItems[cartItems.length - 1];
        if (!lastItem.isPriced && lastItem.quantity > 1) {
            lastItem.quantity--;
        } else {
            cartItems.pop(); 
        }
        clearInput();    
        renderReceipt(); 
    }
}
