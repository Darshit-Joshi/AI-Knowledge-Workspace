import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WorkspaceProvider, useWorkspace } from "./context/WorkspaceContext";
import { KnowledgeProvider } from "./context/KnowledgeContext";
import { ChatProvider } from "./context/ChatContext";
import { ReportProvider } from "./context/ReportContext";

// Page Components
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import ChatPage from "./pages/ChatPage";
import ReportsPage from "./pages/ReportsPage";

/**
 * Internal navigation router that handles view switching based on active state.
 * Uses simple view-state rendering to avoid external routing dependencies while
 * maintaining exact prop compatibility with our domain page components.
 */
function AppRouter() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { activeWorkspace } = useWorkspace();

  // View states: 'DASHBOARD' | 'KNOWLEDGE' | 'CHAT' | 'REPORTS'
  const [currentView, setCurrentView] = useState("DASHBOARD");

  // 1. Global Authentication Loading Spinner
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-slate-400 animate-pulse">
          Verifying JWT session & connecting to FastAPI backend...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated Gateway
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // 3. Ensure users return to dashboard if their active workspace is cleared/deleted
  if (!activeWorkspace && currentView !== "DASHBOARD") {
    setCurrentView("DASHBOARD");
  }

  // 4. Authenticated Workspace Router
  switch (currentView) {
    case "KNOWLEDGE":
      return (
        <KnowledgeBasePage
          onNavigateBack={() => setCurrentView("DASHBOARD")}
          onNavigateToChat={() => setCurrentView("CHAT")}
        />
      );

    case "CHAT":
      return (
        <ChatPage
          onNavigateBack={() => setCurrentView("DASHBOARD")}
          onNavigateToKnowledge={() => setCurrentView("KNOWLEDGE")}
          onNavigateToReports={() => setCurrentView("REPORTS")}
        />
      );

    case "REPORTS":
      return (
        <ReportsPage
          onNavigateBack={() => setCurrentView("DASHBOARD")}
          onNavigateToKnowledge={() => setCurrentView("KNOWLEDGE")}
          onNavigateToChat={() => setCurrentView("CHAT")}
        />
      );

    case "DASHBOARD":
    default:
      return (
        <DashboardPage
          onNavigateToWorkspace={(workspace) => {
            // Default to Knowledge Base view when a workspace card is selected
            setCurrentView("KNOWLEDGE");
          }}
        />
      );
  }
}

/**
 * Root Application Shell
 * Wraps the router in our hierarchical state provider tree.
 */
export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <KnowledgeProvider>
          <ChatProvider>
            <ReportProvider>
              <AppRouter />
            </ReportProvider>
          </ChatProvider>
        </KnowledgeProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
