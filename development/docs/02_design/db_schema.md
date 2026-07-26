# DBスキーマ設計

## テーブル設計

```mermaid
erDiagram
    MUser ||--o{ MAuthProvider : "認証"
    MUser ||--o{ TMyBike : "所有"
    MUser ||--o| TUserQuit : "退会"
    MUser ||--o{ TUserGoods : "購入グッズ"

    MCompany ||--o{ MBike : "製造"
    MCompany ||--o{ MGoodsModel : "製造"

    MBike ||--o{ MMaintenanceType : "推奨メンテナンス"
    MBike ||--o{ TUserBike : "車種"

    TUserBike ||--o{ TMyBike : "所有履歴"

    TMyBike ||--o{ TUserBikeFuel : "給油履歴"
    TMyBike ||--o{ TUserMyBikeMaintenance : "メンテナンス履歴"
    TUserMyBikeMaintenance ||--o{ TUserMyBikeMaintenanceItem : "メンテナンス項目"
    TMyBike ||--o{ TUserBikeLiability : "自賠責保険"
    TMyBike ||--o{ TUserBikeInsurance : "任意保険"
    TMyBike ||--o{ TUserBikeInspection : "車検履歴"
    TMyBike ||--o{ TUserGoods : "取り付けアクセサリ"

    MGoodsModel ||--o{ TUserGoods : "紐付け"

    MUser {
        string id PK
        string name
        MUserStatus status
        MUserRole role
    }

    MAuthProvider {
        string id PK
        string userId FK
        ProviderType providerType
        string externalId
    }

    MCompany {
        string id PK
        string name UK
        string nameEn
        string logoUrl
        string websiteUrl
        string country
        CompanyCategory[] categories "BIKE_MAKER / GOODS_MANUFACTURER（複数可）"
        boolean isActive
    }

    MBike {
        string id PK
        string manufacturerId FK
        string modelName
        float displacement
        int modelYear
    }

    MGoodsModel {
        string id PK
        string goodsManufacturerId FK "MCompany"
        string modelNumber
        string name
        GoodsCategory category
        string amazonAsin "購入先情報はマスタ側に集約"
        string rakutenItemId
        boolean isActive
    }

    TUserGoods {
        string id PK
        string userId FK
        string userMyBikeId FK "任意。取り付けたマイバイク"
        string goodsModelId FK "MGoodsModel"
        datetime purchasedAt
        int price
        string memo
    }

    MMaintenanceType {
        string id PK
        string bikeId FK
        MaintenanceType type
        int recommendedMileage
        int recommendedPeriod
    }

    TUserBike {
        string id PK
        string bikeId FK
        float displacement
        string serialNumber
    }

    TMyBike {
        string id PK
        string userId FK
        string userBikeId FK
        string nickname
        datetime purchaseDate
        UserBikeOwnStatus ownStatus
    }

    TUserBikeFuel {
        string id PK
        string myBikeId FK
        float amount
        int price
        int mileage
        int previousMileage
        datetime refueledAt
    }

    TUserMyBikeMaintenance {
        string id PK
        string myBikeId FK
        datetime performedAt
        int mileage
        string memo
    }

    TUserMyBikeMaintenanceItem {
        string id PK
        string maintenanceId FK
        MaintenanceType maintenanceType
        float value
    }

    TUserBikeLiability {
        string id PK
        string myBikeId FK
        string insuranceNumber
        datetime startDate
        datetime endDate
    }

    TUserBikeInsurance {
        string id PK
        string myBikeId FK
        string policyNumber
        datetime startDate
        datetime endDate
    }

    TUserBikeInspection {
        string id PK
        string myBikeId FK
        datetime inspectionDate
        datetime expiryDate
        int mileage
    }

    TUserQuit {
        string id PK
        string userId FK "unique"
        datetime quitAt
        string quitReason
        string recoveryTokenHash "復帰用トークンのSHA-256ハッシュ"
        datetime purgeAt "退会30日後。完全削除バッチの対象判定に使用"
        UserQuitStatus status "QUIT / RECOVERED"
    }

    MSystemApiKey {
        string id PK
        string name
        string keyHash UK
        string prefix
        boolean isActive
        datetime lastUsedAt
    }
```

