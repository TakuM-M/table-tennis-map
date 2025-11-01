import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ============================================
// 型定義
// ============================================
interface SearchQuery {
  query?: string;
  has_parking?: string;
  has_wifi?: string;
  has_ac_heating?: string;
  has_rental_equipment?: string;
  limit?: string;
  offset?: string;
}

// ============================================
// 1. 全施設取得 (統計情報付き)
// GET /api/locations
// ============================================
export async function getAllLocations(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        l.id,
        l.name,
        l.address,
        l.latitude,
        l.longitude,
        l.description,
        l.phone,
        l.website,
        l.table_count,
        l.has_parking,
        l.has_rental_equipment,
        l.has_ac_heating,
        l.has_wifi,
        l.is_verified,
        l.status,
        l.created_at,
        l.updated_at,
        COALESCE(s.total_reviews, 0) as total_reviews,
        COALESCE(s.average_rating, 0.00) as average_rating,
        COALESCE(s.total_favorites, 0) as total_favorites
      FROM locations l
      LEFT JOIN location_stats s ON l.id = s.location_id
      WHERE l.status = ?
      ORDER BY l.created_at DESC`,
      ['active']
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('施設取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'データベースエラーが発生しました'
    });
  }
}

// ============================================
// 2. 特定施設の詳細取得 (営業時間・料金・統計情報含む)
// GET /api/locations/:id
// ============================================
export async function getLocationById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // IDのバリデーション
    const locationId = parseInt(id);
    if (isNaN(locationId) || locationId < 1) {
      res.status(400).json({
        success: false,
        error: '無効なIDです'
      });
      return;
    }

    // 施設基本情報 + 統計情報取得
    const [locationRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        l.*,
        COALESCE(s.total_reviews, 0) as total_reviews,
        COALESCE(s.approved_reviews, 0) as approved_reviews,
        COALESCE(s.average_rating, 0.00) as average_rating,
        COALESCE(s.rating_1_count, 0) as rating_1_count,
        COALESCE(s.rating_2_count, 0) as rating_2_count,
        COALESCE(s.rating_3_count, 0) as rating_3_count,
        COALESCE(s.rating_4_count, 0) as rating_4_count,
        COALESCE(s.rating_5_count, 0) as rating_5_count,
        COALESCE(s.total_favorites, 0) as total_favorites,
        s.last_review_at
      FROM locations l
      LEFT JOIN location_stats s ON l.id = s.location_id
      WHERE l.id = ?`,
      [locationId]
    );

    if (locationRows.length === 0) {
      res.status(404).json({
        success: false,
        error: '施設が見つかりません'
      });
      return;
    }

    // 営業時間取得
    const [operatingHours] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        day_of_week,
        is_closed,
        open_time,
        close_time,
        notes
      FROM operating_hours
      WHERE location_id = ?
      ORDER BY day_of_week`,
      [locationId]
    );

    // 料金情報取得
    const [pricing] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        user_type,
        duration_hours,
        price,
        notes
      FROM pricing
      WHERE location_id = ?
      ORDER BY user_type, duration_hours`,
      [locationId]
    );

    res.json({
      success: true,
      data: {
        ...locationRows[0],
        operating_hours: operatingHours,
        pricing: pricing
      }
    });
  } catch (error) {
    console.error('施設詳細取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'データベースエラーが発生しました'
    });
  }
}

