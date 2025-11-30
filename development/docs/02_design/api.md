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
- `GET /api/v1/bikes/search` - 登録可能なバイクの検索
- `GET /api/v1/user-bike/bikes` - ユーザー所有バイクの一覧取得
- `POST /api/v1/user-bike/register` - ユーザー所有バイクの追加
- `PATCH /api/v1/user-bike/update` - ユーザー所有バイク情報の更新
- `GET /api/v1/fuel-history/:user-bike-id` - ユーザー所有バイクの燃費情報取得
- `POST /api/v1/fuel-history/:user-bike-id` - ユーザー所有バイクの燃費情報追加
- `PATCH /api/v1/fuel-history/:fuel-history-id` - ユーザー所有バイクの燃費情報更新
- `DELETE /api/v1/fuel-history/:fuel-history-id` - ユーザー所有バイクの燃費情報削除

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

### ロール`ADMIN`

- `GET /api/v1/admin/users` - 全ユーザーの一覧取得
- `GET /api/v1/admin/user/{userId}` - 特定ユーザーの詳細取得

## エラーコード一覧

| エラーコード    | 説明                         | 対応方法                         | 備考                  |
| --------------- | ---------------------------- | -------------------------------- | --------------------- |
| INVALID_REQUEST | リクエストが無効です         | リクエスト内容を確認してください | 内容は`details`を参照 |
| AUTH_FAILED     | 認証に失敗しました           |                                  |                       |
| NOT_FOUND       | リソースが見つかりません     |                                  |                       |
| SERVER_ERROR    | サーバーエラーが発生しました |                                  |                       |
