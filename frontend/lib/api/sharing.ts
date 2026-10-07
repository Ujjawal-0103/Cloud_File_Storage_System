import {
  CreateSharePayload,
  CreatePublicSharePayload,
  FileAccessResult,
  PublicShareResult,
  ReceivedShare,
  RevokeResponse,
  SentShare,
  ShareResponse,
  UpdateSharePayload,
} from "@/types/sharing";

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
 * Share a file with another user by email
 * POST /api/backend/sharing/files/:fileId
 */
export async function shareFile(
  fileId: string,
  payload: CreateSharePayload,
  token?: string
): Promise<ShareResponse> {
  const response = await fetch(`/api/backend/sharing/files/${fileId}`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(response, "Failed to share file");
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Share a folder with another user by email
 * POST /api/backend/sharing/folders/:folderId
 */
export async function shareFolder(
  folderId: string,
  payload: CreateSharePayload,
  token?: string
): Promise<ShareResponse> {
  const response = await fetch(`/api/backend/sharing/folders/${folderId}`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(response, "Failed to share folder");
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Create a public sharing link (with optional expiration)
 * POST /api/backend/sharing/public
 */
export async function createPublicShare(
  payload: CreatePublicSharePayload,
  token?: string
): Promise<{ message: string; publicToken: string; share: any }> {
  const response = await fetch("/api/backend/sharing/public", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(response, "Failed to create public link");
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Access a public share by token (unauthenticated)
 * GET /api/backend/sharing/public/:token
 */
export async function getPublicShare(token: string): Promise<PublicShareResult> {
  const response = await fetch(`/api/backend/sharing/public/${token}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(response, "This public link is invalid or has expired");
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Revoke a public sharing link
 * DELETE /api/backend/sharing/public/:token
 */
export async function revokePublicShare(token: string, userToken?: string): Promise<{ message: string }> {
  const response = await fetch(`/api/backend/sharing/public/${token}`, {
    method: "DELETE",
    headers: getHeaders(userToken),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(response, "Failed to revoke public link");
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Fetch files and folders shared WITH the current user
 * GET /api/backend/sharing/received
 */
export async function getReceivedShares(
  token?: string,
  params?: { page?: number; limit?: number; pageSize?: number },
): Promise<ReceivedShare[]> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.pageSize || params?.limit) {
    query.append("limit", (params.pageSize || params.limit)!.toString());
  }
  const qs = query.toString();
  const url = qs ? `/api/backend/sharing/received?${qs}` : "/api/backend/sharing/received";

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(response, "Failed to load received shares");
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.shares || data.items || data.data || [];
}

/**
 * Fetch files and folders shared BY the current user
 * GET /api/backend/sharing/sent
 */
export async function getSentShares(
  token?: string,
  params?: { page?: number; limit?: number; pageSize?: number },
): Promise<SentShare[]> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.pageSize || params?.limit) {
    query.append("limit", (params.pageSize || params.limit)!.toString());
  }
  const qs = query.toString();
  const url = qs ? `/api/backend/sharing/sent?${qs}` : "/api/backend/sharing/sent";

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(response, "Failed to load sent shares");
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.shares || data.items || data.data || [];
}

/**
 * Update permission (VIEW <-> EDIT) for a share
 * PATCH /api/backend/sharing/:shareId
 */
export async function updateSharePermission(
  shareId: string,
  payload: UpdateSharePayload,
  token?: string
): Promise<ShareResponse> {
  const response = await fetch(`/api/backend/sharing/${shareId}`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(response, "Failed to update permission");
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Revoke a share
 * DELETE /api/backend/sharing/:shareId
 */
export async function revokeShare(
  shareId: string,
  token?: string
): Promise<RevokeResponse> {
  const response = await fetch(`/api/backend/sharing/${shareId}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(response, "Failed to revoke share");
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Check permission level on a file (OWNER, VIEW, EDIT)
 * GET /api/backend/sharing/files/:fileId
 */
export async function getFileAccess(
  fileId: string,
  token?: string
): Promise<FileAccessResult> {
  const response = await fetch(`/api/backend/sharing/files/${fileId}`, {
    method: "GET",
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(response, "You do not have access to this file");
    throw new Error(errorMsg);
  }

  return response.json();
}
