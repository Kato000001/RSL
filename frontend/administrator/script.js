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

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 要素の取得 ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const tbody = document.querySelector('.product-table tbody');
    const tableHeaders = document.querySelectorAll('.product-table th.sortable');
    
    const inputId = document.querySelector('.input-readonly');
    const inputName = document.querySelector('.input-text');
    const inputPrice = document.querySelector('.input-number');
    const seasonalCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    const categoryRadios = document.querySelectorAll('.radio-group input[type="radio"]');
    
    const submitBtn = document.querySelector('.btn-submit');
    const addBtn = document.querySelector('.btn-add');
    // ↓↓↓ ここを修正: HTMLに合わせて '.btn-delete' に変更 ↓↓↓
    const deleteBtn = document.querySelector('.btn-delete'); 
    const clearBtn = document.querySelector('.btn-clear');

    const tagClassMap = {
        '春': 'tag-pink', '夏': 'tag-yellow', '秋': 'tag-orange', '冬': 'tag-blue',
        '野菜': 'tag-green', '果物': 'tag-orange-light', '通年': '', '特売': 'tag-sale'
    };

    let currentSortCol = -1; 
    let isAscending = true;

    // --- 2. ソート処理の関数 ---
    function sortTable(index, ascending) {
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.sort((rowA, rowB) => {
            const cellA = rowA.children[index].textContent.trim();
            const cellB = rowB.children[index].textContent.trim();

            if (index === 0) { 
                return ascending ? parseInt(cellA, 10) - parseInt(cellB, 10) : parseInt(cellB, 10) - parseInt(cellA, 10);
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

    // ヘッダークリック時にソートを実行
    tableHeaders.forEach((header, index) => {
        header.addEventListener('click', () => {
            const nextAscending = (currentSortCol === index) ? !isAscending : true;
            sortTable(index, nextAscending);
        });
    });

    // --- 3. 詳細反映機能 (行クリック) ---
    function attachDetailEvent(row) {
        row.addEventListener('click', () => {
            document.querySelectorAll('.product-table tbody tr').forEach(r => r.classList.remove('row-selected'));
            row.classList.add('row-selected');
            const id = row.querySelector('.cell-id').textContent.trim();
            const name = row.querySelector('.cell-name').textContent.trim();
            const price = row.querySelector('.cell-price').textContent.replace(/[¥,]/g, '').trim();
            const tags = Array.from(row.querySelectorAll('.tag')).map(tag => tag.textContent.trim());
            
            if (inputId) inputId.value = id;
            if (inputName) inputName.value = name;
            if (inputPrice) inputPrice.value = price;
            
            seasonalCheckboxes.forEach(cb => cb.checked = tags.includes(cb.parentElement.textContent.trim()));
            categoryRadios.forEach(radio => radio.checked = tags.includes(radio.parentElement.textContent.trim()));
        });
    }

    if (tbody) {
        document.querySelectorAll('.product-table tbody tr').forEach(row => attachDetailEvent(row));
    }

    // --- 4. 変更決定機能 ---
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const targetId = inputId.value;
            if (!targetId) return;

            let targetRow = null;
            document.querySelectorAll('.product-table tbody tr').forEach(row => {
                if (row.querySelector('.cell-id').textContent.trim() === targetId) {
                    targetRow = row;
                }
            });

            if (targetRow) {
                targetRow.querySelector('.cell-name').textContent = inputName.value;
                targetRow.querySelector('.cell-price').textContent = `¥${Number(inputPrice.value).toLocaleString()}`;
                
                const attrCell = targetRow.querySelector('.cell-attr');
                attrCell.innerHTML = '';
                
                const appendTag = (element) => {
                    if (element.checked) {
                        const label = element.parentElement.textContent.trim();
                        const span = document.createElement('span');
                        span.className = 'tag' + (tagClassMap[label] ? ` ${tagClassMap[label]}` : '');
                        span.textContent = label;
                        attrCell.appendChild(span);
                        attrCell.appendChild(document.createTextNode(' '));
                    }
                };
                seasonalCheckboxes.forEach(appendTag);
                categoryRadios.forEach(appendTag);

                targetRow.style.backgroundColor = '#dcfce7';
                setTimeout(() => { targetRow.style.backgroundColor = ''; }, 500);
            }
        });
    }

    // --- 5. 新規追加機能 ---
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const name = inputName.value.trim();
            const price = inputPrice.value;
            if (!name || !price) return;

            let maxId = 0;
            document.querySelectorAll('.cell-id').forEach(cell => {
                const currentId = parseInt(cell.textContent, 10);
                if (!isNaN(currentId) && currentId > maxId) maxId = currentId;
            });
            const newId = maxId + 1;

            let tagsHtml = '';
            const buildTagHtml = (element) => {
                if (element.checked) {
                    const label = element.parentElement.textContent.trim();
                    const className = 'tag' + (tagClassMap[label] ? ` ${tagClassMap[label]}` : '');
                    tagsHtml += `<span class="${className}">${label}</span> `;
                }
            };
            seasonalCheckboxes.forEach(buildTagHtml);
            categoryRadios.forEach(buildTagHtml);

            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td class="cell-id">${newId}</td>
                <td class="cell-name">${name}</td>
                <td class="cell-price">¥${Number(price).toLocaleString()}</td>
                <td class="cell-attr">${tagsHtml}</td>
            `;

            tbody.appendChild(newRow);
            attachDetailEvent(newRow); 
            newRow.click(); 

            const scrollArea = document.querySelector('.scroll-area');
            if(scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
        });
    }

    // --- 6. 削除機能 ---
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const targetId = inputId.value;
            if (!targetId) {
                alert('削除する商品を選択してください');
                return;
            }

            const result = confirm(`商品ID: ${targetId} を削除してもよろしいですか？`);
            if (!result) return;

            let targetRow = null;
            document.querySelectorAll('.product-table tbody tr').forEach(row => {
                if (row.querySelector('.cell-id').textContent.trim() === targetId) {
                    targetRow = row;
                }
            });

            if (targetRow) {
                targetRow.remove();
                if (clearBtn) clearBtn.click(); // クリアボタンの処理を流用して空にする
                alert('削除が完了しました');
            }
        });
    }

    // --- 7. クリア機能 ---
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            inputId.value = '';
            inputName.value = '';
            inputPrice.value = '';

            seasonalCheckboxes.forEach(cb => cb.checked = false);
            categoryRadios.forEach(radio => radio.checked = false);

            document.querySelectorAll('.product-table tbody tr').forEach(r => {
                r.classList.remove('row-selected');
            });
        });
    }

    // --- 8. フィルタリング機能 ---
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

    // --- 初期実行処理 ---
    sortTable(0, true);
});