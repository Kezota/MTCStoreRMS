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

export const SummaryCards = ({ summary, yearSummary }: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
      {/* Ringkasan Periode */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition">
        <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2 sm:mb-3">
          Ringkasan Periode
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 sm:p-2 border border-blue-200">
            <p className="text-xs text-blue-700 font-medium">Pemasukan</p>
            <p className="text-sm sm:text-base font-semibold text-blue-900 mt-1">
              {formatRupiah(summary.totalSales)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-2 sm:p-2 border border-orange-200">
            <p className="text-xs text-orange-700 font-medium">Total Modal</p>
            <p className="text-sm sm:text-base font-semibold text-orange-900 mt-1">
              {formatRupiah(summary.totalModal)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-2 sm:p-2 border border-purple-200">
            <p className="text-xs text-purple-700 font-medium">Laba Kotor</p>
            <p className="text-sm sm:text-base font-semibold text-purple-900 mt-1">
              {formatRupiah(summary.totalGross)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-2 sm:p-2 border border-emerald-200">
            <p className="text-xs text-emerald-700 font-medium">Laba Bersih</p>
            <p className="text-sm sm:text-base font-semibold text-emerald-900 mt-1">
              {formatRupiah(summary.totalProfit)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-2 sm:p-2 border border-slate-200">
            <p className="text-xs text-slate-600 font-medium">Transaksi</p>
            <p className="text-sm sm:text-base font-semibold text-slate-900 mt-1">
              {summary.totalTransaksi} transaksi
            </p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-2 sm:p-2 border border-indigo-200">
            <p className="text-xs text-indigo-700 font-medium">Barang Masuk</p>
            <p className="text-sm sm:text-base font-semibold text-indigo-900 mt-1">
              {summary.totalBarangMasuk} barang
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2 sm:p-2 border border-green-200">
            <p className="text-xs text-green-700 font-medium">Cash</p>
            <p className="text-sm sm:text-base font-semibold text-green-900 mt-1">
              {formatRupiah(summary.cashTotal)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-2 sm:p-2 border border-cyan-200">
            <p className="text-xs text-cyan-700 font-medium">Total Transfer</p>
            <p className="text-sm sm:text-base font-semibold text-cyan-900 mt-1">
              {formatRupiah(summary.transferTotal)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-2 sm:p-2 border border-purple-200">
            <p className="text-xs text-purple-700 font-medium">Transfer BNI</p>
            <p className="text-sm sm:text-base font-semibold text-purple-900 mt-1">
              {formatRupiah(summary.transferBNITotal)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 sm:p-2 border border-blue-200">
            <p className="text-xs text-blue-700 font-medium">Transfer BRI</p>
            <p className="text-sm sm:text-base font-semibold text-blue-900 mt-1">
              {formatRupiah(summary.transferBRITotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Hari Ini */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-3 sm:p-4 lg:p-6 shadow-md hover:shadow-lg transition">
        <h3 className="text-xs sm:text-sm lg:text-base font-semibold mb-2 sm:mb-3 lg:mb-4">
          ☀️ Hari Ini
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <div className="bg-blue-400/20 rounded p-2 border border-blue-300/30">
            <p className="text-blue-100 text-xs">Pemasukan</p>
            <p className="font-semibold text-blue-50 mt-1">
              {formatRupiah(summary.todaySales)}
            </p>
          </div>
          <div className="bg-blue-400/20 rounded p-2 border border-blue-300/30">
            <p className="text-blue-100 text-xs">Total Modal</p>
            <p className="font-semibold text-orange-200 mt-1">
              {formatRupiah(summary.todayModal)}
            </p>
          </div>
          <div className="bg-blue-400/20 rounded p-2 border border-blue-300/30">
            <p className="text-blue-100 text-xs">Laba Kotor</p>
            <p className="font-semibold text-purple-200 mt-1">
              {formatRupiah(summary.todayGross)}
            </p>
          </div>
          <div className="bg-blue-400/20 rounded p-2 border border-blue-300/30">
            <p className="text-blue-100 text-xs">Laba Bersih</p>
            <p className="font-semibold text-emerald-200 mt-1">
              {formatRupiah(summary.todayProfit)}
            </p>
          </div>
          <div className="bg-blue-400/20 rounded p-2 col-span-2 border border-blue-300/30">
            <p className="text-blue-100 text-xs">Transaksi</p>
            <p className="font-semibold text-blue-50 mt-1">
              {summary.todayTransaksi} transaksi
            </p>
          </div>
          <div className="bg-blue-400/20 rounded p-2 border border-blue-300/30">
            <p className="text-blue-100 text-xs">Cash</p>
            <p className="font-semibold text-green-50 mt-1">
              {formatRupiah(summary.todayCashTotal)}
            </p>
          </div>
          <div className="bg-blue-400/20 rounded p-2 border border-blue-300/30">
            <p className="text-blue-100 text-xs">Total Transfer</p>
            <p className="font-semibold text-cyan-50 mt-1">
              {formatRupiah(summary.todayTransferTotal)}
            </p>
          </div>
          <div className="bg-blue-400/20 rounded p-2 border border-blue-300/30">
            <p className="text-blue-100 text-xs">Transfer BNI</p>
            <p className="font-semibold text-purple-50 mt-1">
              {formatRupiah(summary.todayTransferBNITotal)}
            </p>
          </div>
          <div className="bg-blue-400/20 rounded p-2 border border-blue-300/30">
            <p className="text-blue-100 text-xs">Transfer BRI</p>
            <p className="font-semibold text-blue-50 mt-1">
              {formatRupiah(summary.todayTransferBRITotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Ringkasan Tahun Ini */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-lg p-3 sm:p-4 lg:p-6 shadow-md hover:shadow-lg transition">
        <h3 className="text-xs sm:text-sm lg:text-base font-semibold mb-2 sm:mb-3">
          Ringkasan Tahun Ini
        </h3>
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-200">Pemasukan</span>
            <span className="font-semibold">
              {formatRupiah(yearSummary.totalSales)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-200">Total Modal</span>
            <span className="font-semibold">
              {formatRupiah(yearSummary.totalModal)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-200">Laba Kotor</span>
            <span className="font-semibold">
              {formatRupiah(yearSummary.totalGross)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-200">Laba Bersih</span>
            <span className="font-semibold text-emerald-200">
              {formatRupiah(yearSummary.totalProfit)}
            </span>
          </div>
          <div className="h-px bg-slate-600 my-2"></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-200">Transaksi</span>
            <span className="font-semibold">{yearSummary.totalTransaksi}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-200">Barang Masuk</span>
            <span className="font-semibold text-indigo-200">
              {yearSummary.totalBarangMasuk}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-600">
            <span className="text-slate-300">Cash</span>
            <span className="font-semibold text-green-200">
              {formatRupiah(yearSummary.cashTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Total Transfer</span>
            <span className="font-semibold text-cyan-200">
              {formatRupiah(yearSummary.transferTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Transfer BNI</span>
            <span className="font-semibold text-purple-200">
              {formatRupiah(yearSummary.transferBNITotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Transfer BRI</span>
            <span className="font-semibold text-blue-200">
              {formatRupiah(yearSummary.transferBRITotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
