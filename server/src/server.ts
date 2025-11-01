import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import locationRoutes from './routes/locations.js';
import authRoutes from './routes/auth.js';
import { testConnection } from './config/database.js';

// 環境変数読み込み
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// ログ出力
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ルート登録
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Table Tennis Map API',
    version: '2.0.0 (TypeScript)',
    timestamp: new Date().toISOString()
  });
});

// ヘルスチェック
app.get('/api/health', async (req: Request, res: Response) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'ok',
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ルート登録
app.use('/api/locations', locationRoutes);
app.use('/api/auth', authRoutes);

// サーバー起動
app.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 サーバーがポート${PORT}で起動しました`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log('========================================');
  testConnection();
});
