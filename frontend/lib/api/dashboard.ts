import { ActivityListResponse, DashboardData } from "@/types/dashboard";

export const getAuthToken = (): string => {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; auth_token=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
};

const getHeaders = (tokenOverride?: string): HeadersInit => {
  const token = tokenOverride || getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const errorData = await response.json();
    if (Array.isArray(errorData.message)) {
      return errorData.message.join(", ");
    }
    return errorData.message || fallback;
  } catch {
    return fallback;
  }
};

/**
 * Fetch unified dashboard statistics and analytics
 * GET /api/backend/dashboard
 */
export async function getDashboard(token?: string): Promise<DashboardData> {
  const response = await fetch("/api/backend/dashboard", {
    method: "GET",
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(response, "Unable to load dashboard data.");
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Fetch recent activity history with pagination
 * GET /api/backend/dashboard/activity?page=1&limit=10
 */
export async function getRecentActivities(
  page = 1,
  limit = 10,
  token?: string
): Promise<ActivityListResponse> {
  const response = await fetch(
    `/api/backend/dashboard/activity?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: getHeaders(token),
    }
  );

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(
      response,
      "Unable to load activity logs."
    );
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Download file through backend to record download activity analytics
 * GET /api/backend/files/:id/download
 */
export async function downloadFileWithAnalytics(
  fileId: string,
  token?: string
): Promise<{ downloadUrl: string; file: any }> {
  const response = await fetch(`/api/backend/files/${fileId}/download`, {
    method: "GET",
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(
      response,
      "Unable to download file."
    );
    throw new Error(errorMsg);
  }

  return response.json();
}
