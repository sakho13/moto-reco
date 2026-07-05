# ER図

## 1. DBスキーマ ER図（Prismaモデル）

> **テーブル命名規則**
> - `M` プレフィックス: マスターテーブル
> - `T` プレフィックス: トランザクションテーブル

```mermaid
erDiagram

  %% ─── マスターテーブル ───

  MUser {
    string  id          PK
    string  name
    string  notificationEmail
    boolean isProfilePublic
    enum    status      "ACTIVE | INACTIVE | SUSPENDED"
    enum    role        "USER | ADMIN | GUEST"
    enum    plan        "FREE | PREMIUM"
    datetime createdAt
    datetime updatedAt
  }

  MAuthProvider {
    string  id          PK
    string  userId      FK
    enum    providerType "FIREBASE_EMAIL | FIREBASE_GOOGLE | FIREBASE_ANONYMOUS"
    string  externalId
    json    metadata
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }

  MApiKey {
    string   id       PK
    string   userId   FK
    string   name
    string   keyHash
    string   prefix
    enum_arr scopes   "READ | WRITE"
    boolean  isActive
    datetime createdAt
    datetime updatedAt
  }

  MManufacturer {
    string  id         PK
    string  name
    string  nameEn
    string  logoUrl
    string  websiteUrl
    string  country
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }

  MBike {
    string  id             PK
    string  manufacturerId FK
    string  modelName
    float   displacement
    int     modelYear
    string  modelCode
    int     releaseYear
    int     releaseMonth
    enum    settingStatus  "INACTIVE | ACTIVE"
    datetime createdAt
    datetime updatedAt
  }

  MMaintenanceType {
    string id              PK
    string bikeId          FK
    enum   type            "BRAKE_FLUID | SPARK_PLUG | ..."
    int    recommendedMileage
    int    recommendedPeriod
  }

  MSystemAnnouncement {
    string   id          PK
    string   createdBy   FK
    enum     type        "SYSTEM_MAINTENANCE"
    string   title
    string   body
    enum     status      "DRAFT | PUBLISHED | EXPIRED"
    datetime scheduledAt
    datetime publishedAt
    datetime createdAt
    datetime updatedAt
  }

  %% ─── トランザクションテーブル（バイク） ───

  TUserBike {
    string  id           PK
    string  bikeId       FK  "nullable"
    string  serialNumber
    float   displacement
    int     totalMileage
    datetime createdAt
    datetime updatedAt
  }

  TUserMyBike {
    string   id           PK
    string   userId       FK
    string   userBikeId   FK
    string   nickname
    datetime purchaseDate
    int      purchasePrice
    int      purchaseMileage
    datetime ownedAt
    datetime soldAt
    enum     ownStatus    "OWN | SOLD | TRANSFERRED | SCRAPPED"
    datetime createdAt
    datetime updatedAt
  }

  TUserMyBikeFuelLog {
    string   id             PK
    string   userMyBikeId   FK
    string   touringId      FK  "nullable"
    float    amount
    int      price
    int      mileage
    int      previousMileage
    datetime refueledAt
    string   memo
    datetime createdAt
    datetime updatedAt
  }

  TUserMyBikeMaintenance {
    string   id           PK
    string   userMyBikeId FK
    datetime performedAt
    int      mileage
    string   memo
    datetime createdAt
    datetime updatedAt
  }

  TUserMyBikeMaintenanceItem {
    string id            PK
    string maintenanceId FK
    enum   type          "BRAKE_FLUID | ENGINE_OIL | ..."
    float  value
    datetime createdAt
    datetime updatedAt
  }

  TUserMyBikeTouring {
    string   id             PK
    string   userMyBikeId   FK
    string   planId         FK  "nullable"
    string   title
    datetime startDate
    datetime endDate
    int      startMileage
    int      endMileage
    float    startLatitude
    float    startLongitude
    float    endLatitude
    float    endLongitude
    enum     status         "STARTED | COMPLETED"
    datetime createdAt
    datetime updatedAt
  }

  TUserMyBikeTouringSpot {
    string   id         PK
    string   touringId  FK
    enum     type       "SPOT | BREAK"
    string   name
    string   memo
    float    latitude
    float    longitude
    datetime plannedArrivalAt
    datetime plannedDepartureAt
    datetime arrivedAt
    datetime departedAt
    boolean  isSkipped
    datetime skippedAt
    int      sortOrder
    datetime createdAt
    datetime updatedAt
  }

  TUserMyBikeTouringPlan {
    string   id           PK
    string   userMyBikeId FK
    string   title
    datetime createdAt
    datetime updatedAt
  }

  TUserMyBikeTouringPlanSpot {
    string id                  PK
    string planId              FK
    enum   type                "START | SPOT | BREAK | DESTINATION"
    string name
    string memo
    float  latitude
    float  longitude
    int    stayMinutes
    int    travelMinutesFromPrev
    enum   routeTypeFromPrev   "GENERAL | HIGHWAY | MIXED"
    int    sortOrder
    datetime createdAt
    datetime updatedAt
  }

  TUserMyBikeHistory {
    string   id           PK
    string   userId       FK
    string   userMyBikeId FK  "nullable"
    string   fuelLogId    FK  "nullable, unique"
    string   touringId    FK  "nullable, unique"
    enum     type         "FUEL_LOG | TOURING | MAINTENANCE"
    datetime occurredAt
    datetime createdAt
    datetime updatedAt
  }

  %% ─── トランザクションテーブル（ユーザー） ───

  TUserQuit {
    string   id           PK
    string   userId       FK  "unique"
    datetime quitAt
    string   quitReason
    string   recoveryCode
    enum     status       "QUIT | RECOVERED"
    datetime createdAt
    datetime updatedAt
  }

  TUserFollow {
    string   id          PK
    string   followerId  FK
    string   followingId FK
    datetime createdAt
  }

  TNotification {
    string   id       PK
    string   userId   FK
    enum     type     "FOLLOWED"
    string   title
    string   body
    json     metadata
    boolean  isRead
    datetime readAt
    datetime createdAt
  }

  TSystemAnnouncementRead {
    string   announcementId PK, FK
    string   userId         PK, FK
    datetime readAt
  }

  %% ─── リレーション ───

  MUser             ||--o{ MAuthProvider           : "has (1:N)"
  MUser             ||--o{ MApiKey                 : "has (1:N)"
  MUser             ||--o{ TUserMyBike             : "owns (1:N)"
  MUser             ||--o{ TUserMyBikeHistory      : "has (1:N)"
  MUser             ||--o| TUserQuit               : "quits (1:0..1)"
  MUser             ||--o{ TUserFollow             : "follows as follower (1:N)"
  MUser             ||--o{ TUserFollow             : "followed as following (1:N)"
  MUser             ||--o{ TNotification           : "receives (1:N)"
  MUser             ||--o{ TSystemAnnouncementRead : "reads (1:N)"
  MUser             ||--o{ MSystemAnnouncement     : "creates (1:N)"

  MManufacturer     ||--o{ MBike                   : "makes (1:N)"
  MBike             ||--o{ MMaintenanceType        : "has maintenance types (1:N)"
  MBike             ||--o{ TUserBike               : "based on (1:N)"

  TUserBike         ||--o{ TUserMyBike             : "owned as (1:N)"

  TUserMyBike       ||--o{ TUserMyBikeFuelLog      : "has fuel logs (1:N)"
  TUserMyBike       ||--o{ TUserMyBikeMaintenance  : "has maintenance logs (1:N)"
  TUserMyBike       ||--o{ TUserMyBikeTouring      : "has tourings (1:N)"
  TUserMyBike       ||--o{ TUserMyBikeTouringPlan  : "has touring plans (1:N)"
  TUserMyBike       ||--o{ TUserMyBikeHistory      : "has histories (1:N)"

  TUserMyBikeMaintenance    ||--o{ TUserMyBikeMaintenanceItem : "contains items (1:N)"
  TUserMyBikeTouring        ||--o{ TUserMyBikeTouringSpot     : "has spots (1:N)"
  TUserMyBikeTouring        ||--o{ TUserMyBikeFuelLog         : "includes fuel logs (1:N)"
  TUserMyBikeTouringPlan    ||--o{ TUserMyBikeTouringPlanSpot : "has plan spots (1:N)"
  TUserMyBikeTouringPlan    ||--o{ TUserMyBikeTouring         : "used in (1:N)"

  TUserMyBikeHistory        ||--o| TUserMyBikeFuelLog         : "refs fuel log (1:0..1)"
  TUserMyBikeHistory        ||--o| TUserMyBikeTouring         : "refs touring (1:0..1)"

  MSystemAnnouncement       ||--o{ TSystemAnnouncementRead    : "tracked by (1:N)"
```

