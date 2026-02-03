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
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900">
          📅 Keuangan Per Bulan
        </h3>
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              Tahun {year}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm lg:text-base">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100 text-gray-700 border-b-2 border-gray-300">
              <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-left font-semibold">Bulan</th>
              <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right font-semibold">Pemasukan</th>
              <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right font-semibold">Modal</th>
              <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right font-semibold">Laba Kotor</th>
              <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right font-semibold">
                Laba Bersih
              </th>
              <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right font-semibold">Transaksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.month}
                className={`border-b border-gray-200 transition hover:bg-blue-50 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 font-medium text-gray-900">
                  {row.month}
                </td>
                <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right text-gray-600">
                  {formatRupiah(row.sales)}
                </td>
                <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right text-gray-600">
                  {formatRupiah(row.modal)}
                </td>
                <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right font-semibold text-purple-700">
                  {formatRupiah(row.gross)}
                </td>
                <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right font-semibold text-emerald-700">
                  {formatRupiah(row.net)}
                </td>
                <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right font-medium text-slate-700">
                  {row.transaksi}
                </td>
              </tr>
            ))}
            <tr className="bg-gradient-to-r from-amber-50 to-amber-100 border-t-2 border-gray-300 font-semibold">
              <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 font-bold text-gray-900">TOTAL</td>
              <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right text-blue-700">
                {formatRupiah(totals.sales)}
              </td>
              <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right text-orange-700">
                {formatRupiah(totals.modal)}
              </td>
              <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right text-purple-700">
                {formatRupiah(totals.gross)}
              </td>
              <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right text-emerald-700">
                {formatRupiah(totals.net)}
              </td>
              <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-right text-slate-700">
                {totals.transaksi}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
