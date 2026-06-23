-- AlterTable
ALTER TABLE "MApiKey" ALTER COLUMN "scopes" SET DEFAULT ARRAY['READ']::"MApiKeyScope"[];
