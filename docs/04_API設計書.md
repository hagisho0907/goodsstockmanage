# IPグッズ在庫管理システム API設計書

## 1. 概要

### 1.1 API仕様
- プロトコル: HTTPS
- データ形式: JSON
- 認証方式: JWT (JSON Web Token)
- APIバージョン: v1
- ベースURL: `https://api.goods-stock.example.com/v1`

### 1.2 共通仕様

#### リクエストヘッダー
```http
Content-Type: application/json
Authorization: Bearer {jwt_token}
Accept-Language: ja
```

#### レスポンス形式（成功時）
```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00+09:00"
  }
}
```

#### レスポンス形式（エラー時）
```json
{
  "success": false,
  "error": {
    "code": "ERR_001",
    "message": "エラーメッセージ",
    "details": {}
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00+09:00"
  }
}
```

#### HTTPステータスコード
- 200: OK - 正常終了
- 201: Created - リソース作成成功
- 204: No Content - 削除成功
- 400: Bad Request - リクエスト不正
- 401: Unauthorized - 認証エラー
- 403: Forbidden - 権限エラー
- 404: Not Found - リソースなし
- 422: Unprocessable Entity - バリデーションエラー
- 500: Internal Server Error - サーバーエラー

## 2. 認証API

### 2.1 ログイン
```
POST /auth/login
```

#### リクエスト
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "山田太郎",
      "email": "user@example.com",
      "roles": ["inventory_manager"]
    }
  }
}
```

### 2.2 トークンリフレッシュ
```
POST /auth/refresh
```

#### リクエスト
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.3 ログアウト
```
POST /auth/logout
```

## 3. 商品API

### 3.1 商品一覧取得
```
GET /products
```

#### クエリパラメータ
- `page`: ページ番号（デフォルト: 1）
- `per_page`: 1ページあたりの件数（デフォルト: 20、最大: 100）
- `search`: 検索キーワード（商品名、SKU）
- `category_id`: カテゴリーID
- `storage_location_id`: 保管場所ID
- `status`: 状態（new, used, damaged）
- `stock_status`: 在庫状態（in_stock, low_stock, out_of_stock）
- `sort`: ソート順（created_at, name, sku, current_stock）
- `order`: 並び順（asc, desc）

#### レスポンス
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "sku": "A001",
        "name": "キャラクターA ぬいぐるみ",
        "description": "限定版ぬいぐるみ",
        "category": {
          "id": "cat001",
          "name": "ぬいぐるみ"
        },
        "current_stock": 100,
        "min_stock": 20,
        "storage_location": {
          "id": "loc001",
          "name": "倉庫A-1"
        },
        "status": "new",
        "primary_image_url": "https://example.com/images/a001.jpg",
        "sales_end_date": "2024-12-31",
        "sales_status": "active",
        "created_at": "2024-01-01T10:00:00+09:00"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "per_page": 20,
      "total_items": 200
    }
  }
}
```

### 3.2 商品詳細取得
```
GET /products/{product_id}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "sku": "A001",
    "name": "キャラクターA ぬいぐるみ",
    "description": "限定版ぬいぐるみ",
    "category": {
      "id": "cat001",
      "name": "ぬいぐるみ"
    },
    "current_stock": 100,
    "min_stock": 20,
    "storage_location": {
      "id": "loc001",
      "name": "倉庫A-1",
      "code": "WH-A-1"
    },
    "status": "new",
    "barcode": "4901234567890",
    "qr_code": "QR001234",
    "images": [
      {
        "id": "img001",
        "url": "https://example.com/images/a001.jpg",
        "is_primary": true
      }
    ],
    "ip_info": {
      "production_quantity": 1000,
      "sales_regions": ["日本", "北米"],
      "sales_start_date": "2024-01-01",
      "sales_end_date": "2024-12-31",
      "licensor": "〇〇プロダクション",
      "licensee": "△△商事",
      "manufacturer": {
        "id": "mfr001",
        "name": "××工業"
      }
    },
    "created_by": {
      "id": "user001",
      "name": "山田太郎"
    },
    "created_at": "2024-01-01T10:00:00+09:00",
    "updated_at": "2024-01-20T15:30:00+09:00"
  }
}
```

### 3.3 商品登録
```
POST /products
```

#### リクエスト
```json
{
  "sku": "A002",
  "name": "キャラクターB フィギュア",
  "description": "限定版フィギュア",
  "category_id": "cat002",
  "initial_stock": 50,
  "min_stock": 10,
  "storage_location_id": "loc002",
  "status": "new",
  "generate_qr_code": true,
  "ip_info": {
    "production_quantity": 500,
    "sales_regions": ["日本"],
    "sales_start_date": "2024-02-01",
    "sales_end_date": "2024-12-31",
    "licensor": "〇〇プロダクション",
    "licensee": "△△商事",
    "manufacturer_id": "mfr001"
  }
}
```

### 3.4 商品更新
```
PUT /products/{product_id}
```

