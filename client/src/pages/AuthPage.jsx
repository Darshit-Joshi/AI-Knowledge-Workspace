import React, { useState } from "react";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";

export default function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Production RAG Platform
        </div>
        <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight">
          AI Knowledge Workspace
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-md">
          Multi-agent RAG architecture with hybrid search, autonomous research
          reports, and verified citations.
        </p>
      </div>

      {isLoginView ? (
        <LoginForm onSwitchToRegister={() => setIsLoginView(false)} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setIsLoginView(true)} />
      )}
    </div>
  );
}
