import { z } from "zod";

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const alternativeSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Kode minimal 2 karakter"),
  name: z.string().min(3, "Nama minimal 3 karakter"),
  cluster_id: z.string().regex(uuidRegex, "Klaster harus dipilih"),
  description: z.string().optional(),
  address: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90, "Latitude harus di antara -90 dan 90"),
  longitude: z.coerce.number().min(-180).max(180, "Longitude harus di antara -180 dan 180"),
  image_url: z.string().url("URL gambar tidak valid").or(z.literal("")).optional(),
  is_active: z.boolean().default(true),
  scores: z.record(z.string(), z.coerce.number().min(1).max(4)), // criteria_id -> score (1-4)
});

export const criteriaSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Kode minimal 2 karakter"),
  name: z.string().min(3, "Nama minimal 3 karakter"),
  type: z.enum(["benefit", "cost"]),
  description: z.string().optional(),
  sort_order: z.coerce.number().int().nonnegative(),
});

export const subCriteriaSchema = z.object({
  id: z.string().optional(),
  criteria_id: z.string().regex(uuidRegex, "ID Kriteria tidak valid"),
  score_value: z.coerce.number().min(1).max(4),
  label: z.string().min(2, "Label minimal 2 karakter"),
  description: z.string().optional(),
});

export const referenceSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(2, "Kategori harus dipilih"),
  title: z.string().min(3, "Judul minimal 3 karakter"),
  number: z.string().optional(),
  year: z.coerce.number().int().nonnegative("Tahun tidak valid").optional(),
  publisher: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url("URL tidak valid").or(z.literal("")).optional(),
  sort_order: z.coerce.number().int().nonnegative(),
});