### 3.5 商品削除
```
DELETE /products/{product_id}
```

## 4. 在庫移動API

### 4.1 入出庫履歴取得
```
GET /stock-movements
```

#### クエリパラメータ
- `product_id`: 商品ID
- `movement_type`: 移動タイプ（in, out）
- `date_from`: 開始日
- `date_to`: 終了日
- `page`: ページ番号
- `per_page`: 1ページあたりの件数

### 4.2 入庫処理
```
POST /stock-movements/in
```

#### リクエスト
```json
{
  "items": [
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440001",
      "quantity": 50,
      "to_location_id": "loc001"
    }
  ],
  "movement_type": "purchase",
  "notes": "定期仕入れ"
}
```

### 4.3 出庫処理
```
POST /stock-movements/out
```

#### リクエスト
```json
{
  "items": [
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440001",
      "quantity": 30,
      "from_location_id": "loc001"
    }
  ],
  "movement_type": "sales",
  "destination_info": {
    "customer": "〇〇ストア",
    "address": "東京都...",
    "contact": "03-1234-5678"
  },
  "notes": "通常販売"
}
```

## 5. 棚卸しAPI

### 5.1 棚卸し作成
```
POST /stocktakings
```

#### リクエスト
```json
{
  "name": "2024年1月度棚卸し",
  "target_date": "2024-01-31",
  "target_products": ["all"] // または商品IDの配列
}
```

### 5.2 棚卸し更新
```
PUT /stocktakings/{stocktaking_id}/items
```

#### リクエスト
```json
{
  "items": [
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440001",
      "actual_stock": 95
    }
  ]
}
```

### 5.3 棚卸し確定
```
POST /stocktakings/{stocktaking_id}/complete
```

## 6. QRコード/バーコードAPI

### 6.1 コード生成
```
POST /codes/generate
```

#### リクエスト
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440001",
  "code_type": "qr", // "qr" or "barcode"
  "format": "png" // "png", "svg", "pdf"
}
```

### 6.2 コード読取（デコード）
```
POST /codes/decode
```

#### リクエスト
```json
{
  "code_data": "QR001234" // スキャンしたデータ
}
```

## 7. アラートAPI

### 7.1 アラート一覧取得
```
GET /alerts
```

### 7.2 アラート設定作成
```
POST /alerts
```

#### リクエスト
```json
{
  "name": "在庫不足アラート",
  "alert_type": "low_stock",
  "conditions": {
    "threshold_percentage": 20
  },
  "notification_channels": ["email", "push"]
}
```

### 7.3 アラート履歴取得
```
GET /alerts/history
```

## 8. レポートAPI

### 8.1 在庫レポート取得
```
GET /reports/inventory
```

#### クエリパラメータ
- `date`: 対象日付
- `group_by`: グループ化（category, location）

### 8.2 入出庫レポート取得
```
GET /reports/movements
```

#### クエリパラメータ
- `date_from`: 開始日
- `date_to`: 終了日
- `movement_type`: 移動タイプ

### 8.3 レポートエクスポート
```
POST /reports/export
```

#### リクエスト
```json
{
  "report_type": "inventory",
  "format": "csv", // "csv", "excel", "pdf"
  "parameters": {
    "date": "2024-01-31"
  }
}
```

## 9. マスタデータAPI

### 9.1 カテゴリー
```
GET /categories
POST /categories
PUT /categories/{category_id}
DELETE /categories/{category_id}
```

### 9.2 保管場所
```
GET /storage-locations
POST /storage-locations
PUT /storage-locations/{location_id}
DELETE /storage-locations/{location_id}
```

### 9.3 製造会社
```
GET /manufacturers
POST /manufacturers
PUT /manufacturers/{manufacturer_id}
DELETE /manufacturers/{manufacturer_id}
```

## 10. WebSocket API

### 10.1 リアルタイム在庫更新
```
ws://api.goods-stock.example.com/ws/inventory
```

#### 接続時認証
```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 在庫更新通知
```json
{
  "type": "stock_update",
  "data": {
    "product_id": "550e8400-e29b-41d4-a716-446655440001",
    "sku": "A001",
    "old_stock": 100,
    "new_stock": 70,
    "timestamp": "2024-01-20T15:30:00+09:00"
  }
}
```

## 11. エラーコード一覧

| コード | 説明 | HTTPステータス |
|--------|------|---------------|
| AUTH_001 | 認証失敗 | 401 |
| AUTH_002 | トークン期限切れ | 401 |
| AUTH_003 | 権限不足 | 403 |
| VAL_001 | 必須項目エラー | 422 |
| VAL_002 | 形式エラー | 422 |
| VAL_003 | 重複エラー | 422 |
| BIZ_001 | 在庫不足 | 400 |
| BIZ_002 | 販売期限切れ | 400 |
| SYS_001 | システムエラー | 500 |
| SYS_002 | データベースエラー | 500 |