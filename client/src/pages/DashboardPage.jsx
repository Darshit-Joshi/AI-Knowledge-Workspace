import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import WorkspaceCard from "../components/workspaces/WorkspaceCard";
import CreateWorkspaceModal from "../components/workspaces/CreateWorkspaceModal";

export default function DashboardPage({ onNavigateToWorkspace }) {
  const { user, logout } = useAuth();
  const {
    workspaces,
    activeWorkspace,
    selectWorkspace,
    deleteWorkspace,
    isLoading,
  } = useWorkspace();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleSelectAndNavigate = (workspace) => {
    selectWorkspace(workspace);
    if (onNavigateToWorkspace) {
      onNavigateToWorkspace(workspace);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
            AI
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-slate-100">
              Knowledge Workspace
            </h1>
            <p className="text-[11px] text-slate-400">
              Multi-Agent RAG Engine & Research Studio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-slate-200">
              {user?.username || user?.email}
            </p>
            <span className="text-[10px] text-blue-400 font-mono">
              Provider: {user?.provider?.toUpperCase()}
            </span>
          </div>
          <button
            onClick={logout}
            className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg transition duration-150"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              Your Knowledge Workspaces
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select an isolated workspace to manage documents, run agentic RAG
              queries, or generate reports.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/20 transition duration-150 flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <span>+</span> Create Workspace
          </button>
        </div>

        {/* Workspaces Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-44 bg-slate-900/50 border border-slate-800/60 rounded-xl"
              />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-xl">
              📂
            </div>
            <h3 className="text-base font-semibold text-slate-200">
              No workspaces yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              Create your first workspace to start uploading PDFs, websites, and
              YouTube transcripts for vector search.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition duration-150 inline-flex items-center gap-2"
            >
              Create Your First Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => (
              <WorkspaceCard
                key={ws.id}
                workspace={ws}
                isActive={activeWorkspace?.id === ws.id}
                onSelect={() => handleSelectAndNavigate(ws)}
                onDelete={deleteWorkspace}
              />
            ))}
          </div>
        )}
      </main>

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
