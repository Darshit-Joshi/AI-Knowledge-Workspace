import React, { useState } from "react";
import { MOCK_SOURCES } from "../utils/mockData";
import {
  SearchIcon,
  FileTextIcon,
  VideoIcon,
  GlobeIcon,
  FileEditIcon,
  FilterIcon,
  Trash2Icon,
  ExternalLinkIcon,
} from "lucide-react";

export default function GlobalLibraryPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const getIcon = (type) => {
    switch (type) {
      case "PDF":
        return <FileTextIcon size={16} className="text-red-400" />;
      case "YouTube":
        return <VideoIcon size={16} className="text-rose-500" />;
      case "Web URL":
        return <GlobeIcon size={16} className="text-blue-400" />;
      default:
        return <FileEditIcon size={16} className="text-amber-400" />;
    }
  };

  const filteredSources = MOCK_SOURCES.filter((src) => {
    const matchesFilter = filter === "All" || src.type === filter;
    const matchesSearch =
      src.name.toLowerCase().includes(search.toLowerCase()) ||
      src.subtitle.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#070d19] space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#152642] pb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-100">
            Global Knowledge Library
          </h1>
          <p className="text-xs text-slate-400">
            Manage all indexed documents, transcripts, and notes across every
            workspace.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0d182b] border border-[#1a2f52] px-3 py-1.5 rounded-xl w-64">
            <SearchIcon size={14} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search vector database..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs outline-none text-slate-200 placeholder-slate-500 w-full font-normal"
            />
          </div>
          <div className="flex gap-1 bg-[#0a1424] p-1 rounded-xl border border-[#152642]">
            {["All", "PDF", "YouTube", "Web URL"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${filter === type ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-slate-200"}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Library Table */}
      <div className="border border-[#152642] rounded-xl overflow-hidden bg-[#091222]/60 backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#152642] bg-[#0c1626] text-slate-400 text-[11px] uppercase tracking-wider font-bold">
              <th className="py-3 px-4">Source Name</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Vector Chunks</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#152642]/60 text-xs">
            {filteredSources.map((src) => (
              <tr key={src.id} className="hover:bg-[#0d182b]/60 transition">
                <td className="py-3 px-4 font-medium text-slate-200 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#08101d] border border-[#162744]">
                    {getIcon(src.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">{src.name}</p>
                    <p className="text-[11px] text-slate-500">{src.subtitle}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-400 font-mono">
                  {src.type}
                </td>
                <td className="py-3 px-4 font-mono text-cyan-400 font-semibold">
                  {src.chunks} chunks
                </td>
                <td className="py-3 px-4">
                  <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono">
                    INDEXED
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    title="Open Source"
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition"
                  >
                    <ExternalLinkIcon size={14} />
                  </button>
                  <button
                    title="Delete from DB"
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition"
                  >
                    <Trash2Icon size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
