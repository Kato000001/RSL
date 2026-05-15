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
// ==========================================
// 5. お会計ページへの遷移処理 (LocalStorageへの保存)
// ==========================================
function goToCheckout() {
    if (cartItems.length === 0) {
        alert('商品が登録されていません！');
        return;
    }

    const unpricedItem = cartItems.find(item => !item.isPriced);
    if (unpricedItem) {
        alert('金額が「決定」されていない商品があります！');
        return;
    }

    // --- ここから：データをパッキングして倉庫(LocalStorage)に預ける処理 ---
    let subtotal = 0;
    cartItems.forEach(item => subtotal += (item.unitPrice * item.quantity));
    const tax = Math.floor(subtotal * 0.08);
    const total = subtotal + tax;
    const change = amountTendered > 0 ? amountTendered - total : 0;

    const now = new Date();
    const timeString = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    // 「レシートデータ」という一つの荷物にまとめる
    const receiptData = {
        items: cartItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        tendered: amountTendered,
        change: change,
        timestamp: timeString
    };

    // 倉庫(LocalStorage)に保存
    localStorage.setItem('posReceiptData', JSON.stringify(receiptData));
    // --- ここまで ---

    const isConfirm = confirm(`合計金額は ￥${total.toLocaleString()} です。\nお会計画面に進みますか？`);
    
    if (isConfirm) {
        window.location.href = 'check_v1.1.html'; // 計上画面のファイル名に合わせてください
    }
}

// ==========================================
// 6. 計上画面が開いたときの処理（データの開封）
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 計上画面にだけ存在するID（result-total）があるかチェック
    const resultTotalEl = document.getElementById('result-total');
    
    if (resultTotalEl) {
        // 倉庫からデータを取り出す
        const dataStr = localStorage.getItem('posReceiptData');
        if (!dataStr) return; // データが無ければ何もしない

        const data = JSON.parse(dataStr);

        // ① 大きな「お会計金額」に反映
        resultTotalEl.innerText = data.total.toLocaleString();

        // ② レシート内の商品リストを作成して反映
        const itemsContainer = document.getElementById('result-items');
        itemsContainer.innerHTML = '';
        data.items.forEach(item => {
            const itemTotal = item.unitPrice * item.quantity;
            const qtyText = item.quantity > 1 ? `<span class="text-xs ml-1 bg-gray-200 px-1 rounded">x${item.quantity}</span>` : '';
            itemsContainer.innerHTML += `
                <div class="flex justify-between items-center mb-1">
                    <span>${item.name}${qtyText}</span>
                    <span>￥${itemTotal.toLocaleString()}</span>
                </div>
            `;
        });

        // ③ 各種金額と日時の反映
        document.getElementById('result-subtotal').innerText = '￥' + data.subtotal.toLocaleString();
        document.getElementById('result-tax').innerText = '￥' + data.tax.toLocaleString();
        document.getElementById('result-receipt-total').innerText = '￥' + data.total.toLocaleString();
        document.getElementById('result-tendered').innerText = '￥' + data.tendered.toLocaleString();
        document.getElementById('result-change').innerText = '￥' + data.change.toLocaleString();
        document.getElementById('result-datetime').innerText = '印字日時: ' + data.timestamp;
    }
});

// --- 預り金専用モーダルの処理 ---
let currentModalTendered = ""; // モーダル内の入力保持用

// モーダルを開く（下からスライド）
function openPaymentModal() {
    const totalText = document.getElementById('total-display').innerText;
    document.getElementById('modal-total').innerText = totalText;
    
    currentModalTendered = ""; // 入力をリセット
    updateModalDisplay();

    // Tailwindのクラスを切り替えてアニメーション発動
    const modal = document.getElementById('payment-modal');
    const bg = document.getElementById('payment-bg');
    const panel = document.getElementById('payment-panel');

    modal.classList.replace('pointer-events-none', 'pointer-events-auto');
    bg.classList.replace('opacity-0', 'opacity-100');
    panel.classList.replace('translate-y-full', 'translate-y-0');
}

// モーダルを閉じる
function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    const bg = document.getElementById('payment-bg');
    const panel = document.getElementById('payment-panel');

    bg.classList.replace('opacity-100', 'opacity-0');
    panel.classList.replace('translate-y-0', 'translate-y-full');
    
    // アニメーションが終わるのを待ってからクリック不可にする
    setTimeout(() => {
        modal.classList.replace('pointer-events-auto', 'pointer-events-none');
    }, 300);
}

// モーダル専用テンキー入力
function modalInput(numStr) {
    if (currentModalTendered === "0" && numStr !== "00") {
        currentModalTendered = numStr;
    } else {
        currentModalTendered += numStr;
    }
    updateModalDisplay();
}

// クイックボタン（ちょうど、1000円など）
function modalQuickInput(val) {
    if (val === 'exact') {
        const total = parseInt(document.getElementById('modal-total').innerText.replace(/,/g, ''));
        currentModalTendered = total.toString();
    } else {
        currentModalTendered = val.toString();
    }
    updateModalDisplay();
}

