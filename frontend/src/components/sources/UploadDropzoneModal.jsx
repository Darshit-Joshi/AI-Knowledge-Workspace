import React, { useState } from "react";
import {
  XIcon,
  UploadCloudIcon,
  FileIcon,
  CheckCircle2Icon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-react";

export default function UploadDropzoneModal({ isOpen, onClose, onAddSource }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 0: Idle, 1: Extracting, 2: Chunking, 3: Embedding, 4: Done

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(Array.from(e.target.files));
    }
  };

  const startUploadSimulation = () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgressStep(1);

    setTimeout(() => setProgressStep(2), 1000); // Extracting Text
    setTimeout(() => setProgressStep(3), 2200); // Chunking & BAAI/bge-small-en embedding
    setTimeout(() => {
      setProgressStep(4); // Storing in Qdrant
      setTimeout(() => {
        onAddSource({
          id: Date.now(),
          type: "PDF",
          name: files[0].name,
          subtitle: "Uploaded via workspace dropzone...",
          chunks: Math.floor(Math.random() * 80) + 40,
          status: "Ready",
        });
        setUploading(false);
        setProgressStep(0);
        setFiles([]);
        onClose();
      }, 800);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0a1424] border border-[#1a2f52] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1a2f52] bg-[#0c1626]">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <UploadCloudIcon size={18} className="text-cyan-400" /> Upload
            Documents to Knowledge Base
          </h3>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!uploading ? (
            <>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition cursor-pointer ${
                  dragActive
                    ? "border-cyan-400 bg-cyan-950/20"
                    : "border-[#1e355a] hover:border-cyan-500/50 bg-[#070d19]/60"
                }`}
                onClick={() => document.getElementById("file-upload").click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt,.md"
                />
                <UploadCloudIcon size={36} className="text-cyan-400 mb-3" />
                <p className="text-xs font-semibold text-slate-200">
                  Click to upload or drag and drop
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported: PDF, DOCX, TXT, Markdown (Max 25MB)
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-[#0d182b] border border-[#1a2f52] rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileIcon
                          size={14}
                          className="text-cyan-400 shrink-0"
                        />
                        <span className="text-slate-200 font-medium truncate">
                          {file.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Upload Progress Visualizer */
            <div className="py-6 space-y-5">
              <div className="space-y-3">
                {[
                  {
                    step: 1,
                    label: "Extracting Raw Text & Tables from Document",
                  },
                  {
                    step: 2,
                    label: "Chunking & Generating BAAI/bge-small-en Embeddings",
                  },
                  { step: 3, label: "Indexing Vectors into Qdrant Database" },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-center gap-3 text-xs"
                  >
                    {progressStep > item.step ? (
                      <CheckCircle2Icon
                        size={16}
                        className="text-emerald-400 shrink-0"
                      />
                    ) : progressStep === item.step ? (
                      <Loader2Icon
                        size={16}
                        className="text-cyan-400 shrink-0 animate-spin"
                      />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-slate-600 shrink-0" />
                    )}
                    <span
                      className={
                        progressStep >= item.step
                          ? "text-slate-200 font-medium"
                          : "text-slate-500"
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-500"
                  style={{ width: `${(progressStep / 3) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1a2f52] bg-[#0c1626] flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-transparent hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={startUploadSimulation}
            disabled={files.length === 0 || uploading}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 transition cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
          >
            {uploading ? (
              <Loader2Icon size={14} className="animate-spin" />
            ) : null}
            <span>
              {uploading ? "Processing Pipeline..." : "Start Ingestion"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
