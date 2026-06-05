"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { alternativeSchema } from "@/lib/validations";
import { Alternative, Cluster, Criteria, Score } from "@/types";
import { useApp } from "@/components/shared/AppContext";
import { getClusterColor, getScoreLabel, getScoreColor } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Map,
  Table as TableIcon,
  Grid,
  Edit,
  Trash2,
  X,
  MapPin,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// Dynamic load Tourism Map with ssr disabled
const TourismMap = dynamic(() => import("@/components/maps/TourismMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 font-medium">
      Memuat Peta Pariwisata Balikpapan...
    </div>
  ),
});

export default function ObjekWisataPage() {
  const { refreshKey, triggerRefresh } = useApp();
  const [viewMode, setViewMode] = useState<"table" | "map" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCluster, setSelectedCluster] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlternative, setEditingAlternative] = useState<Alternative | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(alternativeSchema),
    defaultValues: {
      code: "",
      name: "",
      cluster_id: "",
      description: "",
      address: "",
      latitude: -1.24,
      longitude: 116.86,
      image_url: "",
      is_active: true,
      scores: {} as Record<string, number>,
    },
  });

  const watchScores = (watch("scores") || {}) as Record<string, number>;

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [altRes, clustRes, critRes] = await Promise.all([
          fetch("/api/alternatives").then((r) => r.json()),
          fetch("/api/clusters").then((r) => r.json()),
          fetch("/api/criteria").then((r) => r.json()),
        ]);

        if (altRes.success) setAlternatives(altRes.data);
        if (clustRes.success) setClusters(clustRes.data);
        if (critRes.success) setCriteria(critRes.data);
      } catch (err) {
        toast.error("Gagal memuat data objek wisata");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshKey]);

  // Handle open modal for create
  const handleCreateOpen = () => {
    setEditingAlternative(null);
    // Auto generate next code
    const codes = alternatives.map((a) => {
      const match = a.code.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    });
    const nextNum = codes.length > 0 ? Math.max(...codes) + 1 : 1;
    const nextCode = `A${nextNum}`;

    // Initialize scores mapping
    const defaultScores: Record<string, number> = {};
    criteria.forEach((c) => {
      defaultScores[c.id] = 3; // Default score is 3 (Baik)
    });

    reset({
      code: nextCode,
      name: "",
      cluster_id: clusters[0]?.id || "",
      description: "",
      address: "",
      latitude: -1.244,
      longitude: 116.861,
      image_url: "",
      is_active: true,
      scores: defaultScores,
    });
    setIsModalOpen(true);
  };

  // Handle open modal for edit
  const handleEditOpen = (alt: Alternative) => {
    setEditingAlternative(alt);
    const scoresMap: Record<string, number> = {};
    criteria.forEach((c) => {
      const existingScore = alt.scores?.find((s) => s.criteria_id === c.id);
      scoresMap[c.id] = existingScore ? Number(existingScore.score_value) : 3;
    });

    reset({
      id: alt.id,
      code: alt.code,
      name: alt.name,
      cluster_id: alt.cluster_id || "",
      description: alt.description || "",
      address: alt.address || "",
      latitude: Number(alt.latitude) || -1.24,
      longitude: Number(alt.longitude) || 116.86,
      image_url: alt.image_url || "",
      is_active: alt.is_active,
      scores: scoresMap,
    });
    setIsModalOpen(true);
  };

  // Save submit handler
  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const response = await fetch("/api/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.success) {
        toast.success(editingAlternative ? "Objek wisata berhasil diubah!" : "Objek wisata berhasil ditambahkan!");
        setIsModalOpen(false);
        triggerRefresh();
      } else {
        toast.error(result.error || "Gagal menyimpan data");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const handleDeleteOpen = (id: string) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/alternatives?id=${deletingId}`, { method: "DELETE" }).then((r) => r.json());
      if (res.success) {
        toast.success("Objek wisata berhasil dihapus!");
        setIsDeleteOpen(false);
        setDeletingId(null);
        triggerRefresh();
      } else {
        toast.error(res.error || "Gagal menghapus");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi");
    }
  };

  // Filters logic
  const filteredAlternatives = alternatives.filter((alt) => {
    const matchesSearch = alt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alt.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCluster = selectedCluster === "all" || alt.cluster_id === selectedCluster;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && alt.is_active) ||
      (selectedStatus === "inactive" && !alt.is_active);

    return matchesSearch && matchesCluster && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Filter Dropdowns */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari objek wisata / kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full h-10 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all bg-slate-50/50"
            />
          </div>

          <select
            value={selectedCluster}
            onChange={(e) => setSelectedCluster(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 outline-none text-sm px-3 bg-white cursor-pointer"
          >
            <option value="all">Semua Klaster</option>
            {clusters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.split(",")[0]}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 outline-none text-sm px-3 bg-white cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        {/* View Toggles & Add Button */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2.5 transition-colors ${
                viewMode === "table" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`p-2.5 transition-colors ${
                viewMode === "map" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Tampilan Peta"
            >
              <Map className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 transition-colors ${
                viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Tampilan Grid"
            >
              <Grid className="h-4.5 w-4.5" />
            </button>
          </div>

          <button
            onClick={handleCreateOpen}
            className="h-10 px-4 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-md shadow-primary/10 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Tambah Objek Wisata
          </button>
        </div>
      </div>

      {/* Main Views Container */}
      {loading ? (
        <div className="h-96 w-full flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Memuat data objek wisata...</span>
        </div>
      ) : filteredAlternatives.length === 0 ? (
        <div className="h-80 w-full flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/85 text-slate-400 shadow-sm">
          <MapPin className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-sm font-semibold mb-1 text-slate-700">Tidak ada objek wisata ditemukan</p>
          <p className="text-xs text-slate-400">Silakan ubah filter atau tambahkan destinasi baru.</p>
        </div>
      ) : (
        <>
          {/* VIEW: TABLE */}
          {viewMode === "table" && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4 w-12 text-center">No</th>
                      <th className="py-3.5 px-4 w-20 text-center">Kode</th>
                      <th className="py-3.5 px-4">Nama Destinasi</th>
                      <th className="py-3.5 px-4">Klaster Kelompok</th>
                      <th className="py-3.5 px-4 text-center">Nilai K1-K7</th>
                      <th className="py-3.5 px-4 w-28 text-center">Status</th>
                      <th className="py-3.5 px-4 w-24 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredAlternatives.map((alt, idx) => {
                      const clusterColor = alt.cluster?.color || "#64748b";

                      return (
                        <tr key={alt.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-3.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs border border-slate-200">
                              {alt.code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                                {alt.name}
                              </span>
                              <span className="text-xs text-slate-500 italic max-w-sm truncate mt-0.5">
                                {alt.address || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className="text-xs font-bold px-2.5 py-1 rounded-full text-white inline-block shadow-sm"
                              style={{ backgroundColor: clusterColor }}
                            >
                              {alt.cluster?.name || "Tidak ada klaster"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {alt.scores?.map((scoreObj) => (
                                <div
                                  key={scoreObj.id}
                                  className={`h-6 w-6 text-xs font-bold rounded flex items-center justify-center shadow-sm ${getScoreColor(
                                    scoreObj.score_value
                                  )}`}
                                  title={`${scoreObj.criteria?.name}: ${getScoreLabel(scoreObj.score_value)}`}
                                >
                                  {scoreObj.score_value}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                                alt.is_active
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {alt.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditOpen(alt)}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteOpen(alt.id)}
                                className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
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
          )}

          {/* VIEW: MAP */}
          {viewMode === "map" && <TourismMap alternatives={filteredAlternatives} />}

          {/* VIEW: CARD GRID */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAlternatives.map((alt) => {
                const clusterColor = alt.cluster?.color || "#3b82f6";
                const image = alt.image_url || "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=500";

                return (
                  <div
                    key={alt.id}
                    className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group"
                  >
                    <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={alt.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="font-bold bg-white text-slate-800 px-2 py-0.5 rounded text-xs border border-slate-200 shadow">
                          {alt.code}
                        </span>
                        <span
                          className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-white shadow"
                          style={{ backgroundColor: clusterColor }}
                        >
                          {alt.cluster?.name.split(",")[0] || "Wisata"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors text-sm mb-1 leading-snug">
                        {alt.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex-1 line-clamp-2 leading-relaxed mb-3">
                        {alt.description || "Tidak ada deskripsi singkat."}
                      </p>

                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-auto">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Nilai Kriteria:</span>
                        <div className="flex gap-1">
                          {alt.scores?.map((sc) => (
                            <span
                              key={sc.id}
                              className={`h-5 w-5 text-[9px] font-bold rounded flex items-center justify-center font-mono ${getScoreColor(
                                sc.score_value
                              )}`}
                              title={`${sc.criteria?.name}: ${sc.score_value}`}
                            >
                              {sc.score_value}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-100/60 mt-3 pt-3 flex items-center justify-between">
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            alt.is_active
                              ? "bg-green-50 text-green-600 border border-green-200/50"
                              : "bg-red-50 text-red-600 border border-red-200/50"
                          }`}
                        >
                          {alt.is_active ? "Aktif" : "Nonaktif"}
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditOpen(alt)}
                            className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOpen(alt.id)}
                            className="p-1 rounded text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL DIALOG: TAMBAH/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editingAlternative ? `Edit Objek Wisata: ${editingAlternative.name}` : "Tambah Objek Wisata Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Kode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kode Alternatif *</label>
                  <input
                    type="text"
                    {...register("code")}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono font-bold"
                  />
                  {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
                </div>

                {/* Nama */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nama Destinasi Wisata *</label>
                  <input
                    type="text"
                    {...register("name")}
                    placeholder="Nama objek wisata..."
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all font-semibold"
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                {/* Klaster */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Klaster Kelompok *</label>
                  <select
                    {...register("cluster_id")}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white"
                  >
                    {clusters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.cluster_id && <p className="text-xs text-red-500">{errors.cluster_id.message}</p>}
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Status Aktif</label>
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      id="is_active"
                      {...register("is_active")}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 cursor-pointer">
                      Destinasi Wisata Aktif
                    </label>
                  </div>
                </div>

                {/* Latitude */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Latitude GPS *</label>
                  <input
                    type="number"
                    step="any"
                    {...register("latitude")}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                  />
                  {errors.latitude && <p className="text-xs text-red-500">{errors.latitude.message}</p>}
                </div>

                {/* Longitude */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Longitude GPS *</label>
                  <input
                    type="number"
                    step="any"
                    {...register("longitude")}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                  />
                  {errors.longitude && <p className="text-xs text-red-500">{errors.longitude.message}</p>}
                </div>

                {/* Alamat */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Alamat Lengkap</label>
                  <input
                    type="text"
                    {...register("address")}
                    placeholder="Jalan, RT, Kelurahan, Kecamatan..."
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">URL Gambar</label>
                  <input
                    type="text"
                    {...register("image_url")}
                    placeholder="https://example.com/image.jpg..."
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                  />
                  {errors.image_url && <p className="text-xs text-red-500">{errors.image_url.message}</p>}
                </div>

                {/* Deskripsi */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Deskripsi Singkat</label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Deskripsi daya tarik wisata..."
                    className="w-full p-3 rounded-lg border border-slate-200 outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
                  />
                </div>
              </div>

              {/* CRITERIA SCORES ACCORDION */}
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nilai Penilaian Kriteria (K1-K7)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {criteria.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 relative group">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">
                          {c.code} — {c.name}
                        </label>
                      </div>

                      <select
                        value={watchScores[c.id] || 3}
                        onChange={(e) => {
                          setValue(`scores.${c.id}`, Number(e.target.value));
                        }}
                        className="w-full h-9 px-2 rounded border border-slate-200 outline-none text-xs focus:border-primary transition-all bg-white font-semibold cursor-pointer"
                      >
                        <option value={1}>1.00 - Tidak Baik</option>
                        <option value={2}>2.00 - Kurang Baik</option>
                        <option value={3}>3.00 - Baik</option>
                        <option value={4}>4.00 - Sangat Baik</option>
                      </select>

                      {/* Tooltip Description for Sub Criteria */}
                      <p className="text-[10px] text-slate-500 leading-normal">
                        {c.sub_criteria?.find((s) => s.score_value === (watchScores[c.id] || 3))?.description ||
                          "Silakan pilih nilai."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-200 pt-5 flex items-center justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-sm shadow-md shadow-primary/10 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: HAPUS */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xl max-w-sm w-full animate-scale-in">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-5.5 w-5.5" />
              </div>
              <h3 className="font-bold text-slate-950 text-sm">Konfirmasi Hapus</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Apakah Anda yakin ingin menghapus objek wisata ini?
              <strong className="block mt-1 text-red-600 font-semibold">
                * Peringatan: Data skor dan hasil kalkulasi terkait akan ikut terhapus.
              </strong>
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="h-9 px-4 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
