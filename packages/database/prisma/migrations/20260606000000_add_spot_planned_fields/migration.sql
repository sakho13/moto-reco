-- AlterTable: TUserMyBikeTouringSpot
-- visited_at をNULL許容に変更（プランではNULL、到着時に記録）
-- plannedAt / plannedDepartAt でプラン計画時刻を管理
ALTER TABLE "TUserMyBikeTouringSpot" ALTER COLUMN "visited_at" DROP DEFAULT;
ALTER TABLE "TUserMyBikeTouringSpot" ALTER COLUMN "visited_at" DROP NOT NULL;
ALTER TABLE "TUserMyBikeTouringSpot" ADD COLUMN "planned_at" TIMESTAMP(3);
ALTER TABLE "TUserMyBikeTouringSpot" ADD COLUMN "planned_depart_at" TIMESTAMP(3);
