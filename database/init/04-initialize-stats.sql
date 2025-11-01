-- ============================================
-- 既存データから統計テーブルを初期化
-- ============================================

-- 既存の全施設に対して統計レコードを作成
INSERT INTO location_stats (
    location_id,
    total_reviews,
    approved_reviews,
    average_rating,
    rating_1_count,
    rating_2_count,
    rating_3_count,
    rating_4_count,
    rating_5_count,
    total_favorites,
    last_review_at
)
SELECT 
    l.id AS location_id,
    COUNT(DISTINCT r.id) AS total_reviews,
    SUM(CASE WHEN r.moderation_status = 'approved' THEN 1 ELSE 0 END) AS approved_reviews,
    ROUND(AVG(CASE WHEN r.moderation_status = 'approved' THEN r.rating END), 2) AS average_rating,
    SUM(CASE WHEN r.moderation_status = 'approved' AND r.rating = 1 THEN 1 ELSE 0 END) AS rating_1_count,
    SUM(CASE WHEN r.moderation_status = 'approved' AND r.rating = 2 THEN 1 ELSE 0 END) AS rating_2_count,
    SUM(CASE WHEN r.moderation_status = 'approved' AND r.rating = 3 THEN 1 ELSE 0 END) AS rating_3_count,
    SUM(CASE WHEN r.moderation_status = 'approved' AND r.rating = 4 THEN 1 ELSE 0 END) AS rating_4_count,
    SUM(CASE WHEN r.moderation_status = 'approved' AND r.rating = 5 THEN 1 ELSE 0 END) AS rating_5_count,
    COUNT(DISTINCT f.id) AS total_favorites,
    MAX(r.created_at) AS last_review_at
FROM locations l
LEFT JOIN reviews r ON l.id = r.location_id
LEFT JOIN favorites f ON l.id = f.location_id
GROUP BY l.id
ON DUPLICATE KEY UPDATE
    total_reviews = VALUES(total_reviews),
    approved_reviews = VALUES(approved_reviews),
    average_rating = VALUES(average_rating),
    rating_1_count = VALUES(rating_1_count),
    rating_2_count = VALUES(rating_2_count),
    rating_3_count = VALUES(rating_3_count),
    rating_4_count = VALUES(rating_4_count),
    rating_5_count = VALUES(rating_5_count),
    total_favorites = VALUES(total_favorites),
    last_review_at = VALUES(last_review_at);