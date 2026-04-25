-- AlterEnum: BikeHistoryType に POST を追加
ALTER TYPE "BikeHistoryType" ADD VALUE 'POST';

-- CreateTable: TUserMyBikePost
CREATE TABLE "TUserMyBikePost" (
    "id" TEXT NOT NULL,
    "my_bike_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserMyBikePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TUserMyBikePostPhoto
CREATE TABLE "TUserMyBikePostPhoto" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TUserMyBikePostPhoto_pkey" PRIMARY KEY ("id")
);

-- AlterTable: TUserMyBikeHistory に post_id カラムを追加
ALTER TABLE "TUserMyBikeHistory" ADD COLUMN "post_id" TEXT;

-- CreateIndex
CREATE INDEX "TUserMyBikePost_my_bike_id_occurred_at_idx" ON "TUserMyBikePost"("my_bike_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "TUserMyBikePostPhoto_post_id_order_index_idx" ON "TUserMyBikePostPhoto"("post_id", "order_index");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "TUserMyBikeHistory_post_id_key" ON "TUserMyBikeHistory"("post_id");

-- AddForeignKey
ALTER TABLE "TUserMyBikePost" ADD CONSTRAINT "TUserMyBikePost_my_bike_id_fkey" FOREIGN KEY ("my_bike_id") REFERENCES "TUserMyBike"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikePost" ADD CONSTRAINT "TUserMyBikePost_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikePostPhoto" ADD CONSTRAINT "TUserMyBikePostPhoto_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "TUserMyBikePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeHistory" ADD CONSTRAINT "TUserMyBikeHistory_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "TUserMyBikePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