### 退会・完全削除フロー（TUserQuit / MSystemApiKey）

- 退会時（`POST /api/v1/user/auth/quit`）: `MUser.status`を`INACTIVE`に、`MAuthProvider.isActive`を`false`にする論理削除を行い、`TUserQuit`を`status=QUIT`で作成する。`purgeAt`には退会日時の30日後を保存する。復帰用トークンは平文をメールにのみ埋め込み、DBには`recoveryTokenHash`（SHA-256）のみ保存する。
- 復帰時（`POST /api/v1/user/auth/recover`、非認証の公開エンドポイント）: 受け取ったトークンをハッシュ化して`recoveryTokenHash`と照合し、`purgeAt`を超過していなければ`MUser`/`MAuthProvider`を有効化し`TUserQuit.status`を`RECOVERED`にしてワンタイム化する。
- 完全削除バッチ（`POST /api/v1/internal/purge-quit-users`、週次でGitHub Actionsから呼び出し）: `status=QUIT AND purgeAt <= now()`の`TUserQuit`を対象に、Storage実ファイル・DB（Cascade）・Firebase Authアカウントを完全に物理削除する。このAPIは`MSystemApiKey`のハッシュ照合による専用ミドルウェアで保護する（管理者専用API/UIで発行・失効を行う）。

### 定義済みテーブル

| テーブル名       | 説明                                                     | 実装状況 |
| ---------------- | -------------------------------------------------------- | -------- |
| MUser            | ユーザー情報を格納するマスターテーブル                   | ✅       |
| MAuthProvider    | 認証情報を格納するマスターテーブル                       | ✅       |
| MCompany         | 会社マスターテーブル（バイクメーカー/グッズメーカーを`categories`で兼用。旧`MManufacturer`は#464で統合済み） | ✅       |
| MBike            | バイク車種マスターテーブル（同じシリーズでも年式別）     | ✅       |
| MMaintenanceType | メンテナンス種類情報を格納するマスターテーブル           | ✅       |
| MGoodsModel      | グッズ型番マスターテーブル（メーカー・カテゴリ・Amazon ASIN/楽天商品IDを保持） | ✅       |
| TUserBike        | 物理的なバイクの実体（車台番号で識別）                   | ✅       |
| TUserMyBike      | ユーザー視点の「マイバイク」（所有履歴・ニックネーム等） | ✅       |
| TUserMyBikeFuelLog | マイバイクの給油履歴情報を格納するテーブル             | ✅       |
| TUserMyBikeMaintenance | マイバイクのメンテナンス履歴情報を格納するテーブル   | ✅       |
| TUserMyBikeMaintenanceItem | メンテナンス項目ごとの入力値を格納するテーブル | ✅       |
| TUserGoods       | ユーザーが購入したグッズ（マイバイクへの取り付けは任意）を格納するテーブル | ✅       |
| TUserQuit        | ユーザーの退会・復帰・完全削除予定日時を管理するテーブル | ✅       |
| MSystemApiKey    | 内部バッチAPI保護用のシステム共通APIキーを管理するマスターテーブル | ✅       |

### 未定義テーブル（実装予定）

| テーブル名           | 説明                                               | 優先度 |
| -------------------- | -------------------------------------------------- | ------ |
| TUserBikeLiability   | マイバイクの自賠責履歴情報を格納するテーブル       | 🟡 中  |
| TUserBikeInsurance   | マイバイクの任意保険履歴情報を格納するテーブル     | 🟡 中  |
| TUserBikeInspection  | マイバイクの車検履歴情報を格納するテーブル         | 🟡 中  |
| LUserSyncLog         | 同期実施情報を格納するログテーブル                 | 🟢 低  |
