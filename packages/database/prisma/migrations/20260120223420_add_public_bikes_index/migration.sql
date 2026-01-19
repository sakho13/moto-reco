-- CreateIndex
CREATE INDEX "idx_public_bikes" ON "TUserMyBike"("is_public", "own_status", "updated_at" DESC);
