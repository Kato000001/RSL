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

// ⭕ POS連動用：APIのURLと商品データ保持配列
const API_URL = '../../backend/api/products_api.php';
let productsData = []; 

// ==========================================
// ⭕ POS連動：データベースから商品を読み込む処理
// ==========================================
async function loadPOSProducts() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data.success && data.products) {
            productsData = data.products; // データを格納
            renderProductGrid('全て');     // 初期表示として「全て」を描画
        } else {
            console.error('商品データの取得に失敗しました:', data.error);
        }
    } catch (error) {
        console.error('商品データの通信エラー:', error);
    }
}

// ページ読み込み時の初期化処理
document.addEventListener('DOMContentLoaded', () => {
    // メインお会計画面（#product-area が存在するとき）のみ商品読み込みとフィルターを有効化
    if (document.getElementById('product-area')) {
        loadPOSProducts(); 
        setupFilterEvents(); 
    }
});

// ==========================================
// ⭕ POS連動：商品パネルグリッドの動的自動描画
// ==========================================
function renderProductGrid(filterKeyword) {
    const productArea = document.getElementById('product-area');
    if (!productArea) return;
    
    const filterContainer = document.getElementById('filter-container');
    const grid = filterContainer ? filterContainer.nextElementSibling : null;
    
    if (!grid) return;
    grid.innerHTML = ''; // 静的ボタンおよび前回の表示をクリア

    productsData.forEach(product => {
        const cat = product.category || 'その他';
        const attrs = product.seasonal_attributes || '';

        // 9列のフィルターボタンに応じた正確な絞り込み
        if (filterKeyword !== '全て') {
            if (filterKeyword === '通年') {
                const hasSeason = ['春', '夏', '秋', '冬'].some(season => attrs.includes(season));
                if (hasSeason && !attrs.includes('通年')) {
                    return; 
                }
            } else {
                if (cat !== filterKeyword && !attrs.split(',').includes(filterKeyword)) {
                    return; 
                }
            }
        }

        // データベースの情報を元に、美しいグリーンのデザインボタンを生成
        const card = document.createElement('button');
        card.className = "bg-green-50 hover:bg-green-100 border-2 border-green-200 active:border-green-400 active:scale-95 transition-all rounded-xl py-6 flex flex-col items-center justify-center gap-1";
        card.setAttribute("onclick", `addProduct('${product.name}', ${product.price})`);

        card.innerHTML = `
          <span class="font-bold text-gray-800 text-lg">${product.name}</span>
          <span class="text-sm font-mono text-gray-600">¥${parseInt(product.price).toLocaleString()}</span>
        `;
        grid.appendChild(card);
    });
}

// ==========================================
// ⭕ フィルターボタンのイベントセットアップ
// ==========================================
function setupFilterEvents() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => {
                btn.className = "filter-btn py-2 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition";
            });
            button.className = "filter-btn py-2 text-xs font-bold rounded-lg border border-emerald-600 bg-emerald-600 text-white shadow-sm transition";

            const filterValue = button.getAttribute('data-filter') || button.textContent.trim();
            renderProductGrid(filterValue);
        });
    });
}

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
    if (isTenderMode) {
        isTenderMode = false; 
        resetTenderUI(); 
    }
    updateInputDisplay();
}

