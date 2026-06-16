"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/components/shared/AppContext";
import { Criteria } from "@/types";
import { formatNumberID, formatFraction, SAATY_SCALE } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  ChevronRight,
  Calculator,
  ArrowRight,
  Undo2,
  Save,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";

export default function KalkulasiAhpPage() {
  const { activeSession, refreshKey, triggerRefresh } = useApp();
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stepper state
  const [step, setStep] = useState<1 | 2>(1);

  // Comparison state: key: "criteria_i_id-criteria_j_id" -> value
  const [comparisons, setComparisons] = useState<Record<string, number>>({});

  // Calculation outputs
  const [calcResults, setCalcResults] = useState<{
    matrix: number[][];
    normalizedMatrix: number[][];
    weights: number[];
    lambdaMax: number;
    ci: number;
    cr: number;
    isConsistent: boolean;
  } | null>(null);

  // Fetch criteria and existing comparisons
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [critRes, ahpRes] = await Promise.all([
          fetch("/api/criteria").then((r) => r.json()),
          fetch(`/api/ahp?session=${activeSession}`).then((r) => r.json()),
        ]);

        if (critRes.success) {
          const list = critRes.data as Criteria[];
          setCriteria(list);

          // Restore saved comparisons or set defaults
          const comps: Record<string, number> = {};
          if (ahpRes.success && ahpRes.data.matrices?.length > 0) {
            ahpRes.data.matrices.forEach((m: any) => {
              comps[`${m.criteria_i_id}-${m.criteria_j_id}`] = Number(m.value);
            });
          }

          // Ensure all pairs exist (even if some matrices were missing or new criteria were added)
          for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
              const key = `${list[i].id}-${list[j].id}`;
              if (comps[key] === undefined) {
                comps[key] = 1;
              }
            }
          }
          setComparisons(comps);

          // If results exist and match the current criteria list length, display step 2 directly
          if (ahpRes.success && ahpRes.data.results?.length === list.length) {
            const res = ahpRes.data.results;
            const matrixN = list.length;
            const matrix: number[][] = Array.from({ length: matrixN }, () => new Array(matrixN).fill(1));
            const norm: number[][] = Array.from({ length: matrixN }, () => new Array(matrixN).fill(0));

            // Reconstruct full numerical matrix from saved comparisons
            const flatComparisons: Record<string, number> = {};
            ahpRes.data.matrices.forEach((m: any) => {
              flatComparisons[`${m.criteria_i_id}-${m.criteria_j_id}`] = Number(m.value);
            });

            const critIds = list.map((c) => c.id);
            for (let i = 0; i < matrixN; i++) {
              for (let j = 0; j < matrixN; j++) {
                if (i === j) matrix[i][j] = 1;
                else if (i < j) {
                  const val = flatComparisons[`${critIds[i]}-${critIds[j]}`] || 1;
                  matrix[i][j] = Math.round(val * 100) / 100;
                } else {
                  const val = 1 / (flatComparisons[`${critIds[j]}-${critIds[i]}`] || 1);
                  matrix[i][j] = Math.round(val * 100) / 100;
                }
              }
            }

            // Normalization
            const colSums = new Array(matrixN).fill(0);
            for (let j = 0; j < matrixN; j++) {
              for (let i = 0; i < matrixN; i++) {
                colSums[j] += matrix[i][j];
              }
            }
            for (let i = 0; i < matrixN; i++) {
              for (let j = 0; j < matrixN; j++) {
                norm[i][j] = matrix[i][j] / colSums[j];
              }
            }

            const wMap = res.map((r: any) => Number(r.weight));
            setCalcResults({
              matrix,
              normalizedMatrix: norm,
              weights: wMap,
              lambdaMax: Number(res[0].lambda_max),
              ci: Number(res[0].ci),
              cr: Number(res[0].cr),
              isConsistent: !!res[0].is_consistent,
            });
            setStep(2);
          } else {
            setCalcResults(null);
            setStep(1);
          }
        }
      } catch (err) {
        toast.error("Gagal memuat data AHP");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeSession, refreshKey]);

  // Handle cell value change (for upper triangle)
  const handleValChange = (id_i: string, id_j: string, value: number) => {
    setComparisons((prev) => ({
      ...prev,
      [`${id_i}-${id_j}`]: value,
    }));
  };

  // Run calculation
  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const response = await fetch("/api/ahp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionName: activeSession,
          comparisons,
        }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Kalkulasi AHP Berhasil!");
        const res = result.data;

        // Reconstruct matrix locally for display
        const n = criteria.length;
        const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(1));
        const critIds = criteria.map((c) => c.id);

        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            if (i === j) matrix[i][j] = 1;
            else if (i < j) {
              const val = comparisons[`${critIds[i]}-${critIds[j]}`] || 1;
              matrix[i][j] = Math.round(val * 100) / 100;
            } else {
              const val = 1 / (comparisons[`${critIds[j]}-${critIds[i]}`] || 1);
              matrix[i][j] = Math.round(val * 100) / 100;
            }
          }
        }

        setCalcResults({
          matrix,
          normalizedMatrix: res.normalizedMatrix,
          weights: res.weights,
          lambdaMax: res.lambdaMax,
          ci: res.ci,
          cr: res.cr,
          isConsistent: res.isConsistent,
        });
        setStep(2);
        triggerRefresh();
      } else {
        toast.error(result.error || "Gagal menghitung AHP");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setCalculating(false);
    }
  };

  // Reset calculations
  const handleReset = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus data hasil AHP untuk sesi ini?")) return;
    try {
      const res = await fetch(`/api/topsis?session=${activeSession}`, { method: "DELETE" }).then((r) => r.json());
      if (res.success) {
        toast.success("Data kalkulasi berhasil di-reset!");
        setCalcResults(null);
        setStep(1);
        triggerRefresh();
      }
    } catch (e) {
      toast.error("Koneksi gagal");
    }
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Memuat data kalkulasi AHP...</span>
      </div>
    );
  }

  // Pre-calculate columns sums for display
  const colSums = calcResults
    ? calcResults.matrix[0].map((_, j) => calcResults.matrix.reduce((sum, row) => sum + row[j], 0))
    : [];

  const normColSums = calcResults
    ? calcResults.normalizedMatrix[0].map((_, j) => calcResults.normalizedMatrix.reduce((sum, row) => sum + row[j], 0))
    : [];

  // Recharts payload
  const chartData = criteria.map((c, idx) => ({
    name: c.code,
    fullName: c.name,
    weight: calcResults ? Number((calcResults.weights[idx] * 100).toFixed(2)) : 0,
    color: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"][idx % 7],
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stepper Header Navigation */}
      <div className="flex items-center justify-center border-b border-slate-200 bg-white p-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-8">
          <button
            onClick={() => step === 2 && setStep(1)}
            className={`flex items-center gap-2 pb-1 text-sm font-bold border-b-2 transition-all ${step === 1 ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
          >
            <span className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-xs">1</span>
            Input Matriks Perbandingan
          </button>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <button
            disabled={!calcResults}
            onClick={() => step === 1 && calcResults && setStep(2)}
            className={`flex items-center gap-2 pb-1 text-sm font-bold border-b-2 transition-all ${step === 2 ? "border-primary text-primary" : "border-transparent text-slate-400 enabled:hover:text-slate-600 disabled:opacity-50"
              }`}
          >
            <span className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-xs">2</span>
            Hasil Kalkulasi & Bobot AHP
          </button>
        </div>
      </div>

      {/* STEP 1: INPUT MATRIX */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Header Title */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-slate-900 text-sm">Matriks Perbandingan Berpasangan</h2>
              </div>
              <span className="text-xs text-slate-500 font-semibold italic">* Isilah sel di atas diagonal</span>
            </div>

            {/* Matrix Input Table */}
            <div className="overflow-x-auto p-4">
              <table className="w-full text-left border-collapse border border-slate-200 font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold font-mono">
                    <th className="py-3.5 px-3 border border-slate-200 text-center bg-slate-100/50 w-24">Kriteria</th>
                    {criteria.map((c) => (
                      <th key={c.id} className="py-3.5 px-3 border border-slate-200 text-center w-28" title={c.name}>
                        {c.code}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {criteria.map((rowCrit, i) => (
                    <tr key={rowCrit.id} className="hover:bg-slate-50/30">
                      <td className="py-3.5 px-3 border border-slate-200 font-bold bg-slate-50 font-mono text-center" title={rowCrit.name}>
                        {rowCrit.code}
                      </td>

                      {criteria.map((colCrit, j) => {
                        // Case 1: Diagonal
                        if (i === j) {
                          return (
                            <td key={colCrit.id} className="py-3.5 px-3 border border-slate-200 text-center bg-slate-100 font-mono font-bold text-slate-400 select-none">
                              1
                            </td>
                          );
                        }

                        // Case 2: Upper Triangle (editable)
                        if (i < j) {
                          const val = comparisons[`${rowCrit.id}-${colCrit.id}`] || 1;
                          return (
                            <td key={colCrit.id} className="p-1.5 border border-slate-200 text-center bg-white">
                              <select
                                value={val}
                                onChange={(e) => handleValChange(rowCrit.id, colCrit.id, Number(e.target.value))}
                                className="w-full h-8 px-1.5 border border-slate-200/80 rounded outline-none text-xs font-mono text-center font-bold bg-white cursor-pointer hover:border-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/20"
                              >
                                {SAATY_SCALE.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          );
                        }

                        // Case 3: Lower Triangle (auto mirror reciprocal 1/value)
                        const upperVal = comparisons[`${colCrit.id}-${rowCrit.id}`] || 1;
                        const lowerVal = 1 / upperVal;

                        return (
                          <td key={colCrit.id} className="py-3.5 px-3 border border-slate-200 text-center bg-slate-50/50 font-mono font-semibold text-slate-500 select-none">
                            {formatFraction(lowerVal)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stepper Footer Action */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={handleReset}
                disabled={!calcResults}
                className="h-10 px-4 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Reset Bobot
              </button>

              <button
                onClick={handleCalculate}
                disabled={calculating}
                className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-primary/10 transition-all cursor-pointer"
              >
                {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4.5 w-4.5" />}
                Jalankan Kalkulasi AHP
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: TRANSPARENT RESULTS */}
      {step === 2 && calcResults && (
        <div className="space-y-6">
          {/* Consistency Index Warning Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${calcResults.isConsistent
            ? "bg-green-50/60 border-green-200 text-green-800"
            : "bg-red-50/60 border-red-200 text-red-800 animate-pulse"
            }`}>
            {calcResults.isConsistent ? (
              <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h3 className="font-bold text-sm leading-tight">
                Status Konsistensi Matriks: {calcResults.isConsistent ? "KONSISTEN ✓" : "TIDAK KONSISTEN ✗"}
              </h3>
              <p className="text-xs opacity-90 leading-relaxed max-w-2xl">
                {calcResults.isConsistent
                  ? `Matriks perbandingan berpasangan konsisten karena nilai Consistency Ratio (CR) = ${calcResults.cr.toFixed(4)} yang berada di bawah ambang batas maksimum 0,10. Bobot prioritas valid untuk digunakan pada kalkulasi TOPSIS.`
                  : `Matriks TIDAK KONSISTEN karena nilai Consistency Ratio (CR) = ${calcResults.cr.toFixed(4)} melebihi ambang batas maksimum 0,10. Anda harus kembali ke Step 1 untuk merevisi matriks perbandingan.`}
              </p>
            </div>
          </div>

          {/* 2a. MATRIKS PERBANDINGAN AWAL DESIMAL */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span className="font-bold bg-slate-200 text-slate-700 h-5 w-8 rounded text-center text-xs flex items-center justify-center font-mono select-none">2a</span>
              <h3 className="font-bold text-slate-900 text-xs">Matriks Perbandingan Berpasangan (Format Desimal)</h3>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 font-mono">
                    <th className="p-2 border border-slate-200 text-center w-20">Kriteria</th>
                    {criteria.map((c) => <th key={c.id} className="p-2 border border-slate-200 text-center">{c.code}</th>)}
                  </tr>
                </thead>
                <tbody className="text-[11px] font-mono">
                  {calcResults.matrix.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/30">
                      <td className="p-2 border border-slate-200 bg-slate-50 font-bold text-center">{criteria[i].code}</td>
                      {row.map((val, j) => (
                        <td key={j} className="p-2 border border-slate-200 text-center">{val.toFixed(2)}</td>
                      ))}
                    </tr>
                  ))}
                  {/* Sum Row */}
                  <tr className="bg-slate-100/60 font-bold">
                    <td className="p-2 border border-slate-200 text-center">Jumlah (Sum)</td>
                    {colSums.map((sum, j) => (
                      <td key={j} className="p-2 border border-slate-200 text-center text-primary">{sum.toFixed(2)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2b. MATRIKS NORMALISASI */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span className="font-bold bg-slate-200 text-slate-700 h-5 w-8 rounded text-center text-xs flex items-center justify-center font-mono select-none">2b</span>
              <h3 className="font-bold text-slate-900 text-xs">Matriks Normalisasi (Tiap elemen dibagi Jumlah Kolom)</h3>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 font-mono">
                    <th className="p-2 border border-slate-200 text-center w-20">Kriteria</th>
                    {criteria.map((c) => <th key={c.id} className="p-2 border border-slate-200 text-center">{c.code}</th>)}
                  </tr>
                </thead>
                <tbody className="text-[11px] font-mono">
                  {calcResults.normalizedMatrix.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/30">
                      <td className="p-2 border border-slate-200 bg-slate-50 font-bold text-center">{criteria[i].code}</td>
                      {row.map((val, j) => (
                        <td key={j} className="p-2 border border-slate-200 text-center">{val.toFixed(4)}</td>
                      ))}
                    </tr>
                  ))}
                  {/* Sum Row */}
                  <tr className="bg-slate-100/60 font-bold">
                    <td className="p-2 border border-slate-200 text-center">Jumlah</td>
                    {normColSums.map((sum, j) => (
                      <td key={j} className="p-2 border border-slate-200 text-center text-slate-500">{sum.toFixed(4)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2c. VEKTOR PRIORITAS / BOBOT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table Panel */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span className="font-bold bg-slate-200 text-slate-700 h-5 w-8 rounded text-center text-xs flex items-center justify-center font-mono select-none">2c</span>
                <h3 className="font-bold text-slate-900 text-xs">Vektor Prioritas (Bobot Kriteria AHP)</h3>
              </div>
              <div className="p-4 flex-1">
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500">
                      <th className="p-2.5 border border-slate-200 text-center w-16">Kode</th>
                      <th className="p-2.5 border border-slate-200">Nama Kriteria</th>
                      <th className="p-2.5 border border-slate-200 text-right w-28">Bobot (Desimal)</th>
                      <th className="p-2.5 border border-slate-200 text-right w-24">Bobot (%)</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold">
                    {criteria.map((c, idx) => {
                      const weight = calcResults.weights[idx];

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/40">
                          <td className="p-2.5 border border-slate-200 text-center font-mono">{c.code}</td>
                          <td className="p-2.5 border border-slate-200 text-slate-700">{c.name}</td>
                          <td className="p-2.5 border border-slate-200 text-right font-mono text-slate-800">{weight.toFixed(6)}</td>
                          <td className="p-2.5 border border-slate-200 text-right font-mono text-primary text-sm">
                            {(weight * 100).toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                    {/* Sum Row */}
                    <tr className="bg-slate-100/60 font-extrabold text-slate-800">
                      <td colSpan={2} className="p-2.5 border border-slate-200 text-center">TOTAL</td>
                      <td className="p-2.5 border border-slate-200 text-right font-mono">1.000000</td>
                      <td className="p-2.5 border border-slate-200 text-right font-mono">100.00%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recharts Chart Panel */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex flex-col min-h-[300px]">
              <h4 className="text-xs font-bold text-slate-700 mb-3 font-mono">Grafik Kontribusi Bobot Kriteria (%)</h4>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 5 }}>
                    <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontWeight: "bold" }} />
                    <Tooltip
                      formatter={(value: any, name: any, props: any) => [`${value}%`, props.payload.fullName]}
                      contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                    />
                    <Bar dataKey="weight" radius={[0, 4, 4, 0]} barSize={16}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 2d. UJI KONSISTENSI */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span className="font-bold bg-slate-200 text-slate-700 h-5 w-8 rounded text-center text-xs flex items-center justify-center font-mono select-none">2d</span>
              <h3 className="font-bold text-slate-900 text-xs">Uji Indeks Konsistensi AHP (Consistency Matrix Check)</h3>
            </div>

            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-center">
              {/* Lambda Max */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5 shadow-inner">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Lambda Max (λmax)</span>
                <p className="text-xl font-bold text-slate-800">{calcResults.lambdaMax.toFixed(6)}</p>
              </div>

              {/* Consistency Index */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5 shadow-inner">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Consistency Index (CI)</span>
                <p className="text-xl font-bold text-slate-800">{calcResults.ci.toFixed(6)}</p>
              </div>

              {/* Random Index */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5 shadow-inner">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Random Index</span>
                <p className="text-xl font-bold text-slate-800">1.32</p>
              </div>

              {/* Consistency Ratio */}
              <div className={`border rounded-xl p-4 space-y-1.5 shadow ${calcResults.isConsistent ? "bg-green-50/40 border-green-200 text-green-800" : "bg-red-50/40 border-red-200 text-red-800"
                }`}>
                <span className="text-[10px] font-bold opacity-60 uppercase">Consistency Ratio (CR)</span>
                <p className="text-xl font-extrabold">{calcResults.cr.toFixed(6)}</p>
              </div>
            </div>

            {/* Stepper Navigation Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => setStep(1)}
                className="h-10 px-4 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Undo2 className="h-4 w-4" />
                Edit Matriks
              </button>

              <button
                onClick={() => {
                  toast.success("Bobot AHP Tersimpan!");
                  window.location.href = "/kalkulasi-topsis";
                }}
                className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-primary/10 transition-all cursor-pointer"
              >
                Lanjut ke TOPSIS
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RI INDEX TABLE REFERENCE */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3.5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <HelpCircle className="h-4.5 w-4.5 text-primary" />
          <h3 className="font-bold text-slate-900 text-xs">Nilai Indeks Random (Random Index - RI) Saaty</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse border border-slate-200 text-[11px] font-mono leading-normal">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-2 border border-slate-200">Ukuran Matriks (n)</th>
                <th className="p-2 border border-slate-200">1</th>
                <th className="p-2 border border-slate-200">2</th>
                <th className="p-2 border border-slate-200">3</th>
                <th className="p-2 border border-slate-200">4</th>
                <th className="p-2 border border-slate-200">5</th>
                <th className="p-2 border border-slate-200">6</th>
                <th className="p-2 border border-slate-200 text-primary font-bold">7</th>
                <th className="p-2 border border-slate-200">8</th>
                <th className="p-2 border border-slate-200">9</th>
                <th className="p-2 border border-slate-200">10</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-slate-700">
                <td className="p-2 border border-slate-200 bg-slate-50 font-bold">Nilai RI</td>
                <td className="p-2 border border-slate-200">0.00</td>
                <td className="p-2 border border-slate-200">0.00</td>
                <td className="p-2 border border-slate-200">0.58</td>
                <td className="p-2 border border-slate-200">0.90</td>
                <td className="p-2 border border-slate-200">1.12</td>
                <td className="p-2 border border-slate-200">1.24</td>
                <td className="p-2 border border-slate-200 bg-primary/5 text-primary font-bold">1.32</td>
                <td className="p-2 border border-slate-200">1.41</td>
                <td className="p-2 border border-slate-200">1.45</td>
                <td className="p-2 border border-slate-200">1.49</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
