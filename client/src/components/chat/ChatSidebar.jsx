import React, { useState } from "react";
import { useChat } from "../../context/ChatContext";
import { useWorkspace } from "../../context/WorkspaceContext";

export default function ChatSidebar({
  onNavigateBack,
  onNavigateToKnowledge,
  onNavigateToReports,
}) {
  const { activeWorkspace } = useWorkspace();
  const {
    sessions,
    activeSession,
    createSession,
    selectSession,
    deleteSession,
    isLoading,
  } = useChat();
  const [isCreating, setIsCreating] = useState(false);

  const handleNewChat = async () => {
    try {
      setIsCreating(true);
      await createSession("New RAG Conversation");
    } catch (err) {
      console.error("Failed to create chat:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <aside className="w-72 bg-slate-900/60 border-r border-slate-800/80 flex flex-col h-full flex-shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800/80 space-y-3">
        <button
          onClick={onNavigateBack}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
        >
          ← Exit to Workspaces
        </button>

        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 truncate">
          <span>📁</span>
          <span className="truncate">
            {activeWorkspace?.name || "Workspace"}
          </span>
        </div>

        <button
          onClick={handleNewChat}
          disabled={isCreating}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>+</span> {isCreating ? "Provisioning..." : "New Chat Session"}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="px-4 py-2 border-b border-slate-800/80 flex gap-1 text-[11px] font-medium text-slate-400">
        <button
          onClick={onNavigateToKnowledge}
          className="flex-1 py-1 px-2 rounded hover:bg-slate-800/60 hover:text-slate-200 transition text-center"
        >
          📚 Knowledge Base
        </button>
        <button
          onClick={onNavigateToReports}
          className="flex-1 py-1 px-2 rounded hover:bg-slate-800/60 hover:text-slate-200 transition text-center"
        >
          📑 AI Reports
        </button>
      </div>

      {/* Sessions Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-1 tracking-wider">
          Recent Conversations
        </div>

        {isLoading && sessions.length === 0 ? (
          <div className="space-y-2 animate-pulse px-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-9 bg-slate-800/40 rounded-lg" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 px-4">
            No chat history yet. Start a conversation to query your documents.
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = activeSession?.id === s.id;
            return (
              <div
                key={s.id}
                onClick={() => selectSession(s)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  <span>💬</span>
                  <span className="truncate" title={s.title}>
                    {s.title}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(s.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded transition flex-shrink-0"
                  title="Delete chat session"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
