import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Create core Axios instance for standard JSON and Multipart requests
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Inject JWT Bearer token into Authorization headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Handle global errors and session expiration
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired credentials and trigger app-wide auth reset
      localStorage.removeItem("access_token");
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "An unexpected API error occurred.";
    return Promise.reject(new Error(errorMessage));
  },
);

// --- Domain Services ---

export const authService = {
  // Matches UserCreate schema -> returns UserResponse
  register: (data) => api.post("/auth/register", data),
  // Matches UserLogin schema -> returns Token { access_token, token_type }
  login: (data) => api.post("/auth/login", data),
  // Matches get_current_user dependency -> returns UserResponse
  getMe: () => api.get("/auth/me"),
};

export const workspaceService = {
  // Matches WorkspaceCreate -> returns WorkspaceResponse
  create: (data) => api.post("/workspaces", data),
  list: () => api.get("/workspaces"),
  getById: (id) => api.get(`/workspaces/${id}`),
  // Matches WorkspaceUpdate -> returns WorkspaceResponse
  update: (id, data) => api.put(`/workspaces/${id}`, data),
  delete: (id) => api.delete(`/workspaces/${id}`),
};

export const ingestionService = {
  // Multipart upload matching UploadFile = File(...) in /workspaces/{id}/ingest/file
  uploadFile: (workspaceId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/workspaces/${workspaceId}/ingest/file`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  // Matches WebIngestionRequest -> returns DocumentResponse
  ingestWeb: (workspaceId, data) =>
    api.post(`/workspaces/${workspaceId}/ingest/web`, data),
  // Matches YouTubeIngestionRequest -> returns DocumentResponse
  ingestYouTube: (workspaceId, data) =>
    api.post(`/workspaces/${workspaceId}/ingest/youtube`, data),

  listDocuments: (workspaceId) =>
    api.get(`/workspaces/${workspaceId}/documents`),
  deleteDocument: (workspaceId, documentId) =>
    api.delete(`/workspaces/${workspaceId}/documents/${documentId}`),
};

export const reportService = {
  // Matches ReportGenerateRequest -> returns ReportResponse (status: GENERATING)
  generate: (workspaceId, data) =>
    api.post(`/workspaces/${workspaceId}/reports`, data),
  list: (workspaceId) => api.get(`/workspaces/${workspaceId}/reports`),
  getById: (workspaceId, reportId) =>
    api.get(`/workspaces/${workspaceId}/reports/${reportId}`),
  delete: (workspaceId, reportId) =>
    api.delete(`/workspaces/${workspaceId}/reports/${reportId}`),
};

export const chatService = {
  // Matches ChatSessionCreate -> returns ChatSessionResponse
  createSession: (workspaceId, data = {}) =>
    api.post(`/workspaces/${workspaceId}/chats`, data),
  listSessions: (workspaceId) => api.get(`/workspaces/${workspaceId}/chats`),
  // Returns ChatSessionResponse with selectinload messages
  getSessionHistory: (workspaceId, sessionId) =>
    api.get(`/workspaces/${workspaceId}/chats/${sessionId}`),
  deleteSession: (workspaceId, sessionId) =>
    api.delete(`/workspaces/${workspaceId}/chats/${sessionId}`),

  /**
   * Native fetch SSE adapter for LangGraph real-time streaming.
   * Matches live_agent_stream_generator yielding data: {"type": "...", "content": "..."}
   */
  streamMessage: async (
    workspaceId,
    sessionId,
    content,
    onEvent,
    onError,
    onClose,
  ) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await fetch(
        `${BASE_URL}/workspaces/${workspaceId}/chats/${sessionId}/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }), // Matches ChatMessageCreate schema
        },
      );

      if (!response.ok) {
        const errData = await response
          .json()
          .catch(() => ({ detail: "Stream request failed" }));
        throw new Error(errData.detail || `HTTP Error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // Keep incomplete chunks in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") {
              onClose();
              return;
            }
            try {
              const parsedEvent = JSON.parse(dataStr);
              onEvent(parsedEvent); // Parses type: "status" | "token" | "citations"
            } catch (e) {
              console.error("Error parsing SSE chunk:", e);
            }
          }
        }
      }
      onClose();
    } catch (error) {
      onError(error);
    }
  },
};

export default api;
