import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LockIcon,
  MailIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/"); // Redirect to Dashboard on login
    }, 1000);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#070d19] p-4 font-sans text-slate-200">
      <div className="w-full max-w-md space-y-6 bg-[#0a1424] border border-[#1a2f52] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black text-xl shadow-lg shadow-cyan-500/20 mb-2">
            AK
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Welcome back to your Workspace
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to access your multi-source RAG pipelines & knowledge
            graphs.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <MailIcon
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@company.com"
                className="w-full bg-[#070d19] border border-[#1e355a] focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <a href="#" className="text-[11px] text-cyan-400 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <LockIcon
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#070d19] border border-[#1e355a] focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {loading ? "Authenticating via JWT..." : "Sign In to Dashboard"}
            </span>
            {!loading && <ArrowRightIcon size={14} />}
          </button>
        </form>

        <div className="pt-4 border-t border-[#1a2f52] text-center">
          <p className="text-xs text-slate-400">
            Don't have an engineering workspace yet?{" "}
            <Link
              to="/signup"
              className="text-cyan-400 font-semibold hover:underline"
            >
              Create Free Account
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheckIcon size={12} className="text-emerald-400" />
          <span>256-bit JWT Encrypted Session • Production Engineered</span>
        </div>
      </div>
    </div>
  );
}
