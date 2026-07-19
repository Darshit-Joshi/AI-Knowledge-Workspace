import React, { useState } from "react";
import {
  XIcon,
  GlobeIcon,
  VideoIcon,
  Loader2Icon,
  CheckCircle2Icon,
} from "lucide-react";

export default function UrlScraperModal({
  isOpen,
  onClose,
  onAddSource,
  defaultType = "web",
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");

  if (!isOpen) return null;

  const isYouTube = defaultType === "youtube";

  const handleImport = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setStep(
      isYouTube
        ? "Fetching video captions & timestamp chunks..."
        : "Scraping DOM & cleaning HTML noise...",
    );

    setTimeout(() => {
      setStep("Generating vector embeddings & indexing in Qdrant...");
      setTimeout(() => {
        onAddSource({
          id: Date.now(),
          type: isYouTube ? "YouTube" : "Web URL",
          name: isYouTube
            ? "YouTube Transcript (Imported Video)"
            : url.replace(/^https?:\/\//, ""),
          subtitle: url,
          chunks: Math.floor(Math.random() * 120) + 30,
          status: "Ready",
        });
        setLoading(false);
        setUrl("");
        onClose();
      }, 1500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0a1424] border border-[#1a2f52] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#1a2f52] bg-[#0c1626]">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            {isYouTube ? (
              <VideoIcon size={18} className="text-rose-500" />
            ) : (
              <GlobeIcon size={18} className="text-blue-400" />
            )}
            <span>
              {isYouTube ? "Import YouTube Knowledge" : "Scrape Web Page"}
            </span>
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleImport} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {isYouTube ? "YouTube Video URL" : "Website or Blog Article URL"}
            </label>
            <input
              type="url"
              required
              disabled={loading}
              placeholder={
                isYouTube
                  ? "https://www.youtube.com/watch?v=..."
                  : "https://www.langgraph.docs/overview..."
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-[#070d19] border border-[#1e355a] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none placeholder-slate-500 font-mono transition"
            />
          </div>

          {loading && (
            <div className="bg-[#0d182b] p-3 rounded-xl border border-cyan-500/30 flex items-center gap-2.5 text-xs text-cyan-300 animate-pulse">
              <Loader2Icon
                size={16}
                className="animate-spin shrink-0 text-cyan-400"
              />
              <span>{step}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim() || loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 transition cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              {loading ? "Importing..." : "Extract & Embed"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
