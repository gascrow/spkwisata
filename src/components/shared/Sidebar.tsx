"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MapPin,
  Sliders,
  Calculator,
  BarChart3,
  Trophy,
  FileText,
  BookOpen,
  Library,
  ChevronLeft,
  Compass,
} from "lucide-react";

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainMenus: MenuItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Objek Wisata", href: "/objek-wisata", icon: MapPin },
  { title: "Kriteria", href: "/kriteria", icon: Sliders },
];

const analysisMenus: MenuItem[] = [
  { title: "Kalkulasi AHP", href: "/kalkulasi-ahp", icon: Calculator },
  { title: "Ranking", href: "/ranking", icon: Trophy },
];

const otherMenus: MenuItem[] = [
  { title: "Laporan", href: "/laporan", icon: FileText },
  { title: "Metodologi", href: "/metodologi", icon: BookOpen },
  { title: "Sumber Referensi", href: "/sumber-referensi", icon: Library },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useApp();

  const renderLinks = (items: MenuItem[]) => {
    return items.map((item) => {
      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
      const Icon = item.icon;

      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
            isActive
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          )}
        >
          <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
          <span
            className={cn(
              "transition-all duration-300 whitespace-nowrap overflow-hidden",
              sidebarOpen ? "w-40 opacity-100" : "w-0 opacity-0 lg:group-hover:w-auto"
            )}
          >
            {item.title}
          </span>

          {/* Tooltip on collapse */}
          {!sidebarOpen && (
            <span className="absolute left-16 bg-slate-900 text-white text-xs font-semibold px-2 py-1.5 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap hidden lg:block shadow-lg border border-slate-800">
              {item.title}
            </span>
          )}
        </Link>
      );
    });
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-950 text-slate-100 border-r border-slate-900 transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-60" : "w-16 -translate-x-full lg:translate-x-0"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-900 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
            <Compass className="h-5.5 w-5.5 text-white animate-spin-slow" />
          </div>
          <div className={cn("flex flex-col transition-all duration-300", sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0")}>
            <span className="font-bold text-sm leading-tight tracking-wide text-white whitespace-nowrap">SPK Pariwisata</span>
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Kota Balikpapan</span>
          </div>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors duration-200 hidden lg:block"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
        </button>
      </div>

      {/* Menus */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {/* Main Menus */}
        <div className="space-y-1.5">
          <p className={cn("text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 transition-all duration-300", !sidebarOpen && "scale-0 h-0 overflow-hidden mb-0")}>
            Menu Utama
          </p>
          {renderLinks(mainMenus)}
        </div>

        {/* Analysis Menus */}
        <div className="space-y-1.5 border-t border-slate-900/60 pt-4">
          <p className={cn("text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 transition-all duration-300", !sidebarOpen && "scale-0 h-0 overflow-hidden mb-0")}>
            Menu Analisis
          </p>
          {renderLinks(analysisMenus)}
        </div>

        {/* Other Menus */}
        <div className="space-y-1.5 border-t border-slate-900/60 pt-4">
          <p className={cn("text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 transition-all duration-300", !sidebarOpen && "scale-0 h-0 overflow-hidden mb-0")}>
            Menu Lainnya
          </p>
          {renderLinks(otherMenus)}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/40 text-center shrink-0">
        <div className={cn("transition-all duration-300 flex flex-col items-center justify-center gap-0.5", sidebarOpen ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden")}>
          <span className="text-[10px] font-semibold text-slate-500 tracking-wider">VERSI 1.0</span>
          <span className="text-[10px] text-slate-600 font-medium">© 2026 Dinas Pariwisata</span>
        </div>
        {!sidebarOpen && <span className="text-[10px] font-bold text-slate-600">V1.0</span>}
      </div>
    </aside>
  );
}
