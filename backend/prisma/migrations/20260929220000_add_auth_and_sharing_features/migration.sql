-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'RENAME_FILE';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'COPY_FILE';

-- AlterTable
ALTER TABLE "SharedItem" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "folderId" TEXT,
ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "publicToken" TEXT,
ALTER COLUMN "fileId" DROP NOT NULL,
ALTER COLUMN "sharedWithId" DROP NOT NULL,
ALTER COLUMN "permission" SET DEFAULT 'VIEW';

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "resetPasswordToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SharedItem_publicToken_key" ON "SharedItem"("publicToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SharedItem_folderId_idx" ON "SharedItem"("folderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SharedItem_publicToken_idx" ON "SharedItem"("publicToken");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SharedItem_folderId_fkey'
  ) THEN
    ALTER TABLE "SharedItem" ADD CONSTRAINT "SharedItem_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
