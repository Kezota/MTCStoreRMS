import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatRupiah, getBrandColor } from "@/lib/utils";

interface BrandData {
  brand: string;
  transaksi: number;
  sales: number;
  modal: number;
  gross: number;
  net: number;
}

interface PieData {
  name: string;
  value: number;
}

interface BrandAnalysisProps {
  brandSummary: BrandData[];
  brandPieData: PieData[];
  brandRange: "today" | "month" | "year" | "custom";
  onBrandRangeChange: (range: "today" | "month" | "year" | "custom") => void;
  brandStartDate?: string;
  brandEndDate?: string;
  onBrandStartDateChange?: (date: string) => void;
  onBrandEndDateChange?: (date: string) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-lg text-xs">
        <p className="font-semibold text-gray-900">{payload[0].payload.name}</p>
        <p className="text-gray-600">{formatRupiah(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export const BrandAnalysis = ({
  brandSummary,
  brandPieData,
  brandRange,
  onBrandRangeChange,
  brandStartDate,
  brandEndDate,
  onBrandStartDateChange,
  onBrandEndDateChange,
}: BrandAnalysisProps) => {
  return (
    <div className="space-y-4">
      {/* Time Range Buttons */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "today", label: "Hari Ini" },
            { key: "month", label: "Bulan Ini" },
            { key: "year", label: "Tahun Ini" },
            { key: "custom", label: "Custom" },
          ] as const
        ).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onBrandRangeChange(option.key)}
            className={`px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm rounded-full border-2 transition font-medium ${
              brandRange === option.key
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range */}
      {brandRange === "custom" && (
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={brandStartDate}
              onChange={(e) => onBrandStartDateChange?.(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={brandEndDate}
              onChange={(e) => onBrandEndDateChange?.(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Pie Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
        {/* Pie Chart */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6 shadow-sm">
          <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
            📊 Distribusi Brand
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={brandPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {brandPieData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={getBrandColor(entry.name)}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brand Summary Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6 shadow-sm overflow-x-auto">
          <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
            📋 Detail Per Brand
          </h3>
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 text-gray-700 border-b-2 border-gray-300">
                <th className="px-2 sm:px-3 py-2 text-left font-semibold">
                  Brand
                </th>
                <th className="px-2 sm:px-3 py-2 text-right font-semibold">
                  Transaksi
                </th>
                <th className="px-2 sm:px-3 py-2 text-right font-semibold">
                  Pemasukan
                </th>
                <th className="px-2 sm:px-3 py-2 text-right font-semibold">
                  Modal
                </th>
                <th className="px-2 sm:px-3 py-2 text-right font-semibold">
                  Laba Kotor
                </th>
                <th className="px-2 sm:px-3 py-2 text-right font-semibold">
                  Laba Bersih
                </th>
              </tr>
            </thead>
            <tbody>
              {brandSummary.map((row, index) => (
                <tr
                  key={row.brand}
                  className={`border-b border-gray-200 transition hover:bg-blue-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  <td className="px-2 sm:px-3 py-2 font-medium text-gray-900">
                    <span
                      className="inline-block px-2 sm:px-3 py-1 rounded-full text-white text-xs font-semibold shadow-sm"
                      style={{
                        backgroundColor: getBrandColor(row.brand),
                      }}
                    >
                      {row.brand}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right text-gray-600">
                    {row.transaksi}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right text-gray-600">
                    {formatRupiah(row.sales)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right text-gray-600">
                    {formatRupiah(row.modal)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right font-semibold text-purple-700">
                    {formatRupiah(row.gross)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right font-semibold text-emerald-700">
                    {formatRupiah(row.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
