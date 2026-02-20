import { getBrandColor } from "@/lib/utils";

interface MonthlyBrandData {
  month: string;
  brandData: { [brand: string]: { quantity: number } };
}

interface StaffMonthlyTransactionTableProps {
  data: MonthlyBrandData[];
  selectedYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
  brands: string[];
}

export const StaffMonthlyTransactionTable = ({
  data,
  selectedYear,
  availableYears,
  onYearChange,
  brands,
}: StaffMonthlyTransactionTableProps) => {
  const totals = data.reduce(
    (acc, row) => {
      brands.forEach((brand) => {
        const brandInfo = row.brandData[brand] || { quantity: 0 };
        if (!acc[brand]) {
          acc[brand] = { quantity: 0 };
        }
        acc[brand].quantity += brandInfo.quantity;
      });
      return acc;
    },
    {} as { [brand: string]: { quantity: number } },
  );

  const totalQuantity = Object.values(totals).reduce(
    (sum, b) => sum + b.quantity,
    0,
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4 flex-col sm:flex-row gap-2 sm:gap-0">
        <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900">
          📅 Transaksi Per Bulan
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
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100 text-gray-700 border-b-2 border-gray-300">
              <th className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-left font-semibold">
                Bulan
              </th>
              {brands.map((brand) => (
                <th
                  key={brand}
                  className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right font-semibold"
                >
                  <span
                    className="inline-block px-2 py-1 rounded-full text-white text-xs font-semibold"
                    style={{ backgroundColor: getBrandColor(brand) }}
                  >
                    {brand}
                  </span>
                </th>
              ))}
              <th className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right font-semibold">
                Total Qty
              </th>
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
                <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 font-medium text-gray-900">
                  {row.month}
                </td>
                {brands.map((brand) => {
                  const brandInfo = row.brandData[brand] || {
                    quantity: 0,
                  };
                  return (
                    <td
                      key={`${brand}-qty`}
                      className="px-2 py-1 sm:px-3 sm:py-2 text-right font-semibold text-blue-700"
                    >
                      {brandInfo.quantity || "-"}
                    </td>
                  );
                })}
                <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right font-medium text-slate-700">
                  {Object.values(row.brandData).reduce(
                    (sum, b) => sum + b.quantity,
                    0,
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-gradient-to-r from-amber-50 to-amber-100 border-t-2 border-gray-300 font-semibold">
              <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 font-bold text-gray-900">
                TOTAL
              </td>
              {brands.map((brand) => {
                const brandTotal = totals[brand] || { quantity: 0 };
                return (
                  <td
                    key={`${brand}-qty-total`}
                    className="px-2 py-1 sm:px-3 sm:py-2 text-right text-blue-700 font-semibold"
                  >
                    {brandTotal.quantity || "-"}
                  </td>
                );
              })}
              <td className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-right text-slate-700">
                {totalQuantity}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="mt-3 text-xs sm:text-sm text-gray-600">
          <p>
            <strong>Total Quantity Terjual:</strong> {totalQuantity} pcs
          </p>
        </div>
      </div>
    </div>
  );
};
