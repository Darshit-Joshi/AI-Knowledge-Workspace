import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { workspaceService } from "../services/api";
import { useAuth } from "./AuthContext";

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all workspaces owned by the authenticated user
  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await workspaceService.list(); // Hits GET /workspaces
      setWorkspaces(data);

      // Restore active workspace from localStorage or default to the first one
      const savedWorkspaceId = localStorage.getItem("active_workspace_id");
      if (
        savedWorkspaceId &&
        data.some((w) => w.id === Number(savedWorkspaceId))
      ) {
        const found = data.find((w) => w.id === Number(savedWorkspaceId));
        setActiveWorkspace(found);
      } else if (data.length > 0) {
        selectWorkspace(data[0]);
      } else {
        setActiveWorkspace(null);
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setActiveWorkspace(null);
      localStorage.removeItem("active_workspace_id");
    }
  }, [isAuthenticated, fetchWorkspaces]);

  // Set active workspace and persist ID in localStorage
  const selectWorkspace = (workspace) => {
    if (!workspace) {
      setActiveWorkspace(null);
      localStorage.removeItem("active_workspace_id");
      return;
    }
    setActiveWorkspace(workspace);
    localStorage.setItem("active_workspace_id", workspace.id);
  };

  // Matches WorkspaceCreate schema: { name, description }
  const createWorkspace = async (payload) => {
    try {
      setError(null);
      const newWorkspace = await workspaceService.create(payload); // Hits POST /workspaces
      setWorkspaces((prev) => [newWorkspace, ...prev]);
      selectWorkspace(newWorkspace);
      return newWorkspace;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Matches WorkspaceUpdate schema: { name?, description? }
  const updateWorkspace = async (id, payload) => {
    try {
      setError(null);
      const updated = await workspaceService.update(id, payload); // Hits PUT /workspaces/{id}
      setWorkspaces((prev) => prev.map((w) => (w.id === id ? updated : w)));
      if (activeWorkspace?.id === id) {
        setActiveWorkspace(updated);
      }
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Triggers backend cascade deletion (wiping documents, chats, and vector embeddings)
  const deleteWorkspace = async (id) => {
    try {
      setError(null);
      await workspaceService.delete(id); // Hits DELETE /workspaces/{id}
      const remaining = workspaces.filter((w) => w.id !== id);
      setWorkspaces(remaining);

      if (activeWorkspace?.id === id) {
        if (remaining.length > 0) {
          selectWorkspace(remaining[0]);
        } else {
          selectWorkspace(null);
        }
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    workspaces,
    activeWorkspace,
    isLoading,
    error,
    selectWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    refreshWorkspaces: fetchWorkspaces,
    clearError: () => setError(null),
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
