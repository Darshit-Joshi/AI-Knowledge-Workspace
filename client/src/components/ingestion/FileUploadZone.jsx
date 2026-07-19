import { useState, useRef } from "react";
import { useKnowledge } from "../../context/KnowledgeContext";

export default function FileUploadZone() {
  const { uploadFile, isUploading } = useKnowledge();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const SUPPORTED_EXTENSIONS = ["pdf", "docx", "txt", "md", "markdown"];

  const validateAndUpload = async (file) => {
    setUploadError(null);
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setUploadError(
        `Unsupported format (.${ext}). Please upload PDF, DOCX, TXT, or Markdown.`,
      );
      return;
    }

    try {
      await uploadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadError(err.message || "File upload failed.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition duration-150 flex flex-col items-center justify-center min-h-[160px] ${
          isDragging
            ? "border-blue-500 bg-blue-950/20"
            : "border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.markdown"
          onChange={(e) => validateAndUpload(e.target.files[0])}
          className="hidden"
        />

        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl mb-3 text-slate-300">
          {isUploading ? "⏳" : "📤"}
        </div>

        <h4 className="text-sm font-semibold text-slate-200">
          {isUploading
            ? "Uploading to ETL Pipeline..."
            : "Click or drag files to ingest"}
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Supported file formats:{" "}
          <span className="text-slate-300 font-mono">
            PDF, DOCX, TXT, Markdown
          </span>
          . Max file size depends on your FastAPI configuration.
        </p>
      </div>

      {uploadError && (
        <div className="mt-3 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-xs">
          {uploadError}
        </div>
      )}
    </div>
  );
}
