# QA計画: 料金プラン管理機構の実装

## 基本情報
- 要件ID: #440
- 作成日: 2026-06-25
- トラック: 新機能

## 対象機能サマリー

`User.role` とは独立した料金プラン（FREE / PREMIUM）を `TUserPlanHistory` テーブルで履歴管理する機構を実装した。
新規 USER 登録時に FREE プランが自動付与され、ADMIN が `PATCH /api/v1/user/admin/plan` または admin ページから変更できる。
プランに応じて `AccountLimitsValue` が変化し、バイク・ツーリングプラン・メンテナンスログの登録上限が切り替わる。

## 関連ファイル

### ソースファイル
- `packages/database/prisma/schema.prisma` — `TUserPlanHistory` モデル・`MUserPlan` enum の定義
- `packages/database/prisma/migrations/20260624125539_add_user_plan_history/migration.sql` — DBマイグレーション
- `packages/shared-types/src/domain/user.ts` — `UserPlan` 型
- `packages/shared-types/src/domain/userPlanHistory.ts` — `UserPlanHistoryId`・`UserPlanHistory` 型
- `packages/shared-types/src/common/ApiIO.ts` — `ApiResponseUserProfile.plan`・`ApiResponseUserPlanHistory` 型
- `packages/shared-types/src/schemas/userPlanSchema.ts` — `ChangePlanRequestSchema`
- `apps/web/lib/statics.ts` — `FREE_USER_LIMITS`（MAINTENANCE_LOG: 5 追加）・`PREMIUM_USER_LIMITS`（新規）
- `apps/web/lib/api/server/valueObjects/AccountLimitsValue.ts` — `from(role, plan)` でプラン別制限値を返す
- `apps/web/lib/api/server/entities/UserEntity.ts` — `plan` フィールド・`limits` getter
- `apps/web/lib/api/server/entities/UserPlanHistoryEntity.ts` — プラン履歴エンティティ
- `apps/web/lib/api/server/interfaces/IUserPlanHistoryRepository.ts` — リポジトリインターフェース
- `apps/web/lib/api/server/repositories/PrismaUserPlanHistoryRepository.ts` — Prisma実装
- `apps/web/lib/api/server/repositories/PrismaUserRepository.ts` — `planHistories` 同時取得・初回履歴作成
- `apps/web/lib/api/server/repositories/PrismaAuthProviderRepository.ts` — `ActiveUserInfo.plan` を返す
- `apps/web/lib/api/server/services/UserPlanService.ts` — `getCurrentPlan`・`getPlanHistories`・`changePlan`
- `apps/web/lib/api/server/types/hono.ts` — `HonoVariables.user.plan` 追加
- `apps/web/lib/api/server/middlewares/honoAuth.ts` — `plan` をコンテキストにセット
- `apps/web/lib/api/server/v1/user.ts` — `GET /plan/histories`・`PATCH /admin/plan` 追加、プロフィールに `plan` 追加
- `apps/web/lib/api/server/v1/userBike.ts` — `AccountLimitsValue.from(role, plan)` に更新
- `apps/web/lib/api/server/v1/userBike/fuelLogs.ts` — 同上
- `apps/web/lib/api/server/v1/userBike/tourings.ts` — 同上（2箇所）
- `apps/web/lib/api/server/v1/userBike/touringPlans.ts` — 同上
- `apps/web/lib/api/server/v1/userBike/maintenanceLogs.ts` — 同上
- `apps/admin/app/api/admin/users/[id]/route.ts` — GET レスポンスに `currentPlan` 追加
- `apps/admin/app/api/admin/users/[id]/plan/route.ts` — `PATCH` プラン変更（admin）
- `apps/admin/app/api/admin/users/[id]/plan/histories/route.ts` — `GET` 履歴一覧（admin）
- `apps/admin/app/(admin)/users/[id]/page.tsx` — 現在プラン表示・変更モーダル・履歴テーブル

### 既存テストファイル
- `apps/web/__tests__/api/v1/user.test.ts` — プラン管理APIテスト9件を追加済み（プロフィールのplan返却、履歴取得、変更成功・失敗系）
- `apps/web/__tests__/api/v1/userBike.test.ts` — `登録台数制限でエラーになる 1台目→2台目→3台目(エラー)` がFREEプラン相当の制限をカバー（ただしシードデータ不足でスキップ中）、ゲスト制限テストあり
- `apps/e2e/tests/bike/bikeRegister.spec.ts` — バイク登録フローのE2Eテスト
- `apps/e2e/tests/profile/profile.spec.ts` — プロフィール画面のE2Eテスト

## テストが必要なロール×プランの組み合わせ

