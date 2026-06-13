/*
  Warnings:

  - You are about to drop the column `read_count` on the `MSystemAnnouncement` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TouringPlanRouteType" AS ENUM ('GENERAL', 'HIGHWAY', 'MIXED');

-- AlterTable
ALTER TABLE "MSystemAnnouncement" DROP COLUMN "read_count";

-- AlterTable
ALTER TABLE "TUserMyBikeTouringPlanSpot" ADD COLUMN     "route_type_from_prev" "TouringPlanRouteType",
ADD COLUMN     "stay_minutes" INTEGER,
ADD COLUMN     "travel_minutes_from_prev" INTEGER;

-- CreateIndex
CREATE INDEX "MSystemAnnouncement_status_scheduled_at_idx" ON "MSystemAnnouncement"("status", "scheduled_at");
