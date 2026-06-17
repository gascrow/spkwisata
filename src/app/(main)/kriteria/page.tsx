"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { criteriaSchema, subCriteriaSchema } from "@/lib/validations";
import { Criteria, SubCriteria } from "@/types";
import { useApp } from "@/components/shared/AppContext";
import { formatNumberID } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  Sliders,
  ChevronRight,
  Info,
  X,
  Loader2,
  ListOrdered,
  Trash2,
} from "lucide-react";

export default function KriteriaPage() {
  const { refreshKey, triggerRefresh, activeSession } = useApp();
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<Criteria | null>(null);
  const [loading, setLoading] = useState(true);

  // Criteria Form Modal state
  const [isCritModalOpen, setIsCritModalOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<Criteria | null>(null);
  const [critSaving, setCritSaving] = useState(false);

  // SubCriteria Form Modal state
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubCriteria | null>(null);
  const [subSaving, setSubSaving] = useState(false);

  // Criteria Form setup
  const {
    register: registerCrit,
    handleSubmit: handleSubmitCrit,
    reset: resetCrit,
    formState: { errors: errorsCrit },
  } = useForm({
    resolver: zodResolver(criteriaSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "benefit" as "benefit" | "cost",
      description: "",
      sort_order: 1,
    },
  });

  // SubCriteria Form setup
  const {
    register: registerSub,
    handleSubmit: handleSubmitSub,
    reset: resetSub,
    formState: { errors: errorsSub },
  } = useForm({
    resolver: zodResolver(subCriteriaSchema),
    defaultValues: {
      criteria_id: "",
      score_value: 3,
      label: "",
      description: "",
    },
  });

  // Fetch criteria data + session-specific AHP weights
  useEffect(() => {
    async function fetchCriteria() {
      setLoading(true);
      try {
        const [critRes, ahpRes] = await Promise.all([
          fetch("/api/criteria").then((r) => r.json()),
          fetch(`/api/ahp?session=${encodeURIComponent(activeSession)}`).then((r) => r.json()),
        ]);
        if (critRes.success) {
          // Override criteria weights with session-specific AHP results
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
          // Auto select first criteria if none selected
          if (critData.length > 0) {
            const stillExists = critData.find((c: any) => c.id === selectedCriteria?.id);
            setSelectedCriteria(stillExists || critData[0]);
          }
        }
      } catch (err) {
        toast.error("Gagal memuat kriteria");
      } finally {
        setLoading(false);
      }
    }
    fetchCriteria();
  }, [refreshKey, activeSession]);

  // Open criteria modal for create
  const handleCritCreateOpen = () => {
    setEditingCriteria(null);
    resetCrit({
      code: `K${criteria.length + 1}`,
      name: "",
      type: "benefit",
      description: "",
      sort_order: criteria.length + 1,
    });
    setIsCritModalOpen(true);
  };

  // Open criteria modal for edit
  const handleCritEditOpen = (c: Criteria, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting row
    setEditingCriteria(c);
    resetCrit({
      id: c.id,
      code: c.code,
      name: c.name,
      type: c.type,
      description: c.description || "",
      sort_order: c.sort_order,
    });
    setIsCritModalOpen(true);
  };

  // Submit criteria handler
  const onCritSubmit = async (data: any) => {
    setCritSaving(true);
    try {
      const response = await fetch("/api/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, mode: "criteria" }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success(editingCriteria ? "Kriteria berhasil diubah!" : "Kriteria baru ditambahkan!");
        setIsCritModalOpen(false);
        triggerRefresh();
      } else {
        toast.error(result.error || "Gagal menyimpan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setCritSaving(false);
    }
  };

  // Delete criteria handler
  const handleCritDelete = async (id: string, code: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting row
    
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus kriteria ${code}?\n\nTindakan ini bersifat PERMANEN dan akan MENGRESET seluruh kalkulasi AHP & TOPSIS pada semua sesi!`
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/criteria?id=${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        toast.success(`Kriteria ${code} berhasil dihapus! Kalkulasi direset.`);
        triggerRefresh();
      } else {
        toast.error(result.error || "Gagal menghapus kriteria");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi");
    }
  };

  // Open sub-criteria modal for edit
  const handleSubEditOpen = (sub: SubCriteria) => {
    setEditingSub(sub);
    resetSub({
      id: sub.id,
      criteria_id: sub.criteria_id,
      score_value: Number(sub.score_value),
      label: sub.label,
      description: sub.description || "",
    });
    setIsSubModalOpen(true);
  };

  // Submit sub-criteria handler
  const onSubSubmit = async (data: any) => {
    setSubSaving(true);
    try {
      const response = await fetch("/api/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, mode: "sub_criteria" }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Sub-kriteria berhasil disimpan!");
        setIsSubModalOpen(false);
        triggerRefresh();
      } else {
        toast.error(result.error || "Gagal menyimpan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setSubSaving(false);
    }
  };

  // Saaty AHP Scale description
  const saatyScaleData = [
    { value: "1", label: "Sama penting (Equal Importance)", desc: "Kedua elemen memiliki kontribusi yang sama terhadap tujuan." },
    { value: "3", label: "Sedikit lebih penting (Moderate Importance)", desc: "Pengalaman dan penilaian sedikit memihak satu elemen dibanding yang lain." },
    { value: "5", label: "Jelas lebih penting (Strong Importance)", desc: "Satu elemen sangat disukai dan didukung kuat secara logis." },
    { value: "7", label: "Sangat jelas lebih penting (Very Strong Importance)", desc: "Satu elemen sangat dominan dan keunggulannya terbukti secara praktis." },
    { value: "9", label: "Mutlak lebih penting (Extreme Importance)", desc: "Keunggulan satu elemen mutlak tidak dapat diragukan lagi." },
    { value: "2, 4, 6, 8", label: "Nilai-nilai tengah (Intermediate Values)", desc: "Digunakan ketika kompromi atau pembagian penilaian diperlukan di antara skala utama." },
  ];

  return (
    <>
      <div className="space-y-6 animate-fade-in">
      {/* 2-Panel Layout Grid */}
      {loading ? (
        <div className="h-96 w-full flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Memuat data kriteria...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT PANEL: CRITERIA LIST (3 columns of width) */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden lg:col-span-3 flex flex-col">
            {/* Panel Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-slate-900 text-sm">Daftar Kriteria</h2>
              </div>
              <button
                onClick={handleCritCreateOpen}
                className="h-8 px-3 rounded bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Kriteria
              </button>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-16 text-center">Kode</th>
                    <th className="py-3 px-4">Nama Kriteria</th>
                    <th className="py-3 px-4 w-20 text-center">Tipe</th>
                    <th className="py-3 px-4 w-24 text-right">Bobot AHP</th>
                    <th className="py-3 px-4 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {criteria.map((c) => {
                    const isSelected = selectedCriteria?.id === c.id;

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCriteria(c)}
                        className={`cursor-pointer transition-colors group ${
                          isSelected ? "bg-primary/5 hover:bg-primary/5" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs border border-slate-200">
                            {c.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-1">
                              {c.name}
                              {isSelected && <ChevronRight className="h-3.5 w-3.5 text-primary" />}
                            </span>
                            <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 max-w-xs">
                              {c.description || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              c.type === "benefit"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {c.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 text-sm">
                          {formatNumberID(c.weight, 4)}
                        </td>
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={(e) => handleCritEditOpen(c, e)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => handleCritDelete(c.id, c.code, e)}
                              className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT PANEL: DETAIL SUB-CRITERIA (2 columns of width) */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden lg:col-span-2 flex flex-col">
            {/* Panel Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-slate-900 text-sm">
                Sub-Kriteria: <span className="text-primary font-extrabold">{selectedCriteria?.code || "K1"}</span>
              </h2>
            </div>

            {/* Sub-Criteria Table Area */}
            {selectedCriteria ? (
              <div className="flex-1 overflow-auto max-h-[500px] scrollbar-thin">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 w-16 text-center">Nilai</th>
                      <th className="py-3 px-4 w-28">Label</th>
                      <th className="py-3 px-4">Deskripsi / Kriteria Skor</th>
                      <th className="py-3 px-4 w-16 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {selectedCriteria.sub_criteria?.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800 text-sm">{sub.score_value}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-700">{sub.label}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 leading-relaxed">{sub.description || "-"}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleSubEditOpen(sub)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Edit Sub-Kriteria"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!selectedCriteria.sub_criteria || selectedCriteria.sub_criteria.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Tidak ada sub-kriteria terdefinisi.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-48">
                <Info className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs">Silakan pilih salah satu kriteria di sebelah kiri.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM AREA: SAATY PAIRWISE SCALE REFERENCE TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Info className="h-4.5 w-4.5 text-primary" />
          <h3 className="font-bold text-slate-900 text-sm">Tabel Referensi Skala Perbandingan AHP (Saaty 1-9)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {saatyScaleData.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs">
                  {item.value}
                </span>
                <span className="text-xs font-bold text-slate-800">{item.label}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* MODAL DIALOG: EDIT/ADD CRITERIA */}
      {isCritModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md my-auto overflow-hidden animate-scale-in">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {editingCriteria ? `Edit Kriteria: ${editingCriteria.code}` : "Tambah Kriteria Baru"}
              </h2>
              <button
                onClick={() => setIsCritModalOpen(false)}
                className="p-1 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCrit(onCritSubmit)} className="p-5 space-y-4">
              <div className="space-y-3.5">
                {/* Kode */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Kode Kriteria *</label>
                  <input
                    type="text"
                    {...registerCrit("code")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all font-mono font-bold"
                  />
                  {errorsCrit.code && <p className="text-[10px] text-red-500">{errorsCrit.code.message}</p>}
                </div>

                {/* Nama */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Kriteria *</label>
                  <input
                    type="text"
                    {...registerCrit("name")}
                    placeholder="Nama Kriteria..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all font-semibold"
                  />
                  {errorsCrit.name && <p className="text-[10px] text-red-500">{errorsCrit.name.message}</p>}
                </div>

                {/* Tipe */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tipe Kriteria *</label>
                  <select
                    {...registerCrit("type")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all bg-white"
                  >
                    <option value="benefit">Benefit (Makin besar makin baik)</option>
                    <option value="cost">Cost (Makin kecil makin baik)</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Urutan Tampil *</label>
                  <input
                    type="number"
                    {...registerCrit("sort_order")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all font-mono"
                  />
                </div>

                {/* Deskripsi */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Deskripsi</label>
                  <textarea
                    {...registerCrit("description")}
                    rows={3}
                    placeholder="Definisi kriteria..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCritModalOpen(false)}
                  className="h-9 px-4 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={critSaving}
                  className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
                >
                  {critSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DIALOG: EDIT SUB-CRITERIA */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md my-auto overflow-hidden animate-scale-in">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Edit Keterangan Sub-Kriteria (Nilai: {editingSub?.score_value})
              </h2>
              <button
                onClick={() => setIsSubModalOpen(false)}
                className="p-1 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSub(onSubSubmit)} className="p-5 space-y-4">
              <div className="space-y-3.5">
                {/* Nilai (readonly) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Nilai Skor</label>
                  <span className="font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded border border-slate-200 text-xs inline-block">
                    {editingSub?.score_value}
                  </span>
                </div>

                {/* Label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Label Penilaian *</label>
                  <input
                    type="text"
                    {...registerSub("label")}
                    placeholder="Misal: Sangat Baik, Cukup, dll..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all font-semibold"
                  />
                  {errorsSub.label && <p className="text-[10px] text-red-500">{errorsSub.label.message}</p>}
                </div>

                {/* Deskripsi */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Deskripsi Kriteria Skor *</label>
                  <textarea
                    {...registerSub("description")}
                    rows={4}
                    placeholder="Kondisi atau spesifikasi agar mendapatkan nilai skor ini..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="h-9 px-4 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={subSaving}
                  className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
                >
                  {subSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
