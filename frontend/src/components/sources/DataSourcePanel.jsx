import React, { useState } from "react";
import { MOCK_SOURCES } from "../../utils/mockData";
import UploadDropzoneModal from "./UploadDropzoneModal";
import UrlScraperModal from "./UrlScraperModal";
import {
  FileTextIcon,
  VideoIcon,
  GlobeIcon,
  FileEditIcon,
  PlusIcon,
  UploadCloudIcon,
  ChevronDownIcon,
} from "lucide-react";

export default function DataSourcePanel() {
  const [sources, setSources] = useState(MOCK_SOURCES);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'upload' | 'web' | 'youtube'

  const handleAddSource = (newSource) => {
    setSources((prev) => [newSource, ...prev]);
  };

  const getIcon = (type) => {
    switch (type) {
      case "PDF":
        return <FileTextIcon size={16} className="text-red-400 shrink-0" />;
      case "YouTube":
        return <VideoIcon size={16} className="text-rose-500 shrink-0" />;
      case "Web URL":
        return <GlobeIcon size={16} className="text-blue-400 shrink-0" />;
      default:
        return <FileEditIcon size={16} className="text-amber-400 shrink-0" />;
    }
  };

  return (
    <section className="border border-[#152642] bg-[#091222]/60 rounded-xl p-4 backdrop-blur-sm flex flex-col flex-1 max-h-[440px] min-h-[300px] relative">
      {/* Header with Dropdown Trigger */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#152642]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Active Workspace Sources
        </h3>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition cursor-pointer shadow-sm"
          >
            <PlusIcon size={12} /> Add Source <ChevronDownIcon size={12} />
          </button>

          {/* Add Source Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-[#0c1626] border border-[#1e355a] rounded-xl shadow-2xl py-1.5 z-20 text-xs animate-in fade-in duration-150">
              <button
                onClick={() => {
                  setActiveModal("upload");
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:bg-[#14243b] hover:text-cyan-300 transition text-left cursor-pointer"
              >
                <FileTextIcon size={14} className="text-red-400" /> Upload PDF /
                DOCX
              </button>
              <button
                onClick={() => {
                  setActiveModal("web");
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:bg-[#14243b] hover:text-cyan-300 transition text-left cursor-pointer"
              >
                <GlobeIcon size={14} className="text-blue-400" /> Scrape Web URL
              </button>
              <button
                onClick={() => {
                  setActiveModal("youtube");
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:bg-[#14243b] hover:text-cyan-300 transition text-left cursor-pointer"
              >
                <VideoIcon size={14} className="text-rose-500" /> YouTube
                Transcript
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sources List */}
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {sources.map((src) => (
          <div
            key={src.id}
            className="flex items-center justify-between p-2.5 bg-[#0d182b] border border-[#1a2f52] rounded-xl hover:border-cyan-500/40 transition group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-[#08101d] border border-[#162744]">
                {getIcon(src.type)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate group-hover:text-cyan-300 transition">
                  {src.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {src.subtitle}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                {src.chunks} Chunks
              </span>
              <p className="text-[9px] text-emerald-400 mt-0.5 font-medium">
                ● Indexed
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Dropzone Shortcut */}
      <div
        onClick={() => setActiveModal("upload")}
        className="mt-3 p-3 rounded-xl border border-dashed border-[#1a2f52] bg-[#070d19]/60 flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-200 hover:border-cyan-500/40 transition cursor-pointer group"
      >
        <UploadCloudIcon
          size={16}
          className="text-cyan-400 group-hover:scale-110 transition-transform"
        />
        <span>Click to drag & drop files or import knowledge</span>
      </div>

      {/* Modals Mount */}
      <UploadDropzoneModal
        isOpen={activeModal === "upload"}
        onClose={() => setActiveModal(null)}
        onAddSource={handleAddSource}
      />
      <UrlScraperModal
        isOpen={activeModal === "web"}
        onClose={() => setActiveModal(null)}
        onAddSource={handleAddSource}
        defaultType="web"
      />
      <UrlScraperModal
        isOpen={activeModal === "youtube"}
        onClose={() => setActiveModal(null)}
        onAddSource={handleAddSource}
        defaultType="youtube"
      />
    </section>
  );
}
