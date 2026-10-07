-- CreateIndex
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_action_createdAt_idx" ON "ActivityLog"("userId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "File_ownerId_deletedAt_createdAt_idx" ON "File"("ownerId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "File_ownerId_folderId_deletedAt_idx" ON "File"("ownerId", "folderId", "deletedAt");

-- CreateIndex
CREATE INDEX "Folder_ownerId_deletedAt_idx" ON "Folder"("ownerId", "deletedAt");

-- CreateIndex
CREATE INDEX "Folder_ownerId_parentId_deletedAt_idx" ON "Folder"("ownerId", "parentId", "deletedAt");

-- CreateIndex
CREATE INDEX "Folder_ownerId_isFavorite_deletedAt_idx" ON "Folder"("ownerId", "isFavorite", "deletedAt");

-- CreateIndex
CREATE INDEX "SharedItem_fileId_sharedWithId_idx" ON "SharedItem"("fileId", "sharedWithId");

-- CreateIndex
CREATE INDEX "SharedItem_folderId_sharedWithId_idx" ON "SharedItem"("folderId", "sharedWithId");
