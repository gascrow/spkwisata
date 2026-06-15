"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { referenceSchema } from "@/lib/validations";
import { ReferenceDoc } from "@/types";
import { useApp } from "@/components/shared/AppContext";
import toast from "react-hot-toast";
import {
  Library,
  Search,
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function SumberReferensiPage() {
  const { refreshKey, triggerRefresh } = useApp();
  const [references, setReferences] = useState<ReferenceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReference, setEditingReference] = useState<ReferenceDoc | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(referenceSchema),
    defaultValues: {
      category: "Peraturan Daerah",
      title: "",
      number: "",
      year: 2026,
      publisher: "",
      description: "",
      url: "",
      sort_order: 1,
    },
  });

  useEffect(() => {
    async function fetchReferences() {
      setLoading(true);
      try {
        const res = await fetch("/api/references").then((r) => r.json());
        if (res.success) setReferences(res.data);
      } catch (e) {
        toast.error("Gagal memuat referensi");
      } finally {
        setLoading(false);
      }
    }
    fetchReferences();
  }, [refreshKey]);

  const handleCreateOpen = () => {
    setEditingReference(null);
    reset({
      category: "Peraturan Daerah",
      title: "",
      number: "",
      year: 2026,
      publisher: "",
      description: "",
      url: "",
      sort_order: references.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleEditOpen = (ref: ReferenceDoc) => {
    setEditingReference(ref);
    reset({
      id: ref.id,
      category: ref.category,
      title: ref.title,
      number: ref.number || "",
      year: ref.year || 2026,
      publisher: ref.publisher || "",
      description: ref.description || "",
      url: ref.url || "",
      sort_order: ref.sort_order,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const response = await fetch("/api/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.success) {
        toast.success(editingReference ? "Referensi diubah!" : "Referensi ditambahkan!");
        setIsModalOpen(false);
        triggerRefresh();
      } else {
        toast.error(result.error || "Gagal menyimpan");
      }
    } catch (e) {
      toast.error("Koneksi gagal");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOpen = (id: string) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/references?id=${deletingId}`, { method: "DELETE" }).then((r) => r.json());
      if (res.success) {
        toast.success("Referensi berhasil dihapus!");
        setIsDeleteOpen(false);
        setDeletingId(null);
        triggerRefresh();
      } else {
        toast.error(res.error || "Gagal menghapus");
      }
    } catch (e) {
      toast.error("Koneksi gagal");
    }
  };

  // Badge category coloring helper
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Peraturan Daerah":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Undang-Undang":
        return "bg-red-50 text-red-700 border-red-200";
      case "Peraturan Pemerintah":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Jurnal Ilmiah":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Buku":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const filteredReferences = references.filter((ref) => {
    const matchesSearch =
      ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ref.number && ref.number.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || ref.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "Peraturan Daerah",
    "Undang-Undang",
    "Peraturan Pemerintah",
    "Jurnal Ilmiah",
    "Buku",
    "Lainnya",
  ];

  return (
    <>
      <div className="space-y-6 animate-fade-in">
      {/* Search & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul / nomor regulasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full h-10 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs transition-all bg-slate-50/50"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 outline-none text-xs px-3 bg-white cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCreateOpen}
          className="h-10 px-4 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-primary/10 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          Tambah Referensi
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="h-96 w-full flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Memuat data referensi...</span>
        </div>
      ) : filteredReferences.length === 0 ? (
        <div className="h-80 w-full flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/85 text-slate-400 shadow-sm">
          <Library className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-sm font-semibold mb-1 text-slate-700">Tidak ada referensi ditemukan</p>
          <p className="text-xs text-slate-400">Silakan ubah filter atau tambahkan dokumen referensi baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in select-none">
          {filteredReferences.map((ref) => (
            <div
              key={ref.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <span className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getCategoryColor(ref.category)}`}>
                    {ref.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Order: {ref.sort_order}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors text-sm leading-snug">
                    {ref.title}
                  </h3>
                  {ref.number && (
                    <p className="text-[11px] font-bold text-slate-700 font-mono leading-none">
                      {ref.number}
                    </p>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                  {ref.description || "Tidak ada keterangan deskripsi."}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="border-t border-slate-100/80 pt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                  <span>Th: {ref.year || "-"}</span>
                  <span>•</span>
                  <span>Pub: {ref.publisher || "-"}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                      title="Buka Link Dokumen"
                    >
                      <ExternalLink className="h-4.5 w-4.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEditOpen(ref)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteOpen(ref.id)}
                    className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* FORM MODAL: ADD/EDIT REFERENCE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md my-auto overflow-hidden animate-scale-in">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {editingReference ? "Edit Sumber Referensi" : "Tambah Referensi Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div className="space-y-3.5 text-xs">
                {/* Kategori */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Kategori Dokumen *</label>
                  <select
                    {...register("category")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary bg-white transition-all cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Judul */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Judul Referensi/Buku *</label>
                  <input
                    type="text"
                    {...register("title")}
                    placeholder="Judul lengkap..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all font-semibold"
                  />
                  {errors.title && <p className="text-[10px] text-red-500">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {/* Nomor */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nomor (Jika regulasi)</label>
                    <input
                      type="text"
                      {...register("number")}
                      placeholder="No. 12 Tahun 2012..."
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all font-mono"
                    />
                  </div>

                  {/* Tahun */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tahun Terbit</label>
                    <input
                      type="number"
                      {...register("year")}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all font-mono"
                    />
                    {errors.year && <p className="text-[10px] text-red-500">{errors.year.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {/* Penerbit */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Penerbit / Instansi</label>
                    <input
                      type="text"
                      {...register("publisher")}
                      placeholder="Nama Penerbit..."
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all"
                    />
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Urutan Tampil</label>
                    <input
                      type="number"
                      {...register("sort_order")}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all font-mono"
                    />
                  </div>
                </div>

                {/* URL */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">URL Link Dokumen</label>
                  <input
                    type="text"
                    {...register("url")}
                    placeholder="https://example.com/pdf..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all font-mono"
                  />
                  {errors.url && <p className="text-[10px] text-red-500">{errors.url.message}</p>}
                </div>

                {/* Deskripsi */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Deskripsi / Keterangan</label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Keterangan singkat isi dokumen..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 outline-none text-xs focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 px-4 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: DELETE */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xl max-w-xs w-full my-auto animate-scale-in">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertTriangle className="h-5.5 w-5.5 shrink-0" />
              <h3 className="font-bold text-slate-950 text-sm">Hapus Referensi?</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal mb-5">
              Apakah Anda yakin ingin menghapus dokumen sumber referensi ini dari database?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="h-8.5 px-3 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="h-8.5 px-4.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
