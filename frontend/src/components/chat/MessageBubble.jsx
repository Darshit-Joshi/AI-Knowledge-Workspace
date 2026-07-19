import React from "react";
import {
  ShieldCheckIcon,
  ExternalLinkIcon,
  BotIcon,
  UserIcon,
} from "lucide-react";

export default function MessageBubble({ message, onSelectCitation }) {
  const isAi = message.sender === "ai";

  return (
    <div
      className={`flex gap-3.5 ${isAi ? "bg-[#0a1424]/80 p-4 rounded-2xl border border-[#162947]" : "bg-[#0e1a30]/60 p-3.5 rounded-xl border border-[#1a2f52]/50 ml-8"}`}
    >
      {/* Avatar */}
      <div
        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
          isAi
            ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 shadow-cyan-500/20"
            : "bg-slate-700 text-slate-200"
        }`}
      >
        {isAi ? <BotIcon size={16} /> : <UserIcon size={16} />}
      </div>

      {/* Message Content */}
      <div className="space-y-2.5 flex-1 overflow-hidden">
        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
          {message.text}
        </p>

        {/* Citations & Confidence Footer */}
        {isAi && (message.citations || message.confidence) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#162947]/60 mt-2">
            {/* Confidence Badge */}
            {message.confidence && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md shadow-sm">
                <ShieldCheckIcon size={12} /> Verification: {message.confidence}
                % Grounded
              </span>
            )}

            {/* Clickable Citation Pills */}
            {message.citations &&
              message.citations.map((citation, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectCitation(citation)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 px-2.5 py-0.5 rounded-md transition cursor-pointer group shadow-sm"
                >
                  <span>
                    [{idx + 1}] {citation}
                  </span>
                  <ExternalLinkIcon
                    size={10}
                    className="opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
