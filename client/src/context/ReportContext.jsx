import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { reportService } from "../services/api";
import { useWorkspace } from "./WorkspaceContext";

const ReportContext = createContext(null);

export const ReportProvider = ({ children }) => {
  const { activeWorkspace } = useWorkspace();
  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);

  // Fetch all research reports for the active workspace
  const fetchReports = useCallback(
    async (silent = false) => {
      if (!activeWorkspace) {
        setReports([]);
        setActiveReport(null);
        return;
      }
      try {
        if (!silent) setIsLoading(true);
        setError(null);
        const data = await reportService.list(activeWorkspace.id); // Hits GET /workspaces/{id}/reports
        setReports(data);

        // Restore active report if one is selected
        if (activeReport) {
          const updatedActive = data.find((r) => r.id === activeReport.id);
          if (updatedActive) setActiveReport(updatedActive);
        } else if (data.length > 0 && !silent) {
          setActiveReport(data[0]);
        }
      } catch (err) {
        if (!silent) setError(err.message);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [activeWorkspace, activeReport],
  );

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Automated Polling: Check status every 5 seconds if any report is actively generating
  useEffect(() => {
    const hasGeneratingReports = reports.some(
      (rep) => rep.status === "GENERATING",
    );

    if (hasGeneratingReports && !pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(() => {
        fetchReports(true); // Silent background poll
      }, 5000);
    } else if (!hasGeneratingReports && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [reports, fetchReports]);

  const selectReport = async (report) => {
    if (!report || !activeWorkspace) {
      setActiveReport(null);
      return;
    }
    try {
      setError(null);
      // Fetch full report details to ensure complete markdown content is loaded
      const fullReport = await reportService.getById(
        activeWorkspace.id,
        report.id,
      );
      setActiveReport(fullReport);
    } catch (err) {
      setError(err.message);
      setActiveReport(report); // Fallback to list item data
    }
  };

  // Matches ReportGenerateRequest schema: { title, prompt }
  const generateReport = async (payload) => {
    if (!activeWorkspace) throw new Error("No active workspace selected.");
    try {
      setIsGenerating(true);
      setError(null);
      const newReport = await reportService.generate(
        activeWorkspace.id,
        payload,
      );
      setReports((prev) => [newReport, ...prev]);
      setActiveReport(newReport);
      return newReport;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteReport = async (reportId) => {
    if (!activeWorkspace) return;
    try {
      setError(null);
      await reportService.delete(activeWorkspace.id, reportId);
      const remaining = reports.filter((r) => r.id !== reportId);
      setReports(remaining);
      if (activeReport?.id === reportId) {
        setActiveReport(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Helper: Export report markdown as a downloadable .md file
  const exportAsMarkdown = (report) => {
    if (!report || !report.content) return;
    const blob = new Blob([report.content], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const value = {
    reports,
    activeReport,
    isLoading,
    isGenerating,
    error,
    selectReport,
    generateReport,
    deleteReport,
    exportAsMarkdown,
    refreshReports: () => fetchReports(false),
    clearError: () => setError(null),
  };

  return (
    <ReportContext.Provider value={value}>{children}</ReportContext.Provider>
  );
};

export const useReport = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error("useReport must be used within a ReportProvider");
  }
  return context;
};
