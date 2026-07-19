import React, { useState } from "react";
import {
  PaperclipIcon,
  LinkIcon,
  MicIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";

export default function ChatInputConsole({ onSendMessage, isGenerating }) {
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <form
      onSubmit={handleSend}
      className="mt-4 bg-[#0d182b] border border-[#1a2f52] focus-within:border-cyan-500/50 rounded-xl p-2.5 shadow-xl transition-colors"
    >
      <div className="flex items-center gap-2 px-2 pb-1">
        <SparklesIcon
          size={14}
          className="text-cyan-400 shrink-0 animate-pulse"
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isGenerating}
          placeholder={
            isGenerating
              ? "Multi-Agent RAG executing... Please wait."
              : "Ask your knowledge workspace anything (e.g., 'Explain hallucination reduction')..."
          }
          className="w-full bg-transparent py-1.5 text-sm outline-none text-slate-100 placeholder-slate-500 disabled:opacity-50 font-normal"
        />
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-[#182c4c] mt-1.5 px-1">
        <div className="flex gap-1.5 text-slate-400">
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs hover:text-slate-200 bg-[#14243b] hover:bg-[#1b3152] px-2.5 py-1 rounded-md border border-[#1e375a] transition"
          >
            <PaperclipIcon size={13} className="text-cyan-400" /> Upload
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs hover:text-slate-200 bg-[#14243b] hover:bg-[#1b3152] px-2.5 py-1 rounded-md border border-[#1e375a] transition"
          >
            <LinkIcon size={13} className="text-blue-400" /> Paste URL
          </button>
          <button
            type="button"
            title="Voice Transcription"
            className="flex items-center justify-center hover:text-slate-200 bg-[#14243b] hover:bg-[#1b3152] p-1.5 rounded-md border border-[#1e375a] transition text-slate-400"
          >
            <MicIcon size={13} className="text-rose-400" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isGenerating}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition text-slate-950 px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/10 cursor-pointer"
        >
          <span>Send</span>
          <SendIcon size={12} />
        </button>
      </div>
    </form>
  );
}