// テンキーの表示更新
function updateInputDisplay() {
    const containerEl = document.getElementById('input-container');
    const badgeEl = document.getElementById('mode-badge');

    if (displayElement) {
        displayElement.innerText = Number(currentInputValue).toLocaleString();
    }

    if (containerEl && badgeEl) {
        if (isTenderMode) {
            containerEl.classList.replace('border-green-500', 'border-blue-500');
            badgeEl.classList.replace('bg-green-500', 'bg-blue-600');
            if (displayElement) {
                displayElement.classList.replace('text-gray-800', 'text-blue-700');
            }
        } else {
            containerEl.classList.replace('border-blue-500', 'border-green-500');
            badgeEl.classList.replace('bg-blue-600', 'bg-green-500');
            if (displayElement) {
                displayElement.classList.replace('text-blue-700', 'text-gray-800');
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
    needResetInput = false;
    updateInputDisplay();
    
    const productArea = document.getElementById('product-area');
    const priceSummary = document.getElementById('price-summary');
    const modeBadge = document.getElementById('mode-badge');

    if (productArea) productArea.classList.add('lock-overlay');
    if (priceSummary) priceSummary.classList.add('active-summary');
    if (modeBadge) modeBadge.innerText = 'お預り金入力中';

    const confirmBtn = document.getElementById('btn-confirm');
    if (confirmBtn) {
        confirmBtn.classList.replace('bg-orange-500', 'bg-blue-600');
        confirmBtn.classList.replace('border-orange-700', 'border-blue-800');
        confirmBtn.classList.replace('hover:bg-orange-600', 'hover:bg-blue-700');
    }
}

function resetTenderUI() {
    const productArea = document.getElementById('product-area');
    const priceSummary = document.getElementById('price-summary');
    const modeBadge = document.getElementById('mode-badge');
    
    if (productArea) productArea.classList.remove('lock-overlay');
    if (priceSummary) priceSummary.classList.remove('active-summary');
    if (modeBadge) modeBadge.innerText = '入力中金額';

    const confirmBtn = document.getElementById('btn-confirm');
    if (confirmBtn) {
        confirmBtn.classList.replace('bg-blue-600', 'bg-orange-500');
        confirmBtn.classList.replace('border-blue-800', 'border-orange-700');
        confirmBtn.classList.replace('hover:bg-blue-700', 'hover:bg-orange-600');
    }
}

function confirmPrice() {
    const inputNumValue = parseInt(currentInputValue);

    if (isTenderMode) {
        amountTendered = inputNumValue;
        isTenderMode = false; 
        needResetInput = true;
        renderReceipt();      
        resetTenderUI();      
        updateInputDisplay(); 
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
    if (isTenderMode) {
        isTenderMode = false; 
        resetTenderUI();
        updateInputDisplay(); 
    }

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
            <div class="w-[25%] text-right font-mono font-bold ${nameColor}">￥${totalPriceText}</div>
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
            if (isTenderMode) {
                isTenderMode = false;
                resetTenderUI();
            }
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
// 5. ⭕ お会計ページへの遷移処理（ガードバリデーション強化）
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

    let subtotal = 0;
    cartItems.forEach(item => subtotal += (item.unitPrice * item.quantity));
    const tax = Math.floor(subtotal * 0.08);
    const total = subtotal + tax;
    
    // 🛡️ 金額不足をここで絶対にブロックする（通常お会計ルート用）
    if (amountTendered < total) {
        alert(`【お預り金額不足】\nお会計の合計金額に達していません！\n\n合計税込金額: ￥${total.toLocaleString()}\n現在のお預り金: ￥${amountTendered.toLocaleString()}\n不足額: ￥${(total - amountTendered).toLocaleString()}`);
        return;
    }

    const change = amountTendered - total;
    const now = new Date();
    const timeString = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const receiptData = {
        items: cartItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        tendered: amountTendered,
        change: change,
        timestamp: timeString
    };
    localStorage.setItem('posReceiptData', JSON.stringify(receiptData));

    // データベース（PHP）送信用の正しい構造データ
    const dbPayload = {
        total_amount: total,
        tax_amount: tax,
        received_amount: amountTendered,
        change_amount: change,
        items: cartItems.map(item => ({
            name: item.name,
            price: item.unitPrice,
            qty: item.quantity,
            subtotal: item.unitPrice * item.quantity
        }))
    };

    const isConfirm = confirm(`合計金額は ￥${total.toLocaleString()} です。\nお会計画面に進みますか？`);
    
    if (isConfirm) {
        fetch('../../backend/api/save_transaction.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dbPayload)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                console.log('データベースへの登録が成功しました。');
                window.location.href = 'check_v1.1.html'; 
            } else {
                alert('売上データの保存に失敗しました: ' + (result.error || '不明なエラー'));
                window.location.href = 'check_v1.1.html';
            }
        })
        .catch(error => {
            console.error('通信エラーが発生しました:', error);
            window.location.href = 'check_v1.1.html';
        });
    }
}

// ==========================================
// 6. 計上画面（check_v1.1.html）が開いたときの処理（元仕様）
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const resultTotalEl = document.getElementById('result-total');
    
    if (resultTotalEl) {
        const dataStr = localStorage.getItem('posReceiptData');
        if (!dataStr) return; 

        const data = JSON.parse(dataStr);
        resultTotalEl.innerText = data.total.toLocaleString();

        const itemsContainer = document.getElementById('result-items');
        if (itemsContainer) {
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
        }

        const subtotalEl = document.getElementById('result-subtotal');
        const taxEl = document.getElementById('result-tax');
        const receiptTotalEl = document.getElementById('result-receipt-total');
        const tenderedEl = document.getElementById('result-tendered');
        const changeEl = document.getElementById('result-change');
        const datetimeEl = document.getElementById('result-datetime');

        if (subtotalEl) subtotalEl.innerText = '￥' + data.subtotal.toLocaleString();
        if (taxEl) taxEl.innerText = '￥' + data.tax.toLocaleString();
        if (receiptTotalEl) receiptTotalEl.innerText = '￥' + data.total.toLocaleString();
        if (tenderedEl) tenderedEl.innerText = '￥' + data.tendered.toLocaleString();
        if (changeEl) changeEl.innerText = '￥' + data.change.toLocaleString();
        if (datetimeEl) datetimeEl.innerText = '印字日時: ' + data.timestamp;
    }
});

