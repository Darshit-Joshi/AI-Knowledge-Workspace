import React from "react";
import { BarChart2Icon, ShieldAlertIcon } from "lucide-react";

export default function CoverageDashboard() {
  return (
    <section className="border border-[#152642] bg-[#091222]/60 rounded-xl p-4 backdrop-blur-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          <BarChart2Icon size={14} className="text-cyan-400" />
          <span>Vector Coverage</span>
        </div>
        <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
          Qdrant Active
        </span>
      </div>

      <div className="space-y-3 my-2">
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-medium">
            <span className="text-slate-300">Knowledge Base Coverage</span>
            <span className="text-cyan-400 font-bold font-mono">96%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
              style={{ width: "96%" }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-medium">
            <span className="text-slate-300">Sources Synced & Embedded</span>
            <span className="text-emerald-400 font-bold font-mono">100%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-[#0d182b] p-2 rounded-lg border border-[#1a2f52]">
        <ShieldAlertIcon size={13} className="text-amber-400 shrink-0" />
        <span>BAAI/bge-small-en embeddings operating at zero latency.</span>
      </div>
    </section>
  );
}
