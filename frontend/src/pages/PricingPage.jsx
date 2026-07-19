import React from "react";
import { CheckIcon, ZapIcon, ShieldIcon, CpuIcon } from "lucide-react";

export default function PricingPage() {
  const tiers = [
    {
      name: "Student / Starter",
      price: "$0",
      desc: "Perfect for PDF chatbots and basic resume projects.",
      features: [
        "3 Workspaces",
        "Up to 15 PDF Uploads",
        "Standard Vector Search",
        "Gemini Flash LLM",
      ],
      popular: false,
    },
    {
      name: "Production Engineer Pro",
      price: "$29",
      desc: "Full Agentic RAG power for AI software engineers.",
      features: [
        "Unlimited Workspaces",
        "YouTube & Web Ingestion",
        "Hybrid Search + Reranking",
        "Multi-Agent Research Mode",
        "Qdrant & Redis Dedicated DB",
        "Export AI Reports",
      ],
      popular: true,
    },
    {
      name: "Enterprise Team",
      price: "$99",
      desc: "Custom knowledge graphs and VPC deployments.",
      features: [
        "Everything in Pro",
        "Custom Embedding Models",
        "SSO & JWT Auth Service",
        "Dedicated CI/CD Pipelines",
        "24/7 Priority Support",
      ],
      popular: false,
    },
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#070d19] space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2 pt-4">
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">
          Scale Your AI Knowledge Workspace
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Choose the tier that fits your engineering workflow. Upgrade anytime
          to unlock advanced Cross-Encoder reranking and multi-agent research
          pipelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {tiers.map((tier, idx) => (
          <div
            key={idx}
            className={`rounded-2xl p-6 flex flex-col justify-between border transition duration-300 relative ${tier.popular ? "bg-gradient-to-b from-[#0e1c33] to-[#091222] border-cyan-500 shadow-2xl shadow-cyan-500/10 scale-105" : "bg-[#091222]/80 border-[#152642] hover:border-slate-700"}`}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-widest shadow-md">
                Most Popular
              </span>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {tier.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{tier.desc}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-100 font-mono">
                  {tier.price}
                </span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-[#152642]/80 text-xs text-slate-300">
                {tier.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-2.5">
                    <CheckIcon size={14} className="text-cyan-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              className={`w-full mt-6 py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wider cursor-pointer ${tier.popular ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20" : "bg-[#0e1a30] hover:bg-slate-800 text-slate-200 border border-[#1e355a]"}`}
            >
              {tier.popular ? "Upgrade to Pro" : "Select Plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
