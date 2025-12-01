# API設計書

## 基本

### レスポンス

#### 正常

```json
{
  "status": "success",
  "data": { ... },
  "message": "Optional success message"
}
```

#### エラー

```json
{
  "status": "error",
  "error_code": "ERROR_CODE",
  "message": "Error message",
  "details": { ... }
}
```

### ヘッダー

```
Content-Type: application/json
Authorization: Bearer <token>
```

## API一覧

### 基本

- `POST /api/v1/user/auth/register` - ユーザーの登録
- `POST /api/v1/user/auth/quit` - ユーザーの退会

#### `POST /api/v1/user/auth/register`

**リクエスト**

```json
{
  "name": "string"
}
```

**レスポンス**

```json
{
  "status": "success",
  "data": {
    "userId": "string",
    "name": "string" // バリデート: 1文字以上、50文字以下
  },
  "message": "ユーザー登録成功"
}
```

### ロール`USER`

- `GET /api/v1/user/profile` - ユーザープロフィールの取得
- `POST /api/v1/user/profile` - ユーザープロフィールの更新
- `GET /api/v1/bikes/manufacturers` - 対応しているバイクメーカーの一覧取得
- `GET /api/v1/bikes/search` - 登録可能なバイクの検索
- `GET /api/v1/user-bike/bikes` - ユーザー所有バイクの一覧取得
- `POST /api/v1/user-bike/register` - ユーザー所有バイクの追加
- `GET /api/v1/user-bike/bike/:user-bike-id` - ユーザー所有バイクの詳細取得
- `PATCH /api/v1/user-bike/update` - ユーザー所有バイク情報の更新
- `GET /api/v1/fuel-history/:user-bike-id` - ユーザー所有バイクの燃費情報取得
- `POST /api/v1/fuel-history/:user-bike-id` - ユーザー所有バイクの燃費情報追加
- `PATCH /api/v1/fuel-history/:user-bike-id/:fuel-history-id` - ユーザー所有バイクの燃費情報更新
- `DELETE /api/v1/fuel-history/:user-bike-id/:fuel-history-id` - ユーザー所有バイクの燃費情報削除

#### `GET /api/v1/user/profile`

**レスポンス**

```json
{
  "status": "success",
  "data": {
    "name": "string" // バリデート: 1文字以上、50文字以下
  },
  "message": "プロフィール取得成功"
}
```

#### `POST /api/v1/user/profile`

**リクエスト**

```json
{
  "name": "string" // バリデート: 1文字以上、50文字以下
}
```

**レスポンス**

```json
{
  "status": "success",
  "data": {
    "name": "string" // バリデート: 1文字以上、50文字以下
  },
  "message": "プロフィール更新成功"
}
```

#### `GET /api/v1/bikes/manufacturers`

**レスポンス**

```json
{
  "status": "success",
  "data": {
    "manufacturers": [
      {
        "manufacturerId": "string",
        "name": "string",
        "nameEn": "string",
        "country": "string"
      }
    ]
  },
  "message": "バイクメーカー一覧取得成功"
}
```

#### `GET /api/v1/bikes/search`

登録可能なバイクを検索するためのAPI

**クエリパラメータ**

- `mf-op` - バイクメーカーIDのオペレーター
  - `eq`: 等しい
  - `ne`: 等しくない
  - `in`: 含まれる
- `mf` - バイクメーカーID（複数指定可能、カンマ区切り、 `mf-op`で指定したオペレーターに従う）
- `model-name` - モデル名の部分一致検索
- `displacement-min` - 排気量の最小値（cc）
- `displacement-max` - 排気量の最大値（cc）
- `model-year-min` - モデル年の最小値
- `model-year-max` - モデル年の最大値
- `page` - 取得するページ番号（省略可能、デフォルトは1）
- `page-size` - 1ページあたりの結果数（省略可能、デフォルトは20、最大100）
- `sort-by` - ソート対象フィールド（`modelName`, `displacement`, `modelYear`のいずれか）
- `sort-order` - ソート順（`asc`または`desc`、デフォルトは`asc`）

**レスポンス**

```json
{
  "status": "success",
  "data": {
    "bikes": [
      {
        "bikeId": "string",
        "manufacturerId": "string",
        "manufacturer": "string",
        "modelName": "string",
        "displacement": 1000, // 排気量（cc）
        "modelYear": 2020
      }
    ]
  },
  "message": "バイク検索成功"
}
```

### ロール`ADMIN`

- `GET /api/v1/admin/users` - 全ユーザーの一覧取得
- `GET /api/v1/admin/user/{userId}` - 特定ユーザーの詳細取得
- `GET /api/v1/admin/manufacturers` - 全バイクメーカーの一覧取得
- `GET /api/v1/admin/bikes` - 全バイクの一覧取得

## エラーコード一覧

| エラーコード    | 説明                         | 対応方法                         | 備考                  |
| --------------- | ---------------------------- | -------------------------------- | --------------------- |
| INVALID_REQUEST | リクエストが無効です         | リクエスト内容を確認してください | 内容は`details`を参照 |
| AUTH_FAILED     | 認証に失敗しました           |                                  |                       |
| NOT_FOUND       | リソースが見つかりません     |                                  |                       |
| SERVER_ERROR    | サーバーエラーが発生しました |                                  |                       |
