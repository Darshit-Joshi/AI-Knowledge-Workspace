import React, { useState } from "react";
import {
  XIcon,
  Share2Icon,
  CpuIcon,
  LayersIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";

export default function KnowledgeGraphModal({ isOpen, onClose }) {
  const [selectedNode, setSelectedNode] = useState("rag");

  if (!isOpen) return null;

  const nodes = [
    {
      id: "rag",
      label: "Agentic RAG",
      type: "Core Concept",
      icon: <CpuIcon size={16} />,
      x: "50%",
      y: "25%",
      color: "border-cyan-500 text-cyan-400 bg-cyan-950/40",
      desc: "Primary architectural framework combining retrieval with autonomous agent loops.",
    },
    {
      id: "qdrant",
      label: "Qdrant DB",
      type: "Vector Store",
      icon: <DatabaseIcon size={16} />,
      x: "20%",
      y: "55%",
      color: "border-emerald-500 text-emerald-400 bg-emerald-950/40",
      desc: "High-performance Rust-based vector database storing 384-dim BAAI/bge embeddings.",
    },
    {
      id: "langgraph",
      label: "LangGraph",
      type: "Orchestration",
      icon: <LayersIcon size={16} />,
      x: "80%",
      y: "55%",
      color: "border-purple-500 text-purple-400 bg-purple-950/40",
      desc: "Stateful multi-agent workflow routing between Planner, Retrieval, and Verification agents.",
    },
    {
      id: "rerank",
      label: "Cross-Encoder",
      type: "Reranking Layer",
      icon: <SparklesIcon size={16} />,
      x: "35%",
      y: "85%",
      color: "border-amber-500 text-amber-400 bg-amber-950/40",
      desc: "Compresses top 50 retrieved vector candidates down to the top 5 highest precision chunks.",
    },
    {
      id: "verify",
      label: "Verification Agent",
      type: "Hallucination Guard",
      icon: <ShieldCheckIcon size={16} />,
      x: "65%",
      y: "85%",
      color: "border-rose-500 text-rose-400 bg-rose-950/40",
      desc: "Autonomous validation loop ensuring every generated sentence maps directly to source citations.",
    },
  ];

  const activeNodeData = nodes.find((n) => n.id === selectedNode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0a1424] border border-[#1a2f52] rounded-2xl w-full max-w-4xl h-[600px] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1a2f52] bg-[#0c1626]">
          <div className="flex items-center gap-2">
            <Share2Icon size={18} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Interactive Workspace Knowledge Graph
            </h3>
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded ml-2">
              AUTO-LINKED ENTITIES
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Graph Canvas & Inspector Split */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
          {/* Interactive Graph Canvas (8 Cols) */}
          <div className="col-span-8 bg-[#070d19] relative flex items-center justify-center overflow-hidden border-r border-[#1a2f52]">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#1e375a_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Connecting SVG Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-[#1e355a] stroke-2">
              <line
                x1="50%"
                y1="25%"
                x2="20%"
                y2="55%"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              <line
                x1="50%"
                y1="25%"
                x2="80%"
                y2="55%"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              <line x1="20%" y1="55%" x2="35%" y2="85%" />
              <line x1="80%" y1="55%" x2="65%" y2="85%" />
              <line
                x1="35%"
                y1="85%"
                x2="65%"
                y2="85%"
                stroke="rgba(6, 182, 212, 0.4)"
              />
            </svg>

            {/* Render Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNode === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  style={{ left: node.x, top: node.y }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 font-bold text-xs transition-all cursor-pointer shadow-lg z-10 ${
                    node.color
                  } ${isSelected ? "scale-110 shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-2 ring-white/20" : "opacity-80 hover:opacity-100 hover:scale-105"}`}
                >
                  {node.icon}
                  <span>{node.label}</span>
                </button>
              );
            })}

            <div className="absolute bottom-3 left-3 text-[10px] text-slate-500 font-mono">
              Click any entity node to inspect relationships & retrieved
              vectors.
            </div>
          </div>

          {/* Node Inspector Sidebar (4 Cols) */}
          <div className="col-span-4 bg-[#0a1424] p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="border-b border-[#1a2f52] pb-3">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                  {activeNodeData?.type}
                </span>
                <h4 className="text-base font-black text-slate-100 mt-1 flex items-center gap-2">
                  {activeNodeData?.icon}
                  <span>{activeNodeData?.label}</span>
                </h4>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300">
                  Entity Description
                </p>
                <p className="text-xs text-slate-400 leading-relaxed bg-[#070d19] p-3 rounded-xl border border-[#1a2f52]">
                  {activeNodeData?.desc}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-slate-300">
                  Connected Sources
                </p>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="p-2 bg-[#0d182b] rounded-lg border border-[#1a2f52] text-cyan-300 flex justify-between">
                    <span>Agentic_RAG.pdf</span>
                    <span className="text-slate-500">12 Chunks</span>
                  </div>
                  <div className="p-2 bg-[#0d182b] rounded-lg border border-[#1a2f52] text-blue-300 flex justify-between">
                    <span>LangGraph_Docs.url</span>
                    <span className="text-slate-500">8 Chunks</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-950/50 to-transparent border border-cyan-500/30 rounded-xl p-3 text-xs mt-4">
              <p className="font-bold text-cyan-300 mb-1">
                Interview Feature Note
              </p>
              <p className="text-[11px] text-slate-400 leading-normal">
                This graph is generated autonomously during text chunking by
                extracting entity co-occurrences using NER (Named Entity
                Recognition).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
