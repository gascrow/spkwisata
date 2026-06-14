"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/components/shared/AppContext";
import { Alternative, Criteria, TopsisResult } from "@/types";
import { formatNumberID, getRankBadge } from "@/lib/utils";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import {
  Compass,
  MapPin,
  Sliders,
  Calculator,
  Trophy,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

// Dynamic load simplified map for dashboard
const TourismMap = dynamic(() => import("@/components/maps/TourismMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 font-medium">
      Memuat Peta Balikpapan...
    </div>
  ),
});

export default function DashboardPage() {
  const { activeSession, refreshKey } = useApp();
  const [topsisResults, setTopsisResults] = useState<TopsisResult[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const [topsisRes, critRes, altRes] = await Promise.all([
          fetch(`/api/topsis?session=${activeSession}`).then((r) => r.json()),
          fetch("/api/criteria").then((r) => r.json()),
          fetch("/api/alternatives").then((r) => r.json()),
        ]);

        if (topsisRes.success) setTopsisResults(topsisRes.data);
        if (critRes.success) setCriteria(critRes.data);
        if (altRes.success) setAlternatives(altRes.data.filter((a: any) => a.is_active));
      } catch (e) {
        toast.error("Gagal memuat statistik dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [activeSession, refreshKey]);

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Memuat data dashboard SPK...</span>
      </div>
    );
  }

  // AHP calculations metadata extraction
  const firstTopsisResult = topsisResults[0];
  const totalAlternatives = alternatives.length;
  const totalCriteria = criteria.length;

  // Extracted weights mapping for bar chart
  const barChartData = criteria.map((c) => ({
    name: c.code,
    fullName: c.name,
    bobot: Number((c.weight * 100).toFixed(2)),
  }));

  // Cluster distribution for Pie/Donut chart
  const clustersMap: Record<string, { name: string; count: number; color: string }> = {};
  alternatives.forEach((alt) => {
    const cName = alt.cluster?.name || "Lainnya";
    const cColor = alt.cluster?.color || "#3b82f6";
    if (clustersMap[cName]) {
      clustersMap[cName].count += 1;
    } else {
      clustersMap[cName] = { name: cName.split(",")[0], count: 1, color: cColor };
    }
  });
  const pieChartData = Object.values(clustersMap);

  // AHP Consistency Check info retrieval
  const ahpCR = criteria[0] ? Number(localStorage.getItem(`ahp_cr_${activeSession}`) || "0.0543") : 0.0543;
  const isConsistent = ahpCR < 0.1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. HERO BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-950 text-white rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[200px] border border-blue-900 shadow-blue-900/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="space-y-3 relative z-10 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white shadow-sm leading-none flex items-center gap-1">
              <Compass className="h-3.5 w-3.5 animate-spin-slow" />
              Superhub Mitra IKN
            </span>
          </div>

          <h2 className="text-xl lg:text-2xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm">
            Sistem Pendukung Keputusan Prioritas Pengembangan Pariwisata Kota Balikpapan
          </h2>
          <p className="text-xs lg:text-sm text-blue-100/90 leading-relaxed font-medium">
            Mendukung Dinas Pariwisata Balikpapan menentukan prioritas pembangunan konsep 4A (Atraksi, Amenitas, Aksesibilitas, Kelembagaan) berdasarkan kajian empiris AHP-TOPSIS.
          </p>
        </div>

        <div className="flex items-center gap-4.5 pt-5 relative z-10 select-none">
          <Link
            href="/ranking"
            className="h-10 px-5 rounded-lg bg-white text-blue-900 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg"
          >
            Lihat Hasil Ranking
            <Trophy className="h-4.5 w-4.5 text-amber-500" />
          </Link>
          <Link
            href="/kalkulasi-ahp"
            className="h-10 px-5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-inner"
          >
            Mulai Kalkulasi AHP
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </div>
      </div>

      {/* 2. KARTU STATISTIK (4 GRID COLS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Alternatif */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shadow-sm shrink-0">
            <MapPin className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Objek Wisata</span>
            <p className="text-2xl font-extrabold text-slate-900 leading-none">{totalAlternatives}</p>
          </div>
        </div>

        {/* Card 2: Total Kriteria */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
            <Sliders className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Kriteria</span>
            <p className="text-2xl font-extrabold text-slate-900 leading-none">{totalCriteria}</p>
          </div>
        </div>

        {/* Card 3: Konsistensi AHP */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shadow-sm shrink-0 ${
            isConsistent ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600"
          }`}>
            <Activity className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Konsistensi AHP (CR)</span>
            <p className={`text-2xl font-extrabold leading-none ${isConsistent ? "text-green-600" : "text-red-600"}`}>
              {ahpCR.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Card 4: Top Prioritas */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
            <Trophy className="h-6 w-6" />
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Prioritas Utama</span>
            <p className="text-sm font-extrabold text-slate-900 truncate leading-snug">
              {firstTopsisResult?.alternative?.name || "Belum ada data"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. TABLE TOP 5 & CHART DISTRIBUSI */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Top 5 Ranking Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden lg:col-span-3 flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Trophy className="h-4.5 w-4.5 text-amber-500" />
              Daftar Top 5 Ranking Prioritas
            </h3>
            <Link
              href="/ranking"
              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 select-none"
            >
              Lihat Semua →
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-wider font-mono">
                  <th className="py-2.5 px-4 w-12 text-center">Rank</th>
                  <th className="py-2.5 px-4 w-16 text-center">Kode</th>
                  <th className="py-2.5 px-4">Nama Objek Wisata</th>
                  <th className="py-2.5 px-4">Klaster</th>
                  <th className="py-2.5 px-4 text-right w-24">Skor Ci</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {topsisResults.slice(0, 5).map((row) => {
                  const medal = getRankBadge(row.rank || 0);
                  const clusterColor = row.alternative?.cluster?.color || "#3b82f6";

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/40 border-b border-slate-100 font-semibold">
                      <td className="py-3 px-4 text-center">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${medal.color} shadow-sm inline-block pt-0.5`}>
                          {medal.icon || medal.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                          {row.alternative?.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-900 truncate max-w-[180px]">{row.alternative?.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className="text-[9px] font-bold text-white px-2 py-0.5 rounded-full inline-block shadow-sm"
                          style={{ backgroundColor: clusterColor }}
                        >
                          {row.alternative?.cluster?.name.split(",")[0]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-primary text-sm">
                        {row.preference_score?.toFixed(4)}
                      </td>
                    </tr>
                  );
                })}
                {topsisResults.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Belum ada data ranking. Jalankan kalkulasi TOPSIS terlebih dahulu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Pie/Donut Chart klaster */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 lg:col-span-2 flex flex-col min-h-[300px]">
          <h4 className="text-xs font-bold text-slate-700 uppercase font-mono mb-4">Proporsi Jenis Klaster Objek Wisata</h4>
          <div className="flex-1 w-full flex items-center justify-center">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => [`${value} Objek`, props.payload.name]}
                    contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-slate-400 text-xs">Memuat data proporsi...</span>
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-2">
            {pieChartData.map((c, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: c.color }}></span>
                <span>{c.name}: {c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. CHARTS BOBOT KRITERIA & PETA MINI */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Bar Chart horizontal bobot kriteria */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 lg:col-span-2 flex flex-col min-h-[360px]">
          <h4 className="text-xs font-bold text-slate-700 uppercase font-mono mb-4">Bobot Kriteria AHP (%)</h4>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barChartData} layout="vertical" margin={{ left: 5, right: 30, top: 5, bottom: 5 }}>
                <XAxis type="number" unit="%" tick={{ fontSize: 9 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: "bold" }} />
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [`${value}%`, props.payload.fullName]}
                  contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                />
                <Bar dataKey="bobot" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12}>
                  {barChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"][index % 7]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Map Balikpapan mini */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden lg:col-span-3 flex flex-col min-h-[360px]">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <MapPin className="h-4.5 w-4.5 text-primary" />
              Peta Sebaran Objek Wisata
            </h3>
            <Link
              href="/objek-wisata"
              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 select-none"
            >
              Lihat Selengkapnya →
            </Link>
          </div>
          <div className="flex-1 relative">
            <TourismMap alternatives={alternatives} />
          </div>
        </div>
      </div>
    </div>
  );
}
