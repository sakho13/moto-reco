/*
  Warnings:

  - Added the required column `model_code` to the `MBike` table without a default value. This is not possible if the table is not empty.
  - Added the required column `release_month` to the `MBike` table without a default value. This is not possible if the table is not empty.
  - Added the required column `release_year` to the `MBike` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MBike" ADD COLUMN     "model_code" TEXT NOT NULL,
ADD COLUMN     "release_month" INTEGER NOT NULL,
ADD COLUMN     "release_year" INTEGER NOT NULL;
