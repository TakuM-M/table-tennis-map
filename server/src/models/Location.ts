// 施設情報の型
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

// APIレスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface SearchQuery {
  query?: string;
  has_parking?: string;
  has_wifi?: string;
  has_ac_heating?: string;
  limit?: string;
  offset?: string;
}
