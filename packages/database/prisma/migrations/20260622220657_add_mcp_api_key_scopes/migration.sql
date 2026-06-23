-- CreateEnum
CREATE TYPE "MApiKeyScope" AS ENUM ('READ', 'WRITE');

-- AlterTable
ALTER TABLE "MApiKey" ADD COLUMN     "scopes" "MApiKeyScope"[];
