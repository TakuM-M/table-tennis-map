import mysql from 'mysql2/promise';

// データベース設定の型定義
interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  charset?: string;  // ← 追加
}

// 環境変数から設定を読み込み
export const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'mysql',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'tabletennis_user',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'tabletennis_db'
};

// コネクションプール作成
export const pool = mysql.createPool({
  ...dbConfig,
  charset: 'utf8mb4',              // ← 追加: 文字コード指定
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 接続テスト
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    
    // 文字コードを確認（デバッグ用）
    const [rows] = await connection.execute('SELECT @@character_set_client, @@character_set_connection, @@character_set_results');
    console.log('✅ MySQL接続成功', rows);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL接続エラー:', error);
    return false;
  }
}
