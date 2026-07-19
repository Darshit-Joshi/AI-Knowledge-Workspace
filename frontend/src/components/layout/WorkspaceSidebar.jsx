import React, { useState } from "react";
import { MOCK_WORKSPACES } from "../../utils/mockData";
import { PlusIcon, ChevronRightIcon, SparklesIcon } from "lucide-react";

export default function WorkspaceSidebar({ activeId, onSelectWorkspace }) {
  const [workspaces, setWorkspaces] = useState(MOCK_WORKSPACES);

  return (
    <aside className="w-60 border-r border-[#152642] bg-[#091120] p-4 flex flex-col justify-between shrink-0">
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Workspaces
          </h2>
          <button
            className="text-slate-400 hover:text-cyan-400 transition p-1 rounded hover:bg-slate-800/50"
            title="New Workspace"
          >
            <PlusIcon size={16} />
          </button>
        </div>

        <div className="space-y-1">
          {workspaces.map((ws) => {
            const isActive = activeId === ws.id;
            return (
              <button
                key={ws.id}
                onClick={() => onSelectWorkspace(ws.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-950/60 to-transparent border-l-2 border-cyan-400 text-cyan-300 font-semibold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-cyan-400 shadow-[0_0_8px_cyan]" : "bg-slate-600"}`}
                  />
                  <span className="truncate">{ws.name}</span>
                </div>
                <ChevronRightIcon
                  size={14}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "opacity-100 text-cyan-400" : "text-slate-500"}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Pro Tip / Mini Status Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-[#0d182b] to-[#0a1220] border border-[#1a2f52]/60 text-xs">
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
          <SparklesIcon size={14} />
          <span>AI Research Mode</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Hybrid search & Cross-Encoder reranking active for deep queries.
        </p>
      </div>
    </aside>
  );
}
