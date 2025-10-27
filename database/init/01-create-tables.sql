-- 卓球場情報テーブルの作成
CREATE TABLE IF NOT EXISTS table_tennis_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '施設名',
    address TEXT COMMENT '住所',
    latitude DECIMAL(10, 8) COMMENT '緯度',
    longitude DECIMAL(11, 8) COMMENT '経度',
    description TEXT COMMENT '説明',
    facilities JSON COMMENT '設備情報',
    operating_hours JSON COMMENT '営業時間',
    contact_info JSON COMMENT '連絡先情報',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卓球場情報テーブル';

-- 開発用サンプルデータの挿入
INSERT INTO table_tennis_locations (name, address, latitude, longitude, description, facilities, operating_hours, contact_info) VALUES
(
    '東京体育館',
    '東京都渋谷区千駄ヶ谷1-17-1',
    35.678178,
    139.714634,
    '大型体育施設。多目的ホールと卓球台完備。',
    JSON_OBJECT(
        'tables', 20,
        'parking', true,
        'rental_equipment', true,
        'shower', true,
        'locker', true
    ),
    JSON_OBJECT(
        'weekday', '9:00-21:00',
        'weekend', '9:00-17:00',
        'holiday', '9:00-17:00'
    ),
    JSON_OBJECT(
        'phone', '03-3403-1151',
        'website', 'https://www.tef.or.jp/tmg/'
    )
),
(
    '品川区総合体育館',
    '東京都品川区東五反田2-11-2',
    35.626446,
    139.728531,
    '地域の総合体育館。卓球教室も開催。',
    JSON_OBJECT(
        'tables', 12,
        'parking', true,
        'rental_equipment', true,
        'shower', false,
        'locker', true
    ),
    JSON_OBJECT(
        'weekday', '9:00-22:00',
        'weekend', '9:00-21:00',
        'holiday', '9:00-21:00'
    ),
    JSON_OBJECT(
        'phone', '03-3449-4400',
        'website', 'https://www.shinagawa-taiikukan.com/'
    )
),
(
    '渋谷区スポーツセンター',
    '東京都渋谷区西原1-40-18',
    35.669406,
    139.679977,
    '渋谷区民向けスポーツ施設。卓球場あり。',
    JSON_OBJECT(
        'tables', 8,
        'parking', false,
        'rental_equipment', true,
        'shower', true,
        'locker', true
    ),
    JSON_OBJECT(
        'weekday', '9:00-21:30',
        'weekend', '9:00-21:30',
        'holiday', '9:00-21:30'
    ),
    JSON_OBJECT(
        'phone', '03-3468-9051',
        'website', 'https://www.city.shibuya.tokyo.jp/'
    )
);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX idx_location ON table_tennis_locations (latitude, longitude);
CREATE INDEX idx_name ON table_tennis_locations (name);
CREATE INDEX idx_created_at ON table_tennis_locations (created_at);

-- 初期データ挿入完了メッセージ
SELECT 'データベース初期化完了' AS message, COUNT(*) AS inserted_records FROM table_tennis_locations;