-- AlterTable
ALTER TABLE "TUserMyBikeTouringPlanSpot" DROP COLUMN "planned_arrival_at",
DROP COLUMN "planned_departure_at",
ADD COLUMN     "planned_arrival_offset_minutes" INTEGER,
ADD COLUMN     "planned_departure_offset_minutes" INTEGER;
