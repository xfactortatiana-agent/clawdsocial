-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "voiceProfile" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "voiceProfileUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferredPostTimes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notificationSettings" JSONB;
