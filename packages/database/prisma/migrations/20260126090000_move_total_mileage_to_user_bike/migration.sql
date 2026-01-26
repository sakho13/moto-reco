ALTER TABLE "TUserBike" ADD COLUMN "total_mileage" INTEGER NOT NULL DEFAULT 0;

UPDATE "TUserBike" AS ub
SET "total_mileage" = COALESCE(
  (
    SELECT MAX(mub."total_mileage")
    FROM "TUserMyBike" AS mub
    WHERE mub."user_bike_id" = ub."id"
  ),
  0
);

ALTER TABLE "TUserMyBike" DROP COLUMN "total_mileage";
