interface FilterSectionProps {
  startDate: string;
  endDate: string;
  filterBrand: string;
  filterMetode: string;
  filterPreset: string;
  brandOptions: string[];
  metodeOptions: string[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onFilterBrandChange: (brand: string) => void;
  onFilterMetodeChange: (metode: string) => void;
  onFilterPresetChange: (preset: string) => void;
}

export const FilterSection = ({
  startDate,
  endDate,
  filterBrand,
  filterMetode,
  filterPreset,
  brandOptions,
  metodeOptions,
  onStartDateChange,
  onEndDateChange,
  onFilterBrandChange,
  onFilterMetodeChange,
  onFilterPresetChange,
}: FilterSectionProps) => {
  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          Laporan
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Ringkasan penjualan, profit, dan tren per tanggal
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-6 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Brand
            </label>
            <select
              value={filterBrand}
              onChange={(e) => onFilterBrandChange(e.target.value)}
              className="w-full px-2 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Brand</option>
              {brandOptions.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Metode Bayar
            </label>
            <select
              value={filterMetode}
              onChange={(e) => onFilterMetodeChange(e.target.value)}
              className="w-full px-2 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Metode</option>
              {metodeOptions.map((metode) => (
                <option key={metode} value={metode}>
                  {metode}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Periode Preset
            </label>
            <select
              value={filterPreset}
              onChange={(e) => onFilterPresetChange(e.target.value)}
              className="w-full px-2 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua</option>
              <option value="today">Hari Ini</option>
              <option value="7days">7 Hari</option>
              <option value="30days">30 Hari</option>
              <option value="thisMonth">Bulan Ini</option>
              <option value="thisYear">Tahun Ini</option>
              <optgroup label="Quarter">
                <option value="q1">Q1 (Jan-Mar)</option>
                <option value="q2">Q2 (Apr-Jun)</option>
                <option value="q3">Q3 (Jul-Sep)</option>
                <option value="q4">Q4 (Oct-Dec)</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
