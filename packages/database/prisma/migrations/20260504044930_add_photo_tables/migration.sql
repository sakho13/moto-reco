-- CreateTable
CREATE TABLE "TUserMyBikePhoto" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "memo" TEXT,
    "taken_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TUserMyBikePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TUserMyBikeTouringPhoto" (
    "id" TEXT NOT NULL,
    "touring_id" TEXT NOT NULL,
    "photo_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TUserMyBikeTouringPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TUserMyBikeTouringSpotPhoto" (
    "id" TEXT NOT NULL,
    "spot_id" TEXT NOT NULL,
    "photo_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TUserMyBikeTouringSpotPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TUserMyBikeTouringPhoto_photo_id_key" ON "TUserMyBikeTouringPhoto"("photo_id");

-- CreateIndex
CREATE INDEX "TUserMyBikeTouringPhoto_touring_id_order_index_idx" ON "TUserMyBikeTouringPhoto"("touring_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "TUserMyBikeTouringSpotPhoto_photo_id_key" ON "TUserMyBikeTouringSpotPhoto"("photo_id");

-- CreateIndex
CREATE INDEX "TUserMyBikeTouringSpotPhoto_spot_id_order_index_idx" ON "TUserMyBikeTouringSpotPhoto"("spot_id", "order_index");

-- AddForeignKey
ALTER TABLE "TUserMyBikePhoto" ADD CONSTRAINT "TUserMyBikePhoto_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeTouringPhoto" ADD CONSTRAINT "TUserMyBikeTouringPhoto_touring_id_fkey" FOREIGN KEY ("touring_id") REFERENCES "TUserMyBikeTouring"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeTouringPhoto" ADD CONSTRAINT "TUserMyBikeTouringPhoto_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "TUserMyBikePhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeTouringSpotPhoto" ADD CONSTRAINT "TUserMyBikeTouringSpotPhoto_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "TUserMyBikeTouringSpot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeTouringSpotPhoto" ADD CONSTRAINT "TUserMyBikeTouringSpotPhoto_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "TUserMyBikePhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
