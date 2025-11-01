import express from 'express';
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail
} from '../controllers/authController.js';

const router = express.Router();

// ============================================
// 認証API ルート定義
// ============================================

// 1. ユーザー登録
router.post('/register', register);

// 2. ログイン
router.post('/login', login);

// 3. ログアウト
router.post('/logout', logout);

// 4. パスワードリセットリクエスト
router.post('/forgot-password', forgotPassword);

// 5. パスワードリセット実行
router.post('/reset-password', resetPassword);

// 6. メール認証
router.post('/verify-email', verifyEmail);

export default router;
