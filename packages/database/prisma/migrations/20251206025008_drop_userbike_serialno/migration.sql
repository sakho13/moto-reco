-- DropIndex
DROP INDEX "TUserBike_serial_number_key";

-- AlterTable
ALTER TABLE "TUserBike" ALTER COLUMN "serial_number" DROP NOT NULL;
