import React from "react";

export default function AgentProgressBadge({ step }) {
  if (!step) return null;

  // Map LangGraph node identifiers to custom visual styling
  const getNodeConfig = (node) => {
    switch (node) {
      case "query_expander":
        return {
          icon: "🔮",
          label: "Query Expander",
          color: "bg-purple-950 text-purple-300 border-purple-800/80",
        };
      case "retriever":
        return {
          icon: "🔍",
          label: "Vector Retriever",
          color: "bg-blue-950 text-blue-300 border-blue-800/80",
        };
      case "workspace_retriever":
        return {
          icon: "📚",
          label: "Qdrant Hybrid Search",
          color: "bg-cyan-950 text-cyan-300 border-cyan-800/80",
        };
      case "drafter":
        return {
          icon: "✍️",
          label: "Synthesis Drafter",
          color: "bg-amber-950 text-amber-300 border-amber-800/80",
        };
      case "critic":
        return {
          icon: "🛡️",
          label: "Verification Critic",
          color: "bg-emerald-950 text-emerald-300 border-emerald-800/80",
        };
      default:
        return {
          icon: "🧠",
          label: "Agent Graph",
          color: "bg-slate-900 text-slate-300 border-slate-800",
        };
    }
  };

  const config = getNodeConfig(step.node);

  return (
    <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-lg px-4 py-2.5 shadow-lg max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-base">{config.icon}</span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${config.color} flex items-center gap-1.5`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
          {config.label}
        </span>
      </div>
      <p className="text-xs text-slate-300 truncate font-mono">
        {step.message}
      </p>
    </div>
  );
}
