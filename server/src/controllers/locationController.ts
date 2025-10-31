import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { Location, ApiResponse } from '../models/Location.js';
import { RowDataPacket } from 'mysql2';
import { SearchQuery } from '../models/Location.js';

// ============================================
// 全施設取得
// ============================================
export async function getAllLocations(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        id, name, address, latitude, longitude,
        has_parking, has_wifi, has_ac_heating,
        created_at, updated_at
      FROM locations
      WHERE status = ?
      ORDER BY created_at DESC`,
      ['active']
    );

    const response: ApiResponse<Location[]> = {
      success: true,
      count: rows.length,
      data: rows as Location[]
    };

    res.json(response);
  } catch (error) {
    console.error('施設取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'データベースエラーが発生しました'
    });
  }
}

// ============================================
// 特定施設の詳細取得
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

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM locations WHERE id = ? AND status = ?',
      [locationId, 'active']
    );

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        error: '施設が見つかりません'
      });
      return;
    }

    res.json({
      success: true,
      data: rows[0]
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
// 施設検索 (改善版)
// ============================================
export async function searchLocations(req: Request, res: Response): Promise<void> {
  try {
    const searchParams = req.query as SearchQuery;

    // 2️⃣ SQL構築 (型安全)
    const conditions: string[] = ['status = ?'];
    const params: (string | number)[] = ['active'];

    // キーワード検索 (危険な文字をエスケープ)
    if (searchParams.query) {
      const sanitizedQuery = searchParams.query.trim();
      if (sanitizedQuery.length > 0) {
        conditions.push('(name LIKE ? OR address LIKE ?)');
        const searchTerm = `%${sanitizedQuery}%`;
        params.push(searchTerm, searchTerm);
      }
    }

    // 設備フィルター (型安全に変換)
    if (searchParams.has_parking === 'true') {
      conditions.push('has_parking = TRUE');
    }
    if (searchParams.has_wifi === 'true') {
      conditions.push('has_wifi = TRUE');
    }
    if (searchParams.has_ac_heating === 'true') {
      conditions.push('has_ac_heating = TRUE');
    }

    // 3️⃣ ページネーション
    const limit = searchParams.limit ? parseInt(searchParams.limit) : 50;
    const offset = searchParams.offset ? parseInt(searchParams.offset) : 0;

    // 4️⃣ SQL実行 (必要なカラムのみ取得)
    const sql = `
      SELECT 
        id, name, address, latitude, longitude,
        has_parking, has_wifi, has_ac_heating,
        created_at
      FROM locations 
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

    // 5️⃣ 総件数取得 (ページネーション用)
    const countSql = `
      SELECT COUNT(*) as total 
      FROM locations 
      WHERE ${conditions.join(' AND ')}
    `;
    const [countResult] = await pool.execute<RowDataPacket[]>(
      countSql, 
      params.slice(0, -2) // limit/offsetを除く
    );

    const total = (countResult[0] as any).total;

    // 6️⃣ レスポンス
    res.json({
      success: true,
      count: rows.length,
      total: total,
      page: {
        limit: limit,
        offset: offset,
        hasMore: offset + rows.length < total
      },
      data: rows
    });

  } catch (error) {
    console.error('検索エラー:', error);
    
    // エラーの詳細をログに記録
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
      console.error('スタックトレース:', error.stack);
    }

    res.status(500).json({
      success: false,
      error: '検索処理中にエラーが発生しました'
    });
  }
}

// ============================================
// レビュー取得（修正版 - usersテーブルなし対応）
// ============================================
export async function getLocationReviews(req: Request, res: Response): Promise<void> {
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

    // usersテーブルを使わないクエリに修正
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        id,
        reviewer_name,
        is_anonymous,
        rating,
        comment,
        visit_date,
        moderation_status,
        created_at
       FROM reviews
       WHERE location_id = ? AND moderation_status = 'approved'
       ORDER BY created_at DESC`,
      [locationId]
    );

    // 匿名の場合は名前を隠す
    const sanitizedReviews = rows.map(review => ({
      id: review.id,
      reviewer_name: review.is_anonymous ? '匿名' : review.reviewer_name,
      rating: review.rating,
      comment: review.comment,
      visit_date: review.visit_date,
      created_at: review.created_at
    }));

    res.json({
      success: true,
      count: sanitizedReviews.length,
      data: sanitizedReviews
    });
  } catch (error) {
    console.error('レビュー取得エラー:', error);
    
    // デバッグ用に詳細なエラー情報をログ出力
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('スタックトレース:', error.stack);
    }
    
    res.status(500).json({
      success: false,
      error: 'データベースエラーが発生しました'
    });
  }
}



// ============================================
// 近隣施設検索 (距離で絞り込み)
// ============================================


