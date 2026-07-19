import React from "react";

export default function DocumentCard({ document, onDelete }) {
  // Map backend SourceType enums to visual iconography
  const getSourceIcon = (type) => {
    switch (type) {
      case "YOUTUBE":
        return {
          icon: "📺",
          label: "YouTube",
          color: "bg-red-950 text-red-400 border-red-800/60",
        };
      case "WEB":
        return {
          icon: "🌐",
          label: "Website",
          color: "bg-blue-950 text-blue-400 border-blue-800/60",
        };
      case "PDF":
        return {
          icon: "📄",
          label: "PDF Document",
          color: "bg-orange-950 text-orange-400 border-orange-800/60",
        };
      default:
        return {
          icon: "📝",
          label: type,
          color: "bg-slate-800 text-slate-300 border-slate-700",
        };
    }
  };

  // Map backend DocumentStatus enums to visual indicators
  const getStatusBadge = (status, errorMessage) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Ready for RAG
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950 text-amber-400 border border-amber-800/60 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            Embedding...
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-950 text-blue-400 border border-blue-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>In
            Queue
          </span>
        );
      case "FAILED":
        return (
          <span
            title={errorMessage || "Worker extraction failed"}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-red-950 text-red-400 border border-red-800/60 cursor-help"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>Failed
            (Hover)
          </span>
        );
      default:
        return null;
    }
  };

  const sourceMeta = getSourceIcon(document.source_type);

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4 hover:bg-slate-900/80 transition">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="text-2xl flex-shrink-0">{sourceMeta.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h5
              className="font-medium text-slate-200 text-sm truncate"
              title={document.title}
            >
              {document.title}
            </h5>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase border ${sourceMeta.color}`}
            >
              {sourceMeta.label}
            </span>
          </div>
          <p
            className="text-[11px] text-slate-500 truncate mt-0.5 font-mono"
            title={document.source_url_or_path}
          >
            {document.source_url_or_path}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {getStatusBadge(document.status, document.error_message)}
        <button
          onClick={() => onDelete(document.id)}
          title="Delete document and remove vector embeddings"
          className="text-slate-500 hover:text-red-400 hover:bg-slate-800 p-1.5 rounded transition text-xs"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
