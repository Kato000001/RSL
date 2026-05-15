// --- 時計をリアルタイムで動かす処理 ---
function updateClock() {
    const now = new Date();
    
    // 日付のフォーマット (例: 2024/05/20 (月))
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
    const dayOfWeek = daysOfWeek[now.getDay()];
    
    const dateString = `${year}/${month}/${day} (${dayOfWeek})`;
    
    // 時間のフォーマット (例: 14:35:12)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    // HTMLを書き換え
    document.getElementById('current-date').textContent = dateString;
    document.getElementById('current-time').textContent = timeString;
}

// 1秒に1回（1000ミリ秒ごと）時計を更新する
setInterval(updateClock, 1000);
updateClock(); // ページ読み込み時にすぐ1回目を実行

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
    const deleteBtn = document.querySelector('.btn-delete-item');
    const clearBtn = document.querySelector('.btn-clear');

    const tagClassMap = {
        '春': 'tag-pink', '夏': 'tag-yellow', '秋': 'tag-orange', '冬': 'tag-blue',
        '野菜': 'tag-green', '果物': 'tag-orange-light', '通年': '', '特売': 'tag-sale'
    };

    // ソート管理用変数
    let currentSortCol = -1; 
    let isAscending = true;

    // --- 2. ソート処理を関数化（初期実行とクリック時の両方で使用） ---
    function sortTable(index, ascending) {
        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.sort((rowA, rowB) => {
            const cellA = rowA.children[index].textContent.trim();
            const cellB = rowB.children[index].textContent.trim();

            if (index === 0) { // ID
                return ascending ? parseInt(cellA, 10) - parseInt(cellB, 10) : parseInt(cellB, 10) - parseInt(cellA, 10);
            } else if (index === 1) { // 名前
                return ascending ? cellA.localeCompare(cellB, 'ja') : cellB.localeCompare(cellA, 'ja');
            } else if (index === 2) { // 値段
                const valA = parseInt(cellA.replace(/[¥,]/g, ''), 10);
                const valB = parseInt(cellB.replace(/[¥,]/g, ''), 10);
                return ascending ? valA - valB : valB - valA;
            }
            return 0;
        });

        // 並び替えた行を再配置
        rows.forEach(row => tbody.appendChild(row));

        // ヘッダーの矢印表示を更新
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

    // --- 3. その他の機能（行クリック、更新、追加、削除、クリア） ---
    // (※以前の回答で作成した attachDetailEvent などの各機能のコードをここに記述)
    // -------------------------------------------------------------
    
    // 省略：attachDetailEvent(row) の定義
    function attachDetailEvent(row) {
        row.addEventListener('click', () => {
            document.querySelectorAll('.product-table tbody tr').forEach(r => r.classList.remove('row-selected'));
            row.classList.add('row-selected');
            const id = row.querySelector('.cell-id').textContent.trim();
            const name = row.querySelector('.cell-name').textContent.trim();
            const price = row.querySelector('.cell-price').textContent.replace(/[¥,]/g, '').trim();
            const tags = Array.from(row.querySelectorAll('.tag')).map(tag => tag.textContent.trim());
            inputId.value = id;
            inputName.value = name;
            inputPrice.value = price;
            seasonalCheckboxes.forEach(cb => cb.checked = tags.includes(cb.parentElement.textContent.trim()));
            categoryRadios.forEach(radio => radio.checked = tags.includes(radio.parentElement.textContent.trim()));
        });
    }

    // 初期行にイベント登録
    document.querySelectorAll('.product-table tbody tr').forEach(row => attachDetailEvent(row));

    // 更新・追加・削除・クリア・フィルタのロジックは以前のまま維持
    // (中略)

    // --- 4. 初期実行処理 ---
    // ページを読み込んだ瞬間、ID（インデックス0）で昇順ソートを実行する
    sortTable(0, true);
});

    // --- 新規追加機能 ---
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
        // 操作ボタン列(cell-action)を除外して生成
        newRow.innerHTML = `
            <td class="cell-id">${newId}</td>
            <td class="cell-name">${name}</td>
            <td class="cell-price">¥${Number(price).toLocaleString()}</td>
            <td class="cell-attr">${tagsHtml}</td>
        `;

        tbody.appendChild(newRow);
        attachDetailEvent(newRow); // 新しい行にも行クリックイベントを付与
        newRow.click(); // 追加したらそのまま選択状態にする

        const scrollArea = document.querySelector('.scroll-area');
        scrollArea.scrollTop = scrollArea.scrollHeight;
    });

    // フィルタリング機能（既存のまま）
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const kw = button.textContent.trim();
            document.querySelectorAll('.product-table tbody tr').forEach(row => {
                if (kw === '全て') { row.style.display = ''; return; }
                row.style.display = row.querySelector('.cell-attr').textContent.includes(kw) ? '' : 'none';
            });
        });
    });
    // --- 既存のコード内の要素取得部分に追加 ---
