// ============================================
// 施設情報の型定義
// ============================================
export interface Location {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  phone?: string;
  website?: string;
  table_count?: number;
  has_parking: boolean;
  has_rental_equipment: boolean;
  has_ac_heating: boolean;
  has_wifi: boolean;
  is_verified: boolean;
  status: 'active' | 'temporary_closed' | 'closed';
  created_at: Date;
  updated_at: Date;
}

// ============================================
// 統計情報付き施設情報
// ============================================
export interface LocationWithStats extends Location {
  total_reviews: number;
  approved_reviews: number;
  average_rating: number;
  rating_1_count: number;
  rating_2_count: number;
  rating_3_count: number;
  rating_4_count: number;
  rating_5_count: number;
  total_favorites: number;
  last_review_at?: Date;
}

// ============================================
// 営業時間の型定義
// ============================================
export interface OperatingHours {
  id: number;
  location_id: number;
  day_of_week: number; // 0=日曜, 1=月曜, ..., 6=土曜
  is_closed: boolean;
  open_time: string;
  close_time: string;
  notes?: string;
}

// ============================================
// 料金情報の型定義
// ============================================
export interface Pricing {
  id: number;
  location_id: number;
  user_type: 'resident' | 'non_resident' | 'student' | 'senior';
  duration_hours: number;
  price: number;
  notes?: string;
}

// ============================================
// 画像情報の型定義
// ============================================
export interface Image {
  id: number;
  location_id: number;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  display_order: number;
  uploaded_at: Date;
}

// ============================================
// レビュー情報の型定義
// ============================================
export interface Review {
  id: number;
  location_id: number;
  user_id?: number;
  reviewer_name?: string;
  is_anonymous: boolean;
  rating: number;
  comment?: string;
  visit_date?: Date;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

// ============================================
// レビュー画像の型定義
// ============================================
export interface ReviewImage {
  id: number;
  review_id: number;
  url: string;
  thumbnail_url?: string;
  caption?: string;
}

// ============================================
// 検索クエリの型定義
// ============================================
export interface SearchQuery {
  query?: string;
  has_parking?: string;
  has_wifi?: string;
  has_ac_heating?: string;
  has_rental_equipment?: string;
  limit?: string;
  offset?: string;
}

// ============================================
// 近隣検索クエリの型定義
// ============================================
export interface NearbyQuery {
  lat?: string;
  lng?: string;
  radius?: string;
}

// ============================================
// APIレスポンスの型定義
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
  total?: number;
  page?: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
