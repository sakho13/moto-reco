-- CreateEnum
CREATE TYPE "EtcDeviceType" AS ENUM ('NONE', 'ETC', 'ETC2');

-- AlterTable
ALTER TABLE "TUserMyBike" ADD COLUMN     "etc_type" "EtcDeviceType";