// モーダル内クリア
function modalClear() {
    currentModalTendered = "";
    updateModalDisplay();
}

// モーダル内の画面更新（お釣り計算もここで行う）
function updateModalDisplay() {
    const total = parseInt(document.getElementById('modal-total').innerText.replace(/,/g, '')) || 0;
    const tendered = parseInt(currentModalTendered) || 0;
    const change = tendered - total;

    document.getElementById('modal-tendered').innerText = tendered.toLocaleString() || "0";
    
    // お釣りはマイナスにならないように表示
    if (tendered >= total) {
        document.getElementById('modal-change').innerText = change.toLocaleString();
    } else {
        document.getElementById('modal-change').innerText = "0";
    }
}

// 会計を確定するボタン
function submitPayment() {
    const tendered = parseInt(currentModalTendered) || 0;
    const total = parseInt(document.getElementById('modal-total').innerText.replace(/,/g, '')) || 0;

    // 金額が足りているかチェック
    if (tendered < total) {
        alert("お預り金額が不足しています。");
        return;
    }

    // ここでデータを保存して、メイン画面の「お会計」処理へ流す
    document.getElementById('tendered-display').innerText = tendered.toLocaleString();
    document.getElementById('change-display').innerText = (tendered - total).toLocaleString();
    
    // データを保存（計上画面へ渡す用）
    localStorage.setItem('tendered', tendered);
    
    // モーダルを閉じて、次の画面へ飛ぶ
    closePaymentModal();
    goToCheckout();
}

// ==========================================
// 追加：UIを元に戻すヘルパー関数
// ==========================================
function resetTenderUI() {
    const productArea = document.getElementById('product-area');
    const priceSummary = document.getElementById('price-summary');
    const modeBadge = document.getElementById('mode-badge');
    
    if(productArea) productArea.classList.remove('lock-overlay');
    if(priceSummary) priceSummary.classList.remove('active-summary');
    if(modeBadge) modeBadge.innerText = '入力中金額';
}

// ==========================================
// 上書き：入力表示と枠色の更新
// ==========================================
function updateInputDisplay() {
    const containerEl = document.getElementById('input-container');
    const badgeEl = document.getElementById('mode-badge');

    if (displayElement) {
        displayElement.innerText = Number(currentInputValue).toLocaleString();
    }

    // HTMLの緑色設定に合わせて、正しく青色(預り金)に切り替える処理
    if (containerEl && badgeEl) {
        if (isTenderMode) {
            // 【預り金モード】青系に変更
            containerEl.classList.replace('border-green-500', 'border-blue-500');
            badgeEl.classList.replace('bg-green-500', 'bg-blue-600');
            displayElement.classList.replace('text-gray-800', 'text-blue-700');
        } else {
            // 【通常モード】元の緑に戻す
            containerEl.classList.replace('border-blue-500', 'border-green-500');
            badgeEl.classList.replace('bg-blue-600', 'bg-green-500');
            displayElement.classList.replace('text-blue-700', 'text-gray-800');
        }
    }
}

// ==========================================
// 上書き：預り金ボタンを押した時の処理
// ==========================================
function setTenderedAmount() {
    isTenderMode = true;     
    currentInputValue = '0'; 
    needResetInput = false;
    updateInputDisplay();
    
    // UIを「預り金モード」に変形させる
    document.getElementById('product-area').classList.add('lock-overlay');
    document.getElementById('price-summary').classList.add('active-summary');
    document.getElementById('mode-badge').innerText = 'お預り金入力中';

    // 【追加】決定ボタンをオレンジから青に変更
    const confirmBtn = document.getElementById('btn-confirm');
    if (confirmBtn) {
        // bg-orange-500 を bg-blue-600 に、border-orange-700 を border-blue-800 に置換
        confirmBtn.classList.replace('bg-orange-500', 'bg-blue-600');
        confirmBtn.classList.replace('border-orange-700', 'border-blue-800');
        confirmBtn.classList.replace('hover:bg-orange-600', 'hover:bg-blue-700');
    }
}

// ==========================================
// 追加：UIを元に戻すヘルパー関数
// ==========================================
function resetTenderUI() {
    const productArea = document.getElementById('product-area');
    const priceSummary = document.getElementById('price-summary');
    const modeBadge = document.getElementById('mode-badge');
    
    if(productArea) productArea.classList.remove('lock-overlay');
    if(priceSummary) priceSummary.classList.remove('active-summary');
    if(modeBadge) modeBadge.innerText = '入力中金額';

    // 【追加】決定ボタンを青から元のオレンジに戻す
    const confirmBtn = document.getElementById('btn-confirm');
    if (confirmBtn) {
        confirmBtn.classList.replace('bg-blue-600', 'bg-orange-500');
        confirmBtn.classList.replace('border-blue-800', 'border-orange-700');
        confirmBtn.classList.replace('hover:bg-blue-700', 'hover:bg-orange-600');
    }
}