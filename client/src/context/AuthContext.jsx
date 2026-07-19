import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch authenticated user profile using stored token
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profile = await authService.getMe(); // Hits GET /auth/me
      setUser(profile);
    } catch (err) {
      console.error("Failed to load user profile:", err.message);
      localStorage.removeItem("access_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle initialization and Google OAuth callback token extraction
  useEffect(() => {
    const handleAuthInit = async () => {
      // 1. Check if returning from Google OAuth redirect (e.g., /?token=jwt_here)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");

      if (urlToken) {
        localStorage.setItem("access_token", urlToken);
        // Clean URL without triggering page reload
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }

      // 2. Validate session if token exists
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        await loadProfile();
      } else {
        setIsLoading(false);
      }
    };

    handleAuthInit();

    // 3. Listen for global 401 unauthorized eviction from Axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setError("Your session has expired. Please log in again.");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [loadProfile]);

  // Matches UserLogin schema: { email, password }
  const login = async (credentials) => {
    try {
      setError(null);
      const { access_token } = await authService.login(credentials); // Hits POST /auth/login
      localStorage.setItem("access_token", access_token);
      await loadProfile();
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Matches UserCreate schema: { email, username, password }
  const register = async (userData) => {
    try {
      setError(null);
      await authService.register(userData); // Hits POST /auth/register
      // Automatically log in upon successful registration
      await login({ email: userData.email, password: userData.password });
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  // Triggers OAuth redirect handshake to FastAPI backend
  const loginWithGoogle = () => {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
    window.location.href = `${baseUrl}/auth/google/login`;
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    loginWithGoogle,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
