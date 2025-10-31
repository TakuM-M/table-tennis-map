import { Request, Response, NextFunction } from 'express';
import { SearchQuery } from '../models/Location.js';

// ============================================
// バリデーションミドルウェア（Expressミドルウェア形式）
// ============================================
export function validateSearchParams(req: Request, res: Response, next: NextFunction): void {
  const params = req.query as SearchQuery;
  const errors: string[] = [];

  // クエリ文字列の長さチェック
  if (params.query && params.query.length > 100) {
    errors.push('検索キーワードは100文字以内にしてください');
  }

  // ブール値のチェック
  const boolFields = ['has_parking', 'has_wifi', 'has_ac_heating'];
  for (const field of boolFields) {
    const value = params[field as keyof SearchQuery];
    if (value && value !== 'true' && value !== 'false') {
      errors.push(`${field}は'true'または'false'である必要があります`);
    }
  }

  // limit/offset の数値チェック
  if (params.limit) {
    const limit = parseInt(params.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('limitは1〜100の整数である必要があります');
    }
  }

  if (params.offset) {
    const offset = parseInt(params.offset);
    if (isNaN(offset) || offset < 0) {
      errors.push('offsetは0以上の整数である必要があります');
    }
  }

  // エラーがあればレスポンスを返して処理を止める
  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: 'バリデーションエラー',
      details: errors
    });
    return;
  }

  // エラーがなければ次のミドルウェア/コントローラーへ
  next();
}