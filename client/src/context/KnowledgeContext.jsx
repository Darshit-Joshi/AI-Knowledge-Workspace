import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { ingestionService } from "../services/api";
import { useWorkspace } from "./WorkspaceContext";

const KnowledgeContext = createContext(null);

export const KnowledgeProvider = ({ children }) => {
  const { activeWorkspace } = useWorkspace();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);

  // Fetch all knowledge base documents for the active workspace
  const fetchDocuments = useCallback(
    async (silent = false) => {
      if (!activeWorkspace) {
        setDocuments([]);
        return;
      }
      try {
        if (!silent) setIsLoading(true);
        setError(null);
        const data = await ingestionService.listDocuments(activeWorkspace.id);
        setDocuments(data);
      } catch (err) {
        if (!silent) setError(err.message);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [activeWorkspace],
  );

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Automated Polling: Check status every 4 seconds if any document is processing
  useEffect(() => {
    const hasPendingDocs = documents.some((doc) =>
      ["PENDING", "PROCESSING"].includes(doc.status),
    );

    if (hasPendingDocs && !pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(() => {
        fetchDocuments(true); // Silent background poll
      }, 4000);
    } else if (!hasPendingDocs && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [documents, fetchDocuments]);

  // Matches UploadFile = File(...) -> returns DocumentResponse (status: PENDING)
  const uploadFile = async (file) => {
    if (!activeWorkspace) throw new Error("No active workspace selected.");
    try {
      setIsUploading(true);
      setError(null);
      const newDoc = await ingestionService.uploadFile(
        activeWorkspace.id,
        file,
      );
      setDocuments((prev) => [newDoc, ...prev]);
      return newDoc;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  // Matches WebIngestionRequest: { url, title? }
  const ingestWebUrl = async (payload) => {
    if (!activeWorkspace) throw new Error("No active workspace selected.");
    try {
      setError(null);
      const newDoc = await ingestionService.ingestWeb(
        activeWorkspace.id,
        payload,
      );
      setDocuments((prev) => [newDoc, ...prev]);
      return newDoc;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Matches YouTubeIngestionRequest: { url, title? }
  const ingestYouTubeVideo = async (payload) => {
    if (!activeWorkspace) throw new Error("No active workspace selected.");
    try {
      setError(null);
      const newDoc = await ingestionService.ingestYouTube(
        activeWorkspace.id,
        payload,
      );
      setDocuments((prev) => [newDoc, ...prev]);
      return newDoc;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteDocument = async (documentId) => {
    if (!activeWorkspace) return;
    try {
      setError(null);
      await ingestionService.deleteDocument(activeWorkspace.id, documentId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    documents,
    isLoading,
    isUploading,
    error,
    uploadFile,
    ingestWebUrl,
    ingestYouTubeVideo,
    deleteDocument,
    refreshDocuments: () => fetchDocuments(false),
    clearError: () => setError(null),
  };

  return (
    <KnowledgeContext.Provider value={value}>
      {children}
    </KnowledgeContext.Provider>
  );
};

export const useKnowledge = () => {
  const context = useContext(KnowledgeContext);
  if (!context) {
    throw new Error("useKnowledge must be used within a KnowledgeProvider");
  }
  return context;
};
