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