// ============================================
// 3. 施設検索 (LIKE検索対応)
// GET /api/locations/search
// ============================================
export async function searchLocations(req: Request, res: Response): Promise<void> {
  try {
    const { 
      query,
      has_parking,
      has_wifi,
      has_ac_heating,
      has_rental_equipment,
      limit = '50',
      offset = '0'
    } = req.query;

    // 基本クエリ
    let sql = `
      SELECT 
        l.id, l.name, l.address, l.latitude, l.longitude, l.description,
        l.table_count, l.has_parking, l.has_wifi, l.has_ac_heating,
        l.has_rental_equipment, l.is_verified, l.created_at,
        COALESCE(s.average_rating, 0.00) as average_rating,
        COALESCE(s.total_reviews, 0) as total_reviews
      FROM locations l
      LEFT JOIN location_stats s ON l.id = s.location_id
      WHERE l.status = 'active'
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    // キーワード検索
    if (query && typeof query === 'string') {
      const searchTerm = `%${query.trim()}%`;
      conditions.push('(l.name LIKE ? OR l.address LIKE ? OR l.description LIKE ?)');
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // 設備フィルター
    if (has_parking === 'true') {
      conditions.push('l.has_parking = TRUE');
    }
    if (has_wifi === 'true') {
      conditions.push('l.has_wifi = TRUE');
    }
    if (has_ac_heating === 'true') {
      conditions.push('l.has_ac_heating = TRUE');
    }
    if (has_rental_equipment === 'true') {
      conditions.push('l.has_rental_equipment = TRUE');
    }

    // WHERE句に条件を追加
    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ');
    }

    // ソートとページネーション
    sql += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    // 実行
    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

    // 総件数取得
    let countSql = `
      SELECT COUNT(*) as total
      FROM locations l
      WHERE l.status = 'active'
    `;
    
    if (conditions.length > 0) {
      countSql += ' AND ' + conditions.join(' AND ');
    }

    const countParams = params.slice(0, -2); // limit/offsetを除く
    const [countResult] = await pool.execute<RowDataPacket[]>(countSql, countParams);
    const total = (countResult[0] as any).total;

    res.json({
      success: true,
      count: rows.length,
      total: total,
      page: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + rows.length < total
      },
      data: rows
    });

  } catch (error) {
    console.error('検索エラー:', error);
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
    }
    res.status(500).json({
      success: false,
      error: '検索処理中にエラーが発生しました'
    });
  }
}

// ============================================
// 4. 施設登録 (管理者のみ)
// POST /api/locations
// ============================================
export async function createLocation(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      address,
      latitude,
      longitude,
      description,
      phone,
      website,
      table_count,
      has_parking = false,
      has_rental_equipment = false,
      has_ac_heating = false,
      has_wifi = false
    } = req.body;

    // バリデーション
    if (!name || !address || !latitude || !longitude) {
      res.status(400).json({
        success: false,
        error: '施設名、住所、緯度、経度は必須です'
      });
      return;
    }

    // 緯度経度のバリデーション
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      res.status(400).json({
        success: false,
        error: '緯度は-90〜90の範囲で指定してください'
      });
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      res.status(400).json({
        success: false,
        error: '経度は-180〜180の範囲で指定してください'
      });
      return;
    }

    // 施設登録
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO locations (
        name, address, latitude, longitude, description,
        phone, website, table_count,
        has_parking, has_rental_equipment, has_ac_heating, has_wifi,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        address,
        lat,
        lng,
        description || null,
        phone || null,
        website || null,
        table_count || null,
        has_parking,
        has_rental_equipment,
        has_ac_heating,
        has_wifi,
        'active'
      ]
    );

    // 登録した施設を取得
    const [newLocation] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM locations WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: '施設を登録しました',
      data: newLocation[0]
    });

  } catch (error) {
    console.error('施設登録エラー:', error);
    
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
    }

    res.status(500).json({
      success: false,
      error: '施設登録中にエラーが発生しました'
    });
  }
}

// ============================================
// 5. 施設更新 (管理者のみ)
// PATCH /api/locations/:id
// ============================================
export async function updateLocation(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    // IDのバリデーション
    const locationId = parseInt(id);
    if (isNaN(locationId) || locationId < 1) {
      res.status(400).json({
        success: false,
        error: '無効なIDです'
      });
      return;
    }

    // 施設の存在確認
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM locations WHERE id = ?',
      [locationId]
    );

    if (existing.length === 0) {
      res.status(404).json({
        success: false,
        error: '施設が見つかりません'
      });
      return;
    }

    // 更新可能なフィールドを抽出
    const allowedFields = [
      'name', 'address', 'latitude', 'longitude', 'description',
      'phone', 'website', 'table_count',
      'has_parking', 'has_rental_equipment', 'has_ac_heating', 'has_wifi',
      'is_verified', 'status'
    ];

    const updates: string[] = [];
    const values: any[] = [];

    // リクエストボディから更新フィールドを動的に構築
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // 緯度経度のバリデーション
        if (field === 'latitude') {
          const lat = parseFloat(req.body[field]);
          if (isNaN(lat) || lat < -90 || lat > 90) {
            res.status(400).json({
              success: false,
              error: '緯度は-90〜90の範囲で指定してください'
            });
            return;
          }
          values.push(lat);
        } else if (field === 'longitude') {
          const lng = parseFloat(req.body[field]);
          if (isNaN(lng) || lng < -180 || lng > 180) {
            res.status(400).json({
              success: false,
              error: '経度は-180〜180の範囲で指定してください'
            });
            return;
          }
          values.push(lng);
        } else {
          values.push(req.body[field]);
        }
        updates.push(`${field} = ?`);
      }
    }

    // 更新するフィールドがない場合
    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: '更新するフィールドがありません'
      });
      return;
    }

    // SQL実行
    values.push(locationId);
    await pool.execute(
      `UPDATE locations SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // 更新後のデータを取得
    const [updated] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM locations WHERE id = ?',
      [locationId]
    );

    res.json({
      success: true,
      message: '施設情報を更新しました',
      data: updated[0]
    });

  } catch (error) {
    console.error('施設更新エラー:', error);
    
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
    }

    res.status(500).json({
      success: false,
      error: '施設更新中にエラーが発生しました'
    });
  }
}