| ロール | プラン | テストが必要か | 理由 |
|-------|-------|:----------:|------|
| USER  | FREE  | ✓ | デフォルトプラン。各制限値の境界テストが必要 |
| USER  | PREMIUM | ✓ | 制限解放後の動作確認が必要 |
| USER  | FREE→PREMIUM変更 | ✓ | プラン変更直後の制限値切り替えを確認 |
| ADMIN | - | ✓ | プラン変更APIの呼び出し権限・PATCH /admin/plan の動作 |
| GUEST | - | ✓ | plan: null が正しく返ること、プラン変更操作が403になること |

## ペルソナ別の重点観点ヒント

- **P1 新規ユーザー**: 新規ユーザー登録直後に `GET /profile` で `plan: 'FREE'` が返ること、`GET /plan/histories` で初回履歴1件（plan: FREE）が返ること。モバイルアプリ側でプランが正しく表示されるかの確認起点になる。

- **P2 パワーユーザー**: PREMIUMプランに変更後、バイクを3台目以降登録できること（上限: 10台）。ツーリングプランを11件目以降登録できること。メンテナンスログを6件目以降登録できること。プラン変更前後で既存データが消えないこと。

- **P3 攻撃者**: USER が `PATCH /admin/plan` を呼んで403になること。GUEST が `GET /plan/histories` を呼んで認証エラーまたは空レスポンスになること。`targetUserId` に存在しないIDを指定したとき404になること。`targetUserId` に GUEST/ADMIN のIDを指定したとき403になること。admin API のプラン変更エンドポイント（`/api/admin/users/:id/plan`）にアクセスする際、非ADMINトークンで403になること。

- **P4 データ整合性**: プラン変更後に `TUserPlanHistory` にレコードが1件追加されること（削除でなく追加）。`changedById` に変更した管理者のユーザーIDがセットされること。`changedAt` が変更時刻になること。USERを削除したとき関連 `TUserPlanHistory` レコードも cascade 削除されること（`onDelete: Cascade`）。

- **P5 制限値番人**: 以下の境界値を必ず確認する。
  | 機能 | GUEST上限 | FREE上限 | PREMIUM上限 |
  |------|:--------:|:-------:|:-----------:|
  | バイク登録 | 1台 | 2台 | 10台 |
  | 給油履歴 | 5件 | 無制限 | 無制限 |
  | ツーリング履歴 | 2件 | 無制限 | 無制限 |
  | ツーリングプラン | 2件 | **10件** | 無制限 |
  | メンテナンスログ | 2件 | **5件**（今回変更） | 無制限 |

  特に「FREEユーザーのメンテナンスログ5件目は登録できて6件目でエラー」の境界値テストは今回の仕様変更点であり、既存テストにカバーがないため必須。

- **P6 回帰担当**: `AccountLimitsValue.from()` の呼び出しを `plan` 引数付きに変更した箇所が多い（userBike・fuelLogs・tourings×2・touringPlans・maintenanceLogs）。既存のゲスト制限テスト（`userBike.test.ts` の5000行台）が引き続き通ること。ユーザー登録フローが正常に動作すること（`PrismaUserRepository.createUser` が `$transaction` 内で TUserPlanHistory を作成するように変更されたため）。

- **P7 仕様懐疑**: `PREMIUM_USER_LIMITS.TOURING_PLAN: null` と `PREMIUM_USER_LIMITS.MAINTENANCE_LOG: null` だが、`AccountLimitsValue.from('USER', 'PREMIUM')` が `touringPlan: null, maintenanceLog: null` を返すか実装と定数値を照合する。`HonoVariables.user.plan` の型が `UserPlan | null` であることを確認し、ミドルウェアが `ActiveUserInfo.plan` を正しくセットすることを確認する。

## スコープ外（今回テストしないこと）

- **WebフロントエンドUI（`apps/web`）のプラン表示**: Issue #440 のスコープは API・DB・テストのみ（UIチェックボックス未選択）
- **admin ページの E2E テスト**: `apps/e2e` は `apps/web` のみ対象
- **プランによる課金・決済フロー**: 別途 Issue 化が必要
- **プラン自動更新・期限切れ処理**: 本 Issue のスコープ外

## 参照情報
- Prismaスキーマ: `packages/database/prisma/schema.prisma`
- 制限値定数: `apps/web/lib/statics.ts`
- 制限値VO: `apps/web/lib/api/server/valueObjects/AccountLimitsValue.ts`
- 型定義: `packages/shared-types/src/domain/user.ts`, `packages/shared-types/src/domain/userPlanHistory.ts`
- APIエンドポイント: `apps/web/lib/api/server/v1/user.ts`
- 既存プラン管理テスト: `apps/web/__tests__/api/v1/user.test.ts` L1074〜
