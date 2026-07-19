import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import GlobalSidebar from "./components/layout/GlobalSidebar";
import WorkspaceSidebar from "./components/layout/WorkspaceSidebar";
import DashboardPage from "./pages/DashboardPage";
import GlobalLibraryPage from "./pages/GlobalLibraryPage";
import ReportsArchivePage from "./pages/ReportsArchivePage";
import PricingPage from "./pages/PricingPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import AnalyticsPage from "./pages/AnalyticsPage";

function AppLayout() {
  const [activeWorkspace, setActiveWorkspace] = useState("genai");
  const location = useLocation();

  // Hide Sidebars on Login and Signup pages
  const isAuthPage = ["/login", "/signup"].includes(location.pathname);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070d19] font-sans text-slate-200">
      {!isAuthPage && <GlobalSidebar />}
      {!isAuthPage && (
        <WorkspaceSidebar
          activeId={activeWorkspace}
          onSelectWorkspace={setActiveWorkspace}
        />
      )}

      <main className="flex-1 flex overflow-hidden min-w-0">
        <Routes>
          <Route
            path="/"
            element={<DashboardPage activeWorkspace={activeWorkspace} />}
          />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/library" element={<GlobalLibraryPage />} />
          <Route path="/reports" element={<ReportsArchivePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
