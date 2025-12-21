-- AlterTable
ALTER TABLE "TUserBike" DROP CONSTRAINT "TUserBike_bike_id_fkey";
ALTER TABLE "TUserBike" ALTER COLUMN "bike_id" DROP NOT NULL;
ALTER TABLE "TUserBike" ADD COLUMN     "displacement" DOUBLE PRECISION;

UPDATE "TUserBike" ub
SET "displacement" = b."displacement"
FROM "MBike" b
WHERE ub."bike_id" = b."id";

UPDATE "TUserBike"
SET "displacement" = 0
WHERE "displacement" IS NULL;

ALTER TABLE "TUserBike" ALTER COLUMN "displacement" SET NOT NULL;

ALTER TABLE "TUserBike" ADD CONSTRAINT "TUserBike_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "MBike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
