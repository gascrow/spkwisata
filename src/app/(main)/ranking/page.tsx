"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/components/shared/AppContext";
import { TopsisResult, Criteria, Cluster } from "@/types";
import { formatNumberID, getRankBadge, getScoreColor, getScoreLabel } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Trophy,
  Sliders,
  Filter,
  TrendingUp,
  FileSpreadsheet,
  FileDown,
  Info,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";


export default function RankingPage() {
  const { activeSession, refreshKey } = useApp();
  const [topsisResults, setTopsisResults] = useState<TopsisResult[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);

  // States for filters
  const [filterCluster, setFilterCluster] = useState("all");
  const [filterLimit, setFilterLimit] = useState<"all" | "10" | "20">("all");

  // Accordion expand row mapping (altId -> boolean)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [topsisRes, critRes, clustRes, ahpRes] = await Promise.all([
          fetch(`/api/topsis?session=${activeSession}`).then((r) => r.json()),
          fetch("/api/criteria").then((r) => r.json()),
          fetch("/api/clusters", { cache: "no-store" }).then((r) => r.json()),
          fetch(`/api/ahp?session=${activeSession}`).then((r) => r.json()),
        ]);

        if (topsisRes.success) setTopsisResults(topsisRes.data);
        if (critRes.success) {
          let critData = critRes.data;
          if (ahpRes.success && ahpRes.data?.results?.length > 0) {
            const weightMap: Record<string, number> = {};
            ahpRes.data.results.forEach((r: any) => {
              weightMap[r.criteria_id] = Number(r.weight);
            });
            critData = critData.map((c: any) => ({
              ...c,
              weight: weightMap[c.id] !== undefined ? weightMap[c.id] : c.weight,
            }));
          }
          setCriteria(critData);
        }
        if (clustRes.success) setClusters(clustRes.data);
      } catch (e) {
        toast.error("Gagal memuat ranking");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeSession, refreshKey]);

  // Toggle accordion details
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter logic
  const filteredResults = topsisResults
    .filter((r) => {
      const matchesCluster = filterCluster === "all" || r.alternative?.cluster_id === filterCluster;
      return matchesCluster;
    })
    .slice(0, filterLimit === "all" ? undefined : parseInt(filterLimit));

  // If no calculations saved yet
  if (topsisResults.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-sm flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-5">
        <div className="h-14 w-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 animate-pulse">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 text-base">Hasil Ranking Belum Tersedia</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Kalkulasi TOPSIS belum pernah dijalankan atau disimpan untuk sesi <strong className="text-slate-800">{activeSession}</strong>. Silakan jalankan kalkulasi TOPSIS terlebih dahulu.
          </p>
        </div>
        <Link href="/kalkulasi-ahp" className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center justify-center transition-colors shadow shadow-primary/20">
          Mulai Hitung Ranking
        </Link>
      </div>
    );
  }

  // Details for top metadata
  const calculatedAt = topsisResults[0]?.calculated_at
    ? new Date(topsisResults[0].calculated_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  // Data preparation for visualizations:
  // a. Bar Chart: Top 15 alternatives
  const barChartData = topsisResults.slice(0, 15).map((r) => ({
    name: r.alternative?.code || "",
    fullName: r.alternative?.name || "",
    ci: Number((r.preference_score || 0).toFixed(4)),
    color: r.alternative?.cluster?.color || "#3b82f6",
  }));

  // b. Radar Chart: Top 3 profiles
  const top3 = topsisResults.slice(0, 3);
  const radarChartData = criteria.map((c) => {
    const item: Record<string, any> = { subject: c.code, name: c.name };
    top3.forEach((r, idx) => {
      const scoreObj = r.alternative?.scores?.find((s) => s.criteria_id === c.id);
      item[`top_${idx + 1}`] = scoreObj ? Number(scoreObj.score_value) : 3.0;
    });
    return item;
  });

  // c. Scatter Plot: D+ vs D-
  const scatterData = topsisResults.map((r) => ({
    x: Number(r.d_positive || 0),
    y: Number(r.d_negative || 0),
    code: r.alternative?.code || "",
    name: r.alternative?.name || "",
    color: r.alternative?.cluster?.color || "#3b82f6",
  }));

  // d. Stacked Bar Chart: Cluster top 10 distribution
  const top10 = topsisResults.slice(0, 10);
  const clusterDistributionData = clusters.map((c) => {
    const count = top10.filter((r) => r.alternative?.cluster_id === c.id).length;
    return {
      name: c.name.split(",")[0],
      jumlah: count,
      color: c.color || "#3b82f6",
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP 3 CARDS PRIORITAS */}
      {topsisResults.length >= 3 && filterCluster === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((rankNum) => {
            const row = topsisResults[rankNum - 1];
            if (!row) return null;

            const badge = getRankBadge(rankNum);
            const clusterColor = row.alternative?.cluster?.color || "#3b82f6";
            const image = row.alternative?.image_url || "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=500";

            return (
              <div
                key={row.id}
                className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm relative group flex flex-col hover:shadow-md transition-all duration-300"
              >
                {/* Image background header */}
                <div className="h-32 w-full relative overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={row.alternative?.name}
                    className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent"></div>

                  {/* Badge Medal Overlay */}
                  <div className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shadow">
                    {badge.icon}
                  </div>

                  <div className="absolute bottom-3 left-3 text-white">
                    <span className="font-mono text-[10px] font-extrabold uppercase bg-white/25 px-2 py-0.5 rounded border border-white/10 shadow">
                      Rank {badge.label}
                    </span>
                    <span className="block font-extrabold text-sm mt-1 leading-snug truncate max-w-[240px]">
                      {row.alternative?.name}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        Kode: {row.alternative?.code}
                      </span>
                      <span
                        className="text-[9px] font-bold text-white px-2 py-0.5 rounded-full inline-block"
                        style={{ backgroundColor: clusterColor }}
                      >
                        {row.alternative?.cluster?.name.split(",")[0]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {row.alternative?.description || "Tidak ada deskripsi singkat."}
                    </p>
                  </div>

                  {/* Preference score display */}
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-500">Nilai Preferensi (Ci)</span>
                      <span className="text-xs font-bold text-primary font-mono">
                        {(row.preference_score || 0).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200/80 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${(row.preference_score || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 font-mono">
                        {((row.preference_score || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. HEADER METADATA & FILTERS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-slate-500 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60 font-semibold select-none">
            <Calendar className="h-4 w-4 text-primary" />
            Terakhir Kalkulasi: <span className="text-slate-800 font-bold ml-1">{calculatedAt}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60 font-semibold select-none">
            <Trophy className="h-4 w-4 text-amber-500" />
            Total Destinasi Wisata: <span className="text-slate-800 font-bold ml-1">{topsisResults.length}</span>
          </div>
        </div>

        {/* Right: Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterCluster}
              onChange={(e) => setFilterCluster(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 outline-none text-xs px-2.5 bg-white cursor-pointer"
            >
              <option value="all">Semua Klaster</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.split(",")[0]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-xs font-bold font-mono">
            <button
              onClick={() => setFilterLimit("all")}
              className={`px-3 py-2 transition-colors ${
                filterLimit === "all" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              SEMUA
            </button>
            <button
              onClick={() => setFilterLimit("10")}
              className={`px-3 py-2 border-l border-slate-200 transition-colors ${
                filterLimit === "10" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              TOP 10
            </button>
            <button
              onClick={() => setFilterLimit("20")}
              className={`px-3 py-2 border-l border-slate-200 transition-colors ${
                filterLimit === "20" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              TOP 20
            </button>
          </div>

          <Link href="/laporan" className="h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Ekspor Laporan
          </Link>
        </div>
      </div>

      {/* 3. TABLE RANKING UTAMA */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-14 text-center">Rank</th>
                <th className="py-3 px-4 w-20 text-center">Kode</th>
                <th className="py-3 px-4">Nama Destinasi Wisata</th>
                <th className="py-3 px-4">Kelompok Klaster</th>
                {criteria.map((c) => (
                  <th key={c.id} className="py-3 px-3 text-center w-12" title={c.name}>
                    {c.code}
                  </th>
                ))}
                <th className="py-3 px-4 w-28 text-right font-mono">D+</th>
                <th className="py-3 px-4 w-28 text-right font-mono">D-</th>
                <th className="py-3 px-4 w-32 text-right">Skor Ci</th>
                <th className="py-3 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold">
              {filteredResults.map((row) => {
                const isExpanded = !!expandedRows[row.alternative_id];
                const clusterColor = row.alternative?.cluster?.color || "#3b82f6";
                const medal = getRankBadge(row.rank || 0);

                return (
                  <React.Fragment key={row.id}>
                    <tr
                      onClick={() => toggleRow(row.alternative_id)}
                      className={`hover:bg-slate-50/50 cursor-pointer transition-colors group ${
                        isExpanded ? "bg-slate-50/20" : ""
                      }`}
                    >
                      {/* Medal Rank */}
                      <td className="py-3 px-4 text-center">
                        <span className={`h-6.5 w-6.5 rounded-full flex items-center justify-center font-bold text-xs ${medal.color} shadow-sm`}>
                          {medal.icon || medal.label}
                        </span>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-extrabold shadow-sm">
                          {row.alternative?.code}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-semibold group-hover:text-primary transition-colors">
                            {row.alternative?.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                            {row.alternative?.address || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Cluster */}
                      <td className="py-3 px-4">
                        <span
                          className="text-[9px] font-bold text-white px-2.5 py-0.5 rounded-full inline-block shadow-sm"
                          style={{ backgroundColor: clusterColor }}
                        >
                          {row.alternative?.cluster?.name.split(",")[0]}
                        </span>
                      </td>

                      {/* K1-K7 mini cells */}
                      {criteria.map((c) => {
                        const scoreObj = row.alternative?.scores?.find((s) => s.criteria_id === c.id);
                        const scoreVal = scoreObj ? Number(scoreObj.score_value) : 3;
                        return (
                          <td key={c.id} className="py-3 px-3 text-center">
                            <span className={`h-5 w-5 text-[9px] font-bold rounded flex items-center justify-center font-mono inline-block pt-0.5 leading-normal ${getScoreColor(scoreVal)}`}>
                              {scoreVal}
                            </span>
                          </td>
                        );
                      })}

                      {/* D+ */}
                      <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400">
                        {row.d_positive?.toFixed(6)}
                      </td>

                      {/* D- */}
                      <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400">
                        {row.d_negative?.toFixed(6)}
                      </td>

                      {/* Ci score */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-primary text-sm">
                        {row.preference_score?.toFixed(4)}
                      </td>

                      {/* Toggle button */}
                      <td className="py-3 px-4 text-center">
                        <button className="text-slate-400 group-hover:text-slate-800 transition-colors">
                          {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Accordion Expand Area */}
                    {isExpanded && (
                      <tr className="bg-slate-50/35 border-b border-slate-100">
                        <td colSpan={14} className="p-4 bg-slate-50/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                            {/* Detail Deskripsi */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Deskripsi Objek Wisata
                              </span>
                              <p className="text-slate-600 leading-relaxed">
                                {row.alternative?.description || "Tidak ada penjelasan tambahan."}
                              </p>
                              <div className="text-[10px] text-slate-400 flex items-center gap-4 pt-1">
                                <span>Latitude: {row.alternative?.latitude}</span>
                                <span>Longitude: {row.alternative?.longitude}</span>
                              </div>
                            </div>

                            {/* Detail Rating Nilai Kriteria */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Rincian Penilaian Kriteria
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {criteria.map((c) => {
                                  const scoreObj = row.alternative?.scores?.find((s) => s.criteria_id === c.id);
                                  const scoreVal = scoreObj ? Number(scoreObj.score_value) : 3;
                                  const desc = c.sub_criteria?.find((sc) => sc.score_value === scoreVal)?.description || "";

                                  return (
                                    <div key={c.id} className="p-2 border border-slate-200/60 rounded bg-white flex items-start gap-2 shadow-sm">
                                      <span className={`h-5 w-5 rounded text-[9px] font-mono font-bold flex items-center justify-center shrink-0 ${getScoreColor(scoreVal)}`}>
                                        {scoreVal}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[10px] text-slate-700 leading-tight">
                                          {c.code} — {c.name}
                                        </p>
                                        <p className="text-[9px] text-slate-500 leading-normal line-clamp-2 mt-0.5" title={desc}>
                                          {desc}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. VISUALIZATION CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        {/* CHART a. BAR CHART SKOR Ci TOP 15 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col min-h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase font-mono">a. Grafik Skor Preferensi Ci (Top 15)</h4>
            <TrendingUp className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barChartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                <XAxis type="number" domain={[0, 1.0]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontWeight: "bold" }} />
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [value, props.payload.fullName]}
                  contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                />
                <Bar dataKey="ci" radius={[0, 4, 4, 0]} barSize={14}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART b. RADAR CHART PROFILE PERBANDINGAN TOP 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col min-h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase font-mono">b. Radar Profil 3 Alternatif Teratas</h4>
            <Info className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <div className="flex-1 w-full flex items-center justify-center">
            {top3.length > 0 ? (
              <ResponsiveContainer width="100%" height={265}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: "bold" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fontSize: 9 }} />
                  <Radar
                    name={top3[0]?.alternative?.name || ""}
                    dataKey="top_1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.25}
                  />
                  {top3[1] && (
                    <Radar
                      name={top3[1]?.alternative?.name || ""}
                      dataKey="top_2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.25}
                    />
                  )}
                  {top3[2] && (
                    <Radar
                      name={top3[2]?.alternative?.name || ""}
                      dataKey="top_3"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.25}
                    />
                  )}
                  <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-slate-400 text-xs">Memuat data radar...</span>
            )}
          </div>
        </div>

        {/* CHART c. SCATTER PLOT D+ VS D- */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col min-h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase font-mono">c. Scatter Plot Jarak Solusi (D+ vs D-)</h4>
            <span className="text-[10px] text-slate-400 italic">Mendekati kanan-bawah = Makin Unggul</span>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <XAxis type="number" dataKey="x" name="Jarak Positif D+" label={{ value: "D+ (Makin kecil makin baik)", position: "insideBottom", offset: -5, fontSize: 10 }} tick={{ fontSize: 9 }} />
                <YAxis type="number" dataKey="y" name="Jarak Negatif D-" label={{ value: "D- (Makin besar makin baik)", angle: -90, position: "insideLeft", fontSize: 10 }} tick={{ fontSize: 9 }} />
                <ZAxis dataKey="code" name="Alternatif" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value: any, name: any, props: any) => [`${value.toFixed(6)}`, props.payload.name]}
                  contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                />
                <Scatter name="Alternatif" data={scatterData} fill="#3b82f6">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART d. CLUSTER DISTRIBUTION IN TOP 10 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col min-h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase font-mono">d. Distribusi Jenis Klaster di Top 10</h4>
            <Trophy className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={clusterDistributionData} margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: "semibold" }} />
                <YAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                <Bar dataKey="jumlah" radius={[4, 4, 0, 0]} barSize={28}>
                  {clusterDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
