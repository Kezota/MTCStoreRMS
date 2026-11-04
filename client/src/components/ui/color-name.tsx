import { cn } from "@/lib/utils";

// Colour words staff type for phones (Indonesian and English). Longer names
// come first so "biru laut" wins over "biru".
const COLOR_WORDS: Array<[string, string]> = [
  ["biru laut", "#1e3a8a"],
  ["biru muda", "#38bdf8"],
  ["hijau muda", "#4ade80"],
  ["abu-abu", "#6b7280"],
  ["navy", "#1e3a8a"],
  ["midnight", "#1f2937"],
  ["hitam", "#111827"],
  ["black", "#111827"],
  ["graphite", "#374151"],
  ["putih", "#ffffff"],
  ["white", "#ffffff"],
  ["silver", "#c0c4cc"],
  ["perak", "#c0c4cc"],
  ["titanium", "#8a8d91"],
  ["abu", "#6b7280"],
  ["grey", "#6b7280"],
  ["gray", "#6b7280"],
  ["merah", "#dc2626"],
  ["red", "#dc2626"],
  ["maroon", "#7f1d1d"],
  ["biru", "#2563eb"],
  ["blue", "#2563eb"],
  ["hijau", "#16a34a"],
  ["green", "#16a34a"],
  ["ijo", "#16a34a"],
  ["mint", "#34d399"],
  ["tosca", "#0d9488"],
  ["teal", "#0d9488"],
  ["cyan", "#06b6d4"],
  ["kuning", "#eab308"],
  ["yellow", "#eab308"],
  ["emas", "#ca8a04"],
  ["gold", "#ca8a04"],
  ["oranye", "#ea580c"],
  ["orange", "#ea580c"],
  ["jingga", "#ea580c"],
  ["ungu", "#7c3aed"],
  ["purple", "#7c3aed"],
  ["violet", "#7c3aed"],
  ["lavender", "#a78bfa"],
  ["lilac", "#a78bfa"],
  ["pink", "#db2777"],
  ["rose", "#e11d48"],
  ["coklat", "#92400e"],
  ["cokelat", "#92400e"],
  ["brown", "#92400e"],
  ["krem", "#f1e4c8"],
  ["cream", "#f1e4c8"],
  ["beige", "#e8dcc4"],
];

const findColor = (name: string) => {
  const lower = name.toLowerCase();
  return COLOR_WORDS.find(([word]) => lower.includes(word))?.[1];
};

// Very light colours (white, silver, cream…) would be unreadable as text
const isTooLight = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72;
};

interface ColorNameProps {
  name?: string | null;
  className?: string;
  fallback?: string;
}

export const ColorName = ({ name, className, fallback = "-" }: ColorNameProps) => {
  if (!name?.trim()) return <span className={className}>{fallback}</span>;

  const color = findColor(name);
  if (!color) return <span className={className}>{name}</span>;

  const light = isTooLight(color);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          light && "ring-1 ring-slate-300",
        )}
        style={{ backgroundColor: color }}
      />
      <span className="font-medium" style={light ? undefined : { color }}>
        {name}
      </span>
    </span>
  );
};
