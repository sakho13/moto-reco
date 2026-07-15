# 写真アップロードアーキテクチャ

ツーリング・スポット・バイク本体への写真投稿機能の設計ドキュメントです。

---

## 設計方針

- **Storage キーはサーバーで生成する**: クライアントに任意のパスを指定させると他ユーザーの領域を上書きできるため、サーバーが UUID でキーを発行する
- **写真の所有権はユーザー**: バイクではなくユーザーに紐づく（複数バイクをまたいで管理可能）
- **Firebase SDK をクライアントに持たせない**: 署名付き URL の PUT で直接アップロードし、Firebase Client SDK 不要
- **写真は複数の対象に紐づけ可能**: `TUserPhoto` 1件がツーリング・スポット・バイクいずれとも中間テーブルで結びつくため、同じ写真を複数の対象に紐づけることをDB制約でブロックしない

---

## アップロードフロー

```mermaid
sequenceDiagram
    actor Client
    participant Server as Server (Hono API)
    participant Storage as Firebase Storage
    participant DB as PostgreSQL (Prisma)

    rect rgb(235, 245, 255)
    Note over Client,Server: 1. PUT先URL取得
    Client->>Server: POST /api/v1/photo/upload-url<br/>{ files: [{ contentType, fileName, fileSize }] }
    Server->>Server: userId = 認証トークンから取得
    Server->>Server: photoPath = users/{userId}/photos/{uuid}.{ext}
    alt 本番環境
        Server->>Storage: Admin SDK で署名付きPUT URLを生成（15分有効）
        Storage-->>Server: signedUploadUrl
    else Storage Emulator（開発環境）
        Note right of Server: EmulatorはPUTでの署名付きアップロードに未対応のため<br/>JSON API（単純アップロード）のURLを生成
    end
    Server-->>Client: [{ signedUploadUrl, photoPath, uploadMethod }] × count
    end

    rect rgb(235, 255, 240)
    Note over Client,Storage: 2. ファイルアップロード（Firebase SDKなし）
    Client->>Storage: uploadMethod（PUT/POST） {signedUploadUrl}<br/>body: ファイル本体, Content-Type
    Storage-->>Client: 200 OK
    end

    rect rgb(255, 245, 235)
    Note over Client,DB: 3. 写真をツーリング/スポット/バイクに紐づけ
    Client->>Server: POST /api/v1/photo/touring/:touringId 等<br/>{ photos: [{ photoPath, takenAt, memo? }] }
    Server->>DB: 所有権確認（touringId/spotId/myUserBikeId が自分のものか）
    alt 所有権なし
        DB-->>Server: null
        Server-->>Client: 404 NOT_FOUND
    end
    Server->>Server: photoPath が users/{userId}/ 始まりか検証
    alt パス不正
        Server-->>Client: 400 INVALID_REQUEST
    end
    Server->>Storage: Admin SDK で photoPath → 署名付き読取URLを生成（7日有効）
    Storage-->>Server: photoUrl
    Server->>DB: TUserPhoto + 中間テーブル（TUserMyBikeTouringPhoto 等）を作成
    DB-->>Server: 作成済みレコード
    Server-->>Client: 201 Created [{ photoId, photoUrl, storagePath, memo, takenAt }]
    end
```

---

## APIエンドポイント

すべて `honoAuthMiddleware` + `honoAdminMiddleware` による認証必須・**ADMINロール限定**。

> Storage設定を含め新規追加の機能のため、現時点では一般ユーザーには公開しない。
> クライアント側もプロフィール画面の「マイフォト」リンク・バイク詳細/ツーリング詳細の写真カードを
> `role === 'ADMIN'` の場合のみ表示する。

| メソッド | パス                               | 説明                                                                |
| -------- | ---------------------------------- | ------------------------------------------------------------------- |
| POST     | `/api/v1/photo/upload-url`         | 署名付きアップロードURL生成                                         |
| POST     | `/api/v1/photo/touring/:touringId` | ツーリングへの写真登録                                              |
| GET      | `/api/v1/photo/touring/:touringId` | ツーリングの写真一覧（takenAt昇順）                                 |
| POST     | `/api/v1/photo/spot/:spotId`       | スポットへの写真登録                                                |
| GET      | `/api/v1/photo/spot/:spotId`       | スポットの写真一覧（takenAt昇順）                                   |
| POST     | `/api/v1/photo/bike/:myUserBikeId` | バイク本体への写真登録（ツーリング/スポットを介さない日常の1枚）    |
| GET      | `/api/v1/photo/bike/:myUserBikeId` | バイク本体に直接紐づく写真一覧（takenAt昇順）                       |
| GET      | `/api/v1/photo`                    | マイフォト・ギャラリー（全写真横断、ページネーション、takenAt降順） |
| DELETE   | `/api/v1/photo/:photoId`           | 写真削除（Storage上のファイルも削除）                               |

