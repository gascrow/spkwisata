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
import { MultiStepLoader } from "@/components/ui/multi-step-loader";

export default function KalkulasiAhpPage() {
  const { activeSession, refreshKey, triggerRefresh } = useApp();
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stepper state
  const [step] = useState<1 | 2>(1);

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

  // Automated TOPSIS calculation & Loader state
  const [isTopsisModalOpen, setIsTopsisModalOpen] = useState(false);
  const [topsisStep, setTopsisStep] = useState(0);
  const [topsisStatus, setTopsisStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [topsisError, setTopsisError] = useState("");

  const topsisLoadingStates = [
    { text: "Menginisialisasi kalkulasi AHP..." },
    { text: "Menghitung bobot kriteria prioritas..." },
    { text: "Memeriksa rasio konsistensi kriteria..." },
    { text: "Menginisialisasi kalkulasi TOPSIS..." },
    { text: "Mengambil data alternatif & skor penilaian..." },
    { text: "Membentuk matriks keputusan awal (X)..." },
    { text: "Menghitung matriks normalisasi (R)..." },
    { text: "Menerapkan bobot kriteria AHP (Matriks V)..." },
    { text: "Menentukan solusi ideal positif (A+) & negatif (A-)..." },
    { text: "Menghitung jarak ideal positif (D+) & negatif (D-)..." },
    { text: "Menghitung nilai preferensi (Ci) & peringkat..." },
    { text: "Menyimpan hasil kalkulasi ke database..." },
  ];



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
            // step remains 1
          } else {
            setCalcResults(null);
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

  // Run unified calculation (AHP -> TOPSIS)
  const handleCalculate = async () => {
    setIsTopsisModalOpen(true);
    setTopsisStep(0);
    setTopsisStatus("running");
    setTopsisError("");

    let ahpSuccess = false;
    let ahpIsConsistent = false;
    let ahpErrorMsg = "";
    let ahpData: any = null;

    // Phase 1: Run AHP calculation in parallel
    const ahpPromise = fetch("/api/ahp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionName: activeSession,
        comparisons,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          ahpSuccess = true;
          ahpIsConsistent = res.data.isConsistent;
          ahpData = res.data;
          if (!res.data.isConsistent) {
            ahpErrorMsg = `Matriks perbandingan tidak konsisten (CR = ${res.data.cr.toFixed(4)} > 0.10). Harap sesuaikan kembali nilai perbandingan kriteria Anda.`;
          }
        } else {
          ahpErrorMsg = res.error || "Gagal menghitung AHP";
        }
      })
      .catch((e) => {
        ahpErrorMsg = "Terjadi kesalahan koneksi saat menghitung AHP";
      });

    // Simulate AHP loading steps (Step 0 to 2)
    for (let currentStep = 0; currentStep <= 2; currentStep++) {
      setTopsisStep(currentStep);
      const delay = 500 + Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (currentStep === 2) {
        await ahpPromise;
        if (!ahpSuccess || !ahpIsConsistent) {
          setTopsisStatus("failed");
          setTopsisError(ahpErrorMsg);
          return;
        }
        
        // Save local state for calcResults
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
          normalizedMatrix: ahpData.normalizedMatrix,
          weights: ahpData.weights,
          lambdaMax: ahpData.lambdaMax,
          ci: ahpData.ci,
          cr: ahpData.cr,
          isConsistent: ahpData.isConsistent,
        });
      }
    }

    // Phase 2: Run TOPSIS calculation in parallel
    let topsisSuccess = false;
    let topsisErrorMsg = "";

    const topsisPromise = fetch("/api/topsis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionName: activeSession }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          topsisSuccess = true;
        } else {
          topsisErrorMsg = res.error || "Gagal menghitung TOPSIS";
        }
      })
      .catch((e) => {
        topsisErrorMsg = "Terjadi kesalahan koneksi saat menghitung TOPSIS";
      });

    // Simulate TOPSIS loading steps (Step 3 to 11)
    for (let currentStep = 3; currentStep <= 11; currentStep++) {
      setTopsisStep(currentStep);
      const delay = currentStep === 11 ? 1200 : 400 + Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (currentStep === 11) {
        await topsisPromise;
        if (!topsisSuccess) {
          setTopsisStatus("failed");
          setTopsisError(topsisErrorMsg);
          return;
        }
      }
    }

    setTopsisStatus("success");
    toast.success("Kalkulasi ranking selesai & disimpan!");
    triggerRefresh();

    setTimeout(() => {
      window.location.href = "/ranking";
    }, 1000);
  };

  // Reset calculations (AHP & TOPSIS)
  const handleReset = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus data hasil AHP dan TOPSIS untuk sesi ini?")) return;
    try {
      const [ahpRes, topsisRes] = await Promise.all([
        fetch(`/api/ahp?session=${activeSession}`, { method: "DELETE" }).then((r) => r.json()),
        fetch(`/api/topsis?session=${activeSession}`, { method: "DELETE" }).then((r) => r.json()),
      ]);
      if (ahpRes.success && topsisRes.success) {
        toast.success("Data kalkulasi berhasil di-reset!");
        setCalcResults(null);
        // Reset comparisons state to default 1s
        const resetComps = { ...comparisons };
        Object.keys(resetComps).forEach((k) => {
          resetComps[k] = 1;
        });
        setComparisons(resetComps);
        triggerRefresh();
      } else {
        toast.error("Gagal melakukan reset data");
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


      {/* STEP 1: INPUT MATRIX */}
      {step === 1 && (
        <div className="space-y-6">
          {calcResults && (
            <div className="bg-green-50/50 border border-green-200 text-green-800 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-fade-in">
              <CheckCircle className="h-5.5 w-5.5 text-green-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs">Hasil Kalkulasi Ranking Sudah Tersedia</h4>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Bobot kriteria AHP dan perankingan TOPSIS telah dihitung untuk sesi <strong className="text-green-950 font-bold">"{activeSession}"</strong>. Anda dapat menyesuaikan perbandingan berpasangan di bawah ini dan klik tombol <strong>"Hitung & Buat Ranking"</strong> untuk memperbaruinya.
                </p>
              </div>
            </div>
          )}
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
                Reset Data Kalkulasi
              </button>

              <button
                onClick={handleCalculate}
                disabled={topsisStatus === "running"}
                className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-primary/10 transition-all cursor-pointer"
              >
                <Calculator className="h-4.5 w-4.5" />
                Hitung & Buat Ranking
                <ArrowRight className="h-4 w-4" />
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

      {/* Multi-Step Loader */}
      <MultiStepLoader
        loadingStates={topsisLoadingStates}
        loading={isTopsisModalOpen && (topsisStatus === "running" || topsisStatus === "success")}
        value={topsisStep}
        duration={800}
        title="Kalkulasi Ranking"
        subtitle="Memproses perhitungan bobot kriteria AHP & perankingan TOPSIS..."
      />

      {/* Failure Overlay */}
      {isTopsisModalOpen && topsisStatus === "failed" && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-sm text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <XCircle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Perhitungan Gagal</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {topsisError || "Terjadi kesalahan saat menjalankan kalkulasi TOPSIS."}
              </p>
            </div>
            <button
              onClick={() => {
                setTopsisStatus("idle");
                setIsTopsisModalOpen(false);
              }}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
