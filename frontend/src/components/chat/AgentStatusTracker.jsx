import React from "react";
import {
  CpuIcon,
  SearchIcon,
  ShieldCheckIcon,
  FileTextIcon,
  CheckCircle2Icon,
  Loader2Icon,
} from "lucide-react";

export default function AgentStatusTracker({ currentStep, isComplete }) {
  const steps = [
    {
      id: "planner",
      label: "Planner Agent: Decomposing query into sub-tasks",
      icon: <CpuIcon size={14} />,
    },
    {
      id: "retrieval",
      label: "Retrieval Agent: Querying Qdrant vector database (Top 5 chunks)",
      icon: <SearchIcon size={14} />,
    },
    {
      id: "verification",
      label: "Verification Agent: Cross-Encoder fact-checking against sources",
      icon: <ShieldCheckIcon size={14} />,
    },
    {
      id: "report",
      label: "Report Agent: Synthesizing grounded response",
      icon: <FileTextIcon size={14} />,
    },
  ];

  return (
    <div className="my-3 rounded-xl border border-cyan-500/30 bg-[#0c1626]/90 p-3.5 backdrop-blur-md transition-all shadow-lg shadow-cyan-950/20">
      <div className="flex items-center justify-between border-b border-[#1a2f52] pb-2 mb-2.5">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
          <CpuIcon size={14} className="animate-pulse" /> Multi-Agent RAG
          Pipeline
        </span>
        <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/50 font-mono">
          {isComplete ? "EXECUTION COMPLETE" : "AGENTS ACTIVE"}
        </span>
      </div>

      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isDone = isComplete || idx < currentStep;
          const isActive = !isComplete && idx === currentStep;
          const isPending = !isComplete && idx > currentStep;

          return (
            <div key={step.id} className="flex items-center gap-2.5 text-xs">
              <div className="w-4 flex justify-center">
                {isDone && (
                  <CheckCircle2Icon size={14} className="text-emerald-400" />
                )}
                {isActive && (
                  <Loader2Icon
                    size={14}
                    className="text-cyan-400 animate-spin"
                  />
                )}
                {isPending && (
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                )}
              </div>
              <span
                className={`transition-colors ${isDone ? "text-slate-300 font-medium" : isActive ? "text-cyan-300 font-semibold animate-pulse" : "text-slate-500"}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
