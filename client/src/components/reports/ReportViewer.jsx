import React from "react";
import { useReport } from "../../context/ReportContext";

export default function ReportViewer({ report }) {
  const { exportAsMarkdown } = useReport();

  if (!report) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-500">
        <div className="text-4xl mb-3">📑</div>
        <h3 className="text-sm font-medium text-slate-400">
          No Report Selected
        </h3>
        <p className="text-xs max-w-sm mt-1">
          Select a research report from the sidebar or dispatch a new agent team
          to generate insights.
        </p>
      </div>
    );
  }

  if (report.status === "GENERATING") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
        <div className="w-16 h-16 rounded-2xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-center text-2xl mb-4 animate-bounce">
          🧠
        </div>
        <h3 className="text-base font-semibold text-slate-200">
          Autonomous Research in Progress
        </h3>
        <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
          The LangGraph multi-agent team is currently structuring an outline,
          retrieving relevant chunks from your Qdrant vector store, and
          synthesizing grounded sections.
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs text-blue-400 bg-blue-950/30 border border-blue-800/40 px-4 py-2 rounded-full font-mono">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          Polling backend state every 5s...
        </div>
      </div>
    );
  }

  if (report.status === "FAILED") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
        <div className="w-12 h-12 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-xl mb-3 text-red-400">
          ✕
        </div>
        <h3 className="text-sm font-semibold text-red-300">
          Generation Pipeline Failed
        </h3>
        <p className="text-xs text-slate-400 max-w-md mt-1 font-mono bg-slate-900 p-3 rounded-lg border border-slate-800 mt-4">
          {report.content ||
            "An unexpected error occurred during agent execution."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Viewer Header */}
      <div className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur flex-shrink-0">
        <div className="min-w-0 flex-1 pr-4">
          <h2
            className="font-semibold text-sm text-slate-100 truncate"
            title={report.title}
          >
            {report.title}
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            Generated {new Date(report.created_at).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => exportAsMarkdown(report)}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
          >
            <span>📥</span> Download .md
          </button>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
          >
            <span>🖨️</span> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Document Content Feed */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12">
        <article className="max-w-3xl mx-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 shadow-xl text-slate-200 font-normal leading-relaxed space-y-6 print:bg-white print:text-black print:border-none print:shadow-none">
          {/* Simple custom markdown layout rendering */}
          {report.content.split("\n\n").map((paragraph, idx) => {
            const trimmed = paragraph.trim();
            if (trimmed.startsWith("# ")) {
              return (
                <h1
                  key={idx}
                  className="text-2xl font-bold text-slate-100 border-b border-slate-800 pb-3 mt-6 first:mt-0"
                >
                  {trimmed.replace("# ", "")}
                </h1>
              );
            } else if (trimmed.startsWith("## ")) {
              return (
                <h2
                  key={idx}
                  className="text-lg font-semibold text-blue-400 mt-6 mb-2"
                >
                  {trimmed.replace("## ", "")}
                </h2>
              );
            } else if (trimmed.startsWith("### ")) {
              return (
                <h3
                  key={idx}
                  className="text-base font-semibold text-slate-200 mt-4"
                >
                  {trimmed.replace("### ", "")}
                </h3>
              );
            } else if (trimmed.startsWith("> ")) {
              return (
                <blockquote
                  key={idx}
                  className="border-l-4 border-blue-500 bg-blue-950/20 px-4 py-3 rounded-r-lg text-xs italic text-slate-300 my-4"
                >
                  {trimmed.replace("> ", "")}
                </blockquote>
              );
            } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
              return (
                <ul
                  key={idx}
                  className="list-disc list-inside space-y-1 text-xs text-slate-300 pl-2"
                >
                  {trimmed.split("\n").map((item, i) => (
                    <li key={i}>{item.replace(/^[-*]\s+/, "")}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p
                key={idx}
                className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed"
              >
                {trimmed}
              </p>
            );
          })}
        </article>
      </div>
    </div>
  );
}
