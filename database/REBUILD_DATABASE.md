# データベース再構築手順書

## 📋 概要

このドキュメントでは、既存のデータベースを削除して新しいスキーマで再構築する手順を説明します。

## 🆕 新しく追加されたテーブル

1. **password_reset_tokens** - パスワードリセット機能（Argon2対応）
2. **location_stats** - 施設統計情報（パフォーマンス最適化）
3. **review_images** - レビュー画像機能

## ⚠️ 注意事項

- この操作は**既存のデータをすべて削除**します
- 本番環境では事前にバックアップを取得してください
- 開発環境でのみ実行することを推奨します

---

## 🚀 再構築手順

### ステップ1: 現在のコンテナとボリュームの確認

```bash
# 現在実行中のコンテナを確認
docker-compose ps

# 既存のボリュームを確認
docker volume ls | grep table-tennis-map
```

### ステップ2: コンテナの停止と削除

```bash
# すべてのコンテナを停止
docker-compose down
```

このコマンドで以下が実行されます：
- すべてのコンテナの停止
- ネットワークの削除
- **データベースボリュームは保持されます**（次のステップで削除）

### ステップ3: データベースボリュームの削除

```bash
# MySQLデータボリュームを削除
docker volume rm table-tennis-map_mysql_data
```

**確認メッセージ:**
```
table-tennis-map_mysql_data
```

ボリュームが削除されると、上記のような出力が表示されます。

### ステップ4: 新しいスキーマでコンテナを起動

```bash
# すべてのコンテナを再構築して起動
docker-compose up -d --build
```

`--build`フラグにより、Dockerイメージも再ビルドされます。

### ステップ5: データベース初期化の確認

```bash
# MySQLコンテナのログを確認
docker-compose logs mysql

# 以下のようなメッセージが表示されればOK:
# mysql_1  | /usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/01-create-tables.sql
# mysql_1  | /usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/02-insert-sample-data.sql
# mysql_1  | /usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/03-create-views.sql
# mysql_1  | /usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/04-initialize-stats.sql
```

### ステップ6: データベース接続確認

#### 方法1: phpMyAdminで確認

1. ブラウザで http://localhost:8080 にアクセス
2. ログイン情報:
   - サーバー: `mysql`
   - ユーザー名: `root`
   - パスワード: `rootpassword` (docker-compose.ymlで設定した値)
3. `tabletennis_db` データベースを選択
4. 以下のテーブルが存在することを確認:
   - ✅ users
   - ✅ locations
   - ✅ operating_hours
   - ✅ pricing
   - ✅ favorites
   - ✅ reviews
   - ✅ images
   - ✅ **password_reset_tokens** ← 新規
   - ✅ **location_stats** ← 新規
   - ✅ **review_images** ← 新規

#### 方法2: MySQLコマンドラインで確認

```bash
# MySQLコンテナに接続
docker-compose exec mysql mysql -u root -p

# パスワード入力: rootpassword

# データベース選択
USE tabletennis_db;

# テーブル一覧表示
SHOW TABLES;

# 新しいテーブルの構造確認
DESC password_reset_tokens;
DESC location_stats;
DESC review_images;

# トリガーの確認
SHOW TRIGGERS;
```

### ステップ7: バックエンドサーバーの起動確認

```bash
# バックエンドログを確認
docker-compose logs backend

# エラーがないことを確認
# 正常な起動メッセージ例:
# backend_1  | Server is running on port 3000
# backend_1  | Database connected successfully
```

---

## 🔍 動作確認テスト

### テスト1: location_statsトリガーの動作確認

```sql
-- MySQLコンテナ内で実行
USE tabletennis_db;

-- 施設にレビューを追加（承認済み）
INSERT INTO reviews (location_id, rating, comment, moderation_status)
VALUES (1, 5, 'とても良い施設でした！', 'approved');

-- location_statsが自動更新されることを確認
SELECT * FROM location_stats WHERE location_id = 1;

-- 期待される結果:
-- total_reviews = 1
-- approved_reviews = 1
-- average_rating = 5.00
-- rating_5_count = 1
```

### テスト2: お気に入り統計の動作確認

```sql
-- お気に入り追加
INSERT INTO favorites (user_id, location_id)
VALUES (1, 1);

-- location_statsが自動更新されることを確認
SELECT * FROM location_stats WHERE location_id = 1;

-- 期待される結果:
-- total_favorites = 1
```

### テスト3: レビュー画像の追加

```sql
-- レビューに画像を追加
INSERT INTO review_images (review_id, url, storage_type, display_order)
VALUES (1, '/uploads/reviews/image1.jpg', 'local', 0);

-- レビュー画像が追加されたことを確認
SELECT * FROM review_images WHERE review_id = 1;
```

---

## 🛠️ トラブルシューティング

### エラー1: ボリュームが削除できない

**エラーメッセージ:**
```
Error response from daemon: remove table-tennis-map_mysql_data: volume is in use
```

**解決策:**
```bash
# コンテナが完全に停止していることを確認
docker-compose down -v

# または強制削除
docker volume rm -f table-tennis-map_mysql_data
```

### エラー2: トリガーの作成に失敗

**エラーメッセージ:**
```
ERROR 1419 (HY000): You do not have the SUPER privilege and binary logging is enabled
```

**解決策:**

`docker-compose.yml`のMySQLサービスに以下を追加:
```yaml
mysql:
  environment:
    - MYSQL_ROOT_PASSWORD=rootpassword
    - MYSQL_DATABASE=tabletennis_db
  command: --log-bin-trust-function-creators=1
```

### エラー3: 文字化けが発生する

**解決策:**

`docker-compose.yml`のMySQLサービスに以下を追加:
```yaml
mysql:
  command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

---

## 📊 データベーススキーマ図

```
users (ユーザー)
  ├─→ password_reset_tokens (パスワードリセット)
  ├─→ favorites (お気に入り)
  └─→ reviews (レビュー)
        └─→ review_images (レビュー画像)

locations (施設)
  ├─→ operating_hours (営業時間)
  ├─→ pricing (料金)
  ├─→ reviews (レビュー)
  ├─→ images (施設画像)
  ├─→ favorites (お気に入り)
  └─→ location_stats (統計情報) ← 新規
```

---

## 📝 次のステップ

データベースの再構築が完了したら、以下の実装を進めます:

1. **バックエンドAPI開発**
   - パスワードリセットAPI (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`)
   - レビュー画像アップロードAPI (`POST /api/reviews/:id/images`)
   - 統計情報を含む施設一覧API (`GET /api/locations` with stats)

2. **Argon2の実装**
   ```bash
   # serverディレクトリで実行
   npm install argon2
   ```

3. **画像アップロード機能**
   ```bash
   # serverディレクトリで実行
   npm install multer sharp
   ```

4. **メール送信機能（パスワードリセット用）**
   ```bash
   # serverディレクトリで実行
   npm install nodemailer
   ```

---

## ✅ 完了チェックリスト

- [ ] 既存コンテナの停止 (`docker-compose down`)
- [ ] データベースボリュームの削除 (`docker volume rm`)
- [ ] 新しいスキーマでコンテナ起動 (`docker-compose up -d --build`)
- [ ] データベース初期化ログの確認
- [ ] phpMyAdminで10個のテーブルを確認
- [ ] トリガーの動作確認（レビュー追加で統計更新）
- [ ] バックエンドサーバーの起動確認

すべてのチェックが完了したら、次のフェーズ（バックエンドAPI実装）に進めます！