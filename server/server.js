import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();
const PORT = 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// データベース接続設定
const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'tabletennis_user',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'tabletennis_db'
};

// データベース接続テスト
async function testConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL接続成功');
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ MySQL接続エラー:', error.message);
    return false;
  }
}

// 基本的なAPIルート
app.get('/', (req, res) => {
  res.json({ 
    message: 'Table Tennis Map API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ヘルスチェック
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'ok',
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// 卓球場データの取得（開発初期用）
app.get('/api/tables', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM table_tennis_locations');
    await connection.end();
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('データ取得エラー:', error);
    res.status(500).json({ 
      success: false,
      error: 'データベースエラー',
      message: error.message
    });
  }
});

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 バックエンドサーバーがポート${PORT}で起動しました`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  testConnection();
});