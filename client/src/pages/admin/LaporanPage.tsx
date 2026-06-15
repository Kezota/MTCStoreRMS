import { useMemo, useState } from "react";
import { useGetPenjualan } from "@/hooks/queries/usePenjualanQueries";
import { useGetInventory } from "@/hooks/queries/useInventoryQueries";
import { formatRupiah } from "@/lib/utils";
import {
  FilterSection,
  SummaryCards,
  Charts,
  MonthlyFinanceTable,
  BrandAnalysis,
} from "@/components/LaporanComponents";

const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const parseNumber = (value?: string | number | null) =>
  value ? parseFloat(String(value)) : 0;
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getModalValue = (item: any): number => {
  const modalFinal = parseNumber(item.modalFinal ?? item.inventory?.modalFinal);
  const modalAwal = parseNumber(item.modalAwal ?? item.inventory?.modalAwal);
  return modalFinal || modalAwal || 0;
};

export const LaporanPage = () => {
  const today = useMemo(() => new Date(), []);
  const defaultEnd = toDateInput(today);
  const defaultStart = toDateInput(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29),
  );

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterMetode, setFilterMetode] = useState("all");
  const [filterPreset, setFilterPreset] = useState("30days");
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [brandRange, setBrandRange] = useState<
    "today" | "month" | "year" | "custom"
  >("month");
  const [brandStartDate, setBrandStartDate] = useState(defaultStart);
  const [brandEndDate, setBrandEndDate] = useState(defaultEnd);

  const startOfYear = toDateInput(new Date(today.getFullYear(), 0, 1));
  const endOfYear = toDateInput(new Date(today.getFullYear(), 11, 31));

  const { data, isLoading } = useGetPenjualan({
    startDate,
    endDate,
    sortBy: "tanggal",
    sortOrder: "asc",
  });

  const { data: yearData, isLoading: isYearLoading } = useGetPenjualan({
    startDate: startOfYear,
    endDate: endOfYear,
    sortBy: "tanggal",
    sortOrder: "asc",
  });

  const { data: inventoryData } = useGetInventory({ page: 1, limit: 10000 });

  const items = useMemo(() => data?.data ?? [], [data]);
  const yearItems = useMemo(() => yearData?.data ?? [], [yearData]);
  const inventoryItems = useMemo(
    () => inventoryData?.data ?? [],
    [inventoryData],
  );

  const readyStockSummary = useMemo(() => {
    const readyItems = inventoryItems.filter((item) => item.status === "READY");

    return {
      count: readyItems.length,
      value: readyItems.reduce((total, item) => total + getModalValue(item), 0),
    };
  }, [inventoryItems]);

  const brandOptions = useMemo(() => {
    const set = new Set(items.map((item) => item.inventory?.brand || "-"));
    return Array.from(set.values()).sort();
  }, [items]);

  const metodeOptions = useMemo(() => {
    const set = new Set(items.map((item) => item.metodeBayar || "-"));
    return Array.from(set.values()).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const brand = item.inventory?.brand || "-";
      const metode = item.metodeBayar || "-";
      if (filterBrand !== "all" && brand !== filterBrand) return false;
      if (filterMetode !== "all" && metode !== filterMetode) return false;
      return true;
    });
  }, [items, filterBrand, filterMetode]);

  const summary = useMemo(() => {
    // Count items added to inventory within the date range (by tanggalMasuk)
    const barangMasukCount = inventoryItems.filter((item) => {
      const itemDate = new Date(item.tanggalMasuk).toISOString().slice(0, 10);
      return itemDate >= startDate && itemDate <= endDate;
    }).length;

    const totals = filteredItems.reduce(
      (acc, item) => {
        const sales = parseNumber(item.hargaJual);
        const modal = getModalValue(item);
        const metode = (item.metodeBayar || "-").toUpperCase().trim();
        acc.totalSales += sales;
        acc.totalModal += modal;
        acc.totalGross += sales - modal;
        acc.totalProfit += parseNumber(item.profit);
        acc.totalDiskon += parseNumber(item.diskon);
        acc.totalTransaksi += 1;
        if (metode === "CASH") acc.cashTotal += sales;
        if (metode === "TRANSFER_BNI") acc.transferBNITotal += sales;
        if (metode === "TRANSFER_BRI") acc.transferBRITotal += sales;
        if (metode === "TRANSFER")
          acc.transferOldTotal = (acc.transferOldTotal || 0) + sales;
        return acc;
      },
      {
        totalSales: 0,
        totalModal: 0,
        totalGross: 0,
        totalProfit: 0,
        totalDiskon: 0,
        totalTransaksi: 0,
        cashTotal: 0,
        transferBNITotal: 0,
        transferBRITotal: 0,
        transferOldTotal: 0,
      },
    );

    const todayKey = toDateInput(new Date());
    const todayData = filteredItems.filter((item) =>
      new Date(item.tanggal).toISOString().startsWith(todayKey),
    );

    const todayProfit = todayData.reduce(
      (acc, item) => acc + parseNumber(item.profit),
      0,
    );

    const todaySales = todayData.reduce(
      (acc, item) => acc + parseNumber(item.hargaJual),
      0,
    );

    const todayModal = todayData.reduce(
      (acc, item) => acc + getModalValue(item),
      0,
    );

    const todayGross = todaySales - todayModal;

    const todayCash = todayData.reduce((acc, item) => {
      const metode = (item.metodeBayar || "-").toUpperCase().trim();
      if (metode === "CASH") {
        return acc + parseNumber(item.hargaJual);
      }
      return acc;
    }, 0);

    const todayTransferBNI = todayData.reduce((acc, item) => {
      const metode = (item.metodeBayar || "-").toUpperCase().trim();
      if (metode === "TRANSFER_BNI") {
        return acc + parseNumber(item.hargaJual);
      }
      return acc;
    }, 0);

    const todayTransferBRI = todayData.reduce((acc, item) => {
      const metode = (item.metodeBayar || "-").toUpperCase().trim();
      if (metode === "TRANSFER_BRI") {
        return acc + parseNumber(item.hargaJual);
      }
      return acc;
    }, 0);

    const todayTransferOld = todayData.reduce((acc, item) => {
      const metode = (item.metodeBayar || "-").toUpperCase().trim();
      if (metode === "TRANSFER") {
        return acc + parseNumber(item.hargaJual);
      }
      return acc;
    }, 0);

    return {
      ...totals,
      transferTotal:
        (totals.transferOldTotal || 0) +
        totals.transferBNITotal +
        totals.transferBRITotal,
      totalBarangMasuk: barangMasukCount,
      todayProfit,
      todaySales,
      todayModal,
      todayGross,
      todayTransaksi: todayData.length,
      todayCashTotal: todayCash,
      todayTransferTotal:
        todayTransferOld + todayTransferBNI + todayTransferBRI,
      todayTransferBNITotal: todayTransferBNI,
      todayTransferBRITotal: todayTransferBRI,
    };
  }, [filteredItems, inventoryItems, startDate, endDate]);

  const dailySeries = useMemo(() => {
    if (!startDate || !endDate) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: Array<{
      date: string;
      sales: number;
      modal: number;
      profit: number;
      transaksi: number;
    }> = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = toDateInput(d);
      days.push({ date: key, sales: 0, modal: 0, profit: 0, transaksi: 0 });
    }

    const map = new Map(days.map((day) => [day.date, day]));

    filteredItems.forEach((item) => {
      const key = new Date(item.tanggal).toISOString().slice(0, 10);
      const target = map.get(key);
      if (!target) return;
      target.sales += parseNumber(item.hargaJual);
      target.modal += getModalValue(item);
      target.profit += parseNumber(item.profit);
      target.transaksi += 1;
    });

    return Array.from(map.values());
  }, [filteredItems, startDate, endDate]);

  const yearSummary = useMemo(() => {
    const yearFilteredItems = yearItems.filter((item) => {
      const brand = item.inventory?.brand || "-";
      if (filterBrand !== "all" && brand !== filterBrand) return false;
      if (filterMetode !== "all" && (item.metodeBayar || "-") !== filterMetode)
        return false;
      return true;
    });

    // Count items added to inventory within the year (by tanggalMasuk)
    const yearBarangMasukCount = inventoryItems.filter((item) => {
      const itemDate = new Date(item.tanggalMasuk).toISOString().slice(0, 10);
      return itemDate >= startOfYear && itemDate <= endOfYear;
    }).length;

    const totals = yearFilteredItems.reduce(
      (acc, item) => {
        const sales = parseNumber(item.hargaJual);
        const modal = getModalValue(item);
        const metode = (item.metodeBayar || "-").toUpperCase().trim();
        acc.totalSales += sales;
        acc.totalModal += modal;
        acc.totalGross += sales - modal;
        acc.totalProfit += parseNumber(item.profit);
        acc.totalTransaksi += 1;
        if (metode === "CASH") acc.cashTotal += sales;
        if (metode === "TRANSFER_BNI") acc.transferBNITotal += sales;
        if (metode === "TRANSFER_BRI") acc.transferBRITotal += sales;
        if (metode === "TRANSFER")
          acc.transferOldTotal = (acc.transferOldTotal || 0) + sales;
        return acc;
      },
      {
        totalSales: 0,
        totalModal: 0,
        totalGross: 0,
        totalProfit: 0,
        totalTransaksi: 0,
        cashTotal: 0,
        transferBNITotal: 0,
        transferBRITotal: 0,
        transferOldTotal: 0,
      },
    );

    return {
      ...totals,
      transferTotal:
        (totals.transferOldTotal || 0) +
        totals.transferBNITotal +
        totals.transferBRITotal,
      totalBarangMasuk: yearBarangMasukCount,
    };
  }, [
    yearItems,
    filterBrand,
    filterMetode,
    inventoryItems,
    startOfYear,
    endOfYear,
  ]);

  const availableYears = useMemo(() => {
    if (yearItems.length === 0) return [today.getFullYear()];

    const years = new Set<number>();
    yearItems.forEach((item) => {
      const year = new Date(item.tanggal).getFullYear();
      years.add(year);
    });

    return Array.from(years).sort((a, b) => a - b);
  }, [yearItems, today]);

  const monthlyFinance = useMemo(() => {
    const map = new Map(
      monthNames.map((name, index) => [
        index,
        {
          month: name,
          sales: 0,
          modal: 0,
          gross: 0,
          net: 0,
          transaksi: 0,
        },
      ]),
    );

    yearItems.forEach((item) => {
      const date = new Date(item.tanggal);
      const year = date.getFullYear();
      const monthIndex = date.getMonth();

      // Only include items from selected year
      if (year !== selectedYear) return;

      const target = map.get(monthIndex);
      if (!target) return;

      const sales = parseNumber(item.hargaJual);
      const modal = getModalValue(item);
      target.sales += sales;
      target.modal += modal;
      target.gross += sales - modal;
      target.net += parseNumber(item.profit);
      target.transaksi += 1;
    });

    return Array.from(map.values());
  }, [yearItems, selectedYear]);

  const brandFilteredItems = useMemo(() => {
    const now = new Date();
    const todayKey = toDateInput(now);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const rangeStart = new Date(brandStartDate);
    const rangeEnd = new Date(brandEndDate);

    return yearItems.filter((item) => {
      const date = new Date(item.tanggal);
      const dateKey = date.toISOString().slice(0, 10);
      if (filterBrand !== "all") {
        const brand = item.inventory?.brand || "-";
        if (brand !== filterBrand) return false;
      }
      if (filterMetode !== "all") {
        if ((item.metodeBayar || "-") !== filterMetode) return false;
      }

      if (brandRange === "today") return dateKey === todayKey;
      if (brandRange === "month") return date >= startMonth;
      if (brandRange === "year") return true;
      return date >= rangeStart && date <= rangeEnd;
    });
  }, [
    yearItems,
    brandRange,
    brandStartDate,
    brandEndDate,
    filterBrand,
    filterMetode,
  ]);

  const brandSummary = useMemo(() => {
    const groups = new Map<
      string,
      {
        brand: string;
        transaksi: number;
        sales: number;
        modal: number;
        gross: number;
        net: number;
      }
    >();

    brandFilteredItems.forEach((item) => {
      const brand = item.inventory?.brand || "-";
      const entry = groups.get(brand) || {
        brand,
        transaksi: 0,
        sales: 0,
        modal: 0,
        gross: 0,
        net: 0,
      };

      const sales = parseNumber(item.hargaJual);
      const modal = getModalValue(item);
      entry.transaksi += 1;
      entry.sales += sales;
      entry.modal += modal;
      entry.gross += sales - modal;
      entry.net += parseNumber(item.profit);
      groups.set(brand, entry);
    });

    return Array.from(groups.values()).sort((a, b) => b.net - a.net);
  }, [brandFilteredItems]);

  const brandPieData = useMemo(() => {
    return brandSummary.map((row) => ({
      name: row.brand,
      value: row.sales,
    }));
  }, [brandSummary]);

  return (
    <div className="space-y-3 sm:space-y-4">
      <FilterSection
        startDate={startDate}
        endDate={endDate}
        filterBrand={filterBrand}
        filterMetode={filterMetode}
        filterPreset={filterPreset}
        brandOptions={brandOptions}
        metodeOptions={metodeOptions}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onFilterBrandChange={setFilterBrand}
        onFilterMetodeChange={setFilterMetode}
        onFilterPresetChange={(preset) => {
          setFilterPreset(preset);
          const now = new Date();

          switch (preset) {
            case "all":
              setStartDate(startOfYear);
              setEndDate(endOfYear);
              break;
            case "today": {
              const todayKey = toDateInput(now);
              setStartDate(todayKey);
              setEndDate(todayKey);
              break;
            }
            case "7days": {
              const start = new Date(now);
              start.setDate(start.getDate() - 6);
              setStartDate(toDateInput(start));
              setEndDate(toDateInput(now));
              break;
            }
            case "30days": {
              const start = new Date(now);
              start.setDate(start.getDate() - 29);
              setStartDate(toDateInput(start));
              setEndDate(toDateInput(now));
              break;
            }
            case "thisMonth": {
              const start = new Date(now.getFullYear(), now.getMonth(), 1);
              setStartDate(toDateInput(start));
              setEndDate(toDateInput(now));
              break;
            }
            case "thisYear": {
              const start = new Date(now.getFullYear(), 0, 1);
              setStartDate(toDateInput(start));
              setEndDate(toDateInput(now));
              break;
            }
            case "q1": {
              const start = new Date(now.getFullYear(), 0, 1);
              const end = new Date(now.getFullYear(), 3, 0); // Last day of March
              setStartDate(toDateInput(start));
              setEndDate(toDateInput(end));
              break;
            }
            case "q2": {
              const start = new Date(now.getFullYear(), 3, 1);
              const end = new Date(now.getFullYear(), 6, 0); // Last day of June
              setStartDate(toDateInput(start));
              setEndDate(toDateInput(end));
              break;
            }
            case "q3": {
              const start = new Date(now.getFullYear(), 6, 1);
              const end = new Date(now.getFullYear(), 9, 0); // Last day of September
              setStartDate(toDateInput(start));
              setEndDate(toDateInput(end));
              break;
            }
            case "q4": {
              const start = new Date(now.getFullYear(), 9, 1);
              const end = new Date(now.getFullYear(), 12, 0); // Last day of December
              setStartDate(toDateInput(start));
              setEndDate(toDateInput(end));
              break;
            }
          }
        }}
      />

      {isLoading || isYearLoading ? (
        <div className="text-center py-12">
          <div className="inline-flex flex-col items-center">
            <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-3">Memuat laporan...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-md text-white">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm text-emerald-50/90 font-medium">
                  Nilai Stok READY Saat Ini
                </p>
                <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold mt-1">
                  {formatRupiah(readyStockSummary.value)}
                </h3>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 inline-flex items-center">
                <span className="text-sm sm:text-base font-semibold">
                  {readyStockSummary.count} barang ready
                </span>
              </div>
            </div>
          </div>

          <SummaryCards summary={summary} yearSummary={yearSummary} />

          <Charts
            dailySeries={dailySeries}
            startDate={startDate}
            endDate={endDate}
          />

          <MonthlyFinanceTable
            data={monthlyFinance}
            selectedYear={selectedYear}
            availableYears={availableYears}
            onYearChange={setSelectedYear}
          />

          <BrandAnalysis
            brandSummary={brandSummary}
            brandPieData={brandPieData}
            brandRange={brandRange}
            onBrandRangeChange={setBrandRange}
            brandStartDate={brandStartDate}
            brandEndDate={brandEndDate}
            onBrandStartDateChange={setBrandStartDate}
            onBrandEndDateChange={setBrandEndDate}
          />
        </>
      )}
    </div>
  );
};
