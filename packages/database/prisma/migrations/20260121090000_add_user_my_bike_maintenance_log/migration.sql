-- CreateTable
CREATE TABLE "TUserMyBikeMaintenanceLog" (
    "id" TEXT NOT NULL,
    "my_bike_id" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL,
    "mileage" INTEGER NOT NULL,
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserMyBikeMaintenanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TUserMyBikeMaintenanceLogItem" (
    "id" TEXT NOT NULL,
    "maintenance_log_id" TEXT NOT NULL,
    "maintenance_type" "MaintenanceType" NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserMyBikeMaintenanceLogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TUserMyBikeMaintenanceLog_my_bike_id_performed_at_idx" ON "TUserMyBikeMaintenanceLog"("my_bike_id", "performed_at");

-- CreateIndex
CREATE UNIQUE INDEX "TUserMyBikeMaintenanceLogItem_maintenance_log_id_maintenance_type_key" ON "TUserMyBikeMaintenanceLogItem"("maintenance_log_id", "maintenance_type");

-- CreateIndex
CREATE INDEX "TUserMyBikeMaintenanceLogItem_maintenance_log_id_idx" ON "TUserMyBikeMaintenanceLogItem"("maintenance_log_id");

-- AddForeignKey
ALTER TABLE "TUserMyBikeMaintenanceLog" ADD CONSTRAINT "TUserMyBikeMaintenanceLog_my_bike_id_fkey" FOREIGN KEY ("my_bike_id") REFERENCES "TUserMyBike"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserMyBikeMaintenanceLogItem" ADD CONSTRAINT "TUserMyBikeMaintenanceLogItem_maintenance_log_id_fkey" FOREIGN KEY ("maintenance_log_id") REFERENCES "TUserMyBikeMaintenanceLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
