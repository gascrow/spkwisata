"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/components/shared/AppContext";
import { Alternative, Criteria, TopsisResult } from "@/types";
import { formatNumberID } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Play,
  Save,
  CheckCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function KalkulasiTopsisPage() {
  const { activeSession, refreshKey, triggerRefresh } = useApp();
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stepper active step (1 to 6)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Saved TOPSIS data check
  const [hasTopsisSaved, setHasTopsisSaved] = useState(false);

  // Computed results state
  const [calcData, setCalcData] = useState<{
    normalizedMatrix: number[][];
    weightedMatrix: number[][];
    idealPositive: number[];
    idealNegative: number[];
    dPlus: number[];
    dMinus: number[];
    preferences: number[];
    rankings: number[];
  } | null>(null);

  // Check if AHP weights are populated
  const hasAhpWeights = criteria.some((c) => Number(c.weight) > 0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [critRes, altRes, topsisRes] = await Promise.all([
          fetch("/api/criteria").then((r) => r.json()),
          fetch("/api/alternatives").then((r) => r.json()),
          fetch(`/api/topsis?session=${activeSession}`).then((r) => r.json()),
        ]);

        if (critRes.success) setCriteria(critRes.data);
        if (altRes.success) setAlternatives(altRes.data.filter((a: any) => a.is_active));

        // If saved TOPSIS results exist, load them and trigger local computations
        if (topsisRes.success && topsisRes.data.length > 0) {
          setHasTopsisSaved(true);
          // Run calculation locally to populate all steps
          const savedResults = topsisRes.data as TopsisResult[];
          if (critRes.data.length > 0 && altRes.data.length > 0) {
            localCalculate(critRes.data, altRes.data.filter((a: any) => a.is_active));
          }
        } else {
          setHasTopsisSaved(false);
          setCalcData(null);
        }
      } catch (e) {
        toast.error("Gagal memuat data TOPSIS");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeSession, refreshKey]);

  // Locally computes all intermediate steps for transparent display
  const localCalculate = (critList: Criteria[], altList: Alternative[]) => {
    const m = altList.length;
    const n = critList.length;
    const weights = critList.map((c) => Number(c.weight));
    const criteriaTypes = critList.map((c) => c.type);

    // Build decision matrix
    const decisionMatrix: number[][] = [];
    altList.forEach((alt) => {
      const row: number[] = [];
      critList.forEach((crit) => {
        const scoreObj = alt.scores?.find((s) => s.criteria_id === crit.id);
        row.push(scoreObj ? Number(scoreObj.score_value) : 3.0);
      });
      decisionMatrix.push(row);
    });

    // 1. Normalization
    const normalizedMatrix = Array.from({ length: m }, () => new Array(n).fill(0));
    for (let j = 0; j < n; j++) {
      let sumSq = 0;
      for (let i = 0; i < m; i++) {
        sumSq += decisionMatrix[i][j] * decisionMatrix[i][j];
      }
      const sqrtSumSq = Math.sqrt(sumSq);
      for (let i = 0; i < m; i++) {
        normalizedMatrix[i][j] = sqrtSumSq === 0 ? 0 : decisionMatrix[i][j] / sqrtSumSq;
      }
    }

    // 2. Weighted Normalized
    const weightedMatrix = Array.from({ length: m }, () => new Array(n).fill(0));
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        weightedMatrix[i][j] = normalizedMatrix[i][j] * weights[j];
      }
    }

    // 3. Ideal solutions
    const idealPositive = new Array(n).fill(0);
    const idealNegative = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      const colValues = [];
      for (let i = 0; i < m; i++) {
        colValues.push(weightedMatrix[i][j]);
      }
      if (criteriaTypes[j] === "benefit") {
        idealPositive[j] = Math.max(...colValues);
        idealNegative[j] = Math.min(...colValues);
      } else {
        idealPositive[j] = Math.min(...colValues);
        idealNegative[j] = Math.max(...colValues);
      }
    }

    // 4. Distances
    const dPlus = new Array(m).fill(0);
    const dMinus = new Array(m).fill(0);
    for (let i = 0; i < m; i++) {
      let sumSqPlus = 0;
      let sumSqMinus = 0;
      for (let j = 0; j < n; j++) {
        const diffPlus = weightedMatrix[i][j] - idealPositive[j];
        const diffMinus = weightedMatrix[i][j] - idealNegative[j];
        sumSqPlus += diffPlus * diffPlus;
        sumSqMinus += diffMinus * diffMinus;
      }
      dPlus[i] = Math.sqrt(sumSqPlus);
      dMinus[i] = Math.sqrt(sumSqMinus);
    }

    // 5. Preferences
    const preferences = new Array(m).fill(0);
    for (let i = 0; i < m; i++) {
      const denom = dPlus[i] + dMinus[i];
      preferences[i] = denom === 0 ? 0 : dMinus[i] / denom;
    }

    // 6. Rankings
    const indexedPrefs = preferences.map((value, index) => ({ index, value }));
    indexedPrefs.sort((a, b) => b.value - a.value);
    const rankings = new Array(m).fill(0);
    for (let rankIndex = 0; rankIndex < m; rankIndex++) {
      const originalIndex = indexedPrefs[rankIndex].index;
      rankings[originalIndex] = rankIndex + 1;
    }

    setCalcData({
      normalizedMatrix,
      weightedMatrix,
      idealPositive,
      idealNegative,
      dPlus,
      dMinus,
      preferences,
      rankings,
    });
  };

  // Run TOPSIS calculation on server
  const handleCalculateTopsis = async () => {
    setCalculating(true);
    try {
      const response = await fetch("/api/topsis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionName: activeSession }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Kalkulasi TOPSIS selesai & disimpan!");
        localCalculate(criteria, alternatives);
        setHasTopsisSaved(true);
        setActiveStep(6); // directly go to ranking results
        triggerRefresh();
      } else {
        toast.error(result.error || "Gagal menghitung TOPSIS");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Memuat data kalkulasi TOPSIS...</span>
      </div>
    );
  }

  // If no AHP weights calculated
  if (!hasAhpWeights) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-sm flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-5">
        <div className="h-14 w-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 animate-pulse">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 text-base">Bobot Kriteria AHP Belum Siap</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Metode TOPSIS membutuhkan bobot kriteria prioritas yang didapatkan dari hasil perbandingan berpasangan AHP. Silakan jalankan kalkulasi AHP terlebih dahulu.
          </p>
        </div>
        <Link
          href="/kalkulasi-ahp"
          className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow shadow-primary/20"
        >
          Mulai Kalkulasi AHP
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Topsi Calculation Status Banner */}
      {!hasTopsisSaved && (
        <div className="bg-amber-50/60 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-fade-in">
          <AlertCircle className="h-5.5 w-5.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-xs">Kalkulasi TOPSIS Belum Dijalankan</h4>
            <p className="text-[11px] opacity-90 leading-relaxed">
              Silakan klik tombol "Jalankan Kalkulasi" di bawah tabel matriks keputusan untuk memulai pengurutan destinasi wisata secara komprehensif.
            </p>
          </div>
        </div>
      )}

      {/* STEPPERS SELECTOR */}
      {calcData && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm overflow-x-auto select-none">
          <div className="flex items-center gap-1.5 md:gap-3 justify-between min-w-[640px] px-2">
            {[
              { id: 1, label: "Matriks Keputusan (X)" },
              { id: 2, label: "Normalisasi (R)" },
              { id: 3, label: "Terbobot (V)" },
              { id: 4, label: "Solusi Ideal" },
              { id: 5, label: "Jarak Ideal (D)" },
              { id: 6, label: "Ranking (Ci)" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id as any)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  activeStep === s.id
                    ? "bg-primary text-white border-primary shadow"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <span className="font-mono text-[10px]">{s.id}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PANEL 1: DECISION MATRIX (STEP 1) */}
      {activeStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col animate-fade-in">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-slate-900 text-sm">Matriks Keputusan Awal (X)</h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold italic">* Nilai rating kecocokan 1.00 s/d 4.00</span>
          </div>

          <div className="overflow-x-auto p-4 max-h-[500px]">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  <th className="p-2.5 border border-slate-200 w-16 text-center">Kode</th>
                  <th className="p-2.5 border border-slate-200 min-w-[180px]">Nama Objek Wisata</th>
                  {criteria.map((c) => (
                    <th key={c.id} className="p-2.5 border border-slate-200 text-center w-24" title={c.name}>
                      {c.code}
                      <span className="block text-[8px] font-mono text-slate-400 font-normal">
                        ({c.type === "benefit" ? "+" : "-"})
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs">
                {alternatives.map((alt) => (
                  <tr key={alt.id} className="hover:bg-slate-50/40">
                    <td className="p-2.5 border border-slate-200 font-bold bg-slate-50 text-center font-mono">{alt.code}</td>
                    <td className="p-2.5 border border-slate-200 font-semibold text-slate-700">{alt.name}</td>
                    {criteria.map((crit) => {
                      const scoreObj = alt.scores?.find((s) => s.criteria_id === crit.id);
                      const scoreVal = scoreObj ? Number(scoreObj.score_value) : 3.0;

                      return (
                        <td key={crit.id} className="p-2.5 border border-slate-200 text-center font-mono font-bold text-slate-800">
                          {scoreVal.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Weights row */}
                <tr className="bg-primary/5 font-extrabold text-primary border-t border-slate-200">
                  <td colSpan={2} className="p-3 border border-slate-200 text-center uppercase tracking-wide">
                    Bobot Kriteria AHP (wj)
                  </td>
                  {criteria.map((crit) => (
                    <td key={crit.id} className="p-3 border border-slate-200 text-center font-mono text-sm">
                      {crit.weight.toFixed(4)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold">
              Total Objek Wisata Aktif: <strong className="text-slate-800 font-bold">{alternatives.length}</strong>
            </span>

            <button
              onClick={handleCalculateTopsis}
              disabled={calculating}
              className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-primary/10 transition-all cursor-pointer"
            >
              {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4.5 w-4.5" />}
              Jalankan Kalkulasi TOPSIS
            </button>
          </div>
        </div>
      )}

      {/* PANEL 2: NORMALIZED MATRIX (R) */}
      {activeStep === 2 && calcData && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col animate-fade-in">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs">Matriks Ternormalisasi (R)</h3>
            <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
              Formula: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">r_ij = x_ij / sqrt(Σ(x_ij²))</code> untuk masing-masing kriteria.
            </p>
          </div>

          <div className="overflow-x-auto p-4 max-h-[500px]">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase font-mono border-b border-slate-200">
                  <th className="p-2 border border-slate-200 text-center w-16">Kode</th>
                  <th className="p-2 border border-slate-200 min-w-[180px]">Nama Objek Wisata</th>
                  {criteria.map((c) => <th key={c.id} className="p-2 border border-slate-200 text-center w-24">{c.code}</th>)}
                </tr>
              </thead>
              <tbody className="text-[11px] font-mono">
                {alternatives.map((alt, i) => (
                  <tr key={alt.id} className="hover:bg-slate-50/30">
                    <td className="p-2 border border-slate-200 bg-slate-50 font-bold text-center">{alt.code}</td>
                    <td className="p-2 border border-slate-200 font-sans font-semibold text-slate-700">{alt.name}</td>
                    {criteria.map((crit, j) => (
                      <td key={crit.id} className="p-2 border border-slate-200 text-center">
                        {calcData.normalizedMatrix[i][j].toFixed(4)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PANEL 3: WEIGHTED NORMALIZED (V) */}
      {activeStep === 3 && calcData && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col animate-fade-in">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs">Matriks Terbobot (V)</h3>
            <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
              Formula: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">v_ij = r_ij * w_j</code> dengan mengalikan bobot hasil AHP.
            </p>
          </div>

          <div className="overflow-x-auto p-4 max-h-[500px]">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase font-mono border-b border-slate-200">
                  <th className="p-2 border border-slate-200 text-center w-16">Kode</th>
                  <th className="p-2 border border-slate-200 min-w-[180px]">Nama Objek Wisata</th>
                  {criteria.map((c) => <th key={c.id} className="p-2 border border-slate-200 text-center w-24">{c.code}</th>)}
                </tr>
              </thead>
              <tbody className="text-[11px] font-mono">
                {alternatives.map((alt, i) => (
                  <tr key={alt.id} className="hover:bg-slate-50/30">
                    <td className="p-2 border border-slate-200 bg-slate-50 font-bold text-center">{alt.code}</td>
                    <td className="p-2 border border-slate-200 font-sans font-semibold text-slate-700">{alt.name}</td>
                    {criteria.map((crit, j) => (
                      <td key={crit.id} className="p-2 border border-slate-200 text-center">
                        {calcData.weightedMatrix[i][j].toFixed(6)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PANEL 4: IDEAL SOLUTIONS (A+ and A-) */}
      {activeStep === 4 && calcData && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col animate-fade-in">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs">Solusi Ideal Positif (A+) & Negatif (A-)</h3>
            <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
              Benefit: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">A+ = max(v_ij)</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">A- = min(v_ij)</code>.
              Cost: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">A+ = min(v_ij)</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">A- = max(v_ij)</code>.
            </p>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase font-mono">
                  <th className="p-2.5 border border-slate-200 min-w-[200px]">Solusi Ideal</th>
                  {criteria.map((c) => (
                    <th key={c.id} className="p-2.5 border border-slate-200 text-center w-28">
                      {c.code}
                      <span className="block text-[8px] font-mono text-slate-400 font-normal">
                        ({c.type})
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[11px] font-mono font-bold">
                {/* Ideal Positive row */}
                <tr className="bg-green-50/40 text-green-700">
                  <td className="p-3 border border-slate-200 font-sans uppercase">Positif Ideal (A+)</td>
                  {calcData.idealPositive.map((val, idx) => (
                    <td key={idx} className="p-3 border border-slate-200 text-center">{val.toFixed(6)}</td>
                  ))}
                </tr>

                {/* Ideal Negative row */}
                <tr className="bg-red-50/40 text-red-700">
                  <td className="p-3 border border-slate-200 font-sans uppercase">Negatif Ideal (A-)</td>
                  {calcData.idealNegative.map((val, idx) => (
                    <td key={idx} className="p-3 border border-slate-200 text-center">{val.toFixed(6)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PANEL 5: EUCLIDEAN DISTANCES (D+ and D-) */}
      {activeStep === 5 && calcData && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col animate-fade-in">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs">Jarak Euclidean ke Solusi Ideal Positif & Negatif</h3>
            <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
              Jarak Positif: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">D+_i = sqrt(Σ(v_ij - A+_j)²)</code>.
              Jarak Negatif: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">D-_i = sqrt(Σ(v_ij - A-_j)²)</code>.
            </p>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase font-mono">
                  <th className="p-2 border border-slate-200 text-center w-16">No</th>
                  <th className="p-2 border border-slate-200 text-center w-20">Kode</th>
                  <th className="p-2 border border-slate-200">Nama Objek Wisata</th>
                  <th className="p-2 border border-slate-200 text-right w-36">Jarak Positif (D+)</th>
                  <th className="p-2 border border-slate-200 text-right w-36">Jarak Negatif (D-)</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold font-mono">
                {alternatives.map((alt, i) => (
                  <tr key={alt.id} className="hover:bg-slate-50/30">
                    <td className="p-2 border border-slate-200 text-center font-sans text-slate-400">{i + 1}</td>
                    <td className="p-2 border border-slate-200 text-center font-bold text-slate-700 bg-slate-50">{alt.code}</td>
                    <td className="p-2 border border-slate-200 font-sans font-semibold text-slate-800">{alt.name}</td>
                    <td className="p-2 border border-slate-200 text-right text-green-700 font-bold">{calcData.dPlus[i].toFixed(8)}</td>
                    <td className="p-2 border border-slate-200 text-right text-red-700 font-bold">{calcData.dMinus[i].toFixed(8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PANEL 6: PREFERENCE SCORE (Ci) & RANKINGS */}
      {activeStep === 6 && calcData && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col animate-fade-in">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-xs">Nilai Preferensi (Ci) & Urutan Prioritas Pengembangan</h3>
              <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                Formula: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Ci = D- / (D+ + D-)</code>. Nilai Ci mendekati 1.00 menunjukkan prioritas utama.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase font-mono">Sesi: {activeSession}</span>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                  <th className="p-2.5 border border-slate-200 w-16 text-center">Rank</th>
                  <th className="p-2.5 border border-slate-200 w-20 text-center">Kode</th>
                  <th className="p-2.5 border border-slate-200">Nama Objek Wisata</th>
                  <th className="p-2.5 border border-slate-200">Klaster</th>
                  <th className="p-2.5 border border-slate-200 text-right w-32">Skor Preferensi (Ci)</th>
                  <th className="p-2.5 border border-slate-200 w-44">Tingkat Prioritas (Grafik)</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {alternatives
                  .map((alt, idx) => ({
                    alt,
                    dPlus: calcData.dPlus[idx],
                    dMinus: calcData.dMinus[idx],
                    pref: calcData.preferences[idx],
                    rank: calcData.rankings[idx],
                  }))
                  .sort((a, b) => a.rank - b.rank)
                  .map((row, idx) => {
                    const isTop3 = row.rank <= 3;
                    const medal = row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : `${row.rank}`;
                    const clusterColor = row.alt.cluster?.color || "#64748b";

                    return (
                      <tr
                        key={row.alt.id}
                        className={`hover:bg-slate-50/40 border-b border-slate-100 ${
                          isTop3 ? "font-bold bg-slate-50/50" : ""
                        }`}
                      >
                        <td className="p-2.5 border border-slate-200 text-center">
                          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                            row.rank === 1
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : row.rank === 2
                              ? "bg-slate-100 text-slate-700 border border-slate-300"
                              : row.rank === 3
                              ? "bg-orange-100 text-orange-700 border border-orange-300"
                              : "text-slate-500 font-semibold"
                          }`}>
                            {medal}
                          </span>
                        </td>
                        <td className="p-2.5 border border-slate-200 text-center font-mono">
                          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-bold">
                            {row.alt.code}
                          </span>
                        </td>
                        <td className="p-2.5 border border-slate-200 text-slate-900 font-semibold">{row.alt.name}</td>
                        <td className="p-2.5 border border-slate-200">
                          <span
                            className="text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full inline-block shadow-sm"
                            style={{ backgroundColor: clusterColor }}
                          >
                            {row.alt.cluster?.name.split(",")[0]}
                          </span>
                        </td>
                        <td className="p-2.5 border border-slate-200 text-right font-mono font-bold text-primary text-sm">
                          {row.pref.toFixed(8)}
                        </td>
                        <td className="p-2.5 border border-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                              <div
                                className="bg-primary h-full rounded-full transition-all duration-500"
                                style={{ width: `${row.pref * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 font-mono">
                              {(row.pref * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs text-green-700 font-bold flex items-center gap-1.5">
              <CheckCircle className="h-4.5 w-4.5 text-green-600" />
              Hasil perhitungan TOPSIS telah disimpan di database.
            </span>

            <Link
              href="/ranking"
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-primary/10 transition-all cursor-pointer"
            >
              Lihat Dashboard Ranking
              <TrendingUp className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
