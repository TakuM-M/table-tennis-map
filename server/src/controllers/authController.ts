import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// ============================================
// 型定義
// ============================================
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// ============================================
// JWT設定
// ============================================
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7日間有効

// ============================================
// ヘルパー関数: JWTトークン生成
// ============================================
function generateToken(userId: number, email: string, role: string): string {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ============================================
// ヘルパー関数: メール送信 (モック版)
// ============================================
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // TODO: 本番環境ではnodemailerを使用
  console.log('📧 メール送信 (モック):');
  console.log('  To:', to);
  console.log('  Subject:', subject);
  console.log('  Body:', html);
}

// ============================================
// 1. ユーザー登録
// POST /api/auth/register
// ============================================
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password, display_name } = req.body as RegisterRequest;

    // バリデーション
    if (!username || !email || !password) {
      res.status(400).json({
        success: false,
        error: 'ユーザー名、メールアドレス、パスワードは必須です'
      });
      return;
    }

    // パスワード強度チェック
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        error: 'パスワードは8文字以上である必要があります'
      });
      return;
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'メールアドレスの形式が正しくありません'
      });
      return;
    }

    // ユーザー名重複チェック
    const [existingUsers] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      res.status(409).json({
        success: false,
        error: 'このユーザー名またはメールアドレスは既に使用されています'
      });
      return;
    }

    // パスワードをArgon2でハッシュ化
    const passwordHash = await argon2.hash(password);

    // メール認証トークン生成
    const verificationToken = uuidv4();

    // ユーザー登録
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (
        username, email, password_hash, display_name,
        role, is_active, is_email_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, display_name || username, 'user', true, false]
    );

    const userId = result.insertId;

    // メール認証メール送信 (モック)
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    await sendEmail(
      email,
      '【卓球施設マップ】メールアドレス認証',
      `
        <h2>アカウント登録ありがとうございます!</h2>
        <p>以下のリンクをクリックしてメールアドレスを認証してください:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>このリンクは24時間有効です。</p>
      `
    );

    // JWTトークン発行
    const token = generateToken(userId, email, 'user');

    // 登録したユーザー情報を取得
    const [newUser] = await pool.execute<RowDataPacket[]>(
      'SELECT id, username, email, display_name, role, is_email_verified, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'ユーザー登録が完了しました。メールアドレスを認証してください。',
      data: {
        user: newUser[0],
        token: token
      }
    });

  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
    }
    res.status(500).json({
      success: false,
      error: 'ユーザー登録中にエラーが発生しました'
    });
  }
}

// ============================================
// 2. ログイン
// POST /api/auth/login
// ============================================
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as LoginRequest;

    // バリデーション
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'メールアドレスとパスワードは必須です'
      });
      return;
    }

    // ユーザー検索
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id, username, email, password_hash, display_name, role, is_active, is_email_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      res.status(401).json({
        success: false,
        error: 'メールアドレスまたはパスワードが正しくありません'
      });
      return;
    }

    const user = users[0];

    // アカウント有効性チェック
    if (!user.is_active) {
      res.status(403).json({
        success: false,
        error: 'このアカウントは無効化されています'
      });
      return;
    }

    // パスワード検証
    const isValidPassword = await argon2.verify(user.password_hash, password);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'メールアドレスまたはパスワードが正しくありません'
      });
      return;
    }

    // 最終ログイン日時を更新
    await pool.execute(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    // JWTトークン発行
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      success: true,
      message: 'ログインに成功しました',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
          is_email_verified: user.is_email_verified
        },
        token: token
      }
    });

  } catch (error) {
    console.error('ログインエラー:', error);
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
    }
    res.status(500).json({
      success: false,
      error: 'ログイン処理中にエラーが発生しました'
    });
  }
}

// ============================================
// 3. ログアウト
// POST /api/auth/logout
// ============================================
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    // JWTの場合、クライアント側でトークンを削除するだけでOK
    // サーバー側では特に処理不要（ステートレス）
    
    res.json({
      success: true,
      message: 'ログアウトしました'
    });

  } catch (error) {
    console.error('ログアウトエラー:', error);
    res.status(500).json({
      success: false,
      error: 'ログアウト処理中にエラーが発生しました'
    });
  }
}

