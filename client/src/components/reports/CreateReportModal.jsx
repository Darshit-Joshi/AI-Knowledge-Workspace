import React, { useState } from "react";
import { useReport } from "../../context/ReportContext";

export default function CreateReportModal({ isOpen, onClose }) {
  const { generateReport, isGenerating } = useReport();
  const [formData, setFormData] = useState({ title: "", prompt: "" });
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.prompt.trim()) return;

    try {
      setError(null);
      await generateReport({
        title: formData.title.trim(),
        prompt: formData.prompt.trim(),
      });
      setFormData({ title: "", prompt: "" });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to dispatch report agent.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">
            Launch Deep Research Agent
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition"
            type="button"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-6">
          The autonomous agent team will outline topics, search your vector
          database, and draft an executive report with citations.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Report Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={255}
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Deep Research: Agentic RAG Systems"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Research Directive & Scope <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              minLength={5}
              rows={4}
              value={formData.prompt}
              onChange={(e) =>
                setFormData({ ...formData, prompt: e.target.value })
              }
              placeholder="Compare LangGraph and standard LangChain pipelines based on uploaded research papers. Detail hallucination reduction strategies."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
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
              disabled={
                isGenerating ||
                !formData.title.trim() ||
                !formData.prompt.trim()
              }
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-xs transition flex items-center gap-2"
            >
              {isGenerating ? "Dispatching Agents..." : "Generate Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
