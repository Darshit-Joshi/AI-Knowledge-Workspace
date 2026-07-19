import React, { useState } from "react";

export default function CitationDrawer({ citations }) {
  const [isOpen, setIsOpen] = useState(false);

  if (
    !citations ||
    typeof citations !== "object" ||
    Object.keys(citations).length === 0
  ) {
    return null;
  }

  // Handle both array and dictionary structured JSON citations
  const citationList = Array.isArray(citations)
    ? citations
    : Object.entries(citations).map(([key, val]) => ({ id: key, ...val }));

  return (
    <div className="mt-3 border-t border-slate-800/80 pt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-400 hover:text-blue-300 transition focus:outline-none"
      >
        <span>{isOpen ? "▼" : "►"}</span>
        <span>Verified Grounding Sources ({citationList.length})</span>
      </button>

      {isOpen && (
        <div className="mt-2.5 grid gap-2 animate-in fade-in duration-150">
          {citationList.map((cite, idx) => (
            <div
              key={cite.id || idx}
              className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-medium text-slate-200 truncate">
                  <span>📄</span>
                  <span
                    className="truncate"
                    title={
                      cite.title || cite.document_title || "Retrieved Document"
                    }
                  >
                    {cite.title || cite.document_title || `Source #${idx + 1}`}
                  </span>
                </div>
                {cite.score && (
                  <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400 flex-shrink-0">
                    {Math.round(cite.score * 100)}% Match
                  </span>
                )}
              </div>

              {cite.chunk_text && (
                <p className="text-[11px] text-slate-400 font-mono bg-slate-900/40 p-2 rounded border border-slate-800/40 line-clamp-3 leading-relaxed">
                  "{cite.chunk_text}"
                </p>
              )}

              {cite.source_url && (
                <a
                  href={cite.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:underline truncate max-w-full"
                >
                  <span>🔗</span> {cite.source_url}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
