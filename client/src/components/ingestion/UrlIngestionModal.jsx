import { useState } from "react";
import { useKnowledge } from "../../context/KnowledgeContext";

export default function UrlIngestionModal({ isOpen, onClose }) {
  const { ingestWebUrl, ingestYouTubeVideo } = useKnowledge();
  const [activeTab, setActiveTab] = useState("YOUTUBE"); // 'YOUTUBE' | 'WEB'
  const [formData, setFormData] = useState({ url: "", title: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.url.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const payload = {
        url: formData.url.trim(),
        title: formData.title.trim() || null,
      };

      if (activeTab === "YOUTUBE") {
        await ingestYouTubeVideo(payload);
      } else {
        await ingestWebUrl(payload);
      }

      setFormData({ url: "", title: "" });
      onClose();
    } catch (err) {
      setError(err.message || "URL ingestion request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">
            Import Remote Knowledge
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("YOUTUBE");
              setError(null);
            }}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === "YOUTUBE"
                ? "border-red-500 text-slate-100"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            📺 YouTube Transcript
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("WEB");
              setError(null);
            }}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === "WEB"
                ? "border-blue-500 text-slate-100"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            🌐 Web Scraper
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {activeTab === "YOUTUBE"
                ? "YouTube Video URL"
                : "Website / Blog URL"}{" "}
              <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              placeholder={
                activeTab === "YOUTUBE"
                  ? "https://www.youtube.com/watch?v=..."
                  : "https://some-blog.com/rag-guide"
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Custom Title (Optional)
            </label>
            <input
              type="text"
              maxLength={255}
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Leave blank to auto-detect from source"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.url.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-xs transition duration-150 flex items-center gap-2"
            >
              {isSubmitting ? "Dispatching Worker..." : "Start Ingestion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
