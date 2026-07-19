import React from "react";
import { SparklesIcon, TagIcon, BookOpenIcon } from "lucide-react";

export default function InsightsContainer() {
  return (
    <section className="border border-[#152642] bg-[#091222]/60 rounded-xl p-3.5 backdrop-blur-sm shrink-0">
      <div className="flex justify-between items-center mb-2.5 border-b border-[#152642]/60 pb-2">
        <div className="flex items-center gap-1.5">
          <SparklesIcon size={14} className="text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Insights & Annotations
          </h3>
        </div>
        <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded">
          AUTO-EXTRACTED
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0e1a30]/80 p-3 rounded-lg border border-[#1e355a]/40 hover:border-amber-500/30 transition">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
            <TagIcon size={12} /> Key Definition
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Hallucination mitigation explicitly requires cross-encoder
            verification after initial dense vector retrieval.
          </p>
        </div>
        <div className="bg-[#0e1a30]/80 p-3 rounded-lg border border-[#1e355a]/40 hover:border-emerald-500/30 transition">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
            <BookOpenIcon size={12} /> Architecture Summary
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Extracted multi-agent stateful loops and graph routing principles
            from uploaded LangGraph documentation.
          </p>
        </div>
      </div>
    </section>
  );
}
