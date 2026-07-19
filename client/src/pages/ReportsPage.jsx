import React, { useState } from "react";
import { useReport } from "../context/ReportContext";
import { useWorkspace } from "../context/WorkspaceContext";
import ReportCard from "../components/reports/ReportCard";
import ReportViewer from "../components/reports/ReportViewer";
import CreateReportModal from "../components/reports/CreateReportModal";

export default function ReportsPage({
  onNavigateBack,
  onNavigateToKnowledge,
  onNavigateToChat,
}) {
  const { activeWorkspace } = useWorkspace();
  const { reports, activeReport, selectReport, deleteReport, isLoading } =
    useReport();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!activeWorkspace) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
        <h3 className="text-lg font-semibold">No Workspace Active</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Select a workspace from the dashboard to manage AI research reports.
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
      {/* Research Sidebar */}
      <aside className="w-80 bg-slate-900/60 border-r border-slate-800/80 flex flex-col h-full flex-shrink-0">
        <div className="p-4 border-b border-slate-800/80 space-y-3">
          <button
            onClick={onNavigateBack}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
          >
            ← Exit to Workspaces
          </button>

          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 truncate">
            <span>📁</span>
            <span className="truncate">{activeWorkspace.name}</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>+</span> New Research Directive
          </button>
        </div>

        {/* Cross-navigation */}
        <div className="px-4 py-2 border-b border-slate-800/80 flex gap-1 text-[11px] font-medium text-slate-400">
          <button
            onClick={onNavigateToKnowledge}
            className="flex-1 py-1 px-2 rounded hover:bg-slate-800/60 hover:text-slate-200 transition text-center"
          >
            📚 Knowledge Base
          </button>
          <button
            onClick={onNavigateToChat}
            className="flex-1 py-1 px-2 rounded hover:bg-slate-800/60 hover:text-slate-200 transition text-center"
          >
            💬 RAG Chat
          </button>
        </div>

        {/* Reports Feed */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-1 tracking-wider">
            Generated Reports ({reports.length})
          </div>

          {isLoading && reports.length === 0 ? (
            <div className="space-y-2 animate-pulse px-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-14 bg-slate-800/40 rounded-xl" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500 px-4">
              No reports generated yet. Dispatch an agent team to synthesize
              your documents.
            </div>
          ) : (
            reports.map((rep) => (
              <ReportCard
                key={rep.id}
                report={rep}
                isActive={activeReport?.id === rep.id}
                onSelect={selectReport}
                onDelete={deleteReport}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main Report Viewport */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        <ReportViewer report={activeReport} />
      </main>

      <CreateReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
