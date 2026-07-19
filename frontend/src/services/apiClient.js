// Base API endpoint matching your FastAPI setup
const BASE_URL = "http://localhost:8000/api/v1";

/**
 * Helper to retrieve stored JWT access tokens
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem("akw_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * 1. WORKSPACE & SOURCE INGESTION SERVICES
 */
export const uploadDocument = async (workspaceId, file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("workspace_id", workspaceId);

  const response = await fetch(`${BASE_URL}/sources/upload`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
  });

  if (!response.ok) throw new Error("File ingestion failed");
  return await response.json();
};

export const importUrlKnowledge = async (workspaceId, url, type = "web") => {
  const response = await fetch(`${BASE_URL}/sources/import-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ workspace_id: workspaceId, url, source_type: type }),
  });

  if (!response.ok) throw new Error("URL scraping failed");
  return await response.json();
};

/**
 * 2. MULTI-AGENT CHAT STREAMING SERVICE (Server-Sent Events)
 * This connects directly to your FastAPI StreamingResponse endpoint
 */
export const streamAgenticChat = (
  workspaceId,
  query,
  onToken,
  onAgentStep,
  onComplete,
  onError,
) => {
  const url = `${BASE_URL}/chat/stream?workspace_id=${workspaceId}&query=${encodeURIComponent(query)}`;

  const eventSource = new EventSource(url, {
    headers: { ...getAuthHeaders() },
  });

  // Handle live LLM text token streaming
  eventSource.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.token) {
      onToken(data.token);
    }
  });

  // Handle multi-agent status updates (e.g. "Retrieval Agent querying Qdrant...")
  eventSource.addEventListener("agent_status", (event) => {
    const data = JSON.parse(event.data);
    onAgentStep(data.step_index, data.label);
  });

  // Handle final response grounding & citations
  eventSource.addEventListener("complete", (event) => {
    const data = JSON.parse(event.data);
    onComplete(data.citations, data.confidence);
    eventSource.close();
  });

  eventSource.onerror = (err) => {
    onError("Connection lost to AI Knowledge Workspace backend.");
    eventSource.close();
  };

  return () => eventSource.close(); // Return cleanup function
};
