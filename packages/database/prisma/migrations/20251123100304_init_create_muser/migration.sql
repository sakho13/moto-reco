-- CreateEnum
CREATE TYPE "MUserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "MUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "MUserStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "MUser_pkey" PRIMARY KEY ("id")
);
