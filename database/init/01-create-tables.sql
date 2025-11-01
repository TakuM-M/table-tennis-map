-- 文字コード設定
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;


-- ===========================================
-- テーブル作成スクリプト
-- 実行順序: users → locations → operating_hours/pricing/reviews/images
-- ===========================================

-- ============================================
-- ユーザーテーブル
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'ユーザー名（一意）',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'メールアドレス',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Argon2でハッシュ化されたパスワード',
    display_name VARCHAR(100) COMMENT '表示名',
    avatar_url VARCHAR(500) COMMENT 'アバター画像URL',
    
    -- 権限管理
    role ENUM('user', 'moderator', 'admin') DEFAULT 'user' COMMENT 'ユーザー権限',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'アカウント有効/無効',
    is_email_verified BOOLEAN DEFAULT FALSE COMMENT 'メール認証済み',
    
    -- タイムスタンプ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    last_login_at TIMESTAMP NULL COMMENT '最終ログイン日時',
    
    -- インデックス
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ユーザーテーブル';

-- ============================================
-- 施設テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '施設名',
    address TEXT NOT NULL COMMENT '住所',
    latitude DECIMAL(10, 8) NOT NULL COMMENT '緯度',
    longitude DECIMAL(11, 8) NOT NULL COMMENT '経度',
    description TEXT COMMENT '施設の説明',
    phone VARCHAR(20) COMMENT '電話番号',
    website VARCHAR(500) COMMENT 'ウェブサイトURL',
    
    -- 設備情報（検索しやすいようにフラグ化）
    table_count INT COMMENT '卓球台数',
    has_parking BOOLEAN DEFAULT FALSE COMMENT '駐車場有無',
    has_rental_equipment BOOLEAN DEFAULT FALSE COMMENT 'レンタル用具有無',
    has_ac_heating BOOLEAN DEFAULT FALSE COMMENT '冷暖房有無',
    has_wifi BOOLEAN DEFAULT FALSE COMMENT 'Wi-Fi有無',
    
    -- メタデータ
    is_verified BOOLEAN DEFAULT FALSE COMMENT '運営者確認済み',
    status ENUM('active', 'temporary_closed', 'closed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_location (latitude, longitude),
    INDEX idx_name (name),
    FULLTEXT idx_search (name, address, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS operating_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    day_of_week TINYINT COMMENT '0=日曜, 1=月曜, ..., 6=土曜',
    is_closed BOOLEAN DEFAULT FALSE,
    exception_dates JSON COMMENT '特別営業・休業日',
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    notes VARCHAR(255) COMMENT '特記事項（例：第3月曜休館）',
    
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    INDEX idx_location (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    user_type ENUM('resident', 'non_resident', 'student', 'senior') NOT NULL COMMENT '利用者区分',
    duration_hours INT NOT NULL COMMENT '利用時間（時間）',
    price INT NOT NULL COMMENT '料金（円）',
    notes TEXT COMMENT '補足説明',
    
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    INDEX idx_location (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- お気に入りテーブル（ユーザーと施設の多対多リレーション）
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'ユーザーID',
    location_id INT NOT NULL COMMENT '施設ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'お気に入り登録日時',
    
    -- 外部キー制約
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    
    -- 同じユーザーが同じ施設を重複してお気に入りできないようにユニーク制約
    UNIQUE KEY unique_user_location (user_id, location_id),
    
    -- インデックス
    INDEX idx_user (user_id),
    INDEX idx_location (location_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='お気に入りテーブル';

-- ============================================
-- レビューテーブル（usersテーブルとリレーション追加）
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    user_id INT DEFAULT NULL COMMENT 'ユーザーID（NULLの場合は匿名投稿）',
    reviewer_name VARCHAR(100) COMMENT '投稿者名（匿名可）',
    is_anonymous BOOLEAN DEFAULT TRUE COMMENT '匿名投稿フラグ',
    moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'スパム対策・承認状態',
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5) COMMENT '評価（1-5）',
    comment TEXT COMMENT 'レビュー本文',
    visit_date DATE COMMENT '訪問日',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '投稿日時',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    
    -- 外部キー制約
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- インデックス
    INDEX idx_location (location_id),
    INDEX idx_user (user_id),
    INDEX idx_rating (rating),
    INDEX idx_moderation_status (moderation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='レビューテーブル';


CREATE TABLE IF NOT EXISTS images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    storage_type ENUM('local', 's3', 'external'),
    file_path VARCHAR(500), -- ローカルパスも保存
    thumbnail_url VARCHAR(500), -- サムネイル用
    caption VARCHAR(255),
    display_order INT DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    INDEX idx_location (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- パスワードリセットトークンテーブル
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'ユーザーID',
    token VARCHAR(255) NOT NULL UNIQUE COMMENT 'リセットトークン（UUID v4）',
    expires_at TIMESTAMP NOT NULL COMMENT 'トークン有効期限（通常24時間後）',
    used_at TIMESTAMP NULL COMMENT 'トークン使用日時',
    ip_address VARCHAR(45) COMMENT 'リクエスト元IPアドレス',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'トークン生成日時',
    
    -- 外部キー制約
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- インデックス
    INDEX idx_token (token),
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='パスワードリセットトークン';


-- ============================================
-- 施設統計テーブル（パフォーマンス最適化用）
-- ============================================
CREATE TABLE IF NOT EXISTS location_stats (
    location_id INT PRIMARY KEY COMMENT '施設ID',
    
    -- レビュー統計
    total_reviews INT DEFAULT 0 COMMENT '総レビュー数',
    approved_reviews INT DEFAULT 0 COMMENT '承認済みレビュー数',
    average_rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '平均評価（1.00-5.00）',
    rating_1_count INT DEFAULT 0 COMMENT '★1の数',
    rating_2_count INT DEFAULT 0 COMMENT '★2の数',
    rating_3_count INT DEFAULT 0 COMMENT '★3の数',
    rating_4_count INT DEFAULT 0 COMMENT '★4の数',
    rating_5_count INT DEFAULT 0 COMMENT '★5の数',
    
    -- お気に入り統計
    total_favorites INT DEFAULT 0 COMMENT 'お気に入り登録数',
    
    -- 最新情報
    last_review_at TIMESTAMP NULL COMMENT '最終レビュー日時',
    
    -- メタデータ
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '統計更新日時',
    
    -- 外部キー制約
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    
    -- インデックス（検索・ソート用）
    INDEX idx_rating (average_rating DESC),
    INDEX idx_reviews (total_reviews DESC),
    INDEX idx_favorites (total_favorites DESC),
    INDEX idx_last_review (last_review_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='施設統計テーブル';


-- ============================================
-- レビュー画像テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS review_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL COMMENT 'レビューID',
    
    -- 画像情報
    url VARCHAR(500) NOT NULL COMMENT '画像URL',
    thumbnail_url VARCHAR(500) COMMENT 'サムネイルURL（最適化済み）',
    storage_type ENUM('local', 's3', 'cloudinary') DEFAULT 'local' COMMENT 'ストレージタイプ',
    file_path VARCHAR(500) COMMENT 'ファイルパス',
    file_size INT COMMENT 'ファイルサイズ（バイト）',
    mime_type VARCHAR(50) COMMENT 'MIMEタイプ（image/jpeg, image/png等）',
    
    -- 表示制御
    display_order INT DEFAULT 0 COMMENT '表示順序',
    caption VARCHAR(255) COMMENT '画像のキャプション',
    
    -- メタデータ
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'アップロード日時',
    
    -- 外部キー制約
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    
    -- インデックス
    INDEX idx_review (review_id),
    INDEX idx_display_order (review_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='レビュー画像テーブル';


-- ============================================
-- トリガー: location_stats自動更新
-- ============================================

DELIMITER $$

-- レビュー追加時の統計更新トリガー
CREATE TRIGGER after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    -- location_statsレコードが存在しない場合は作成
    INSERT INTO location_stats (location_id, total_reviews, approved_reviews, average_rating, last_review_at)
    VALUES (NEW.location_id, 0, 0, 0.00, NULL)
    ON DUPLICATE KEY UPDATE location_id = location_id;
    
    -- 統計を更新
    UPDATE location_stats
    SET 
        total_reviews = total_reviews + 1,
        approved_reviews = approved_reviews + IF(NEW.moderation_status = 'approved', 1, 0),
        last_review_at = NEW.created_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE location_id = NEW.location_id;
    
    -- 承認済みレビューの場合は評価統計も更新
    IF NEW.moderation_status = 'approved' THEN
        UPDATE location_stats
        SET
            rating_1_count = rating_1_count + IF(NEW.rating = 1, 1, 0),
            rating_2_count = rating_2_count + IF(NEW.rating = 2, 1, 0),
            rating_3_count = rating_3_count + IF(NEW.rating = 3, 1, 0),
            rating_4_count = rating_4_count + IF(NEW.rating = 4, 1, 0),
            rating_5_count = rating_5_count + IF(NEW.rating = 5, 1, 0),
            average_rating = (
                SELECT ROUND(AVG(rating), 2)
                FROM reviews
                WHERE location_id = NEW.location_id 
                AND moderation_status = 'approved'
            )
        WHERE location_id = NEW.location_id;
    END IF;
END$$

-- レビュー削除時の統計更新トリガー
CREATE TRIGGER after_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    UPDATE location_stats
    SET 
        total_reviews = total_reviews - 1,
        approved_reviews = approved_reviews - IF(OLD.moderation_status = 'approved', 1, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE location_id = OLD.location_id;
    
    -- 承認済みレビューの場合は評価統計も更新
    IF OLD.moderation_status = 'approved' THEN
        UPDATE location_stats
        SET
            rating_1_count = rating_1_count - IF(OLD.rating = 1, 1, 0),
            rating_2_count = rating_2_count - IF(OLD.rating = 2, 1, 0),
            rating_3_count = rating_3_count - IF(OLD.rating = 3, 1, 0),
            rating_4_count = rating_4_count - IF(OLD.rating = 4, 1, 0),
            rating_5_count = rating_5_count - IF(OLD.rating = 5, 1, 0),
            average_rating = IFNULL((
                SELECT ROUND(AVG(rating), 2)
                FROM reviews
                WHERE location_id = OLD.location_id 
                AND moderation_status = 'approved'
            ), 0.00)
        WHERE location_id = OLD.location_id;
    END IF;
END$$

-- お気に入り追加時の統計更新トリガー
CREATE TRIGGER after_favorite_insert
AFTER INSERT ON favorites
FOR EACH ROW
BEGIN
    -- location_statsレコードが存在しない場合は作成
    INSERT INTO location_stats (location_id, total_favorites)
    VALUES (NEW.location_id, 0)
    ON DUPLICATE KEY UPDATE location_id = location_id;
    
    UPDATE location_stats
    SET 
        total_favorites = total_favorites + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE location_id = NEW.location_id;
END$$

-- お気に入り削除時の統計更新トリガー
CREATE TRIGGER after_favorite_delete
AFTER DELETE ON favorites
FOR EACH ROW
BEGIN
    UPDATE location_stats
    SET 
        total_favorites = total_favorites - 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE location_id = OLD.location_id;
END$$

DELIMITER ;
