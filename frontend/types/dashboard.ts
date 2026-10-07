export interface StorageStats {
  usedBytes: number;
  quotaBytes: number;
  usedFormatted: string;
  quotaFormatted: string;
  percentageUsed: number;
  fileCount: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  bytes: number;
  formattedBytes: string;
  percentage: number;
}

export interface FileStats {
  total: number;
  trashedCount: number;
  favoritesCount: number;
  byCategory: CategoryStat[];
}

export interface FolderStats {
  total: number;
  trashedCount: number;
  rootCount: number;
}

export interface ShareStats {
  total: number;
  sentCount: number;
  receivedCount: number;
}

export interface MostDownloadedFile {
  fileId: string;
  name: string;
  downloadCount: number;
  sizeBytes: number;
  formattedSize: string;
  mimeType: string;
}

export interface DownloadStats {
  totalDownloads: number;
  downloadsThisWeek: number;
  mostDownloadedFiles: MostDownloadedFile[];
}

export interface ActivitySummary {
  uploadsThisWeek: number;
  downloadsThisWeek: number;
  sharesThisWeek: number;
  deletesThisWeek: number;
}

export interface DashboardFile {
  id: string;
  name: string;
  url?: string;
  sizeBytes: number;
  formattedSize: string;
  mimeType: string;
  category: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardActivity {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  file?: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    formattedSize: string;
  } | null;
  folder?: {
    id: string;
    name: string;
  } | null;
}

export interface UserProfileOverview {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
}

export interface DashboardData {
  storage: StorageStats;
  files: FileStats;
  folders: FolderStats;
  shares: ShareStats;
  downloads: DownloadStats;
  activitySummary: ActivitySummary;
  recentFiles: DashboardFile[];
  recentActivity: DashboardActivity[];
  user: UserProfileOverview;
}

export interface ActivityListResponse {
  activities: DashboardActivity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
