import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import ChatInputConsole from "./ChatInputConsole";
import AgentStatusTracker from "./AgentStatusTracker";
import SourcePreviewDrawer from "../sources/SourcePreviewDrawer";
import { MOCK_MESSAGES } from "../../utils/mockData";
import { MessageSquareIcon, Trash2Icon } from "lucide-react";

export default function ChatContainer() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentStep, setAgentStep] = useState(0);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating, agentStep]);

  // Simulate Multi-Agent execution when user sends a message
  const handleSendMessage = (text) => {
    const userMsg = { id: Date.now(), sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);
    setAgentStep(0);

    // Simulate Agent Step Progression
    const stepInterval = setInterval(() => {
      setAgentStep((prevStep) => {
        if (prevStep < 3) return prevStep + 1;
        clearInterval(stepInterval);
        return prevStep;
      });
    }, 900);

    // Simulate Final AI Response Arrival
    setTimeout(() => {
      clearInterval(stepInterval);
      const aiResponse = {
        id: Date.now() + 1,
        sender: "ai",
        text: `Based on your uploaded documents, hallucination reduction is best handled through a multi-stage verification pipeline. By integrating Cross-Encoder reranking after vector retrieval, noise is aggressively filtered out before context reaches the LLM. Furthermore, our Verification Agent explicitly checks every claim against your uploaded LangGraph and RAG technical papers.`,
        citations: ["Agentic_RAG.pdf", "LangGraph_Docs.url"],
        confidence: 96,
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsGenerating(false);
    }, 3800);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex-1 border border-[#152642] bg-[#091222]/60 rounded-xl p-4 flex flex-col justify-between backdrop-blur-sm min-h-[500px] relative">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#152642] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquareIcon size={16} className="text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Active Chat Workspace
          </h3>
        </div>
        <button
          onClick={handleClearChat}
          title="Clear History"
          className="text-slate-500 hover:text-rose-400 transition p-1 rounded hover:bg-slate-800/40"
        >
          <Trash2Icon size={14} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 min-h-0">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onSelectCitation={(cite) => setSelectedCitation(cite)}
          />
        ))}

        {/* Live Multi-Agent Execution Visualizer */}
        {isGenerating && (
          <div className="ml-8">
            <AgentStatusTracker currentStep={agentStep} isComplete={false} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Action Console */}
      <ChatInputConsole
        onSendMessage={handleSendMessage}
        isGenerating={isGenerating}
      />

      {/* Interactive Source Preview Slide-over Drawer */}
      <SourcePreviewDrawer
        isOpen={!!selectedCitation}
        onClose={() => setSelectedCitation(null)}
        citationName={selectedCitation}
      />
    </div>
  );
}