// ============================================
// 4. パスワードリセットリクエスト
// POST /api/auth/forgot-password
// ============================================
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    // バリデーション
    if (!email) {
      res.status(400).json({
        success: false,
        error: 'メールアドレスは必須です'
      });
      return;
    }

    // ユーザー検索
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id, username, email FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    // セキュリティのため、ユーザーが存在しなくても成功レスポンスを返す
    if (users.length === 0) {
      res.json({
        success: true,
        message: 'パスワードリセット用のメールを送信しました'
      });
      return;
    }

    const user = users[0];

    // リセットトークン生成（UUID v4）
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

    // リクエスト元のIPアドレス取得
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    // トークンをデータベースに保存
    await pool.execute(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address)
       VALUES (?, ?, ?, ?)`,
      [user.id, resetToken, expiresAt, ipAddress]
    );

    // リセット用メール送信
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    await sendEmail(
      email,
      '【卓球施設マップ】パスワードリセット',
      `
        <h2>パスワードリセットのリクエストを受け付けました</h2>
        <p>以下のリンクをクリックして新しいパスワードを設定してください:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>このリンクは24時間有効です。</p>
        <p>※このリクエストに心当たりがない場合は、このメールを無視してください。</p>
      `
    );

    res.json({
      success: true,
      message: 'パスワードリセット用のメールを送信しました'
    });

  } catch (error) {
    console.error('パスワードリセットリクエストエラー:', error);
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
    }
    res.status(500).json({
      success: false,
      error: 'パスワードリセット処理中にエラーが発生しました'
    });
  }
}

// ============================================
// 5. パスワードリセット実行
// POST /api/auth/reset-password
// ============================================
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, new_password } = req.body as ResetPasswordRequest;

    // バリデーション
    if (!token || !new_password) {
      res.status(400).json({
        success: false,
        error: 'トークンと新しいパスワードは必須です'
      });
      return;
    }

    // パスワード強度チェック
    if (new_password.length < 8) {
      res.status(400).json({
        success: false,
        error: 'パスワードは8文字以上である必要があります'
      });
      return;
    }

    // トークンの検証
    const [tokens] = await pool.execute<RowDataPacket[]>(
      `SELECT user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = ?`,
      [token]
    );

    if (tokens.length === 0) {
      res.status(400).json({
        success: false,
        error: '無効なトークンです'
      });
      return;
    }

    const resetToken = tokens[0];

    // トークンの使用済みチェック
    if (resetToken.used_at) {
      res.status(400).json({
        success: false,
        error: 'このトークンは既に使用されています'
      });
      return;
    }

    // トークンの有効期限チェック
    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);
    if (now > expiresAt) {
      res.status(400).json({
        success: false,
        error: 'トークンの有効期限が切れています'
      });
      return;
    }

    // 新しいパスワードをハッシュ化
    const passwordHash = await argon2.hash(new_password);

    // パスワードを更新
    await pool.execute(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, resetToken.user_id]
    );

    // トークンを使用済みにする
    await pool.execute(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?',
      [token]
    );

    res.json({
      success: true,
      message: 'パスワードがリセットされました'
    });

  } catch (error) {
    console.error('パスワードリセット実行エラー:', error);
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
    }
    res.status(500).json({
      success: false,
      error: 'パスワードリセット処理中にエラーが発生しました'
    });
  }
}

// ============================================
// 6. メール認証
// POST /api/auth/verify-email
// ============================================
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;

    // バリデーション
    if (!token) {
      res.status(400).json({
        success: false,
        error: '認証トークンは必須です'
      });
      return;
    }

    // TODO: 実際の実装では、メール認証トークンをデータベースに保存する必要があります
    // 今回は簡易実装として、ユーザーIDを直接受け取る形にします

    res.json({
      success: true,
      message: 'メールアドレスが認証されました'
    });

  } catch (error) {
    console.error('メール認証エラー:', error);
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
    }
    res.status(500).json({
      success: false,
      error: 'メール認証処理中にエラーが発生しました'
    });
  }
}
