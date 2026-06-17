import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number with Indonesian locale (comma as decimal separator) */
export function formatNumberID(value: number, decimals: number = 4): string {
  return value.toFixed(decimals).replace(".", ",");
}

/** Format as percentage with Indonesian locale */
export function formatPercentID(value: number, decimals: number = 2): string {
  return (value * 100).toFixed(decimals).replace(".", ",") + "%";
}

/** Get cluster color by name */
export function getClusterColor(clusterName: string): string {
  const colors: Record<string, string> = {
    "Wisata Bahari, Pesisir & Pantai": "#0ea5e9",
    "Wisata Alam, Konservasi & Edukasi": "#22c55e",
    "Wisata Sejarah, Budaya & Heritage": "#f59e0b",
    "Wisata Kreatif, Kuliner & Belanja": "#a855f7",
    "Wisata MICE & Bisnis": "#ef4444",
  };
  for (const [key, color] of Object.entries(colors)) {
    if (clusterName.includes(key) || key.includes(clusterName)) return color;
  }
  return "#6b7280";
}

/** Get score label */
export function getScoreLabel(score: number): string {
  const labels: Record<number, string> = {
    1: "Tidak Baik",
    2: "Kurang Baik",
    3: "Baik",
    4: "Sangat Baik",
  };
  return labels[score] || `${score}`;
}

/** Get score color class */
export function getScoreColor(score: number): string {
  const colors: Record<number, string> = {
    1: "bg-red-100 text-red-700",
    2: "bg-orange-100 text-orange-700",
    3: "bg-yellow-100 text-yellow-700",
    4: "bg-green-100 text-green-700",
  };
  return colors[score] || "bg-gray-100 text-gray-700";
}

/** Get rank badge style */
export function getRankBadge(rank: number): { color: string; label: string; icon: string } {
  switch (rank) {
    case 1:
      return { color: "bg-amber-100 text-amber-800 border-amber-300", label: "#1", icon: "🥇" };
    case 2:
      return { color: "bg-slate-100 text-slate-700 border-slate-300", label: "#2", icon: "🥈" };
    case 3:
      return { color: "bg-orange-100 text-orange-700 border-orange-300", label: "#3", icon: "🥉" };
    default:
      return { color: "bg-blue-50 text-blue-700 border-blue-200", label: `#${rank}`, icon: "" };
  }
}

/** Saaty scale values */
export const SAATY_SCALE = [
  { value: 9, label: "9 - Mutlak lebih penting" },
  { value: 8, label: "8" },
  { value: 7, label: "7 - Sangat jelas lebih penting" },
  { value: 6, label: "6" },
  { value: 5, label: "5 - Jelas lebih penting" },
  { value: 4, label: "4" },
  { value: 3, label: "3 - Sedikit lebih penting" },
  { value: 2, label: "2" },
  { value: 1, label: "1 - Sama penting" },
  { value: 1/2, label: "1/2" },
  { value: 1/3, label: "1/3" },
  { value: 1/4, label: "1/4" },
  { value: 1/5, label: "1/5" },
  { value: 1/6, label: "1/6" },
  { value: 1/7, label: "1/7" },
  { value: 1/8, label: "1/8" },
  { value: 1/9, label: "1/9 - Mutlak kurang penting" },
];

/** Get closest Saaty scale value to avoid floating point precision dropdown mismatch */
export function getClosestSaatyValue(val: number): number {
  let closest = SAATY_SCALE[0].value;
  let minDiff = Math.abs(val - closest);
  for (let i = 1; i < SAATY_SCALE.length; i++) {
    const diff = Math.abs(val - SAATY_SCALE[i].value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = SAATY_SCALE[i].value;
    }
  }
  return closest;
}

/** RI values for AHP consistency check */
export const RI_VALUES: Record<number, number> = {
  1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12,
  6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
};

/** Format fraction for display (e.g. 0.333... -> "1/3") */
export function formatFraction(value: number): string {
  if (value >= 1) return value.toFixed(0);
  const fractions: Record<string, string> = {
    "0.5": "1/2", "0.333": "1/3", "0.25": "1/4", "0.2": "1/5",
    "0.167": "1/6", "0.143": "1/7", "0.125": "1/8", "0.111": "1/9",
  };
  const key = value.toFixed(3);
  return fractions[key] || value.toFixed(4);
}
