import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { Location, ApiResponse } from '../models/Location.js';
import { RowDataPacket } from 'mysql2';

// 全施設取得
export async function getAllLocations(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM locations WHERE status = ? ORDER BY created_at DESC',
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
      error: 'データベースエラー'
    });
  }
}

// 特定施設の詳細取得
export async function getLocationById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM locations WHERE id = ?',
      [id]
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
      error: 'データベースエラー'
    });
  }
}

// 施設検索
export async function searchLocations(req: Request, res: Response): Promise<void> {
  try {
    const { 
      query,        // 検索キーワード
      has_parking,  // 駐車場フィルター
      has_wifi,     // Wi-Fiフィルター
      has_ac_heating // 冷暖房フィルター
    } = req.query;

    let sql = 'SELECT * FROM locations WHERE status = ?';
    const params: any[] = ['active'];

    // キーワード検索
    if (query) {
      sql += ' AND (name LIKE ? OR address LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm);
    }

    // 設備フィルター
    if (has_parking === 'true') {
      sql += ' AND has_parking = TRUE';
    }
    if (has_wifi === 'true') {
      sql += ' AND has_wifi = TRUE';
    }
    if (has_ac_heating === 'true') {
      sql += ' AND has_ac_heating = TRUE';
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('検索エラー:', error);
    res.status(500).json({
      success: false,
      error: '検索エラー'
    });
  }
}
