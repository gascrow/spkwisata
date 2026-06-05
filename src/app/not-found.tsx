"use client";

import Link from "next/link";
import { Compass, Home, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
      {/* Icon Graphic */}
      <div className="relative flex items-center justify-center select-none">
        <Compass className="h-24 w-24 text-primary/10 animate-spin-slow absolute" />
        <span className="text-7xl font-extrabold text-primary font-mono tracking-tighter relative">
          404
        </span>
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-lg font-bold text-slate-900 leading-tight">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan. Silakan kembali ke halaman utama dashboard.
        </p>
      </div>

      <div className="flex items-center gap-3.5 select-none">
        <Link
          href="/dashboard"
          className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow shadow-primary/20"
        >
          <Home className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>
        <Link
          href="/metodologi"
          className="h-10 px-5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center gap-1.5 transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          Lihat Panduan
        </Link>
      </div>
    </div>
  );
}
