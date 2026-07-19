import React, { useState } from "react";
import {
  CpuIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  KeyIcon,
  SaveIcon,
} from "lucide-react";

export default function SettingsPage() {
  const [llm, setLlm] = useState("gemini-1.5-pro");
  const [vectorDb, setVectorDb] = useState("qdrant");
  const [rerank, setRerank] = useState(true);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#070d19] space-y-6 max-w-4xl">
      <div className="border-b border-[#152642] pb-4">
        <h1 className="text-lg font-bold text-slate-100">
          AI Stack Configuration
        </h1>
        <p className="text-xs text-slate-400">
          Configure LLM providers, vector database drivers, and retrieval
          hyperparameters.
        </p>
      </div>

      <div className="space-y-6">
        {/* LLM Selection */}
        <div className="border border-[#152642] bg-[#091222]/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
            <CpuIcon size={18} /> LLM & Embedding Engine
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Primary Chat Model
              </label>
              <select
                value={llm}
                onChange={(e) => setLlm(e.target.value)}
                className="w-full bg-[#0d182b] border border-[#1a2f52] rounded-lg p-2.5 text-slate-200 outline-none focus:border-cyan-500"
              >
                <option value="gemini-1.5-pro">
                  Google Gemini 1.5 Pro (Recommended)
                </option>
                <option value="gpt-4o">OpenAI GPT-4o</option>
                <option value="claude-3.5">Anthropic Claude 3.5 Sonnet</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Embedding Pipeline Model
              </label>
              <input
                type="text"
                disabled
                value="BAAI/bge-small-en (384 dimensions)"
                className="w-full bg-[#08101d] border border-[#162744] rounded-lg p-2.5 text-slate-500 font-mono cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Vector DB & Retrieval */}
        <div className="border border-[#152642] bg-[#091222]/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <DatabaseIcon size={18} /> Vector Database & Reranking
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Active Vector Engine
              </label>
              <select
                value={vectorDb}
                onChange={(e) => setVectorDb(e.target.value)}
                className="w-full bg-[#0d182b] border border-[#1a2f52] rounded-lg p-2.5 text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="qdrant">Qdrant Production Engine (Rust)</option>
                <option value="chroma">ChromaDB (Beginner / Local)</option>
                <option value="faiss">Meta FAISS In-Memory</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#0d182b] border border-[#1a2f52] rounded-lg mt-5">
              <div>
                <p className="font-semibold text-slate-200">
                  Cross-Encoder Reranking
                </p>
                <p className="text-[10px] text-slate-500">
                  Filters top 50 chunks down to top 5
                </p>
              </div>
              <input
                type="checkbox"
                checked={rerank}
                onChange={(e) => setRerank(e.target.checked)}
                className="h-4 w-4 accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save Console */}
        <div className="flex justify-end pt-4">
          <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition">
            <SaveIcon size={14} /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
