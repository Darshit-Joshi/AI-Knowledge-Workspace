import React from "react";
import CitationDrawer from "./CitationDrawer";

export default function ChatMessage({ message, isStreaming = false }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 my-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs text-white flex-shrink-0 shadow-md shadow-blue-600/10 mt-0.5">
          AI
        </div>
      )}

      <div
        className={`max-w-3xl rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-none font-normal"
            : "bg-slate-900/90 border border-slate-800/80 text-slate-100 rounded-tl-none"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-blue-400 ml-1 animate-pulse align-middle" />
          )}
        </div>

        {/* Display citations only for verified assistant outputs */}
        {!isUser && message.citations && (
          <CitationDrawer citations={message.citations} />
        )}

        <div
          className={`mt-2 text-[10px] select-none ${isUser ? "text-blue-200 text-right" : "text-slate-500"}`}
        >
          {isStreaming
            ? "Synthesizing verified tokens..."
            : new Date(message.created_at || Date.now()).toLocaleTimeString()}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300 flex-shrink-0 mt-0.5">
          YOU
        </div>
      )}
    </div>
  );
}
