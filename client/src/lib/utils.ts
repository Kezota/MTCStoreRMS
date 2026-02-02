import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function getBrandColor(brand: string): string {
  if (!brand) return "#e5e7eb";
  const key = brand.toLowerCase();
  const colorMap: Record<string, string> = {
    oppo: "#1ea366",
    vivo: "#0072b8",
    xiaomi: "#ff6900",
    samsung: "#0c4da2",
    apple: "#333333",
    realme: "#ffc916",
    itel: "#e1251b",
    nokia: "#124191",
    advan: "#e11b22",
    infinix: "#8bc53f",
    tecno: "#1f8fff",
    others: "#9333ea",
  };
  return colorMap[key] || "#e5e7eb";
}
