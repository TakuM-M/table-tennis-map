-- 文字コード設定
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;


-- ===========================================
-- 1. 施設情報（locations）
-- ===========================================

INSERT INTO locations (
    name, 
    address, 
    latitude, 
    longitude, 
    phone, 
    website,
    description,
    table_count,
    has_parking,
    has_rental_equipment,
    has_ac_heating,
    has_wifi,
    is_verified,
    status
) VALUES 
-- 施設1: FSXアリーナ
(
    'FSXアリーナ(くにたち市民総合体育館)',
    '東京都国立市富士見台富士見台2‑48‑1',
    35.685209,
    139.440279,
    '042-573-4111',
    'https://kuzaidan.or.jp/gym/rule/shisetsu-T2/',
    '国立市の総合体育館。卓球をはじめ、バスケットボールやバレーボールなど多目的に利用できます。',
    NULL,  -- 卓球台数は不明
    TRUE,  -- 駐車場あり（facilitiesから判断）
    FALSE, -- レンタル情報なし
    TRUE,  -- 冷暖房完備
    FALSE, -- Wi-Fi情報なし
    TRUE,  -- 確認済み施設として登録
    'active'
),

-- 施設2: 日野市民の森ふれあいホール
(
    '日野市民の森ふれあいホール',
    '東京都日野市日野本町6丁目1-3',
    35.681420,
    139.402760,
    '042-584-2555',
    'https://hinofureai.com/topics/',
    '日野市の多目的ホール。最新の卓球台30台を完備しており、快適にプレーできます。',
    NULL,     -- 最新台30台
    FALSE,  -- 駐車場情報なし
    FALSE,  -- レンタル情報なし
    FALSE,  -- 冷暖房情報なし
    TRUE,   -- Wi-Fiあり
    TRUE,
    'active'
),

-- 施設3: 富士森体育館
(
    '富士森体育館',
    '東京都八王子市台町２丁目３−７',
    35.650300,
    139.322635,
    '042-625-2305',
    'https://www.city.hachioji.tokyo.jp/shisetsu/104/p020495.html',
    '八王子市の総合体育館。冷暖房完備で年中快適に利用できます。',
    NULL,
    TRUE,   -- 駐車場あり
    FALSE,
    TRUE,   -- 冷暖房完備
    FALSE,
    TRUE,
    'active'
),

-- 施設4: 小平市民総合体育館
(
    '小平市民総合体育館',
    '東京都小平市津田町１丁目１',
    35.722864,
    139.462583,
    '042-346-9556',
    'https://kodaira-parkconnect.jp/',
    '小平市の中心的な体育施設。各種スポーツ教室も開催されています。',
    NULL,
    TRUE,   -- 駐車場あり
    FALSE,
    TRUE,   -- 冷暖房完備
    FALSE,
    TRUE,
    'active'
);

-- ===========================================
-- 2. 営業時間（operating_hours）
-- ===========================================

-- FSXアリーナ（9:00-22:00）
INSERT INTO operating_hours (location_id, day_of_week, is_closed, open_time, close_time, notes) VALUES
(1, 0, FALSE, '09:00:00', '22:00:00', NULL),  -- 日曜
(1, 1, FALSE, '09:00:00', '22:00:00', NULL),  -- 月曜
(1, 2, FALSE, '09:00:00', '22:00:00', NULL),  -- 火曜
(1, 3, FALSE, '09:00:00', '22:00:00', NULL),  -- 水曜
(1, 4, FALSE, '09:00:00', '22:00:00', '第2・第4木曜は休館'),  -- 木曜
(1, 5, FALSE, '09:00:00', '22:00:00', NULL),  -- 金曜
(1, 6, FALSE, '09:00:00', '22:00:00', NULL);  -- 土曜

-- 日野市民の森ふれあいホール（8:30-23:30）
INSERT INTO operating_hours (location_id, day_of_week, is_closed, open_time, close_time, notes) VALUES
(2, 0, FALSE, '08:30:00', '23:30:00', NULL),
(2, 1, FALSE, '08:30:00', '23:30:00', NULL),
(2, 2, FALSE, '08:30:00', '23:30:00', NULL),
(2, 3, FALSE, '08:30:00', '23:30:00', NULL),
(2, 4, FALSE, '08:30:00', '23:30:00', NULL),
(2, 5, FALSE, '08:30:00', '23:30:00', NULL),
(2, 6, FALSE, '08:30:00', '23:30:00', NULL);

