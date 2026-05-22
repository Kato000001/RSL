// --- 時計をリアルタイムで動かす処理 ---
function updateClock() {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
    const dayOfWeek = daysOfWeek[now.getDay()];
    const dateString = `${year}/${month}/${day} (${dayOfWeek})`;
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    
    if (dateEl) dateEl.textContent = dateString;
    if (timeEl) timeEl.textContent = timeString;
}

setInterval(updateClock, 1000);
updateClock(); 

//---------------------------------------------------------------------------------

// --- APIのURL設定 ---
const API_URL = '../../backend/api/products_api.php';

document.addEventListener('DOMContentLoaded', () => {
    // --- 要素の取得 ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const tbody = document.querySelector('.product-table tbody');
    const tableHeaders = document.querySelectorAll('.product-table th.sortable');
    
    const inputId = document.querySelector('.input-readonly');
    const inputName = document.querySelector('.input-text');
    const inputPrice = document.querySelector('.input-number');
    const seasonalCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    const categoryRadios = document.querySelectorAll('.radio-group input[name="cat"]');
    
    const submitBtn = document.querySelector('.btn-submit');
    const addBtn = document.querySelector('.btn-add');
    const deleteBtn = document.querySelector('.btn-delete'); 
    const clearBtn = document.querySelector('.btn-clear');

    // タグクラス（色分け）定義
    const tagClassMap = {
        '春': 'tag-pink', '夏': 'tag-yellow', '秋': 'tag-orange', '冬': 'tag-blue',
        '野菜': 'tag-green', '果物': 'tag-orange-light', 'その他': '', '通年': ''
    };

    let currentSortCol = -1; 
    let isAscending = true;

    // 起動時にデータベースから商品を読み込む
    loadProducts();

    // --- 商品一覧をデータベースから読み込んで描画する関数 ---
    async function loadProducts() {
        if (!tbody) return;
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            if (!data.success) {
                alert('データ取得エラー: ' + data.error);
                return;
            }

            tbody.innerHTML = ''; 

            data.products.forEach(product => {
                const row = document.createElement('tr');
                const formattedPrice = `¥${parseInt(product.price).toLocaleString()}`;
                
                // 種類（カテゴリ）のタグを生成
                let tagsHTML = `<span class="tag ${tagClassMap[product.category] || ''}">${product.category}</span>`;
                
                // 季節の属性カラータグを生成
                if (product.seasonal_attributes) {
                    const attrs = product.seasonal_attributes.split(',');
                    attrs.forEach(attr => {
                        if (attr && attr !== '通年') { 
                            const tagColorClass = tagClassMap[attr] || '';
                            tagsHTML += ` <span class="tag ${tagColorClass}">${attr}</span>`;
                        }
                    });
                }

                row.innerHTML = `
                    <td class="cell-id">${product.product_id}</td>
                    <td class="cell-name">${product.name}</td>
                    <td class="cell-price">${formattedPrice}</td>
                    <td class="cell-attr">${tagsHTML}</td>
                `;

                attachDetailEvent(row, product);
                tbody.appendChild(row);
            });

            if (currentSortCol !== -1) {
                sortTable(currentSortCol, isAscending);
            }

        } catch (error) {
            console.error('通信エラー:', error);
        }
    }

    // --- 詳細反映機能 (行クリックしたときフォームに同期) ---
    function attachDetailEvent(row, product) {
        row.addEventListener('click', () => {
            document.querySelectorAll('.product-table tbody tr').forEach(r => r.classList.remove('row-selected'));
            row.classList.add('row-selected');
            
            if (inputId) inputId.value = product.product_id;
            if (inputName) inputName.value = product.name;
            if (inputPrice) inputPrice.value = product.price;
            
            // 種類（カテゴリ）ラジオボタンの同期
            categoryRadios.forEach(radio => {
                const labelText = radio.parentElement.textContent.trim();
                radio.checked = (labelText === product.category);
            });

            // 季節の属性チェックボックスの同期
            const savedAttrs = product.seasonal_attributes ? product.seasonal_attributes.split(',') : [];
            seasonalCheckboxes.forEach(cb => {
                const labelText = cb.parentElement.textContent.trim();
                cb.checked = savedAttrs.includes(labelText);
            });
        });
    }

    // --- 登録・変更確定ボタン ---
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const p_id = inputId.value.trim();
            const name = inputName.value.trim();
            const price = inputPrice.value.trim();
            
            let category = '';
            categoryRadios.forEach(r => { if(r.checked) category = r.parentElement.textContent.trim(); });
            
            let selectedAttrs = [];
            seasonalCheckboxes.forEach(cb => {
                if (cb.checked) {
                    selectedAttrs.push(cb.parentElement.textContent.trim());
                }
            });

            if (!p_id || !name || !price || !category) {
                alert('商品ID、商品名、単価、種類（カテゴリ）をすべて選択・入力してください。');
                return;
            }

            const payload = {
                action: 'save',
                product_id: p_id,
                name: name,
                price: parseInt(price, 10),
                category: category,
                seasonal_attributes: selectedAttrs
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                if (data.success) {
                    alert('データベースへ保存しました！');
                    await loadProducts(); 
                    if (clearBtn) clearBtn.click();
                } else {
                    alert('保存エラー: ' + data.error);
                }
            } catch (error) {
                alert('通信エラーが発生しました。');
            }
        });
    }

    // --- 新規登録ボタン ---
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const rows = Array.from(document.querySelectorAll('.product-table tbody tr'));
            let nextNum = 1;
            if (rows.length > 0) {
                const ids = rows.map(r => {
                    const idText = r.querySelector('.cell-id').textContent.trim();
                    return parseInt(idText.replace(/[^0-9]/g, ''), 10) || 0;
                });
                nextNum = Math.max(...ids) + 1;
            }
            if (clearBtn) clearBtn.click();
            if (inputId) inputId.value = 'P' + String(nextNum).padStart(3, '0');
            if (inputName) inputName.focus();
        });
    }

    // --- 削除ボタンの処理 ---
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const p_id = inputId.value.trim();
            if (!p_id) {
                alert('削除する商品を選択してください');
                return;
            }

            if (!confirm(`商品ID: ${p_id} を本当にデータベースから削除しますか？`)) {
                return;
            }

            const payload = { action: 'delete', product_id: p_id };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                if (data.success) {
                    alert('削除が完了しました');
                    await loadProducts(); 
                    if (clearBtn) clearBtn.click();
                } else {
                    alert('削除エラー: ' + data.error);
                }
            } catch (error) {
                alert('通信エラーが発生しました');
            }
        });
    }

    // --- クリア機能 ---
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (inputId) inputId.value = '';
            if (inputName) inputName.value = '';
            if (inputPrice) inputPrice.value = '';
            seasonalCheckboxes.forEach(cb => cb.checked = false);
            categoryRadios.forEach(radio => radio.checked = false);
            document.querySelectorAll('.product-table tbody tr').forEach(r => r.classList.remove('row-selected'));
        });
    }

    // --- フィルタリング機能 ---
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const kw = button.textContent.trim();
            
            document.querySelectorAll('.product-table tbody tr').forEach(row => {
                if (kw === '全て') { row.style.display = ''; return; }
                const attrCell = row.querySelector('.cell-attr');
                if (attrCell) {
                    row.style.display = attrCell.textContent.includes(kw) ? '' : 'none';
                }
            });
        });
    });

    // --- ソート関数 ---
    function sortTable(index, ascending) {
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.sort((rowA, rowB) => {
            const cellA = rowA.children[index].textContent.trim();
            const cellB = rowB.children[index].textContent.trim();

            if (index === 0) { 
                return ascending ? cellA.localeCompare(cellB, undefined, {numeric: true}) : cellB.localeCompare(cellA, undefined, {numeric: true});
            } else if (index === 1) { 
                return ascending ? cellA.localeCompare(cellB, 'ja') : cellB.localeCompare(cellA, 'ja');
            } else if (index === 2) { 
                const valA = parseInt(cellA.replace(/[¥,]/g, ''), 10);
                const valB = parseInt(cellB.replace(/[¥,]/g, ''), 10);
                return ascending ? valA - valB : valB - valA;
            }
            return 0;
        });

        rows.forEach(row => tbody.appendChild(row));

        tableHeaders.forEach((th, i) => {
            th.textContent = th.textContent.replace(/[ ▲▼]/g, '');
            if (i === index) {
                th.textContent += ascending ? ' ▲' : ' ▼';
            }
        });

        currentSortCol = index;
        isAscending = ascending;
    }

    tableHeaders.forEach((header, index) => {
        header.addEventListener('click', () => {
            const nextAscending = (currentSortCol === index) ? !isAscending : true;
            sortTable(index, nextAscending);
        });
    });
});