-- CreateEnum
CREATE TYPE "SpotType" AS ENUM ('SPOT', 'BREAK');

-- AlterTable
ALTER TABLE "TUserMyBikeTouringSpot" ADD COLUMN "type" "SpotType" NOT NULL DEFAULT 'SPOT',
ADD COLUMN "end_at" TIMESTAMP(3);
