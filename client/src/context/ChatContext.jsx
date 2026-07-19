import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { chatService } from "../services/api";
import { useWorkspace } from "./WorkspaceContext";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { activeWorkspace } = useWorkspace();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  // Live SSE streaming states
  const [streamingContent, setStreamingContent] = useState("");
  const [currentAgentStep, setCurrentAgentStep] = useState(null); // { node, message }
  const [liveCitations, setLiveCitations] = useState(null);

  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;

  // Fetch all chat sessions for the active workspace
  const fetchSessions = useCallback(async () => {
    if (!activeWorkspace) {
      setSessions([]);
      setActiveSession(null);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await chatService.listSessions(activeWorkspace.id);
      setSessions(data);

      if (data.length > 0) {
        // Restore last active session or select the most recent
        const savedSessionId = localStorage.getItem("active_chat_session_id");
        const found =
          data.find((s) => s.id === Number(savedSessionId)) || data[0];
        selectSession(found);
      } else {
        setActiveSession(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Load message history using selectinload backend query
  const selectSession = async (session) => {
    if (!session || !activeWorkspace) {
      setActiveSession(null);
      setMessages([]);
      localStorage.removeItem("active_chat_session_id");
      return;
    }
    try {
      setActiveSession(session);
      localStorage.setItem("active_chat_session_id", session.id);
      setError(null);
      const historyData = await chatService.getSessionHistory(
        activeWorkspace.id,
        session.id,
      );
      setMessages(historyData.messages || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Matches ChatSessionCreate: { title }
  const createSession = async (title = null) => {
    if (!activeWorkspace) throw new Error("No active workspace selected.");
    try {
      setError(null);
      const newSession = await chatService.createSession(activeWorkspace.id, {
        title: title || "New RAG Conversation",
      });
      setSessions((prev) => [newSession, ...prev]);
      selectSession(newSession);
      return newSession;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteSession = async (sessionId) => {
    if (!activeWorkspace) return;
    try {
      setError(null);
      await chatService.deleteSession(activeWorkspace.id, sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);

      if (activeSession?.id === sessionId) {
        if (remaining.length > 0) {
          selectSession(remaining[0]);
        } else {
          setActiveSession(null);
          setMessages([]);
          localStorage.removeItem("active_chat_session_id");
        }
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Dispatch message and process LangGraph SSE stream events
  const sendMessage = async (content) => {
    if (!activeWorkspace || !activeSession) return;
    if (!content.trim() || isStreaming) return;

    // 1. Optimistically append user message to local feed
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      session_id: activeSession.id,
      role: "user",
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // 2. Initialize streaming buffers
    setIsStreaming(true);
    setStreamingContent("");
    setCurrentAgentStep({
      node: "query_expander",
      message: "Initializing agent graph...",
    });
    setLiveCitations(null);
    setError(null);

    let accumulatedText = "";
    let capturedCitations = null;

    try {
      await chatService.streamMessage(
        activeWorkspace.id,
        activeSession.id,
        content.trim(),
        // onEvent handler matching FastAPI live_agent_stream_generator yields
        (event) => {
          if (event.type === "status") {
            setCurrentAgentStep({ node: event.node, message: event.message });
          } else if (event.type === "citations") {
            capturedCitations = event.content;
            setLiveCitations(event.content);
          } else if (event.type === "token") {
            accumulatedText += event.content;
            setStreamingContent((prev) => prev + event.content);
          }
        },
        // onError handler
        (err) => {
          console.error("Stream error:", err);
          setError(err.message || "Stream disconnected unexpectedly.");
          setIsStreaming(false);
        },
        // onClose handler [DONE]
        () => {
          setIsStreaming(false);
          setCurrentAgentStep(null);

          // Commit completed assistant response to static message feed
          if (accumulatedText.trim()) {
            const finalAssistantMsg = {
              id: `msg-${Date.now()}`,
              session_id: activeSessionRef.current?.id,
              role: "assistant",
              content: accumulatedText.trim(),
              citations: capturedCitations,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, finalAssistantMsg]);
          }
          setStreamingContent("");
          setLiveCitations(null);
        },
      );
    } catch (err) {
      setError(err.message);
      setIsStreaming(false);
    }
  };

  const value = {
    sessions,
    activeSession,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    currentAgentStep,
    liveCitations,
    error,
    createSession,
    selectSession,
    deleteSession,
    sendMessage,
    clearError: () => setError(null),
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
