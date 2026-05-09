-- CreateTable
CREATE TABLE "TUserFollow" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TUserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TUserFollow_follower_id_idx" ON "TUserFollow"("follower_id");

-- CreateIndex
CREATE INDEX "TUserFollow_following_id_idx" ON "TUserFollow"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "TUserFollow_follower_id_following_id_key" ON "TUserFollow"("follower_id", "following_id");

-- AddForeignKey
ALTER TABLE "TUserFollow" ADD CONSTRAINT "TUserFollow_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserFollow" ADD CONSTRAINT "TUserFollow_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
