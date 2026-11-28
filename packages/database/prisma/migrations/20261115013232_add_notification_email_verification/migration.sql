-- CreateTable
CREATE TABLE "TUserNotificationEmailVerification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "verified_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TUserNotificationEmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TUserNotificationEmailVerification_token_hash_key" ON "TUserNotificationEmailVerification"("token_hash");

-- CreateIndex
CREATE INDEX "TUserNotificationEmailVerification_user_id_created_at_idx" ON "TUserNotificationEmailVerification"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "TUserNotificationEmailVerification" ADD CONSTRAINT "TUserNotificationEmailVerification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
