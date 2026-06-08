"use client";

import React, { useState } from "react";
import { BookOpen, CheckCircle, ChevronRight, HelpCircle, Layers, Sliders, Trophy } from "lucide-react";

export default function MetodologiPage() {
  const [activeAnchor, setActiveAnchor] = useState("pendahuluan");

  const anchors = [
    { id: "pendahuluan", label: "1. Pendahuluan" },
    { id: "metode-ahp", label: "2. Metode AHP" },
    { id: "metode-topsis", label: "3. Metode TOPSIS" },
    { id: "hirarki-spk", label: "4. Diagram Hirarki AHP" },
    { id: "kriteria-penilaian", label: "5. Kriteria & Skala" },
  ];

  const scrollToAnchor = (id: string) => {
    setActiveAnchor(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none font-sans animate-fade-in">
      {/* LEFT: FLOATING ANCHOR NAVIGATION */}
      <div className="lg:col-span-1">
        <div className="sticky top-20 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-slate-900 text-sm">Daftar Isi</h3>
          </div>
          <nav className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">
            {anchors.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToAnchor(item.id)}
                className={`flex items-center justify-between w-full text-left p-2 rounded-lg transition-all ${
                  activeAnchor === item.id
                    ? "bg-primary/5 text-primary font-bold border-l-4 border-primary"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>{item.label}</span>
                {activeAnchor === item.id && <ChevronRight className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* RIGHT: SCIENTIFIC ARTICLE CONTENT */}
      <div className="lg:col-span-3 bg-white p-6 lg:p-8 rounded-xl border border-slate-200/80 shadow-sm space-y-8 text-xs leading-relaxed text-slate-600">
        {/* Title */}
        <div className="space-y-1.5 border-b border-slate-100 pb-4">
          <h1 className="text-lg font-extrabold text-slate-950 uppercase tracking-wide">
            Kajian Ilmiah Metodologi AHP-TOPSIS
          </h1>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Kerangka Pengambilan Keputusan Prioritas Pariwisata Balikpapan
          </p>
        </div>

        {/* 1. PENDAHULUAN */}
        <section id="pendahuluan" className="space-y-3.5">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
            1. Pendahuluan
          </h2>
          <p>
            Sistem Pendukung Keputusan (SPK) atau Decision Support System (DSS) adalah sistem berbasis komputer interaktif yang membantu pengambil keputusan memanfaatkan data dan model untuk menyelesaikan masalah tidak terstruktur.
          </p>
          <p>
            Dalam prioritas pengembangan pariwisata Kota Balikpapan, penggabungan metode <strong>AHP (Analytic Hierarchy Process)</strong> dan <strong>TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)</strong> dipilih karena kekuatan sinergi keduanya:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1.5">
            <li>
              <strong>AHP</strong> digunakan untuk menghitung bobot kriteria secara objektif melalui matriks perbandingan berpasangan (pairwise comparison), meminimalisir subjektivitas manusia serta dilengkapi dengan uji konsistensi logika (Consistency Ratio).
            </li>
            <li>
              <strong>TOPSIS</strong> digunakan untuk merangking alternatif dalam jumlah besar (40 alternatif objek wisata) berdasarkan jarak terdekat dengan solusi ideal positif (pilihan terbaik) dan jarak terjauh dari solusi ideal negatif (pilihan terburuk).
            </li>
          </ul>
        </section>

        {/* 2. METODE AHP */}
        <section id="metode-ahp" className="space-y-3.5">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
            2. Metode AHP (Analytic Hierarchy Process)
          </h2>
          <p>
            Metode AHP dikembangkan oleh Thomas L. Saaty pada tahun 1980. Tahapan matematis perhitungannya meliputi:
          </p>
          <div className="space-y-4 pt-2">
            {/* Step 1 */}
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg space-y-2">
              <h4 className="font-bold text-slate-800">Langkah A1: Penyusunan Matriks Perbandingan Berpasangan</h4>
              <p>Membentuk matriks persegi N x N (N = jumlah kriteria = 7) berdasarkan skala Saaty 1-9:</p>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[10px] text-center select-all">
                A = [a_ij] di mana a_ji = 1 / a_ij dan a_ii = 1
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg space-y-2">
              <h4 className="font-bold text-slate-800">Langkah A2: Normalisasi Matriks</h4>
              <p>Membagi setiap nilai sel pada kolom j dengan jumlah total kolom j:</p>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[10px] text-center select-all">
                r_ij = a_ij / Sum(a_kj, k=1 s/d n)
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg space-y-2">
              <h4 className="font-bold text-slate-800">Langkah A3: Menghitung Vektor Prioritas (Bobot)</h4>
              <p>Rata-rata baris dari matriks hasil normalisasi:</p>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[10px] text-center select-all">
                w_i = Sum(r_ij, j=1 s/d n) / n
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg space-y-2">
              <h4 className="font-bold text-slate-800">Langkah A4: Uji Konsistensi (Consistency Ratio)</h4>
              <p>Menghitung Lambda Max (λmax), Consistency Index (CI), dan Consistency Ratio (CR):</p>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[10px] text-left space-y-1.5 pl-6 select-all">
                <p>1. CI = (λmax - n) / (n - 1)</p>
                <p>2. CR = CI / RI (Random Index sesuai ukuran matriks n)</p>
                <p>3. Jika CR &lt; 0.10, maka matriks dinyatakan KONSISTEN.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. METODE TOPSIS */}
        <section id="metode-topsis" className="space-y-3.5">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
            3. Metode TOPSIS
          </h2>
          <p>
            TOPSIS diintroduksi oleh Hwang dan Yoon pada tahun 1981. Tahapan kalkulasinya meliputi:
          </p>
          <div className="space-y-4 pt-2">
            {/* Step 1 */}
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg space-y-2">
              <h4 className="font-bold text-slate-800">Langkah B1: Normalisasi Matriks Keputusan</h4>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[10px] text-center select-all">
                r_ij = x_ij / sqrt(Sum(x_kj², k=1 s/d m))
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg space-y-2">
              <h4 className="font-bold text-slate-800">Langkah B2: Matriks Terbobot</h4>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[10px] text-center select-all">
                v_ij = w_j * r_ij
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg space-y-2">
              <h4 className="font-bold text-slate-800">Langkah B3: Menentukan Solusi Ideal Positif (A+) & Negatif (A-)</h4>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[10px] text-left pl-6 select-all">
                <p>• A+ = [max(v_ij) untuk benefit, min(v_ij) untuk cost]</p>
                <p>• A- = [min(v_ij) untuk benefit, max(v_ij) untuk cost]</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg space-y-2">
              <h4 className="font-bold text-slate-800">Langkah B4: Menghitung Jarak Euclidean (D+ & D-)</h4>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[10px] text-left pl-6 select-all">
                <p>• D+_i = sqrt(Sum((v_ij - A+_j)², j=1 s/d n))</p>
                <p>• D-_i = sqrt(Sum((v_ij - A-_j)², j=1 s/d n))</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg space-y-2">
              <h4 className="font-bold text-slate-800">Langkah B5: Menghitung Nilai Preferensi (Ci) & Perangkingan</h4>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[10px] text-center select-all">
                Ci = D-_i / (D+_i + D-_i)
              </div>
              <p className="text-[10px] text-slate-500">
                Nilai Ci berkisar antara 0 s/d 1. Alternatif dengan nilai Ci mendekati 1.00 adalah prioritas utama program pengembangan pariwisata.
              </p>
            </div>
          </div>
        </section>

        {/* 4. DIAGRAM HIRARKI AHP */}
        <section id="hirarki-spk" className="space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
            4. Diagram Hirarki Pengambilan Keputusan (AHP)
          </h2>
          <p>
            Struktur hirarki keputusan AHP untuk penentuan prioritas pengembangan destinasi pariwisata Kota Balikpapan digambarkan sebagai berikut:
          </p>

          {/* SVG Hierarchy Chart */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center overflow-x-auto shadow-inner">
            <svg width="600" height="280" className="mx-auto block text-slate-800">
              {/* LEVEL 1: GOAL */}
              <rect x="200" y="10" width="200" height="35" rx="6" fill="#1d4ed8" stroke="#1e40af" strokeWidth="1.5" />
              <text x="300" y="31" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">Goal: Prioritas Pariwisata Balikpapan</text>

              {/* LINES Level 1 to 2 */}
              <line x1="300" y1="45" x2="60" y2="100" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="300" y1="45" x2="140" y2="100" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="300" y1="45" x2="220" y2="100" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="300" y1="45" x2="300" y2="100" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="300" y1="45" x2="380" y2="100" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="300" y1="45" x2="460" y2="100" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="300" y1="45" x2="540" y2="100" stroke="#94a3b8" strokeWidth="1.5" />

              {/* LEVEL 2: CRITERIA */}
              {/* K1 */}
              <rect x="25" y="100" width="70" height="30" rx="5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
              <text x="60" y="118" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">K1: Akses</text>

              {/* K2 */}
              <rect x="105" y="100" width="70" height="30" rx="5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
              <text x="140" y="118" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">K2: Amenitas</text>

              {/* K3 */}
              <rect x="185" y="100" width="70" height="30" rx="5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
              <text x="220" y="118" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">K3: Atraksi</text>

              {/* K4 */}
              <rect x="265" y="100" width="70" height="30" rx="5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
              <text x="300" y="118" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">K4: Lembaga</text>

              {/* K5 */}
              <rect x="345" y="100" width="70" height="30" rx="5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
              <text x="380" y="118" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">K5: Ekonomi</text>

              {/* K6 */}
              <rect x="425" y="100" width="70" height="30" rx="5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
              <text x="460" y="118" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">K6: Lingk.</text>

              {/* K7 */}
              <rect x="505" y="100" width="70" height="30" rx="5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
              <text x="540" y="118" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">K7: Hub IKN</text>

              {/* LINES Level 2 to 3 (Selective for clean visual) */}
              <line x1="60" y1="130" x2="150" y2="210" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="140" y1="130" x2="250" y2="210" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="220" y1="130" x2="350" y2="210" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="380" y1="130" x2="450" y2="210" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="540" y1="130" x2="450" y2="210" stroke="#cbd5e1" strokeWidth="1" />

              {/* LEVEL 3: ALTERNATIVES */}
              {/* A1 */}
              <rect x="100" y="210" width="100" height="30" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
              <text x="150" y="228" fill="#fff" fontSize="9" fontWeight="semibold" textAnchor="middle">Alt A1 (Pantai Manggar)</text>

              {/* A2 */}
              <rect x="210" y="210" width="80" height="30" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
              <text x="250" y="228" fill="#fff" fontSize="9" fontWeight="semibold" textAnchor="middle">Alt A2 (Lamaru)</text>

              {/* Dots */}
              <circle cx="310" cy="225" r="3" fill="#64748b" />
              <circle cx="320" cy="225" r="3" fill="#64748b" />
              <circle cx="330" cy="225" r="3" fill="#64748b" />

              {/* A40 */}
              <rect x="350" y="210" width="150" height="30" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
              <text x="425" y="228" fill="#fff" fontSize="9" fontWeight="semibold" textAnchor="middle">Alt A40 (KEK Kariangau)</text>
            </svg>
          </div>
        </section>

        {/* 5. KRITERIA PENILAIAN */}
        <section id="kriteria-penilaian" className="space-y-3.5">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
            5. Kriteria Penilaian
          </h2>
          <p>
            Sistem pengujian ini menggunakan 7 kriteria keputusan strategis sebagai landasan analisis:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border border-slate-200/80 rounded-lg space-y-1.5">
              <span className="font-bold text-slate-800">K1 — Aksesibilitas</span>
              <p className="text-[11px] text-slate-500">Kondisi kemudahan jalan, kelancaran lalu lintas, ketersediaan angkutan umum/online.</p>
            </div>
            <div className="p-3 border border-slate-200/80 rounded-lg space-y-1.5">
              <span className="font-bold text-slate-800">K2 — Amenitas</span>
              <p className="text-[11px] text-slate-500">Kelengkapan akomodasi penunjang seperti area sanitasi, parkir, penginapan, tempat ibadah.</p>
            </div>
            <div className="p-3 border border-slate-200/80 rounded-lg space-y-1.5">
              <span className="font-bold text-slate-800">K3 — Atraksi</span>
              <p className="text-[11px] text-slate-500">Unsur keindahan pemandangan alam, seni tari tradisional, rekreasi aktif, spot foto kreatif.</p>
            </div>
            <div className="p-3 border border-slate-200/80 rounded-lg space-y-1.5">
              <span className="font-bold text-slate-800">K4 — Kelembagaan</span>
              <p className="text-[11px] text-slate-500">Kelompok Sadar Wisata (Pokdarwis) pengelola resmi, peraturan pemda, SOP pelayanan.</p>
            </div>
            <div className="p-3 border border-slate-200/80 rounded-lg space-y-1.5">
              <span className="font-bold text-slate-800">K5 — Dampak Ekonomi</span>
              <p className="text-[11px] text-slate-500">Penyerapan tenaga kerja wilayah sekitar, peningkatan omset UMKM kerajinan & kuliner khas.</p>
            </div>
            <div className="p-3 border border-slate-200/80 rounded-lg space-y-1.5">
              <span className="font-bold text-slate-800">K6 — Kelestarian Lingkungan</span>
              <p className="text-[11px] text-slate-500">Upaya mitigasi polusi sampah plastik, pengelolaan limbah sanitasi, perlindungan ekosistem pesisir.</p>
            </div>
            <div className="p-3 border border-slate-200/80 rounded-lg space-y-1.5 md:col-span-2">
              <span className="font-bold text-slate-800">K7 — Relevansi IKN (Ibu Kota Nusantara)</span>
              <p className="text-[11px] text-slate-500">Posisi strategis sebagai destinasi weekend hub penunjang kebutuhan rekreasi bagi pegawai/tamu negara IKN.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
