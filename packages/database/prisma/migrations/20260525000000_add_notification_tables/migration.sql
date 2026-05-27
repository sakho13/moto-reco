-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FOLLOWED');

-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('SYSTEM_MAINTENANCE');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'EXPIRED');

-- CreateTable
CREATE TABLE "TNotification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MSystemAnnouncement" (
    "id" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "read_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MSystemAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TSystemAnnouncementRead" (
    "announcement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TSystemAnnouncementRead_pkey" PRIMARY KEY ("announcement_id","user_id")
);

-- CreateIndex
CREATE INDEX "TNotification_user_id_is_read_created_at_idx" ON "TNotification"("user_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "TNotification_user_id_created_at_idx" ON "TNotification"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "MSystemAnnouncement_status_published_at_idx" ON "MSystemAnnouncement"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "TSystemAnnouncementRead_user_id_idx" ON "TSystemAnnouncementRead"("user_id");

-- AddForeignKey
ALTER TABLE "TNotification" ADD CONSTRAINT "TNotification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MSystemAnnouncement" ADD CONSTRAINT "MSystemAnnouncement_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "MUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TSystemAnnouncementRead" ADD CONSTRAINT "TSystemAnnouncementRead_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "MSystemAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TSystemAnnouncementRead" ADD CONSTRAINT "TSystemAnnouncementRead_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
