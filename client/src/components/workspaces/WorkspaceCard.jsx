import { useState } from "react";

export default function WorkspaceCard({
  workspace,
  isActive,
  onSelect,
  onDelete,
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (isConfirmingDelete) {
      onDelete(workspace.id);
    } else {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 3000); // Reset after 3s
    }
  };

  return (
    <div
      onClick={() => onSelect(workspace)}
      className={`group relative cursor-pointer rounded-xl border p-5 transition duration-200 flex flex-col justify-between ${
        isActive
          ? "bg-slate-900/90 border-blue-500/80 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/30"
          : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">📁</span>
            <h4 className="font-semibold text-slate-100 text-base line-clamp-1">
              {workspace.name}
            </h4>
          </div>
          {isActive && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-950 text-blue-400 border border-blue-800/60">
              Active
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 min-h-[2.5rem]">
          {workspace.description ||
            "No description provided for this knowledge base."}
        </p>
      </div>

      <div className="mt-6 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
        <span>
          Created {new Date(workspace.created_at).toLocaleDateString()}
        </span>

        <button
          type="button"
          onClick={handleDeleteClick}
          className={`px-2 py-1 rounded transition font-medium ${
            isConfirmingDelete
              ? "bg-red-950 border border-red-800 text-red-300 animate-pulse"
              : "text-slate-500 hover:text-red-400 hover:bg-slate-800/60"
          }`}
        >
          {isConfirmingDelete ? "Click to Confirm Cascade Wipe" : "Delete"}
        </button>
      </div>
    </div>
  );
}
