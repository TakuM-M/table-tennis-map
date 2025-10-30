-- ===========================================
-- テーブル作成スクリプト
-- 実行順序: locations → operating_hours/pricing/reviews/images
-- ===========================================


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


CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    user_id INT DEFAULT NULL COMMENT 'ユーザーID（将来の拡張用）',
    reviewer_name VARCHAR(100) COMMENT '投稿者名（匿名可）',
    is_anonymous BOOLEAN DEFAULT TRUE,
    moderation_status ENUM('pending', 'approved', 'rejected') -- スパム対策
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    visit_date DATE COMMENT '訪問日',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    INDEX idx_location (location_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


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
