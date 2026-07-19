import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function RegisterForm({ onSwitchToLogin }) {
  const { register, loginWithGoogle, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const handleChange = (e) => {
    if (error) clearError();
    if (validationError) setValidationError(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (formData.username.trim().length < 3) {
      setValidationError("Username must be at least 3 characters long.");
      return false;
    }
    if (formData.password.length < 8) {
      setValidationError("Password must be at least 8 characters long.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await register(formData);
    } catch (err) {
      // Caught in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100">Create Account</h2>
        <p className="text-sm text-slate-400 mt-1">
          Deploy your isolated AI knowledge base
        </p>
      </div>

      {(error || validationError) && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-sm">
          {validationError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            placeholder="developer@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            minLength={3}
            maxLength={50}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            placeholder="johndoe"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            placeholder="Min. 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-sm transition duration-150 flex items-center justify-center"
        >
          {isSubmitting ? "Provisioning Account..." : "Register"}
        </button>
      </form>

      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-slate-800"></div>
        <span className="px-3 text-xs text-slate-500">OR</span>
        <div className="flex-1 border-t border-slate-800"></div>
      </div>

      <button
        type="button"
        onClick={loginWithGoogle}
        className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium py-2 px-4 rounded-lg text-sm transition duration-150 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.3 8.9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
          />
          <path
            fill="#FBBC05"
            d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.4C.6 9.4 0 10.6 0 12s.6 2.6 1.6 4.6l3.7-1.8z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.2L1.6 16.6C3.5 20.4 7.4 23 12 23z"
          />
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-xs text-slate-400 mt-6">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline"
        >
          Sign In
        </button>
      </p>
    </div>
  );
}
