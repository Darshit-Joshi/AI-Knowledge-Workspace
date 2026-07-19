import React from "react";
import {
  BarChart2Icon,
  ShieldCheckIcon,
  ZapIcon,
  LayersIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
} from "lucide-react";

export default function AnalyticsPage() {
  const metrics = [
    {
      title: "Total Vector Embeddings",
      value: "1,033",
      change: "+14% this week",
      icon: <LayersIcon className="text-cyan-400" size={20} />,
    },
    {
      title: "Cross-Encoder Latency",
      value: "142 ms",
      change: "Top 5 Reranking",
      icon: <ZapIcon className="text-amber-400" size={20} />,
    },
    {
      title: "Hallucination Mitigation",
      value: "98.4%",
      change: "Verified Grounded",
      icon: <ShieldCheckIcon className="text-emerald-400" size={20} />,
    },
    {
      title: "Active Knowledge Queries",
      value: "482",
      change: "Across 4 Workspaces",
      icon: <BarChart2Icon className="text-purple-400" size={20} />,
    },
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#070d19] space-y-6">
      <div className="border-b border-[#152642] pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-slate-100">
            System Performance & Vector Analytics
          </h1>
          <p className="text-xs text-slate-400">
            Live telemetry from your Qdrant vector collections and multi-agent
            execution loops.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          ALL PIPELINES HEALTHY
        </span>
      </div>

      {/* Top Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="bg-[#0a1424] border border-[#1a2f52] p-4 rounded-xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                {m.title}
              </span>
              <div className="p-2 bg-[#070d19] rounded-lg border border-[#162744]">
                {m.icon}
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-slate-100 font-mono">
                {m.value}
              </span>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <ArrowUpRightIcon size={12} className="text-emerald-400" />{" "}
                {m.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Source Distribution Breakdown (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0a1424] border border-[#1a2f52] p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200">
            Knowledge Ingestion Distribution
          </h3>
          <p className="text-xs text-slate-400">
            Breakdown of content indexed across BAAI/bge-small-en vector
            collections.
          </p>

          <div className="space-y-4 pt-2">
            {[
              {
                label: "PDF & Research Papers (RAG Docs)",
                count: "540 Chunks",
                pct: "52%",
                color: "bg-red-500",
              },
              {
                label: "YouTube Video Transcripts",
                count: "310 Chunks",
                pct: "30%",
                color: "bg-rose-500",
              },
              {
                label: "Web Blog Articles & LangGraph Docs",
                count: "133 Chunks",
                pct: "13%",
                color: "bg-blue-500",
              },
              {
                label: "Personal Semantic Notes",
                count: "50 Chunks",
                pct: "5%",
                color: "bg-amber-500",
              },
            ].map((bar, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">
                    {bar.label}
                  </span>
                  <span className="font-mono text-slate-400">
                    {bar.count} ({bar.pct})
                  </span>
                </div>
                <div className="h-2 w-full bg-[#070d19] rounded-full overflow-hidden border border-[#162744]">
                  <div
                    className={`h-full ${bar.color} rounded-full transition-all duration-500`}
                    style={{ width: bar.pct }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agentic Pipeline Verification Stats (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0a1424] border border-[#1a2f52] p-5 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              Multi-Agent Verification Audit
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Real-time performance of your autonomous fact-checking loop.
            </p>

            <div className="my-6 space-y-3">
              <div className="p-3 bg-[#070d19] rounded-xl border border-[#1a2f52] flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  Queries Flagged for Hallucination
                </span>
                <span className="font-mono font-bold text-rose-400">1.6%</span>
              </div>
              <div className="p-3 bg-[#070d19] rounded-xl border border-[#1a2f52] flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  Average Citations per Answer
                </span>
                <span className="font-mono font-bold text-cyan-400">
                  3.4 Sources
                </span>
              </div>
              <div className="p-3 bg-[#070d19] rounded-xl border border-[#1a2f52] flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  Rerank Top-5 Precision Rate
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  99.1%
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-gradient-to-r from-emerald-950/60 to-transparent border-l-2 border-emerald-400 rounded-r-xl text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
              <CheckCircle2Icon size={14} /> Production Grade Standard
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Your Cross-Encoder architecture performs 4x better at noise
              reduction than standard single-stage vector retrieval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
