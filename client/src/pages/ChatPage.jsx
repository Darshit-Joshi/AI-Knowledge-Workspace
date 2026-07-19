import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import { useWorkspace } from "../context/WorkspaceContext";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatMessage from "../components/chat/ChatMessage";
import AgentProgressBadge from "../components/chat/AgentProgressBadge";

export default function ChatPage({
  onNavigateBack,
  onNavigateToKnowledge,
  onNavigateToReports,
}) {
  const { activeWorkspace } = useWorkspace();
  const {
    activeSession,
    messages,
    isStreaming,
    streamingContent,
    currentAgentStep,
    liveCitations,
    sendMessage,
    createSession,
  } = useChat();

  const [inputQuery, setInputQuery] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom as new tokens arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, currentAgentStep]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || isStreaming) return;

    const query = inputQuery;
    setInputQuery("");

    // If no session exists, auto-create one before sending
    if (!activeSession) {
      await createSession(query.slice(0, 40) + "...");
    }
    await sendMessage(query);
  };

  if (!activeWorkspace) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
        <h3 className="text-lg font-semibold">No Workspace Active</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Please select a workspace before entering the chat studio.
        </p>
        <button
          onClick={onNavigateBack}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Sidebar Navigation */}
      <ChatSidebar
        onNavigateBack={onNavigateBack}
        onNavigateToKnowledge={onNavigateToKnowledge}
        onNavigateToReports={onNavigateToReports}
      />

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-base">💬</span>
            <h2 className="font-semibold text-sm text-slate-200 truncate">
              {activeSession ? activeSession.title : "New Conversation"}
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
            Model: LangGraph RAG Actor-Critic
          </span>
        </header>

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2 max-w-4xl w-full mx-auto">
          {messages.length === 0 && !isStreaming ? (
            <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-8 my-8">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-xl">
                🤖
              </div>
              <h3 className="text-base font-semibold text-slate-200">
                Query your Knowledge Base
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                Ask analytical questions, request comparisons, or synthesize
                concepts. The agent team will query Qdrant vectors and
                self-critique before answering.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "Summarize key takeaways from uploaded PDFs",
                  "Compare concepts across multiple sources",
                  "Explain hallucination reduction techniques",
                ].map((hint, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputQuery(hint)}
                    className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-full transition"
                  >
                    "{hint}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {/* Render live generating assistant bubble */}
              {isStreaming && (
                <ChatMessage
                  message={{
                    role: "assistant",
                    content: streamingContent || "...",
                    citations: liveCitations,
                  }}
                  isStreaming={true}
                />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Agent Progress Badge */}
        {isStreaming && currentAgentStep && (
          <div className="absolute bottom-24 left-0 right-0 pointer-events-none px-6 z-10">
            <AgentProgressBadge step={currentAgentStep} />
          </div>
        )}

        {/* Sticky Input Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950 flex-shrink-0">
          <form
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto relative flex items-center"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isStreaming}
              placeholder={
                isStreaming
                  ? "Agent team is synthesizing response..."
                  : "Ask a question against your uploaded PDFs, notes, and web transcripts..."
              }
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-4 pr-24 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isStreaming}
              className="absolute right-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-4 py-2 rounded-lg text-xs transition duration-150 flex items-center gap-1 shadow-sm"
            >
              <span>{isStreaming ? "⏳" : "➤"}</span>
              <span>{isStreaming ? "Thinking" : "Send"}</span>
            </button>
          </form>
          <div className="text-center text-[10px] text-slate-500 mt-2">
            AI answers are grounded in retrieved vector embeddings using hybrid
            search & reranking.
          </div>
        </div>
      </main>
    </div>
  );
}
