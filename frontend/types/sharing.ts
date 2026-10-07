export type Permission = "VIEW" | "EDIT";

export interface SharedUser {
  id: string;
  name: string;
  email: string;
}

export interface SharedFile {
  id: string;
  name: string;
  originalName: string;
  url: string;
  publicId: string;
  size: number;
  mimeType: string;
  ownerId: string;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface SharedFolder {
  id: string;
  name: string;
  ownerId: string;
  parentId?: string | null;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  itemCount?: number;
  size?: string;
  files?: SharedFile[];
}

export interface ReceivedShare {
  id: string;
  fileId?: string | null;
  folderId?: string | null;
  sharedById: string;
  sharedWithId?: string | null;
  permission: Permission;
  isPublic?: boolean;
  publicToken?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  file?: SharedFile | null;
  folder?: SharedFolder | null;
  sharedBy: SharedUser;
}

export interface SentShare {
  id: string;
  fileId?: string | null;
  folderId?: string | null;
  sharedById: string;
  sharedWithId?: string | null;
  permission: Permission;
  isPublic?: boolean;
  publicToken?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  file?: SharedFile | null;
  folder?: SharedFolder | null;
  sharedWith?: SharedUser | null;
}

export interface PublicShareResult {
  permission: Permission;
  file?: SharedFile | null;
  folder?: SharedFolder | null;
  sharedBy: {
    name: string;
    email: string;
  };
  expiresAt?: string | null;
}

export interface FileAccessResult {
  permission: "OWNER" | "VIEW" | "EDIT";
  file: SharedFile;
  inheritedFromFolder?: boolean;
}

export interface CreateSharePayload {
  email?: string;
  sharedWithId?: string;
  permission: Permission;
}

export interface CreatePublicSharePayload {
  fileId?: string;
  folderId?: string;
  permission?: Permission;
  expiresInHours?: number;
  expiresAt?: string | null;
}

export interface UpdateSharePayload {
  permission: Permission;
}

export interface ShareResponse {
  message: string;
  share: ReceivedShare | SentShare;
}

export interface RevokeResponse {
  message: string;
  shareId?: string;
}
