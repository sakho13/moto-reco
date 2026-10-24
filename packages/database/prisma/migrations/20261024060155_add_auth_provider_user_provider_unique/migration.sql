-- CreateIndex
CREATE UNIQUE INDEX "MAuthProvider_user_id_provider_type_key" ON "MAuthProvider"("user_id", "provider_type");
