import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { getBrandColor } from "@/lib/utils";

interface BrandData {
  brand: string;
  transaksi: number;
  quantity: number;
  readyProducts: number;
}

interface PieData {
  name: string;
  value: number;
}

interface BrandTrendPoint {
  date: string;
  [brand: string]: string | number;
}

interface StaffBrandAnalysisProps {
  brandSummary: BrandData[];
  brandPieData: PieData[];
  brandTrendSeries: BrandTrendPoint[];
  brandTrendBrands: string[];
  brandRange:
    | "today"
    | "yesterday"
    | "thisWeek"
    | "thisMonth"
    | "thisYear"
    | "custom";
  onBrandRangeChange: (
    range:
      | "today"
      | "yesterday"
      | "thisWeek"
      | "thisMonth"
      | "thisYear"
      | "custom",
  ) => void;
  brandStartDate?: string;
  brandEndDate?: string;
  onBrandStartDateChange?: (date: string) => void;
  onBrandEndDateChange?: (date: string) => void;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      name: string;
      value: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-lg text-xs">
        <p className="font-semibold text-gray-900">{payload[0].payload.name}</p>
        <p className="text-gray-600">{payload[0].value} transaksi</p>
      </div>
    );
  }
  return null;
};

export const StaffBrandAnalysis = ({
  brandSummary,
  brandPieData,
  brandTrendSeries,
  brandTrendBrands,
  brandRange,
  onBrandRangeChange,
  brandStartDate,
  brandEndDate,
  onBrandStartDateChange,
  onBrandEndDateChange,
}: StaffBrandAnalysisProps) => {
  return (
    <div className="space-y-4">
      {/* Time Range Buttons */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "today", label: "Hari Ini" },
            { key: "yesterday", label: "Kemarin" },
            { key: "thisWeek", label: "Minggu Ini" },
            { key: "thisMonth", label: "Bulan Ini" },
            { key: "thisYear", label: "Tahun Ini" },
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
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Dari
            </label>
            <input
              type="date"
                            value={brandStartDate}
              onChange={(e) => onBrandStartDateChange?.(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Sampai
            </label>
            <input
              type="date"
                            value={brandEndDate}
              onChange={(e) => onBrandEndDateChange?.(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Charts & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
        <div className="order-3 lg:order-1 bg-white rounded-xl border border-slate-200 p-3 sm:p-4 lg:p-5 shadow-sm">
          <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
            📈 Grafik Brand
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={brandTrendSeries} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-lg text-xs">
                        <p className="font-semibold text-gray-900">
                          {payload[0].payload.date}
                        </p>
                        {payload.map((entry) => (
                          <p
                            key={entry.name}
                            className="text-gray-600"
                            style={{ color: entry.color }}
                          >
                            {entry.name}: {entry.value} pcs
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                {brandTrendBrands.map((brand) => (
                  <Line
                    key={brand}
                    type="monotone"
                    dataKey={brand}
                    stroke={getBrandColor(brand)}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="order-2 lg:order-2 bg-white rounded-xl border border-slate-200 p-3 sm:p-4 lg:p-5 shadow-sm">
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

        <div className="order-1 lg:order-3 bg-white rounded-xl border border-slate-200 p-3 sm:p-4 lg:p-5 shadow-sm overflow-x-auto">
          <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
            📋 Detail Per Brand
          </h3>
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <th className="px-2 sm:px-3 py-2 text-left font-semibold">
                  Brand
                </th>
                <th className="px-2 sm:px-3 py-2 text-right font-semibold">
                  Transaksi
                </th>
                <th className="px-2 sm:px-3 py-2 text-right font-semibold">
                  Produk Ready
                </th>
              </tr>
            </thead>
            <tbody>
              {brandSummary.map((row, index) => (
                <tr
                  key={row.brand}
                  className={`border-b border-slate-100 transition hover:bg-blue-50/60 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  <td className="px-2 sm:px-3 py-2 font-medium text-gray-900">
                    <span
                      className="inline-block px-1.5 py-0.5 rounded-full text-white text-[10px] font-semibold shadow-sm sm:px-2 sm:py-1 sm:text-xs"
                      style={{
                        backgroundColor: getBrandColor(row.brand),
                      }}
                    >
                      {row.brand}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right text-gray-600">
                    {row.transaksi} pcs
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right font-semibold text-emerald-700">
                    {row.readyProducts}
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
