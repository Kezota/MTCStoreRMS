import { formatRupiah } from "@/lib/utils";

interface MonthlyData {
  month: string;
  sales: number;
  modal: number;
  gross: number;
  net: number;
  transaksi: number;
}

interface MonthlyFinanceTableProps {
  data: MonthlyData[];
  selectedYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
}

export const MonthlyFinanceTable = ({
  data,
  selectedYear,
  availableYears,
  onYearChange,
}: MonthlyFinanceTableProps) => {
  const totals = data.reduce(
    (acc, row) => ({
      sales: acc.sales + row.sales,
      modal: acc.modal + row.modal,
      gross: acc.gross + row.gross,
      net: acc.net + row.net,
      transaksi: acc.transaksi + row.transaksi,
    }),
    { sales: 0, modal: 0, gross: 0, net: 0, transaksi: 0 },
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 lg:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4 flex-col sm:flex-row gap-2 sm:gap-0">
        <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900">
          📅 Keuangan Per Bulan
        </h3>
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              Tahun {year}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-y border-slate-200">
              <th className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-left font-semibold">
                Bulan
              </th>
              <th className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right font-semibold">
                Pemasukan
              </th>
              <th className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right font-semibold">
                Modal
              </th>
              <th className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right font-semibold">
                Laba Kotor
              </th>
              <th className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right font-semibold">
                Laba Bersih
              </th>
              <th className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right font-semibold">
                Transaksi
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.month}
                className={`border-b border-slate-100 transition hover:bg-blue-50/60 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 font-medium text-gray-900">
                  {row.month}
                </td>
                <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right text-gray-600">
                  {formatRupiah(row.sales)}
                </td>
                <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right text-gray-600">
                  {formatRupiah(row.modal)}
                </td>
                <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right font-semibold text-purple-700">
                  {formatRupiah(row.gross)}
                </td>
                <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right font-semibold text-emerald-700">
                  {formatRupiah(row.net)}
                </td>
                <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right font-medium text-slate-700">
                  {row.transaksi}
                </td>
              </tr>
            ))}
            <tr className="bg-amber-50 border-t-2 border-amber-200 font-semibold">
              <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 font-bold text-gray-900">
                TOTAL
              </td>
              <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right text-blue-700">
                {formatRupiah(totals.sales)}
              </td>
              <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right text-orange-700">
                {formatRupiah(totals.modal)}
              </td>
              <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right text-purple-700">
                {formatRupiah(totals.gross)}
              </td>
              <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right text-emerald-700">
                {formatRupiah(totals.net)}
              </td>
              <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right text-slate-700">
                {totals.transaksi}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
