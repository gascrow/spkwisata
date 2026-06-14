"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/components/shared/AppContext";
import { Alternative, Criteria, TopsisResult } from "@/types";
import { formatNumberID, getRankBadge } from "@/lib/utils";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  FileText,
  FileDown,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Eye,
  Loader2,
  Calendar,
  Layers,
  History,
} from "lucide-react";

export default function LaporanPage() {
  const { activeSession, refreshKey } = useApp();
  const [topsisResults, setTopsisResults] = useState<TopsisResult[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(true);

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);

  // Checklist states
  const [checklist, setChecklist] = useState({
    ringkasan: true,
    alternatifSkor: true,
    matriksAhp: true,
    bobotKonsistensi: true,
    normalisasiTopsis: true,
    terbobotTopsis: true,
    solusiIdeal: true,
    jarakEuclidean: true,
    rankingCi: true,
    kesimpulan: true,
  });

  // Export history state
  const [exportHistory, setExportHistory] = useState<{ date: string; format: string; count: number }[]>([]);

  useEffect(() => {
    async function fetchData() {
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

        // Load export history from localStorage
        const hist = localStorage.getItem("export_history");
        if (hist) {
          setExportHistory(JSON.parse(hist));
        }
      } catch (e) {
        toast.error("Gagal memuat data laporan");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeSession, refreshKey]);

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addHistory = (format: string) => {
    const newHist = [
      {
        date: new Date().toLocaleString("id-ID"),
        format,
        count: alternatives.length,
      },
      ...exportHistory.slice(0, 4),
    ];
    setExportHistory(newHist);
    localStorage.setItem("export_history", JSON.stringify(newHist));
  };

  // ----------------------------------------------------
  // EXPORT EXCEL (SheetJS)
  // ----------------------------------------------------
  const handleExportExcel = () => {
    if (topsisResults.length === 0) {
      toast.error("Hasil kalkulasi TOPSIS belum tersedia.");
      return;
    }
    setGeneratingExcel(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Alternatif & Skor
      if (checklist.alternatifSkor) {
        const data1 = alternatives.map((alt) => {
          const row: any = { Kode: alt.code, Nama: alt.name, Klaster: alt.cluster?.name?.split(",")[0] || "" };
          criteria.forEach((c) => {
            const sc = alt.scores?.find((s) => s.criteria_id === c.id);
            row[c.code] = sc ? Number(sc.score_value) : 3;
          });
          return row;
        });
        const ws1 = XLSX.utils.json_to_sheet(data1);
        XLSX.utils.book_append_sheet(wb, ws1, "Skor Alternatif");
      }

      // Sheet 2: Matriks AHP & Bobot
      if (checklist.matriksAhp || checklist.bobotKonsistensi) {
        const data2 = criteria.map((c) => ({
          Kriteria: c.code,
          Nama: c.name,
          Tipe: c.type,
          "Bobot AHP": Number(c.weight),
        }));
        const ws2 = XLSX.utils.json_to_sheet(data2);
        XLSX.utils.book_append_sheet(wb, ws2, "Bobot Kriteria");
      }

      // Sheet 3: Ranking Final & D+/D-/Ci
      if (checklist.rankingCi || checklist.jarakEuclidean) {
        const data3 = topsisResults.map((r) => ({
          Rank: r.rank,
          Kode: r.alternative?.code,
          Nama: r.alternative?.name,
          Klaster: r.alternative?.cluster?.name?.split(",")[0] || "",
          "Jarak Ideal Positif (D+)": r.d_positive,
          "Jarak Ideal Negatif (D-)": r.d_negative,
          "Skor Preferensi (Ci)": r.preference_score,
        }));
        const ws3 = XLSX.utils.json_to_sheet(data3);
        XLSX.utils.book_append_sheet(wb, ws3, "Ranking Final");
      }

      XLSX.writeFile(wb, `Laporan_SPK_Pariwisata_Sesi_${activeSession}.xlsx`);
      toast.success("Excel Berhasil Diekspor!");
      addHistory("Excel");
    } catch (e) {
      toast.error("Gagal mengekspor Excel");
    } finally {
      setGeneratingExcel(false);
    }
  };

  // ----------------------------------------------------
  // EXPORT PDF (jsPDF + autotable)
  // ----------------------------------------------------
  const handleExportPdf = () => {
    if (topsisResults.length === 0) {
      toast.error("Hasil kalkulasi TOPSIS belum tersedia.");
      return;
    }
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // 1. Cover Page
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("LAPORAN HASIL KEPUTUSAN SPK", 105, yPos + 20, { align: "center" });
      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.text("Prioritas Pengembangan Pariwisata Kota Balikpapan (AHP-TOPSIS)", 105, yPos + 30, { align: "center" });

      doc.setFontSize(10);
      doc.text(`Sesi Skenario: ${activeSession}`, 105, yPos + 45, { align: "center" });
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 105, yPos + 52, { align: "center" });
      doc.text("Dinas Pariwisata Kota Balikpapan", 105, yPos + 60, { align: "center" });

      doc.line(20, yPos + 70, 190, yPos + 70);

      yPos = 100;

      // 2. Ringkasan Eksekutif
      if (checklist.ringkasan) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("1. Ringkasan Eksekutif", 20, yPos);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        const summaryText =
          `Berdasarkan analisis Sistem Pendukung Keputusan (SPK) menggunakan gabungan metode AHP dan TOPSIS, destinasi prioritas utama yang terpilih untuk program pengembangan pariwisata Kota Balikpapan adalah "${
            topsisResults[0]?.alternative?.name || "-"
          }" (Kode: ${topsisResults[0]?.alternative?.code || "-"}) dengan nilai preferensi tertinggi sebesar ${
            topsisResults[0]?.preference_score?.toFixed(4) || "0"
          }. Analisis ini menyertakan ${alternatives.length} alternatif objek wisata yang tersebar di 5 klaster pariwisata Balikpapan.`;

        const splitText = doc.splitTextToSize(summaryText, 170);
        doc.text(splitText, 20, yPos + 8);
        yPos += 35;
      }

      // 3. Tabel Kriteria & Bobot
      if (checklist.bobotKonsistensi) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("2. Bobot Prioritas Kriteria (Hasil AHP)", 20, yPos);
        yPos += 5;

        const headers = [["Kode", "Nama Kriteria", "Tipe", "Bobot AHP"]];
        const rows = criteria.map((c) => [c.code, c.name, c.type, Number(c.weight).toFixed(4)]);

        autoTable(doc, {
          head: headers,
          body: rows,
          startY: yPos,
          theme: "grid",
          styles: { fontSize: 9 },
          headStyles: { fillColor: [29, 78, 216] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Check if page needs break
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      // 4. Tabel Ranking Final
      if (checklist.rankingCi) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("3. Urutan Prioritas Pengembangan (Hasil TOPSIS)", 20, yPos);
        yPos += 5;

        const headers = [["Rank", "Kode", "Nama Destinasi Wisata", "Klaster", "D+", "D-", "Skor Ci"]];
        const rows = topsisResults.map((r) => [
          r.rank !== undefined && r.rank !== null ? r.rank : "",
          r.alternative?.code || "",
          r.alternative?.name || "",
          r.alternative?.cluster?.name?.split(",")[0] || "",
          r.d_positive !== undefined && r.d_positive !== null ? Number(r.d_positive).toFixed(4) : "",
          r.d_negative !== undefined && r.d_negative !== null ? Number(r.d_negative).toFixed(4) : "",
          r.preference_score !== undefined && r.preference_score !== null ? Number(r.preference_score).toFixed(4) : "",
        ]);

        autoTable(doc, {
          head: headers,
          body: rows,
          startY: yPos,
          theme: "grid",
          styles: { fontSize: 8 },
          headStyles: { fillColor: [15, 23, 42] },
        });
      }

      doc.save(`Laporan_Prioritas_Pariwisata_Sesi_${activeSession}.pdf`);
      toast.success("Laporan PDF Berhasil Diunduh!");
      addHistory("PDF");
    } catch (e) {
      console.error("PDF Export Error:", e);
      toast.error("Gagal mengekspor PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT PANEL: CHECKLIST OPTIONS (1 column) */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 h-fit space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CheckSquare className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-slate-900 text-sm">Pilih Konten Laporan</h3>
          </div>

          <div className="space-y-2.5 text-xs font-semibold text-slate-700">
            {[
              { key: "ringkasan", label: "Ringkasan Eksekutif" },
              { key: "alternatifSkor", label: "Daftar Alternatif & Skor" },
              { key: "matriksAhp", label: "Matriks Perbandingan AHP" },
              { key: "bobotKonsistensi", label: "Hasil Bobot & Konsistensi" },
              { key: "normalisasiTopsis", label: "Matriks Normalisasi TOPSIS" },
              { key: "terbobotTopsis", label: "Matriks Terbobot TOPSIS" },
              { key: "solusiIdeal", label: "Solusi Ideal (A+ & A-)" },
              { key: "jarakEuclidean", label: "Jarak Euclidean (D+ & D-)" },
              { key: "rankingCi", label: "Ranking Akhir & Skor Ci" },
              { key: "kesimpulan", label: "Kesimpulan & Rekomendasi" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => toggleChecklist(item.key as any)}
                className="flex items-center gap-2.5 w-full text-left p-1.5 rounded hover:bg-slate-50 transition-colors"
              >
                {checklist[item.key as keyof typeof checklist] ? (
                  <CheckSquare className="h-4.5 w-4.5 text-primary shrink-0" />
                ) : (
                  <Square className="h-4.5 w-4.5 text-slate-300 shrink-0" />
                )}
                {item.label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="border-t border-slate-100 pt-4 space-y-2.5 select-none">
            <button
              onClick={handleExportPdf}
              disabled={generatingPdf}
              className="w-full h-10 rounded-lg bg-primary hover:bg-primary/95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow shadow-primary/10 cursor-pointer"
            >
              {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Ekspor PDF Laporan
            </button>

            <button
              onClick={handleExportExcel}
              disabled={generatingExcel}
              className="w-full h-10 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {generatingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
              Ekspor Excel Data
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: LIVE PREVIEW AREA (3 columns) */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden lg:col-span-3 flex flex-col min-h-[500px]">
          {/* Preview Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0">
            <Eye className="h-5 w-5 text-slate-400" />
            <h2 className="font-bold text-slate-900 text-sm">Preview Dokumen Laporan</h2>
          </div>

          {/* Preview Scroll Container */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-100/50 scrollbar-thin">
            <div className="max-w-3xl mx-auto bg-white border border-slate-200/80 p-8 shadow-md rounded-xl space-y-8 text-xs leading-relaxed text-slate-700 font-sans min-h-[700px] select-none">
              {/* Report Header Logo */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-950 uppercase tracking-widest text-sm">SPK Pariwisata Balikpapan</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AHP + TOPSIS Decision Engine</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sesi Skenario:</span>
                  <span className="font-bold text-primary text-xs">{activeSession}</span>
                </div>
              </div>

              {/* Title Page */}
              <div className="text-center py-4 space-y-2">
                <h1 className="text-base font-extrabold text-slate-900 uppercase">
                  Laporan Prioritas Program Pengembangan Pariwisata
                </h1>
                <p className="text-[10px] text-slate-500 font-semibold italic">
                  Dinas Pariwisata Kota Balikpapan — Tahun Evaluasi 2026
                </p>
              </div>

              {/* 1. Ringkasan Eksekutif */}
              {checklist.ringkasan && (
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-1.5">
                    1. Ringkasan Eksekutif
                  </h3>
                  <p className="text-slate-600">
                    Berdasarkan kajian analisis Sistem Pendukung Keputusan (SPK) menggunakan integrasi metode Analytic Hierarchy Process (AHP) untuk pembobotan kriteria dan Technique for Order of Preference by Similarity to Ideal Solution (TOPSIS) untuk perangkingan, telah dianalisis sebanyak <strong>{alternatives.length} alternatif</strong> objek wisata aktif di Balikpapan.
                  </p>
                  <p className="text-slate-600">
                    Destinasi prioritas utama yang direkomendasikan untuk pengembangan pertama adalah <strong>"{topsisResults[0]?.alternative?.name || "-"}"</strong> (Kode: {topsisResults[0]?.alternative?.code || "-"}) dengan nilai preferensi tertinggi sebesar <strong>{topsisResults[0]?.preference_score?.toFixed(4) || "0.00"}</strong>.
                  </p>
                </div>
              )}

              {/* 2. Alternatif Skor */}
              {checklist.alternatifSkor && (
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-1.5">
                    2. Data Alternatif Objek Wisata ({alternatives.length} Aktif)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border border-slate-200">
                      <thead>
                        <tr className="bg-slate-50 font-bold border-b border-slate-200 text-slate-500">
                          <th className="p-2 border-r border-slate-200">Kode</th>
                          <th className="p-2 border-r border-slate-200">Nama Objek Wisata</th>
                          <th className="p-2 border-r border-slate-200">Klaster Kelompok</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alternatives.slice(0, 5).map((alt) => (
                          <tr key={alt.id} className="border-b border-slate-100">
                            <td className="p-2 border-r border-slate-200 font-bold font-mono">{alt.code}</td>
                            <td className="p-2 border-r border-slate-200 font-semibold">{alt.name}</td>
                            <td className="p-2 border-r border-slate-200">{alt.cluster?.name?.split(",")[0] || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-[10px] text-slate-400 italic mt-1.5">* Ditampilkan hanya 5 baris pertama untuk visual preview.</p>
                  </div>
                </div>
              )}

              {/* 3. Hasil Bobot & Uji Konsistensi */}
              {checklist.bobotKonsistensi && (
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-1.5">
                    3. Hasil Pembobotan Kriteria AHP
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border border-slate-200">
                      <thead>
                        <tr className="bg-slate-50 font-bold border-b border-slate-200 text-slate-500">
                          <th className="p-2 border-r border-slate-200">Kode</th>
                          <th className="p-2 border-r border-slate-200">Nama Kriteria</th>
                          <th className="p-2 border-r border-slate-200 text-right">Bobot AHP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {criteria.map((c) => (
                          <tr key={c.id} className="border-b border-slate-100">
                            <td className="p-2 border-r border-slate-200 font-mono font-bold">{c.code}</td>
                            <td className="p-2 border-r border-slate-200 font-semibold">{c.name}</td>
                            <td className="p-2 border-r border-slate-200 text-right font-mono">{Number(c.weight).toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. Ranking Ci */}
              {checklist.rankingCi && (
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-1.5">
                    4. Perangkingan Akhir TOPSIS (Top 5)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border border-slate-200">
                      <thead>
                        <tr className="bg-slate-50 font-bold border-b border-slate-200 text-slate-500">
                          <th className="p-2 border-r border-slate-200 w-12 text-center">Rank</th>
                          <th className="p-2 border-r border-slate-200 w-16 text-center">Kode</th>
                          <th className="p-2 border-r border-slate-200">Nama Objek Wisata</th>
                          <th className="p-2 border-r border-slate-200 text-right">Skor Ci</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topsisResults.slice(0, 5).map((row) => (
                          <tr key={row.id} className="border-b border-slate-100 font-semibold">
                            <td className="p-2 border-r border-slate-200 text-center">{row.rank}</td>
                            <td className="p-2 border-r border-slate-200 text-center font-mono">{row.alternative?.code}</td>
                            <td className="p-2 border-r border-slate-200 text-slate-900">{row.alternative?.name}</td>
                            <td className="p-2 border-r border-slate-200 text-right font-mono text-primary">{row.preference_score?.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. HISTORY EXPORT LIST */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3.5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <History className="h-5 w-5 text-slate-400" />
          <h3 className="font-bold text-slate-900 text-sm">Riwayat Ekspor Laporan</h3>
        </div>

        {exportHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs select-none">
            {exportHistory.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center shadow-inner">
                <div className="space-y-1">
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    item.format === "PDF" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {item.format}
                  </span>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">{item.date}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold block">Jumlah Alternatif</span>
                  <span className="font-bold text-slate-700">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic block py-2 select-none">Belum ada riwayat ekspor dokumen.</span>
        )}
      </div>
    </div>
  );
}
