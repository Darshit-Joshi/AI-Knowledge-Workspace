import React, { useState } from "react";
import ChatContainer from "../components/chat/ChatContainer";
import InsightsContainer from "../components/insights/InsightsContainer";
import DataSourcePanel from "../components/sources/DataSourcePanel";
import ReportGeneratorCard from "../components/reports/ReportGeneratorCard";
import CoverageDashboard from "../components/analytics/CoverageDashboard";
import KnowledgeGraphModal from "../components/insights/KnowledgeGraphModal";
import { Share2Icon } from "lucide-react";

export default function DashboardPage() {
  const [graphOpen, setGraphOpen] = useState(false);

  return (
    <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-y-auto bg-[#070d19] relative">
      {/* Top Floating Banner for Knowledge Graph (Interview Highlight) */}
      <div className="col-span-12 bg-gradient-to-r from-cyan-950/60 via-[#0a1424] to-transparent border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between shadow-lg shadow-cyan-950/20">
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold text-slate-100">
            Top 1% Engineering Feature:
          </span>
          <span className="text-slate-400">
            Autonomous entity relationships mapped across active vector sources.
          </span>
        </div>
        <button
          onClick={() => setGraphOpen(true)}
          className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-md cursor-pointer"
        >
          <Share2Icon size={14} /> View Knowledge Graph
        </button>
      </div>

      {/* Left/Center Column */}
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-4 h-full">
        <InsightsContainer />
        <ChatContainer />
      </div>

      {/* Right Column */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 h-full">
        <DataSourcePanel />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-h-[180px]">
          <ReportGeneratorCard />
          <CoverageDashboard />
        </div>
      </div>

      {/* Interactive Graph Modal */}
      <KnowledgeGraphModal
        isOpen={graphOpen}
        onClose={() => setGraphOpen(false)}
      />
    </div>
  );
}
