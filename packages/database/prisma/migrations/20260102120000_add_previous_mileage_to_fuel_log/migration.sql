ALTER TABLE "TUserMyBikeFuelLog" ADD COLUMN "previous_mileage" INTEGER;

UPDATE "TUserMyBikeFuelLog"
SET "previous_mileage" = "mileage";

ALTER TABLE "TUserMyBikeFuelLog" ALTER COLUMN "previous_mileage" SET NOT NULL;
