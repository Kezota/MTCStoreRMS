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

export function normalizeDateInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const pad2 = (num: number) => String(num).padStart(2, "0");
  const isValidDateParts = (year: number, month: number, day: number) => {
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    const probe = new Date(year, month - 1, day);
    return (
      probe.getFullYear() === year &&
      probe.getMonth() === month - 1 &&
      probe.getDate() === day
    );
  };

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (!isValidDateParts(year, month, day)) return "";
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const dmMatch = trimmed.match(
    /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2}|\d{4}))?$/,
  );
  if (dmMatch) {
    const day = Number(dmMatch[1]);
    const month = Number(dmMatch[2]);
    const rawYear = dmMatch[3];
    let year = new Date().getFullYear();

    if (rawYear) {
      year = Number(rawYear.length === 2 ? `20${rawYear}` : rawYear);
    }

    if (!isValidDateParts(year, month, day)) return "";
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  return "";
}

export function formatDateToDDMMYYYY(value: string | Date): string {
  if (!value) return "";

  const pad2 = (num: number) => String(num).padStart(2, "0");

  if (typeof value === "string") {
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = isoMatch[1];
      const month = isoMatch[2];
      const day = isoMatch[3];
      return `${day}/${month}/${year}`;
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
    }

    return "";
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${pad2(value.getDate())}/${pad2(value.getMonth() + 1)}/${value.getFullYear()}`;
  }

  return "";
}

export function formatDateInputDDMMYYYY(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function capitalizeFirstLetter(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
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
