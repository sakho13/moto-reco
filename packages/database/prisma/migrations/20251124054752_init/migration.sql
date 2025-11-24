-- CreateEnum
CREATE TYPE "MUserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MUserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('FIREBASE_EMAIL', 'FIREBASE_GOOGLE');

-- CreateEnum
CREATE TYPE "BikeStatus" AS ENUM ('INACTIVE', 'ACTIVE');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('BRAKE_FLUID', 'FRONT_BRAKE_PAD', 'REAR_BRAKE_PAD', 'MASTER_CYLINDER_CUP', 'BRAKE_CALIPER_SEAL', 'BRAKE_CABLE', 'SPARK_PLUG', 'COOLANT', 'ENGINE_OIL', 'OIL_CLEANER', 'TRANSMISSION_OIL', 'DRIVE_CHAIN', 'DRIVE_BELT', 'FRONT_TIRE', 'REAR_TIRE', 'BATTERY', 'LIGHT', 'TURN_SIGNAL', 'HORN');

-- CreateEnum
CREATE TYPE "UserBikeOwnStatus" AS ENUM ('OWN', 'SOLD', 'TRANSFERRED', 'SCRAPPED');

-- CreateTable
CREATE TABLE "MAuthProvider" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider_type" "ProviderType" NOT NULL,
    "external_id" TEXT NOT NULL,
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MAuthProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "MUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "role" "MUserRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "MUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MManufacturer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "logo_url" TEXT,
    "website_url" TEXT,
    "country" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MManufacturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MBike" (
    "id" TEXT NOT NULL,
    "manufacturer_id" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "displacement" DOUBLE PRECISION NOT NULL,
    "model_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "setting_status" "BikeStatus" NOT NULL DEFAULT 'INACTIVE',

    CONSTRAINT "MBike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MMaintenanceType" (
    "id" TEXT NOT NULL,
    "bike_id" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "recommended_mileage" INTEGER NOT NULL,
    "recommended_period" INTEGER NOT NULL,

    CONSTRAINT "MMaintenanceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TUserBike" (
    "id" TEXT NOT NULL,
    "bike_id" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserBike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TMyBike" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_bike_id" TEXT NOT NULL,
    "nickname" TEXT,
    "purchase_date" TIMESTAMP(3),
    "purchase_price" INTEGER,
    "purchase_mileage" INTEGER,
    "owned_at" TIMESTAMP(3) NOT NULL,
    "sold_at" TIMESTAMP(3),
    "own_status" "UserBikeOwnStatus" NOT NULL DEFAULT 'OWN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TMyBike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TUserBikeFuel" (
    "id" TEXT NOT NULL,
    "my_bike_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "price" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "refueled_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserBikeFuel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MAuthProvider_user_id_is_active_idx" ON "MAuthProvider"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "MAuthProvider_provider_type_external_id_key" ON "MAuthProvider"("provider_type", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "MManufacturer_name_key" ON "MManufacturer"("name");

-- CreateIndex
CREATE INDEX "MBike_manufacturer_id_idx" ON "MBike"("manufacturer_id");

-- CreateIndex
CREATE INDEX "MBike_model_name_model_year_idx" ON "MBike"("model_name", "model_year");

-- CreateIndex
CREATE UNIQUE INDEX "MMaintenanceType_bike_id_type_key" ON "MMaintenanceType"("bike_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TUserBike_serial_number_key" ON "TUserBike"("serial_number");

-- CreateIndex
CREATE INDEX "TMyBike_user_id_own_status_idx" ON "TMyBike"("user_id", "own_status");

-- CreateIndex
CREATE INDEX "TMyBike_owned_at_idx" ON "TMyBike"("owned_at");

-- CreateIndex
CREATE INDEX "TUserBikeFuel_my_bike_id_refueled_at_idx" ON "TUserBikeFuel"("my_bike_id", "refueled_at");

-- AddForeignKey
ALTER TABLE "MAuthProvider" ADD CONSTRAINT "MAuthProvider_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MBike" ADD CONSTRAINT "MBike_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "MManufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MMaintenanceType" ADD CONSTRAINT "MMaintenanceType_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "MBike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserBike" ADD CONSTRAINT "TUserBike_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "MBike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TMyBike" ADD CONSTRAINT "TMyBike_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TMyBike" ADD CONSTRAINT "TMyBike_user_bike_id_fkey" FOREIGN KEY ("user_bike_id") REFERENCES "TUserBike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserBikeFuel" ADD CONSTRAINT "TUserBikeFuel_my_bike_id_fkey" FOREIGN KEY ("my_bike_id") REFERENCES "TMyBike"("id") ON DELETE CASCADE ON UPDATE CASCADE;
