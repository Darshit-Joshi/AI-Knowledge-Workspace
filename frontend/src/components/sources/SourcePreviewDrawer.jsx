import React from "react";
import {
  XIcon,
  FileTextIcon,
  ShieldCheckIcon,
  LayersIcon,
  SparklesIcon,
} from "lucide-react";

export default function SourcePreviewDrawer({ isOpen, onClose, citationName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#091222] border-l border-[#1a2f52] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1a2f52] bg-[#0c1626]">
        <div className="flex items-center gap-2">
          <FileTextIcon size={18} className="text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              {citationName || "Source Document"}
            </h3>
            <p className="text-[10px] text-slate-400">
              Vector Search Match • Qdrant DB
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
        >
          <XIcon size={18} />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* Reranking Score Box */}
        <div className="bg-[#0e1a30] p-3 rounded-xl border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <SparklesIcon size={16} className="text-cyan-400" /> Cross-Encoder
            Score
          </div>
          <span className="text-xs font-bold font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
            0.942 Top-Ranked
          </span>
        </div>

        {/* Extracted Chunk Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <LayersIcon size={13} /> Retrieved Chunk #42
            </span>
            <span>Page 4</span>
          </div>
          <div className="bg-[#070d19] p-3.5 rounded-xl border border-[#1a2f52] text-xs text-slate-300 leading-relaxed font-mono selection:bg-cyan-500/30">
            "To mitigate hallucination in retrieval-augmented generation (RAG),
            hybrid search must be combined with a secondary reranking layer.
            While dense vector embeddings capture semantic similarity, sparse
            keyword search prevents terminology drift. Passing the top 50
            retrieved candidates through a Cross-Encoder reranker consistently
            narrows the context down to the top 5 highest-precision chunks..."
          </div>
        </div>

        {/* Verification Metadata */}
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheckIcon size={14} /> Verification Agent Passed
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The generated response directly maps to facts found in this chunk
            without speculative reasoning or extrapolations.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#1a2f52] bg-[#0c1626]">
        <button
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-lg transition uppercase tracking-wider"
        >
          Close Preview
        </button>
      </div>
    </div>
  );
}
