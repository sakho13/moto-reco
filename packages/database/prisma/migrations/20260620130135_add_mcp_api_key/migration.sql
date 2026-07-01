-- CreateTable
CREATE TABLE "MApiKey" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MApiKey_key_hash_key" ON "MApiKey"("key_hash");

-- CreateIndex
CREATE INDEX "MApiKey_user_id_is_active_idx" ON "MApiKey"("user_id", "is_active");

-- AddForeignKey
ALTER TABLE "MApiKey" ADD CONSTRAINT "MApiKey_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
