-- ツーリング「プラン」機能 大規模再設計
--
-- 「プラン（再利用可能なルートテンプレート）」と「実績（実際に走った記録）」を
-- 完全に別エンティティに分離する。
--   - TUserMyBikeTouringPlan / TUserMyBikeTouringPlanSpot: プラン（新規）
--   - TUserMyBikeTouring / TUserMyBikeTouringSpot: 実績（status は STARTED/COMPLETED のみ）
--
-- 既存の status='PLANNED' な TUserMyBikeTouring 行は、新しい
-- TUserMyBikeTouringPlan / TUserMyBikeTouringPlanSpot へ変換したうえで削除する。

-- =========================================================================
-- 1. TouringPlanSpotType enum を作成
-- =========================================================================
CREATE TYPE "TouringPlanSpotType" AS ENUM ('START', 'SPOT', 'BREAK', 'DESTINATION');

-- =========================================================================
-- 2. 新テーブル TUserMyBikeTouringPlan / TUserMyBikeTouringPlanSpot を作成
-- =========================================================================
CREATE TABLE "TUserMyBikeTouringPlan" (
    "id" TEXT NOT NULL,
    "my_bike_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "depart_at" TIMESTAMP(3) NOT NULL,
    "return_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserMyBikeTouringPlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TUserMyBikeTouringPlan_my_bike_id_depart_at_idx" ON "TUserMyBikeTouringPlan"("my_bike_id", "depart_at");

ALTER TABLE "TUserMyBikeTouringPlan"
  ADD CONSTRAINT "TUserMyBikeTouringPlan_my_bike_id_fkey"
  FOREIGN KEY ("my_bike_id") REFERENCES "TUserMyBike"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TUserMyBikeTouringPlanSpot" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "type" "TouringPlanSpotType" NOT NULL DEFAULT 'SPOT',
    "name" TEXT,
    "memo" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "planned_arrival_at" TIMESTAMP(3),
    "planned_departure_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserMyBikeTouringPlanSpot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TUserMyBikeTouringPlanSpot_plan_id_sort_order_idx" ON "TUserMyBikeTouringPlanSpot"("plan_id", "sort_order");

ALTER TABLE "TUserMyBikeTouringPlanSpot"
  ADD CONSTRAINT "TUserMyBikeTouringPlanSpot_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "TUserMyBikeTouringPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =========================================================================
-- 3. TUserMyBikeTouring に plan_id カラムを追加（nullable, FK, ON DELETE SET NULL）
-- =========================================================================
ALTER TABLE "TUserMyBikeTouring" ADD COLUMN "plan_id" TEXT;

CREATE INDEX "TUserMyBikeTouring_plan_id_idx" ON "TUserMyBikeTouring"("plan_id");

ALTER TABLE "TUserMyBikeTouring"
  ADD CONSTRAINT "TUserMyBikeTouring_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "TUserMyBikeTouringPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =========================================================================
-- 4. TUserMyBikeTouringSpot に新カラムを追加（nullable）
-- =========================================================================
ALTER TABLE "TUserMyBikeTouringSpot" ADD COLUMN "planned_arrival_at" TIMESTAMP(3);
ALTER TABLE "TUserMyBikeTouringSpot" ADD COLUMN "planned_departure_at" TIMESTAMP(3);
ALTER TABLE "TUserMyBikeTouringSpot" ADD COLUMN "arrived_at" TIMESTAMP(3);
ALTER TABLE "TUserMyBikeTouringSpot" ADD COLUMN "departed_at" TIMESTAMP(3);
ALTER TABLE "TUserMyBikeTouringSpot" ADD COLUMN "skipped_at" TIMESTAMP(3);

-- =========================================================================
-- 5. データ移行: status='PLANNED' な TUserMyBikeTouring 行 → TUserMyBikeTouringPlan
-- =========================================================================

-- 5-1. PLANNED ツーリング行 → TouringPlan
--      (title -> title, start_date -> depart_at, end_date -> return_at)
INSERT INTO "TUserMyBikeTouringPlan" ("id", "my_bike_id", "title", "depart_at", "return_at", "created_at", "updated_at")
SELECT
  "id",
  "my_bike_id",
  "title",
  "start_date",
  "end_date",
  "created_at",
  "updated_at"
FROM "TUserMyBikeTouring"
WHERE "status" = 'PLANNED';

-- 5-2. start_latitude/start_longitude が設定されている場合、type='START' のスポットを追加
INSERT INTO "TUserMyBikeTouringPlanSpot" ("id", "plan_id", "type", "latitude", "longitude", "sort_order", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  "id",
  'START',
  "start_latitude",
  "start_longitude",
  0,
  "created_at",
  "updated_at"
FROM "TUserMyBikeTouring"
WHERE "status" = 'PLANNED'
  AND "start_latitude" IS NOT NULL
  AND "start_longitude" IS NOT NULL;

-- 5-3. end_latitude/end_longitude が設定されている場合、type='DESTINATION' のスポットを追加
--      （旧「帰着予定日時」(end_date) を目的地到着予定として引き継ぐ）
INSERT INTO "TUserMyBikeTouringPlanSpot" ("id", "plan_id", "type", "latitude", "longitude", "planned_arrival_at", "sort_order", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  "id",
  'DESTINATION',
  "end_latitude",
  "end_longitude",
  "end_date",
  9999,
  "created_at",
  "updated_at"
FROM "TUserMyBikeTouring"
WHERE "status" = 'PLANNED'
  AND "end_latitude" IS NOT NULL
  AND "end_longitude" IS NOT NULL;

-- 5-4. 既存の type IN ('SPOT','BREAK') スポット行 → TouringPlanSpot
--      (planned_at -> planned_arrival_at,
--       COALESCE(planned_depart_at, end_at) -> planned_departure_at
--       … Bug #1 で end_at に誤って入っていたプラン出発予定値もここで正しく拾う)
INSERT INTO "TUserMyBikeTouringPlanSpot" (
  "id", "plan_id", "type", "name", "memo", "latitude", "longitude",
  "planned_arrival_at", "planned_departure_at", "sort_order", "created_at", "updated_at"
)
SELECT
  s."id",
  s."touring_id",
  s."type"::text::"TouringPlanSpotType",
  s."name",
  s."memo",
  s."latitude",
  s."longitude",
  s."planned_at",
  COALESCE(s."planned_depart_at", s."end_at"),
  s."sort_order",
  s."created_at",
  s."updated_at"
FROM "TUserMyBikeTouringSpot" s
JOIN "TUserMyBikeTouring" t ON t."id" = s."touring_id"
WHERE t."status" = 'PLANNED'
  AND s."type" IN ('SPOT', 'BREAK');

-- =========================================================================
-- 6. 既存の TUserMyBikeTouringSpot（STARTED/COMPLETED 由来）を新カラムへ移行
-- =========================================================================
UPDATE "TUserMyBikeTouringSpot" s
SET
  "arrived_at" = s."visited_at",
  "departed_at" = s."end_at",
  "planned_arrival_at" = s."planned_at",
  "planned_departure_at" = s."planned_depart_at",
  "skipped_at" = CASE WHEN s."is_skipped" THEN s."visited_at" ELSE NULL END
FROM "TUserMyBikeTouring" t
WHERE t."id" = s."touring_id"
  AND t."status" IN ('STARTED', 'COMPLETED');

-- =========================================================================
-- 7. status='PLANNED' な TUserMyBikeTouring 行を削除
--    （onDelete: Cascade で spot/history も連鎖削除される）
-- =========================================================================
DELETE FROM "TUserMyBikeTouring" WHERE "status" = 'PLANNED';

-- =========================================================================
-- 8. 旧カラムを TUserMyBikeTouringSpot から削除
-- =========================================================================
ALTER TABLE "TUserMyBikeTouringSpot" DROP COLUMN "visited_at";
ALTER TABLE "TUserMyBikeTouringSpot" DROP COLUMN "end_at";
ALTER TABLE "TUserMyBikeTouringSpot" DROP COLUMN "planned_at";
ALTER TABLE "TUserMyBikeTouringSpot" DROP COLUMN "planned_depart_at";

-- =========================================================================
-- 9. TouringStatus enum から PLANNED を除去
--    （新enum型作成 → カラムの型差し替え → 旧enum型drop → リネーム）
-- =========================================================================
CREATE TYPE "TouringStatus_new" AS ENUM ('STARTED', 'COMPLETED');

ALTER TABLE "TUserMyBikeTouring"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "TUserMyBikeTouring"
  ALTER COLUMN "status" TYPE "TouringStatus_new"
  USING ("status"::text::"TouringStatus_new");

ALTER TABLE "TUserMyBikeTouring"
  ALTER COLUMN "status" SET DEFAULT 'COMPLETED';

DROP TYPE "TouringStatus";

ALTER TYPE "TouringStatus_new" RENAME TO "TouringStatus";
