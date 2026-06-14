"use client";

import { useApp } from "./AppContext";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Layers, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard Utama",
  "/objek-wisata": "Manajemen Objek Wisata",
  "/kriteria": "Kriteria & Sub-Kriteria",
  "/kalkulasi-ahp": "Kalkulasi Bobot AHP",
  "/kalkulasi-topsis": "Kalkulasi Ranking TOPSIS",
  "/ranking": "Hasil Ranking Prioritas",
  "/laporan": "Ekspor Laporan Keputusan",
  "/metodologi": "Metodologi AHP-TOPSIS",
  "/sumber-referensi": "Sumber Referensi & Regulasi",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen, activeSession, setActiveSession } = useApp();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const currentTitle = pageTitles[pathname] || "Sistem Pendukung Keputusan";

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ label: "Home", active: true }];

    const crumbs = [{ label: "SPK", active: false }];
    segments.forEach((seg, idx) => {
      const isLast = idx === segments.length - 1;
      const formattedLabel = seg
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      crumbs.push({ label: formattedLabel, active: isLast });
    });

    return crumbs;
  };

  const sessions = ["Default", "Skenario A", "Skenario B", "Alternatif IKN"];

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 shrink-0 shadow-sm transition-all duration-300">
      {/* Left side: Toggle button & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col select-none">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
            {getBreadcrumbs().map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                <span className={cn(crumb.active ? "text-primary font-bold" : "hover:text-slate-600 transition-colors duration-150")}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
          {/* Page Title */}
          <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Right side: Session badge / select */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 shadow-sm shrink-0">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-slate-500 mr-1.5">Sesi:</span>
          <select
            value={activeSession}
            onChange={(e) => setActiveSession(e.target.value)}
            className="bg-transparent border-none outline-none text-xs font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
          >
            {sessions.map((s) => (
              <option key={s} value={s} className="bg-white text-slate-800">
                {s}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-colors group"
          title="Logout"
        >
          <LogOut className="h-4 w-4 text-slate-500 group-hover:text-red-500 transition-colors" />
        </button>
      </div>
    </header>
  );
}
