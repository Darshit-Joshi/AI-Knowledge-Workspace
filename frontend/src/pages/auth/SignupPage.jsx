import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockIcon, MailIcon, UserIcon, ArrowRightIcon } from "lucide-react";
import { register } from "../../services/authService";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register({ email: email, password: password, username: name });
      setLoading(false);
      navigate("/");
    } catch (err) {
      setLoading(false);
      console.error("Signup error:", err);
      alert(err.message || "Registration failed");
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#070d19] p-4 font-sans text-slate-200">
      <div className="w-full max-w-md space-y-6 bg-[#0a1424] border border-[#1a2f52] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Deploy Your AI Workspace
          </h1>
          <p className="text-xs text-slate-400">
            Initialize your personal vector database and multi-agent RAG
            environment.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <UserIcon
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full bg-[#070d19] border border-[#1e355a] focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Work Email Address
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
                placeholder="alex@company.com"
                className="w-full bg-[#070d19] border border-[#1e355a] focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Master Password
            </label>
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
                placeholder="Create strong password (min 8 chars)"
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
              {loading
                ? "Provisioning Qdrant Collection..."
                : "Initialize Free Workspace"}
            </span>
            {!loading && <ArrowRightIcon size={14} />}
          </button>
        </form>

        <div className="pt-4 border-t border-[#1a2f52] text-center">
          <p className="text-xs text-slate-400">
            Already have an active account?{" "}
            <Link
              to="/login"
              className="text-cyan-400 font-semibold hover:underline"
            >
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