const deleteBtn = document.querySelector('.btn-delete');

// --- 削除機能の追加 ---
deleteBtn.addEventListener('click', () => {
    const targetId = inputId.value;
    if (!targetId) {
        alert('削除する商品を選択してください');
        return;
    }

    // 確認ダイアログを表示
    const result = confirm(`商品ID: ${targetId} を削除してもよろしいですか？`);
    if (!result) return;

    // ① 左側のテーブルから該当するIDの行を探す
    const rows = document.querySelectorAll('.product-table tbody tr');
    let targetRow = null;
    rows.forEach(row => {
        if (row.querySelector('.cell-id').textContent.trim() === targetId) {
            targetRow = row;
        }
    });

    if (targetRow) {
        // ② 行を削除
        targetRow.remove();

        // ③ フォームをクリア（空にする）
        inputId.value = '';
        inputName.value = '';
        inputPrice.value = '';
        seasonalCheckboxes.forEach(cb => cb.checked = false);
        categoryRadios.forEach(radio => radio.checked = false);

        alert('削除が完了しました');
    }
});

// --- 既存のコード内の要素取得部分に追加 ---
const clearBtn = document.querySelector('.btn-clear');

// --- クリア機能の追加 ---
clearBtn.addEventListener('click', () => {
    // 1. 入力フィールドをすべて空にする
    inputId.value = '';
    inputName.value = '';
    inputPrice.value = '';

    // 2. チェックボックスとラジオボタンをすべて未選択にする
    seasonalCheckboxes.forEach(cb => cb.checked = false);
    categoryRadios.forEach(radio => radio.checked = false);

    // 3. 左側テーブルの選択状態（ハイライト）を解除する
    document.querySelectorAll('.product-table tbody tr').forEach(r => {
        r.classList.remove('row-selected');
    });

    console.log('入力をリセットしました');
});
// --- 6. ソート機能 ---
const tableHeaders = document.querySelectorAll('.product-table th.sortable');
let currentSortCol = -1; // 現在ソートしている列のインデックス
let isAscending = true;  // 昇順かどうか

tableHeaders.forEach((header, index) => {
    header.addEventListener('click', () => {
        // ① クリックされた列が前回と同じなら昇順・降順を反転、違う列なら昇順からスタート
        if (currentSortCol === index) {
            isAscending = !isAscending;
        } else {
            currentSortCol = index;
            isAscending = true;
        }

        // ② ヘッダーのテキストから既存の矢印(▲/▼)を消して、新しい矢印を付ける
        tableHeaders.forEach(th => th.textContent = th.textContent.replace(/[ ▲▼]/g, ''));
        header.textContent += isAscending ? ' ▲' : ' ▼';

        // ③ 現在表示されている行の配列を取得
        const tbody = document.querySelector('.product-table tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));

        // ④ 行を並び替え（ソート）
        rows.sort((rowA, rowB) => {
            const cellA = rowA.children[index].textContent.trim();
            const cellB = rowB.children[index].textContent.trim();

            if (index === 0) {
                // ID列（数値として比較）
                const valA = parseInt(cellA, 10);
                const valB = parseInt(cellB, 10);
                return isAscending ? valA - valB : valB - valA;

            } else if (index === 1) {
                // 名前列（文字列として比較・日本語対応）
                return isAscending ? cellA.localeCompare(cellB, 'ja') : cellB.localeCompare(cellA, 'ja');

            } else if (index === 2) {
                // 値段列（「¥」と「,」を消して数値として比較）
                const valA = parseInt(cellA.replace(/[¥,]/g, ''), 10);
                const valB = parseInt(cellB.replace(/[¥,]/g, ''), 10);
                return isAscending ? valA - valB : valB - valA;
            }
            return 0;
        });

        // ⑤ 並び替えた行を tbody に戻す（自動的に元の位置から移動します）
        rows.forEach(row => tbody.appendChild(row));
    });
});