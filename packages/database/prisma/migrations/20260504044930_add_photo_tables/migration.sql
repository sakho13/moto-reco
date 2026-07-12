-- CreateTable
CREATE TABLE "TUserPhoto" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "memo" TEXT,
    "taken_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TUserPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TUserMyBikeTouringPhoto" (
    "touring_id" TEXT NOT NULL,
    "photo_id" TEXT NOT NULL,

    CONSTRAINT "TUserMyBikeTouringPhoto_pkey" PRIMARY KEY ("touring_id", "photo_id")
);

-- CreateTable
CREATE TABLE "TUserMyBikeTouringSpotPhoto" (
    "spot_id" TEXT NOT NULL,
    "photo_id" TEXT NOT NULL,

    CONSTRAINT "TUserMyBikeTouringSpotPhoto_pkey" PRIMARY KEY ("spot_id", "photo_id")
);

-- CreateTable
CREATE TABLE "TUserMyBikeDirectPhoto" (
    "my_bike_id" TEXT NOT NULL,
    "photo_id" TEXT NOT NULL,

    CONSTRAINT "TUserMyBikeDirectPhoto_pkey" PRIMARY KEY ("my_bike_id", "photo_id")
);

-- AddForeignKey
ALTER TABLE "TUserPhoto" ADD CONSTRAINT "TUserPhoto_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeTouringPhoto" ADD CONSTRAINT "TUserMyBikeTouringPhoto_touring_id_fkey" FOREIGN KEY ("touring_id") REFERENCES "TUserMyBikeTouring"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeTouringPhoto" ADD CONSTRAINT "TUserMyBikeTouringPhoto_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "TUserPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeTouringSpotPhoto" ADD CONSTRAINT "TUserMyBikeTouringSpotPhoto_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "TUserMyBikeTouringSpot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeTouringSpotPhoto" ADD CONSTRAINT "TUserMyBikeTouringSpotPhoto_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "TUserPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeDirectPhoto" ADD CONSTRAINT "TUserMyBikeDirectPhoto_my_bike_id_fkey" FOREIGN KEY ("my_bike_id") REFERENCES "TUserMyBike"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeDirectPhoto" ADD CONSTRAINT "TUserMyBikeDirectPhoto_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "TUserPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
