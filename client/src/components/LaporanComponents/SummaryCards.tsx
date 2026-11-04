import type { ReactNode } from "react";
import { CalendarDays, Sun } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface SummaryData {
  totalSales: number;
  totalModal: number;
  totalGross: number;
  totalProfit: number;
  totalTransaksi: number;
  totalBarangMasuk: number;
  totalDiskon: number;
  todaySales: number;
  todayGross: number;
  todayProfit: number;
  todayModal: number;
  todayTransaksi: number;
  cashTotal: number;
  transferTotal: number;
  transferBNITotal: number;
  transferBRITotal: number;
  todayCashTotal: number;
  todayTransferTotal: number;
  todayTransferBNITotal: number;
  todayTransferBRITotal: number;
}

interface YearSummaryData {
  totalSales: number;
  totalModal: number;
  totalGross: number;
  totalProfit: number;
  totalTransaksi: number;
  totalBarangMasuk: number;
  cashTotal: number;
  transferTotal: number;
  transferBNITotal: number;
  transferBRITotal: number;
}

interface SummaryCardsProps {
  summary: SummaryData;
  yearSummary: YearSummaryData;
}

// Light tile for the "Ringkasan Periode" card
const Tile = ({
  label,
  value,
  dot,
  highlight = false,
}: {
  label: string;
  value: string;
  dot: string;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-lg border p-2.5 sm:p-3 ${
      highlight
        ? "border-emerald-200 bg-emerald-50"
        : "border-slate-200 bg-slate-50/60"
    }`}
  >
    <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      {label}
    </p>
    <p
      className={`mt-1 text-sm sm:text-base font-semibold break-words ${
        highlight ? "text-emerald-700" : "text-slate-900"
      }`}
    >
      {value}
    </p>
  </div>
);

const GroupTitle = ({ children }: { children: ReactNode }) => (
  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
    {children}
  </p>
);

// Translucent tile for the coloured cards
const GlassTile = ({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) => (
  <div className="rounded-lg bg-white/10 p-2.5 ring-1 ring-white/15">
    <p className="text-xs opacity-80">{label}</p>
    <p className={`mt-0.5 text-sm ${strong ? "font-bold" : "font-semibold"}`}>
      {value}
    </p>
  </div>
);

const Row = ({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) => (
  <div className="flex items-center justify-between gap-2 py-1.5 text-sm">
    <span className="opacity-75">{label}</span>
    <span className={strong ? "font-bold" : "font-semibold"}>{value}</span>
  </div>
);

export const SummaryCards = ({ summary, yearSummary }: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
      {/* Ringkasan Periode */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 lg:p-5 shadow-sm">
        <h3 className="text-sm lg:text-base font-semibold text-slate-900 mb-3">
          Ringkasan Periode
        </h3>
        <div className="space-y-3">
          <div>
            <GroupTitle>Keuangan</GroupTitle>
            <div className="grid grid-cols-2 gap-2">
              <Tile
                label="Pemasukan"
                value={formatRupiah(summary.totalSales)}
                dot="bg-blue-500"
              />
              <Tile
                label="Total Modal"
                value={formatRupiah(summary.totalModal)}
                dot="bg-orange-400"
              />
              <Tile
                label="Laba Kotor"
                value={formatRupiah(summary.totalGross)}
                dot="bg-purple-500"
              />
              <Tile
                label="Laba Bersih"
                value={formatRupiah(summary.totalProfit)}
                dot="bg-emerald-500"
                highlight
              />
            </div>
          </div>
          <div>
            <GroupTitle>Aktivitas</GroupTitle>
            <div className="grid grid-cols-2 gap-2">
              <Tile
                label="Transaksi"
                value={`${summary.totalTransaksi} transaksi`}
                dot="bg-slate-400"
              />
              <Tile
                label="Barang Masuk"
                value={`${summary.totalBarangMasuk} barang`}
                dot="bg-indigo-500"
              />
            </div>
          </div>
          <div>
            <GroupTitle>Pembayaran</GroupTitle>
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 px-3">
              <Row label="Cash" value={formatRupiah(summary.cashTotal)} />
              <Row
                label="Transfer BNI"
                value={formatRupiah(summary.transferBNITotal)}
              />
              <Row
                label="Transfer BRI"
                value={formatRupiah(summary.transferBRITotal)}
              />
              <Row
                label="Total Transfer"
                value={formatRupiah(summary.transferTotal)}
                strong
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hari Ini */}
      <div className="flex flex-col bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl p-3 sm:p-4 lg:p-5 shadow-md">
        <h3 className="flex items-center gap-2 text-sm lg:text-base font-semibold">
          <Sun className="h-4 w-4 text-amber-300" />
          Hari Ini
        </h3>
        <p className="mt-3 text-xs text-blue-100">Pemasukan</p>
        <p className="text-2xl lg:text-3xl font-bold">
          {formatRupiah(summary.todaySales)}
        </p>
        <p className="text-xs text-blue-100">
          {summary.todayTransaksi} transaksi
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <GlassTile
            label="Total Modal"
            value={formatRupiah(summary.todayModal)}
          />
          <GlassTile
            label="Laba Kotor"
            value={formatRupiah(summary.todayGross)}
          />
          <div className="col-span-2">
            <GlassTile
              label="Laba Bersih"
              value={formatRupiah(summary.todayProfit)}
              strong
            />
          </div>
        </div>

        <div className="mt-auto pt-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-blue-100/80">
            Pembayaran
          </p>
          <div className="divide-y divide-white/15 rounded-lg bg-white/10 px-3 ring-1 ring-white/15">
            <Row label="Cash" value={formatRupiah(summary.todayCashTotal)} />
            <Row
              label="Transfer BNI"
              value={formatRupiah(summary.todayTransferBNITotal)}
            />
            <Row
              label="Transfer BRI"
              value={formatRupiah(summary.todayTransferBRITotal)}
            />
            <Row
              label="Total Transfer"
              value={formatRupiah(summary.todayTransferTotal)}
              strong
            />
          </div>
        </div>
      </div>

      {/* Ringkasan Tahun Ini */}
      <div className="flex flex-col bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-xl p-3 sm:p-4 lg:p-5 shadow-md">
        <h3 className="flex items-center gap-2 text-sm lg:text-base font-semibold">
          <CalendarDays className="h-4 w-4 text-emerald-300" />
          Ringkasan Tahun Ini
        </h3>
        <p className="mt-3 text-xs text-slate-300">Pemasukan</p>
        <p className="text-2xl lg:text-3xl font-bold">
          {formatRupiah(yearSummary.totalSales)}
        </p>
        <p className="text-xs text-slate-300">
          {yearSummary.totalTransaksi} transaksi ·{" "}
          {yearSummary.totalBarangMasuk} barang masuk
        </p>

        <div className="mt-4 divide-y divide-white/10 rounded-lg bg-white/5 px-3 ring-1 ring-white/10">
          <Row label="Total Modal" value={formatRupiah(yearSummary.totalModal)} />
          <Row label="Laba Kotor" value={formatRupiah(yearSummary.totalGross)} />
          <div className="text-emerald-300">
            <Row
              label="Laba Bersih"
              value={formatRupiah(yearSummary.totalProfit)}
              strong
            />
          </div>
        </div>

        <div className="mt-auto pt-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Pembayaran
          </p>
          <div className="divide-y divide-white/10 rounded-lg bg-white/5 px-3 ring-1 ring-white/10">
            <Row label="Cash" value={formatRupiah(yearSummary.cashTotal)} />
            <Row
              label="Transfer BNI"
              value={formatRupiah(yearSummary.transferBNITotal)}
            />
            <Row
              label="Transfer BRI"
              value={formatRupiah(yearSummary.transferBRITotal)}
            />
            <Row
              label="Total Transfer"
              value={formatRupiah(yearSummary.transferTotal)}
              strong
            />
          </div>
        </div>
      </div>
    </div>
  );
};
