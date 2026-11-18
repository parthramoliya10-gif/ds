import supabase from "../supabase/client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

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

  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

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
    credentials: "include",
  });

  let responseData: any = null;
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    // On 401, sign out and redirect to login on client-side
    if (response.status === 401 && typeof window !== "undefined") {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore background signout error
      }
      if (window.location.pathname !== "/login") {
        window.location.href = `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`;
      }
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
    updateMe: (data: { fullName?: string; phone?: string; avatarUrl?: string }) =>
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
  },

  requests: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
      apiRequest("/requests", { method: "GET", params }),
    getById: (id: string) => apiRequest(`/requests/${id}`, { method: "GET" }),
    create: (formData: FormData) =>
      apiRequest("/requests", { method: "POST", body: formData }),
    updateStatus: (id: string, status: string) =>
      apiRequest(`/requests/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    cancel: (id: string) => apiRequest(`/requests/${id}`, { method: "DELETE" }),
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
      quotationId: string;
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
      `${API_BASE_URL}/documents/${documentId}/download`,
  },

  chat: {
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
  },

  admin: {
    getDashboardStats: () => apiRequest("/admin/dashboard/stats", { method: "GET" }),
    getAuditLogs: (params?: { page?: number; limit?: number }) =>
      apiRequest("/admin/audit-logs", { method: "GET", params }),
  },
};

export default api;
