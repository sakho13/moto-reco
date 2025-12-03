/*
  Warnings:

  - You are about to drop the `TMyBike` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TUserBikeFuel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TMyBike" DROP CONSTRAINT "TMyBike_user_bike_id_fkey";

-- DropForeignKey
ALTER TABLE "TMyBike" DROP CONSTRAINT "TMyBike_user_id_fkey";

-- DropForeignKey
ALTER TABLE "TUserBikeFuel" DROP CONSTRAINT "TUserBikeFuel_my_bike_id_fkey";

-- DropTable
DROP TABLE "TMyBike";

-- DropTable
DROP TABLE "TUserBikeFuel";

-- CreateTable
CREATE TABLE "TUserMyBike" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_bike_id" TEXT NOT NULL,
    "nickname" TEXT,
    "purchase_date" TIMESTAMP(3),
    "purchase_price" INTEGER,
    "purchase_mileage" INTEGER,
    "total_mileage" INTEGER NOT NULL DEFAULT 0,
    "owned_at" TIMESTAMP(3) NOT NULL,
    "sold_at" TIMESTAMP(3),
    "own_status" "UserBikeOwnStatus" NOT NULL DEFAULT 'OWN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserMyBike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TUserMyBikeFuelLog" (
    "id" TEXT NOT NULL,
    "my_bike_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "price" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "refueled_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserMyBikeFuelLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TUserMyBike_user_id_own_status_idx" ON "TUserMyBike"("user_id", "own_status");

-- CreateIndex
CREATE INDEX "TUserMyBike_owned_at_idx" ON "TUserMyBike"("owned_at");

-- CreateIndex
CREATE INDEX "TUserMyBikeFuelLog_my_bike_id_refueled_at_idx" ON "TUserMyBikeFuelLog"("my_bike_id", "refueled_at");

-- AddForeignKey
ALTER TABLE "TUserMyBike" ADD CONSTRAINT "TUserMyBike_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBike" ADD CONSTRAINT "TUserMyBike_user_bike_id_fkey" FOREIGN KEY ("user_bike_id") REFERENCES "TUserBike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeFuelLog" ADD CONSTRAINT "TUserMyBikeFuelLog_my_bike_id_fkey" FOREIGN KEY ("my_bike_id") REFERENCES "TUserMyBike"("id") ON DELETE CASCADE ON UPDATE CASCADE;