### POST `/api/v1/photo/upload-url`

```json
// Request
{
  "files": [
    { "contentType": "image/jpeg", "fileName": "photo1.jpg", "fileSize": 1024000 },
    { "contentType": "image/png",  "fileName": "photo2.png", "fileSize": 512000  }
  ]
}
// files: 1〜10件。contentType は "image/jpeg" | "image/png" | "image/webp"

// Response 200
{
  "status": "success",
  "data": [
    {
      "signedUploadUrl": "https://storage.googleapis.com/...",
      "photoPath": "users/abc123/photos/550e8400-e29b-41d4-a716.jpg",
      "uploadMethod": "PUT"
    }
  ]
}
// uploadMethod: 本番は "PUT"（署名付きURL）。Storage Emulatorでは "POST"（単純アップロード）
```

### POST `/api/v1/photo/touring/:touringId`

```json
// Request
{
  "photos": [
    {
      "photoPath": "users/abc123/photos/550e8400-e29b-41d4-a716.jpg",
      "takenAt": "2024-06-01T10:30:00.000Z",
      "memo": "山頂からの景色"  // optional
    }
  ]
}

// Response 201
{
  "status": "success",
  "data": [
    {
      "photoId": "...",
      "photoUrl": "https://storage.googleapis.com/...",
      "storagePath": "users/abc123/photos/...",
      "memo": "山頂からの景色",
      "takenAt": "2024-06-01T10:30:00.000Z"
    }
  ]
}
```

`POST /api/v1/photo/spot/:spotId` ・ `POST /api/v1/photo/bike/:myUserBikeId` もリクエスト/レスポンス形式は同様（紐づけ先が spot / バイク本体になるのみ）。

### GET `/api/v1/photo`

```
GET /api/v1/photo?page=1&per-size=30
```

```json
// Response 200
{
  "status": "success",
  "data": [
    {
      "photoId": "...",
      "photoUrl": "https://storage.googleapis.com/...",
      "storagePath": "users/abc123/photos/...",
      "memo": "山頂からの景色",
      "takenAt": "2024-06-01T10:30:00.000Z",
      "attachments": [{ "type": "TOURING", "touringId": "..." }]
    }
  ]
}
// page省略時: 1 / per-size省略時: 30（最大100）
// attachments: 写真がどのツーリング/スポット/バイクに紐づいているかの一覧（複数持つ場合もある）
```

---

## DBスキーマ

```mermaid
erDiagram
    MUser ||--o{ TUserPhoto : "所有"
    TUserPhoto ||--o{ TUserMyBikeTouringPhoto : "ツーリング紐づけ"
    TUserPhoto ||--o{ TUserMyBikeTouringSpotPhoto : "スポット紐づけ"
    TUserPhoto ||--o{ TUserMyBikeDirectPhoto : "バイク直付け紐づけ"
    TUserMyBikeTouring ||--o{ TUserMyBikeTouringPhoto : "写真"
    TUserMyBikeTouringSpot ||--o{ TUserMyBikeTouringSpotPhoto : "写真"
    TUserMyBike ||--o{ TUserMyBikeDirectPhoto : "写真"

    TUserPhoto {
        string id PK
        string userId FK
        string photoUrl   "署名付き読取URL（7日有効）"
        string storagePath "Firebase Storage path"
        string memo
        datetime takenAt
        datetime createdAt
    }

    TUserMyBikeTouringPhoto {
        string touringId FK
        string photoId FK
    }

    TUserMyBikeTouringSpotPhoto {
        string spotId FK
        string photoId FK
    }

    TUserMyBikeDirectPhoto {
        string myBikeId FK
        string photoId FK
    }
```

### 設計のポイント

- `TUserPhoto` が写真そのもの（1レコード = 1ファイル）。特定のバイクにスコープされず、ユーザーにのみ紐づく
- `TUserMyBikeTouringPhoto` / `TUserMyBikeTouringSpotPhoto` / `TUserMyBikeDirectPhoto` は中間テーブルで、いずれも `(親キー, photoId)` の複合主キーのみを持つ
  - `photoId` に UNIQUE 制約はなく、1枚の写真が複数のツーリング/スポット/バイクに紐づくことをブロックしない
  - 中間テーブル同士の相互排他は DB 制約ではなく、各 `create*` メソッドの呼び分け（`PrismaPhotoRepository`）で保証している
- 並び順は `orderIndex` のような専用カラムを持たず、`takenAt`（同一時刻は `createdAt`）でソートする
  - ツーリング/スポット/バイクの一覧は昇順、マイフォト・ギャラリー（`GET /api/v1/photo`）は降順

---

## Firebase Storage のパス設計

```
users/
  {userId}/
    photos/
      {uuid}.jpg
      {uuid}.png
      ...
```

