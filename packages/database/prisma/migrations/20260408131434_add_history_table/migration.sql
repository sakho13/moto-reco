-- CreateEnum
CREATE TYPE "BikeHistoryType" AS ENUM ('FUEL_LOG', 'TOURING', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "TUserMyBikeHistory" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "my_bike_id" TEXT,
    "type" "BikeHistoryType" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "fuel_log_id" TEXT,
    "touring_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserMyBikeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TUserMyBikeHistory_fuel_log_id_key" ON "TUserMyBikeHistory"("fuel_log_id");

-- CreateIndex
CREATE UNIQUE INDEX "TUserMyBikeHistory_touring_id_key" ON "TUserMyBikeHistory"("touring_id");

-- CreateIndex
CREATE INDEX "TUserMyBikeHistory_user_id_occurred_at_idx" ON "TUserMyBikeHistory"("user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "TUserMyBikeHistory_my_bike_id_occurred_at_idx" ON "TUserMyBikeHistory"("my_bike_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "TUserMyBikeHistory_type_idx" ON "TUserMyBikeHistory"("type");

-- AddForeignKey
ALTER TABLE "TUserMyBikeHistory" ADD CONSTRAINT "TUserMyBikeHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeHistory" ADD CONSTRAINT "TUserMyBikeHistory_my_bike_id_fkey" FOREIGN KEY ("my_bike_id") REFERENCES "TUserMyBike"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeHistory" ADD CONSTRAINT "TUserMyBikeHistory_fuel_log_id_fkey" FOREIGN KEY ("fuel_log_id") REFERENCES "TUserMyBikeFuelLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeHistory" ADD CONSTRAINT "TUserMyBikeHistory_touring_id_fkey" FOREIGN KEY ("touring_id") REFERENCES "TUserMyBikeTouring"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData: 既存の給油履歴からヒストリーレコードを生成
INSERT INTO "TUserMyBikeHistory" (
    "id",
    "user_id",
    "my_bike_id",
    "type",
    "occurred_at",
    "fuel_log_id",
    "updated_at"
)
SELECT
    gen_random_uuid()::TEXT,
    b."user_id",
    f."my_bike_id",
    'FUEL_LOG'::"BikeHistoryType",
    f."refueled_at",
    f."id",
    NOW()
FROM "TUserMyBikeFuelLog" f
JOIN "TUserMyBike" b ON f."my_bike_id" = b."id";

-- MigrateData: 既存のツーリング記録からヒストリーレコードを生成
INSERT INTO "TUserMyBikeHistory" (
    "id",
    "user_id",
    "my_bike_id",
    "type",
    "occurred_at",
    "touring_id",
    "updated_at"
)
SELECT
    gen_random_uuid()::TEXT,
    b."user_id",
    t."my_bike_id",
    'TOURING'::"BikeHistoryType",
    t."end_date",
    t."id",
    NOW()
FROM "TUserMyBikeTouring" t
JOIN "TUserMyBike" b ON t."my_bike_id" = b."id";
