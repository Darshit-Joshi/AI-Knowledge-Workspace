import React from "react";
import { FileTextIcon, ArrowRightIcon, SparklesIcon } from "lucide-react";

export default function ReportGeneratorCard() {
  return (
    <section className="border border-[#152642] bg-[#091222]/60 rounded-xl p-4 backdrop-blur-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          <FileTextIcon size={14} className="text-emerald-400" />
          <span>Synthesis & Reports</span>
        </div>
        <h4 className="text-xs font-bold text-slate-200">
          Hallucination Mitigation Review
        </h4>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          Aggregates consensus analysis points organically across current
          dynamic models and retrieved chunks.
        </p>
      </div>

      <button className="w-full mt-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition text-slate-950 text-xs font-bold py-2 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer">
        <SparklesIcon size={13} />
        <span>Generate AI Report</span>
        <ArrowRightIcon size={13} />
      </button>
    </section>
  );
}
