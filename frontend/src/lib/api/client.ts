import supabase from "../supabase/client";

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    // In local development, frontend (port 3001) connects to backend API on port 5000
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5000/api/v1";
    }
    // On unified production single-domain deployment, relative URL /api/v1 connects directly
    return "/api/v1";
  }
  return "http://localhost:5000/api/v1";
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  } catch (err) {
    console.warn("Could not retrieve Supabase session:", err);
  }

  return null;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers = {}, ...rest } = options;
  const apiBase = getApiBaseUrl();

  let url = `${apiBase}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs;
    }
  }

  const token = await getAuthToken();
  const reqHeaders = new Headers(headers);

  if (token && !reqHeaders.has("Authorization")) {
    reqHeaders.set("Authorization", `Bearer ${token}`);
  }

  // Set Content-Type only if not sending FormData
  if (!(rest.body instanceof FormData) && !reqHeaders.has("Content-Type")) {
    reqHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...rest,
    headers: reqHeaders,
    credentials: "same-origin",
  });

  let responseData: any = null;
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    // On 401, sign out and redirect to login on client-side (only if not already on /login or /register)
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login" &&
      window.location.pathname !== "/register"
    ) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore background signout error
      }
      window.location.href = `/login?redirect=${encodeURIComponent(
        window.location.pathname + window.location.search
      )}`;
    }

    const errorMessage =
      (responseData && responseData.message) ||
      `API error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  // Unwrap standardized backend envelope { success: true, data: ... }
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return responseData.data as T;
  }

  return responseData as T;
}

export const api = {
  auth: {
    getMe: () => apiRequest("/auth/me"),
    register: (data: { email: string; password: string; fullName: string }) =>
      apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    sendOtp: (data: { email: string; fullName?: string }) =>
      apiRequest("/auth/otp/send", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    verifyOtp: (data: { email: string; token: string }) =>
      apiRequest("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    forgotPassword: (data: { email: string }) =>
      apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    resetPassword: (data: { email: string; token: string; password: string }) =>
      apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateMe: (data: { fullName?: string; phone?: string; avatarUrl?: string | null }) =>
      apiRequest("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
    updateUserRole: (userId: string, role: "USER" | "ADMIN") =>
      apiRequest(`/auth/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    updateUserStatus: (userId: string, isBlocked: boolean) =>
      apiRequest(`/auth/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isBlocked }),
      }),
    establishSession: (data: { code?: string; accessToken?: string; refreshToken?: string }) =>
      apiRequest("/auth/session", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  profile: {
    get: () => apiRequest("/profile", { method: "GET" }),
    uploadAvatar: (formData: FormData) =>
      apiRequest<{ avatarUrl: string }>("/profile/avatar", {
        method: "POST",
        body: formData,
      }),
    removeAvatar: () =>
      apiRequest<{ avatarUrl: null }>("/profile/avatar", {
        method: "DELETE",
      }),
  },

  requests: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
      apiRequest("/requests", { method: "GET", params }),
    getById: (id: string) => apiRequest(`/requests/${id}`, { method: "GET" }),
    create: (formData: FormData) =>
      apiRequest("/requests", { method: "POST", body: formData }),
    updateStatus: (
      id: string,
      statusOrData: string | { status?: string; isDownloadUnlocked?: boolean }
    ) =>
      apiRequest(`/requests/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(
          typeof statusOrData === "string" ? { status: statusOrData } : statusOrData
        ),
      }),
    cancel: (id: string) => apiRequest(`/requests/${id}/cancel`, { method: "PATCH" }),
    delete: (id: string) => apiRequest(`/requests/${id}`, { method: "DELETE" }),
  },

  quotations: {
    getByRequest: (requestId: string) =>
      apiRequest(`/quotations/request/${requestId}`, { method: "GET" }),
    create: (data: {
      requestId: string;
      totalAmount: number;
      terms?: string;
      estimatedDays?: number;
    }) =>
      apiRequest("/quotations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    accept: (id: string) =>
      apiRequest(`/quotations/${id}/accept`, { method: "POST" }),
    reject: (id: string, rejectionReason?: string) =>
      apiRequest(`/quotations/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ rejectionReason }),
      }),
  },

  payments: {
    createOrder: (data: {
      requestId: string;
      quotationId?: string;
      milestone: "ADVANCE_50" | "FINAL_50";
    }) =>
      apiRequest("/payments/create-order", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    verify: (data: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) =>
      apiRequest("/payments/verify", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    complete: (data: {
      requestId: string;
      milestone: "ADVANCE_50" | "FINAL_50";
      transactionId?: string;
    }) =>
      apiRequest("/payments/complete", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    myHistory: () => apiRequest("/payments/my-history", { method: "GET" }),
    adminList: () => apiRequest("/payments/admin/all", { method: "GET" }),
  },

  documents: {
    getByRequest: (requestId: string) =>
      apiRequest(`/documents/request/${requestId}`, { method: "GET" }),
    upload: (requestId: string, formData: FormData) =>
      apiRequest(`/documents/${requestId}/upload`, {
        method: "POST",
        body: formData,
      }),
    getDownloadUrl: (documentId: string) =>
      `${getApiBaseUrl()}/documents/${documentId}/download`,
    getDownloadInfo: (documentId: string) =>
      apiRequest<{ downloadUrl: string; fileName: string; mimeType: string }>(
        `/documents/${documentId}/download`,
        { method: "GET" }
      ),
    delete: (documentId: string) =>
      apiRequest(`/documents/${documentId}`, { method: "DELETE" }),
  },

  chat: {
    getUnreadCount: () =>
      apiRequest<{ unreadCount: number }>("/chat/unread-count", { method: "GET" }),
    getMessages: (requestId: string, params?: { page?: number; limit?: number }) =>
      apiRequest(`/chat/${requestId}/messages`, { method: "GET", params }),
    postMessage: (requestId: string, formDataOrBody: FormData | { content: string; messageType?: string; metadata?: any }) => {
      if (formDataOrBody instanceof FormData) {
        return apiRequest(`/chat/${requestId}/messages`, {
          method: "POST",
          body: formDataOrBody,
        });
      }
      return apiRequest(`/chat/${requestId}/messages`, {
        method: "POST",
        body: JSON.stringify(formDataOrBody),
      });
    },
    markRead: (requestId: string) =>
      apiRequest(`/chat/${requestId}/read`, { method: "PATCH" }),
    deleteMessage: (
      requestId: string,
      messageId: string,
      type: "for_me" | "for_everyone" = "for_me"
    ) =>
      apiRequest(`/chat/${requestId}/messages/${messageId}?type=${type}`, {
        method: "DELETE",
      }),
    clearChat: (requestId: string) =>
      apiRequest(`/chat/${requestId}/clear`, { method: "POST" }),
  },

  admin: {
    getDashboardStats: () => apiRequest("/admin/dashboard/stats", { method: "GET" }),
    getAuditLogs: (params?: { page?: number; limit?: number }) =>
      apiRequest("/admin/audit-logs", { method: "GET", params }),
  },
};

export default api;
