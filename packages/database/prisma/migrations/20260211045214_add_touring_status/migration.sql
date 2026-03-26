-- CreateEnum
CREATE TYPE "TouringStatus" AS ENUM ('STARTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "TUserMyBikeFuelLog" ADD COLUMN     "touring_id" TEXT;

-- AlterTable
ALTER TABLE "TUserMyBikeTouring" ADD COLUMN     "status" "TouringStatus" NOT NULL DEFAULT 'COMPLETED';

-- CreateIndex
CREATE INDEX "TUserMyBikeFuelLog_touring_id_idx" ON "TUserMyBikeFuelLog"("touring_id");

-- CreateIndex
CREATE INDEX "TUserMyBikeTouring_my_bike_id_status_idx" ON "TUserMyBikeTouring"("my_bike_id", "status");

-- AddForeignKey
ALTER TABLE "TUserMyBikeFuelLog" ADD CONSTRAINT "TUserMyBikeFuelLog_touring_id_fkey" FOREIGN KEY ("touring_id") REFERENCES "TUserMyBikeTouring"("id") ON DELETE SET NULL ON UPDATE CASCADE;
