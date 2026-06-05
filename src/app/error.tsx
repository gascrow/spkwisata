"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error in console for development debugging
    console.error("SPK Application Crash Captured:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 space-y-6 select-none font-sans">
      <div className="h-16 w-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm animate-bounce">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <div className="space-y-2.5 max-w-lg">
        <h2 className="text-base font-bold text-slate-900 leading-tight">
          Terjadi Kesalahan Sistem
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Sistem mengalami kegagalan proses internal. Silakan coba muat ulang komponen ini atau kembali ke halaman utama.
        </p>
        {error.message && (
          <div className="bg-red-50 text-red-700/90 font-mono text-[10px] p-2.5 rounded-lg border border-red-200/50 max-h-32 overflow-y-auto text-left leading-normal break-all">
            <strong>Detail Error:</strong> {error.message}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow shadow-primary/20 cursor-pointer"
        >
          <RotateCw className="h-4 w-4" />
          Muat Ulang Halaman
        </button>

        <Link
          href="/dashboard"
          className="h-10 px-5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
        >
          <Home className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
