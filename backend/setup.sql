-- データベースの作成
CREATE DATABASE IF NOT EXISTS yasaiya_pos DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yasaiya_pos;

-- 1. 商品マスタ（products）
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL COMMENT '野菜, 果物など',
    name VARCHAR(100) NOT NULL COMMENT '商品名',
    price INT NOT NULL COMMENT '単価',
    is_active TINYINT(1) DEFAULT 1 COMMENT '1:販売中, 0:販売停止',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 売上履歴・取引（transactions）
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_amount INT NOT NULL COMMENT '合計金額(税込)',
    tax_amount INT NOT NULL COMMENT '消費税額',
    received_amount INT NOT NULL COMMENT '預かり金',
    change_amount INT NOT NULL COMMENT 'お釣り',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '取引日時'
);

-- 3. 売上明細（transaction_details）
CREATE TABLE IF NOT EXISTS transaction_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    price INT NOT NULL,
    quantity INT NOT NULL,
    subtotal INT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- 4. 管理者情報（admins）
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pin_code VARCHAR(255) NOT NULL COMMENT '4桁の暗証番号(ハッシュ化推奨)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ■ 初期データの投入 ■
-- 管理者パスワード (ここでは仮に '1234' とします。※実運用時はハッシュ化します)
INSERT INTO admins (pin_code) VALUES ('1234');

-- 商品データの投入 (お会計画面にあったもの)
INSERT INTO products (category, name, price) VALUES 
('野菜', 'キャベツ', 200),
('野菜', '大根', 150),
('野菜', 'トマト', 100),
('野菜', 'きゅうり', 80),
('野菜', 'にんじん', 120),
('野菜', '玉ねぎ', 90),
('野菜', 'ピーマン', 150),
('野菜', 'なす', 160),
('野菜', '長ネギ', 110),
('果物', 'バナナ', 500),
('果物', 'リンゴ', 300);