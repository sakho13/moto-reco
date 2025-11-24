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

### ロール`USER`

- `GET /api/v1/user/profile` - ユーザープロフィールの取得
- `POST /api/v1/user/profile` - ユーザープロフィールの更新
- `GET /api/v1/user/user-bikes` - ユーザー所有バイクの一覧取得

### ロール`ADMIN`

## API詳細

## エラーコード一覧

| エラーコード    | 説明                         | 対応方法                         | 備考                  |
| --------------- | ---------------------------- | -------------------------------- | --------------------- |
| INVALID_REQUEST | リクエストが無効です         | リクエスト内容を確認してください | 内容は`details`を参照 |
| AUTH_FAILED     | 認証に失敗しました           |                                  |                       |
| NOT_FOUND       | リソースが見つかりません     |                                  |                       |
| SERVER_ERROR    | サーバーエラーが発生しました |                                  |                       |