// ==========================================
// 7. 預り金専用モーダルの処理
// ==========================================
let currentModalTendered = ""; 

function openPaymentModal() {
    const totalText = document.getElementById('total-display').innerText;
    const modalTotalEl = document.getElementById('modal-total');
    if (modalTotalEl) modalTotalEl.innerText = totalText;
    
    currentModalTendered = ""; 
    updateModalDisplay();

    const modal = document.getElementById('payment-modal');
    const bg = document.getElementById('payment-bg');
    const panel = document.getElementById('payment-panel');

    if (modal && bg && panel) {
        modal.classList.replace('pointer-events-none', 'pointer-events-auto');
        bg.classList.replace('opacity-0', 'opacity-100');
        panel.classList.replace('translate-y-full', 'translate-y-0');
    }
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    const bg = document.getElementById('payment-bg');
    const panel = document.getElementById('payment-panel');

    if (modal && bg && panel) {
        bg.classList.replace('opacity-100', 'opacity-0');
        panel.classList.replace('translate-y-0', 'translate-y-full');
        
        setTimeout(() => {
            modal.classList.replace('pointer-events-auto', 'pointer-events-none');
        }, 300);
    }
}

function modalInput(numStr) {
    if (currentModalTendered === "0" && numStr !== "00") {
        currentModalTendered = numStr;
    } else {
        currentModalTendered += numStr;
    }
    updateModalDisplay();
}

function modalQuickInput(val) {
    if (val === 'exact') {
        const modalTotalEl = document.getElementById('modal-total');
        const total = modalTotalEl ? (parseInt(modalTotalEl.innerText.replace(/,/g, '')) || 0) : 0;
        currentModalTendered = total.toString();
    } else {
        currentModalTendered = val.toString();
    }
    updateModalDisplay();
}

function modalClear() {
    currentModalTendered = "";
    updateModalDisplay();
}

function updateModalDisplay() {
    const modalTotalEl = document.getElementById('modal-total');
    const total = modalTotalEl ? (parseInt(modalTotalEl.innerText.replace(/,/g, '')) || 0) : 0;
    const tendered = parseInt(currentModalTendered) || 0;
    const change = tendered - total;

    const modalTenderedEl = document.getElementById('modal-tendered');
    const modalChangeEl = document.getElementById('modal-change');

    if (modalTenderedEl) modalTenderedEl.innerText = tendered.toLocaleString() || "0";
    
    if (modalChangeEl) {
        if (tendered >= total) {
            modalChangeEl.innerText = change.toLocaleString();
        } else {
            modalChangeEl.innerText = "0";
        }
    }
}

// ⭕ 金額不足決済バグを完全修正した決定ボタンロジック
function submitPayment() {
    const tendered = parseInt(currentModalTendered) || 0;
    const modalTotalEl = document.getElementById('modal-total');
    const total = modalTotalEl ? (parseInt(modalTotalEl.innerText.replace(/,/g, '')) || 0) : 0;

    // 🛡️ 修正点：ポップアップテンキー側でもお預り金が足りない場合は完全にブロック
    if (tendered < total) {
        alert(`【お預り金額不足】\nお預り金が合計金額に達していません！\n\n合計税込金額: ￥${total.toLocaleString()}\n入力されたお預り金: ￥${tendered.toLocaleString()}\n不足額: ￥${(total - tendered).toLocaleString()}`);
        return;
    }

    amountTendered = tendered; 
    
    const tenderedDisp = document.getElementById('tendered-display');
    const changeDisp = document.getElementById('change-display');

    if (tenderedDisp) tenderedDisp.innerText = tendered.toLocaleString();
    if (changeDisp) changeDisp.innerText = (tendered - total).toLocaleString();
    
    localStorage.setItem('tendered', tendered);
    
    closePaymentModal();
    
    // 正式なお会計関数（売上送信・データ書き込み処理）へ移る
    goToCheckout(); 
}