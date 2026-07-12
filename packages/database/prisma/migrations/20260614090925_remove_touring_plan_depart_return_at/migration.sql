-- DropIndex
DROP INDEX "TUserMyBikeTouringPlan_my_bike_id_depart_at_idx";

-- AlterTable
ALTER TABLE "TUserMyBikeTouringPlan" DROP COLUMN "depart_at",
DROP COLUMN "return_at";

-- CreateIndex
CREATE INDEX "TUserMyBikeTouringPlan_my_bike_id_created_at_idx" ON "TUserMyBikeTouringPlan"("my_bike_id", "created_at");
