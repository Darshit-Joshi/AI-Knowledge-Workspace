import React from "react";

export default function ReportCard({ report, isActive, onSelect, onDelete }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
            Completed
          </span>
        );
      case "GENERATING":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-400 border border-blue-800/60 animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            Synthesizing...
          </span>
        );
      case "FAILED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950 text-red-400 border border-red-800/60">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={() => onSelect(report)}
      className={`group cursor-pointer p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
        isActive
          ? "bg-slate-900 border-blue-500/80 shadow-md ring-1 ring-blue-500/20"
          : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">📑</span>
          <h4
            className="font-medium text-slate-200 text-xs truncate"
            title={report.title}
          >
            {report.title}
          </h4>
        </div>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
          <span>{new Date(report.created_at).toLocaleDateString()}</span>
          <span>•</span>
          {getStatusBadge(report.status)}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(report.id);
        }}
        title="Delete generated report"
        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded transition text-xs"
      >
        ✕
      </button>
    </div>
  );
}