- ユーザーIDでディレクトリを分離してアクセス制御しやすくする
- サーバーが UUID でファイル名を発行（クライアントは指定不可）
- 写真登録 API でパスが `users/{認証済みuserId}/` 始まりかを検証し、他ユーザー領域への侵入を防ぐ

---

## セキュリティ検証フロー

```mermaid
sequenceDiagram
    actor Client
    participant Auth as honoAuthMiddleware
    participant Admin as honoAdminMiddleware
    participant Handler as photo.ts ハンドラ
    participant DB as PostgreSQL (Prisma)

    Client->>Auth: POST /api/v1/photo/touring/:touringId
    Auth->>Auth: Firebase トークン検証 → userId 確定
    alt トークン不正
        Auth-->>Client: 401 Unauthorized
    end
    Auth->>Admin: userEntity を引き継ぐ
    Admin->>Admin: role === 'ADMIN' か確認
    alt ADMINでない
        Admin-->>Client: 403 Forbidden
    end
    Admin->>Handler: 次のハンドラへ

    Handler->>DB: touringId 所有権確認<br/>tUserMyBikeTouring.findFirst({ id, userMyBike: { userId } })
    alt 存在しない/他ユーザー
        DB-->>Handler: null
        Handler-->>Client: 404 NOT_FOUND
    end

    Handler->>Handler: photoPath.startsWith(`users/${userId}/`)
    alt プレフィックス不正
        Handler-->>Client: 400 INVALID_REQUEST
    end

    Handler->>Handler: Firebase Admin SDK で署名付き読取URLを生成（7日有効）
    Handler->>DB: TUserPhoto + 中間テーブルを作成
    DB-->>Handler: 作成済みレコード
    Handler-->>Client: 201 Created
```

spot / バイク本体への登録も同じ検証順序（認証 → ADMIN確認 → 所有権確認 → パスプレフィックス検証 → 署名付きURL生成 → DB作成）を辿る。所有権確認の対象が `touringId` → `spotId` / `myUserBikeId` に置き換わるのみ。

---

## サーバー実装ファイル

| ファイル                                                        | 役割                                               |
| --------------------------------------------------------------- | -------------------------------------------------- |
| `apps/web/lib/firebase/adminStorage.ts`                         | Firebase Admin Storage クライアント初期化          |
| `apps/web/lib/api/server/v1/photo.ts`                           | エンドポイント定義・Storage 操作                   |
| `apps/web/lib/api/server/services/PhotoService.ts`              | ビジネスロジック（登録・取得・削除の権限チェック） |
| `apps/web/lib/api/server/interfaces/IPhotoRepository.ts`        | リポジトリインターフェース                         |
| `apps/web/lib/api/server/repositories/PrismaPhotoRepository.ts` | DB アクセス                                        |
| `apps/web/lib/api/server/entities/PhotoEntity.ts`               | ドメインエンティティ                               |

## クライアント実装ファイル

| ファイル                                          | 役割                                                       |
| ------------------------------------------------- | ---------------------------------------------------------- |
| `apps/web/components/photo/TouringPhotosCard.tsx` | ツーリング写真の表示・アップロード・削除 UI                |
| `apps/web/components/photo/BikePhotosCard.tsx`    | バイク本体写真（直付け）の表示・アップロード・削除 UI      |
| `apps/web/app/app/(protected)/photos/page.tsx`    | マイフォト・ギャラリー（全写真横断、無限スクロール）ページ |

---

## 制約・仕様

| 項目                                 | 値                                                             |
| ------------------------------------ | -------------------------------------------------------------- |
| 対応フォーマット                     | JPEG / PNG / WebP                                              |
| 1リクエストあたり最大枚数            | 10枚                                                           |
| 署名付きアップロードURLの有効期限    | 15分                                                           |
| 署名付き読取URLの有効期限            | 7日（GCS V4署名付きURLの仕様上の上限）                         |
| アップロード方式                     | 本番: 署名付きPUT / Storage Emulator: 単純アップロード（POST） |
| マイフォト・ギャラリーのページサイズ | 30件（省略時）、最大100件                                      |

---

## 本番環境の Firebase Storage セキュリティルール

`development/firebase_emulator/storage.rules` はローカル開発用エミュレータのみに適用される設定であり、
本番プロジェクトのFirebase Storageには自動反映されない（このリポジトリのCI/CDに `firebase deploy` 相当のstorage rulesデプロイ手順は存在しない）。

そのため、本番公開前に以下をFirebase Consoleまたは別途の手順で本番プロジェクトに設定する必要がある。

- 認証済みユーザーのみ読み書き可能なルール（最低限エミュレータと同等のもの）
- 可能であれば `users/{userId}/photos/{fileName}` のパスに対し、リクエストユーザー自身の領域のみ書き込みを許可するルールへ強化する
