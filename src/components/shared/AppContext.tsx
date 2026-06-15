"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AppContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeSession: string;
  setActiveSession: (session: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSession, setActiveSession] = useState("Skenario A");
  const [refreshKey, setRefreshKey] = useState(0);

  // Load initial session on client mount
  useEffect(() => {
    const savedSession = localStorage.getItem("active_session");
    if (savedSession) {
      setActiveSession(savedSession);
    }
  }, []);

  const changeSession = (session: string) => {
    setActiveSession(session);
    localStorage.setItem("active_session", session);
    triggerRefresh();
  };

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        activeSession,
        setActiveSession: changeSession,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