-- 富士森体育館（9:00-21:30）
INSERT INTO operating_hours (location_id, day_of_week, is_closed, open_time, close_time, notes) VALUES
(3, 0, FALSE, '09:00:00', '21:30:00', NULL),
(3, 1, FALSE, '09:00:00', '21:30:00', '第2月曜休館（祝日の場合翌日）'),
(3, 2, FALSE, '09:00:00', '21:30:00', NULL),
(3, 3, FALSE, '09:00:00', '21:30:00', NULL),
(3, 4, FALSE, '09:00:00', '21:30:00', NULL),
(3, 5, FALSE, '09:00:00', '21:30:00', NULL),
(3, 6, FALSE, '09:00:00', '21:30:00', NULL);

-- 小平市民総合体育館（8:30-22:00）
INSERT INTO operating_hours (location_id, day_of_week, is_closed, open_time, close_time, notes) VALUES
(4, 0, FALSE, '08:30:00', '22:00:00', NULL),
(4, 1, FALSE, '08:30:00', '22:00:00', '第4月曜休館（祝日の場合翌日）'),
(4, 2, FALSE, '08:30:00', '22:00:00', NULL),
(4, 3, FALSE, '08:30:00', '22:00:00', NULL),
(4, 4, FALSE, '08:30:00', '22:00:00', NULL),
(4, 5, FALSE, '08:30:00', '22:00:00', NULL),
(4, 6, FALSE, '08:30:00', '22:00:00', NULL);


-- ===========================================
-- 3. 料金設定（pricing）
-- ===========================================

INSERT INTO pricing (location_id, user_type, duration_hours, price, notes) VALUES
-- FSXアリーナ
(1, 'resident', 3, 300, '国立市民料金'),
(1, 'non_resident', 3, 350, '市外料金'),

-- 日野市民の森ふれあいホール
(2, 'resident', 3, 250, '日野市民料金'),
(2, 'non_resident', 3, 500, '市外料金'),

-- 富士森体育館
(3, 'resident', 3, 300, '八王子市民料金'),
(3, 'non_resident', 3, 350, '市外料金'),

-- 小平市民総合体育館
(4, 'resident', 3, 300, '小平市民料金'),
(4, 'non_resident', 3, 350, '市外料金');


-- ===========================================
-- 4. レビュー（reviews）- テストデータ
-- ===========================================

INSERT INTO reviews (location_id, reviewer_name, is_anonymous, moderation_status, rating, comment, visit_date) VALUES
-- FSXアリーナのレビュー
(1, '卓球太郎', FALSE, 'approved', 5, '設備が新しくて快適です。駐車場も広くて便利でした。', '2024-10-20'),
(1, NULL, TRUE, 'approved', 4, '施設はきれいですが、週末は混雑します。', '2024-10-15'),
(1, '国立ユーザー', FALSE, 'approved', 5, '市民料金で利用できるのが嬉しい！', '2024-10-10'),

-- 日野市民の森ふれあいホールのレビュー
(2, NULL, TRUE, 'approved', 5, '最新の台30台は圧巻！練習環境としては最高です。', '2024-10-18'),
(2, '卓球花子', FALSE, 'approved', 4, '営業時間が長いので仕事帰りに利用できて助かります。', '2024-10-12'),

-- 富士森体育館のレビュー
(3, NULL, TRUE, 'approved', 4, '冷暖房がしっかりしているので年中快適です。', '2024-10-08'),
(3, '八王子プレイヤー', FALSE, 'pending', 3, '施設は良いですが、予約が取りづらいです。', '2024-10-25'),

-- 小平市民総合体育館のレビュー
(4, NULL, TRUE, 'approved', 5, '駅からのアクセスも良く、設備も充実しています。', '2024-10-05'),
(4, 'テーブルテニス愛好家', FALSE, 'approved', 4, '教室も開催されていて初心者にもおすすめ。', '2024-09-28');


-- ===========================================
-- 5. 画像（images）- テストデータ
-- ===========================================

INSERT INTO images (location_id, url, storage_type, caption, display_order) VALUES
-- FSXアリーナ
(1, 'https://example.com/images/fsx-arena-exterior.jpg', 'external', '外観', 1),
(1, 'https://example.com/images/fsx-arena-interior.jpg', 'external', '卓球場内部', 2),

-- 日野市民の森ふれあいホール
(2, 'https://example.com/images/hino-hall-main.jpg', 'external', 'メインホール', 1),
(2, 'https://example.com/images/hino-hall-tables.jpg', 'external', '卓球台エリア', 2),

-- 富士森体育館
(3, 'https://example.com/images/fujimori-gym-front.jpg', 'external', '正面入口', 1),

-- 小平市民総合体育館
(4, 'https://example.com/images/kodaira-gym-building.jpg', 'external', '体育館全景', 1);
