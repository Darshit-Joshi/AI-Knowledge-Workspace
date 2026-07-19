import React, { useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { useKnowledge } from "../context/KnowledgeContext";
import FileUploadZone from "../components/ingestion/FileUploadZone";
import UrlIngestionModal from "../components/ingestion/UrlIngestionModal";
import DocumentCard from "../components/ingestion/DocumentCard";

export default function KnowledgeBasePage({
  onNavigateBack,
  onNavigateToChat,
}) {
  const { activeWorkspace } = useWorkspace();
  const { documents, isLoading, deleteDocument, refreshDocuments } =
    useKnowledge();
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [filterType, setFilterType] = useState("ALL");

  if (!activeWorkspace) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-lg font-semibold text-slate-200">
          No Workspace Selected
        </h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Please select a workspace from the dashboard to manage its knowledge
          base.
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

  const filteredDocs =
    filterType === "ALL"
      ? documents
      : documents.filter((doc) => doc.source_type === filterType);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Workspace Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateBack}
            className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition"
          >
            ← Workspaces
          </button>
          <div className="h-4 w-[1px] bg-slate-800"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm">📁</span>
              <h1 className="font-bold text-sm text-slate-100">
                {activeWorkspace.name}
              </h1>
            </div>
            <p className="text-[11px] text-slate-400">
              Knowledge Ingestion & Vector Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUrlModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
          >
            <span>🌐</span> Import Web / YouTube
          </button>
          <button
            onClick={onNavigateToChat}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-lg shadow-blue-600/20 transition flex items-center gap-1.5"
          >
            <span>💬</span> Launch RAG Chat
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Upload Zone */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Ingest Local Documents
            </h3>
            <span className="text-[11px] text-slate-400">
              Files are chunked and embedded into Qdrant automatically
            </span>
          </div>
          <FileUploadZone />
        </section>

        {/* Document List Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-200">
                Knowledge Base
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                {documents.length} Total
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              {["ALL", "PDF", "DOCX", "WEB", "YOUTUBE"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
                    filterType === type
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {type}
                </button>
              ))}
              <button
                onClick={refreshDocuments}
                title="Force refresh status"
                className="px-2 py-1 text-slate-400 hover:text-slate-200 ml-1 border-l border-slate-800"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Document Feed */}
          {isLoading && documents.length === 0 ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-16 bg-slate-900/50 border border-slate-800/60 rounded-xl"
                />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500">
                No documents found matching this filter.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onDelete={deleteDocument}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <UrlIngestionModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
      />
    </div>
  );
}
