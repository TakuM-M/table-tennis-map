# 🚀 データベース再構築 クイックスタート

## 1分でわかる再構築手順

### ⚡ コマンド3つで完了

```bash
# 1. コンテナ停止
docker-compose down

# 2. データベースボリューム削除
docker volume rm table-tennis-map_mysql_data

# 3. 再起動（自動的に新しいスキーマで初期化される）
docker-compose up -d --build
```

---

## ✅ 成功確認

### phpMyAdminで確認（推奨）

1. ブラウザで http://localhost:8080 を開く
2. ログイン:
   - サーバー: `mysql`
   - ユーザー名: `root`
   - パスワード: `rootpassword`
3. `tabletennis_db`を選択
4. **10個のテーブル**があればOK:
   - users
   - locations
   - operating_hours
   - pricing
   - favorites
   - reviews
   - images
   - **password_reset_tokens** ← 新規
   - **location_stats** ← 新規
   - **review_images** ← 新規

---

## 🆕 追加された機能

### 1. パスワードリセット機能
- テーブル: `password_reset_tokens`
- パスワードハッシュ: **Argon2対応**
- トークン有効期限: 24時間

### 2. 施設統計情報（パフォーマンス最適化）
- テーブル: `location_stats`
- 自動更新: レビュー追加/削除時にトリガーで更新
- 統計内容:
  - 総レビュー数
  - 平均評価（★1〜5の分布）
  - お気に入り登録数
  - 最終レビュー日時

### 3. レビュー画像機能
- テーブル: `review_images`
- 複数画像対応
- サムネイル生成対応
- 画像順序管理

---

## 🔍 動作確認テスト

### テスト: 統計の自動更新

```sql
-- MySQLコンテナに接続
docker-compose exec mysql mysql -u root -prootpassword tabletennis_db

-- レビューを追加
INSERT INTO reviews (location_id, rating, comment, moderation_status)
VALUES (1, 5, 'とても良い施設でした！', 'approved');

-- 統計が自動更新されたか確認
SELECT * FROM location_stats WHERE location_id = 1;

-- 結果: total_reviews=1, average_rating=5.00 になっていればOK！
```

---

## ⚠️ トラブルシューティング

### エラー: ボリュームが削除できない

```bash
# 強制削除
docker-compose down -v
docker volume rm -f table-tennis-map_mysql_data
```

### エラー: トリガー作成に失敗

**原因**: `log-bin-trust-function-creators`設定が必要

**解決**: docker-compose.ymlに以下の設定がすでに追加されています
```yaml
mysql:
  command: >
    --character-set-server=utf8mb4
    --collation-server=utf8mb4_unicode_ci
    --log-bin-trust-function-creators=1
```

---

## 📚 詳細ドキュメント

より詳しい情報は [`REBUILD_DATABASE.md`](./REBUILD_DATABASE.md) を参照してください。

---

## 🎯 次のステップ

データベース再構築が完了したら:

1. **Argon2のインストール**
   ```bash
   cd server
   npm install argon2
   ```

2. **画像アップロード機能のインストール**
   ```bash
   npm install multer sharp
   ```

3. **メール送信機能のインストール**
   ```bash
   npm install nodemailer
   ```

4. **バックエンドAPI開発**
   - パスワードリセットAPI
   - レビュー画像アップロードAPI
   - 統計情報付き施設一覧API