---

## 2. Entityクラス ER図（ドメイン型）

> `packages/shared-types/src/domain/` に定義されたTypeScriptドメイン型の構造と関連を示します。

```mermaid
classDiagram

  class User {
    +UserId id
    +string name
    +UserRole role
    +UserStatus status
    +UserPlan plan
    +string|null notificationEmail
    +boolean isProfilePublic
  }

  class AuthProvider {
    +UserId userId
    +string externalId
    +ProviderType providerType
    +boolean isActive
    +Record metadata?
  }

  class ApiKeyScope {
    <<enumeration>>
    READ
    WRITE
  }

  class Manufacturer {
    +ManufacturerId id
    +string name
    +string nameEn
    +string country
  }

  class Bike {
    +BikeId id
    +string manufacturerId
    +string manufacturer
    +string modelName
    +number displacement
    +number modelYear
  }

  class UserBike {
    +BikeId|null bikeId
    +UserBikeId userBikeId
    +number displacement
    +number totalMileage
    +string|null serialNumber
  }

  class MyUserBike {
    +MyUserBikeId myUserBikeId
    +UserId userId
    +string|null nickname
    +Date|null purchaseDate
    +number|null purchasePrice
    +number|null purchaseMileage
    +Date ownedAt
    +Date|null soldAt
    +UserMyBikeOwnStatus ownStatus
  }

  class FuelLog {
    +FuelLogId fuelLogId
    +MyUserBikeId myUserBikeId
    +Date refueledAt
    +number mileage
    +number previousMileage
    +number amount
    +number totalPrice
    +string|null memo
    +TouringId|null touringId
    +string|null touringTitle
  }

  class MaintenanceLog {
    +MaintenanceLogId maintenanceLogId
    +MyUserBikeId myUserBikeId
    +Date performedAt
    +number mileage
    +string|null memo
    +MaintenanceLogItem[] items
  }

  class MaintenanceLogItem {
    +MaintenanceType maintenanceType
    +number|null value
  }

  class MaintenanceItem {
    +string id
    +MaintenanceType type
    +MaintenanceCategory category
    +string typeName
    +string categoryName
    +number|null recommendedMileageInterval
    +number|null recommendedPeriodMonths
  }

  class Touring {
    +TouringId touringId
    +MyUserBikeId myUserBikeId
    +TouringPlanId|null touringPlanId
    +string title
    +Date startDate
    +Date endDate
    +number|null startMileage
    +number|null endMileage
    +number|null startLatitude
    +number|null startLongitude
    +number|null endLatitude
    +number|null endLongitude
    +TouringStatus status
  }

  class Spot {
    +SpotId spotId
    +TouringId touringId
    +SpotType type
    +string|null name
    +string|null memo
    +number|null latitude
    +number|null longitude
    +Date|null plannedArrivalAt
    +Date|null plannedDepartureAt
    +Date|null arrivedAt
    +Date|null departedAt
    +boolean isSkipped
    +Date|null skippedAt
    +number sortOrder
  }

  class TouringPlan {
    +TouringPlanId touringPlanId
    +MyUserBikeId myUserBikeId
    +string title
    +Date createdAt
    +Date updatedAt
  }

  class TouringPlanSpot {
    +TouringPlanSpotId touringPlanSpotId
    +TouringPlanId touringPlanId
    +TouringPlanSpotType type
    +string|null name
    +string|null memo
    +number|null latitude
    +number|null longitude
    +number|null stayMinutes
    +number|null travelMinutesFromPrev
    +TouringPlanRouteType|null routeTypeFromPrev
    +number sortOrder
  }

  class History {
    +HistoryId historyId
    +UserId userId
    +MyUserBikeId|null userMyBikeId
    +BikeHistoryType type
    +Date occurredAt
    +FuelLogId|null fuelLogId
    +TouringId|null touringId
  }

  class UserQuit {
    +UserQuitId id
    +UserId userId
    +string quitReason
    +Date quitAt
    +string recoveryCode
    +UserQuitStatus status
  }

  class FuelInsight {
    +number|null averageFuelEfficiency
    +number|null averageAmount
    +number|null averageTotalPrice
    +number|null averagePricePerLiter
    +number|null minPricePerLiter
    +number|null maxPricePerLiter
  }

  %% 継承
  MyUserBike --|> UserBike : "extends"

  %% リレーション
  User "1" --> "0..*" AuthProvider      : userId
  User "1" --> "0..*" MyUserBike        : userId
  User "1" --> "0..1" UserQuit          : userId
  User "1" --> "0..*" History           : userId

  Manufacturer "1" --> "0..*" Bike      : manufacturerId

  Bike "1" --> "0..*" UserBike          : bikeId

  MyUserBike "1" --> "0..*" FuelLog     : myUserBikeId
  MyUserBike "1" --> "0..*" MaintenanceLog : myUserBikeId
  MyUserBike "1" --> "0..*" Touring     : myUserBikeId
  MyUserBike "1" --> "0..*" TouringPlan : myUserBikeId

  FuelLog "0..1" --> "0..1" Touring     : touringId
  FuelLog "0..1" --> "0..1" History     : fuelLogId

  MaintenanceLog "1" *-- "1..*" MaintenanceLogItem : items

  Touring "1" --> "0..*" Spot           : touringId
  Touring "0..1" --> "0..1" History     : touringId
  Touring "0..1" --> "0..1" TouringPlan : touringPlanId

  TouringPlan "1" --> "0..*" TouringPlanSpot : touringPlanId

  FuelInsight ..> FuelLog               : "aggregated from"
  MaintenanceItem ..> MaintenanceLogItem : "type reference"
```

---

## バイク3層構造の概念図

バイクに関する3つの概念の関係をシンプルに示します。

```mermaid
graph LR
  A["🏭 MBike / Bike<br/>車種マスタ<br/>例: Honda CB400SF 2023"]
  B["🔩 TUserBike / UserBike<br/>物理的個体<br/>（車台番号で識別）"]
  C["👤 TUserMyBike / MyUserBike<br/>ユーザーの所有記録<br/>（給油・整備・ツーリング紐付け）"]

  A -->|"1:N 同じ車種でも個体は複数"| B
  B -->|"1:N 1台のバイクを複数ユーザーが順に所有可"| C

  style A fill:#dbeafe,stroke:#3b82f6
  style B fill:#fef3c7,stroke:#f59e0b
  style C fill:#dcfce7,stroke:#22c55e
```

> **設計意図**: TUserMyBike（MyUserBike）を分離することで、中古売買の際に前オーナーの給油・メンテ履歴が次オーナーに見えないようプライバシーを保護している。
