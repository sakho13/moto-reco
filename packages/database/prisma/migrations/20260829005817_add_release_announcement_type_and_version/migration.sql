-- AlterEnum
ALTER TYPE "AnnouncementType" ADD VALUE 'RELEASE_ANNOUNCEMENT';

-- AlterTable
ALTER TABLE "MSystemAnnouncement" ADD COLUMN     "version" TEXT;
