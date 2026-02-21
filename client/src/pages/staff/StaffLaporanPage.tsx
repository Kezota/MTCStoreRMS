import { useMemo, useState } from "react";
import { useGetPenjualan } from "@/hooks/queries/usePenjualanQueries";
import { useGetInventory } from "@/hooks/queries/useInventoryQueries";
import {
  StaffBrandAnalysis,
  StaffMonthlyTransactionTable,
} from "@/components/LaporanComponents";
import { brandsList } from "@/lib/constants";

const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

export const StaffLaporanPage = () => {
  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [brandRange, setBrandRange] = useState<
    "today" | "yesterday" | "thisWeek" | "thisMonth" | "thisYear" | "custom"
  >("today");

  const defaultEnd = toDateInput(today);
  const defaultStart = toDateInput(today);
  const [brandStartDate, setBrandStartDate] = useState(defaultStart);
  const [brandEndDate, setBrandEndDate] = useState(defaultEnd);

  const startOfYear = toDateInput(new Date(today.getFullYear(), 0, 1));
  const endOfYear = toDateInput(new Date(today.getFullYear(), 11, 31));

  const { data: yearData, isLoading: isYearLoading } = useGetPenjualan({
    startDate: startOfYear,
    endDate: endOfYear,
    sortBy: "tanggal",
    sortOrder: "asc",
  });

  const { data: inventoryData } = useGetInventory({ page: 1, limit: 10000 });

  const yearItems = useMemo(() => yearData?.data ?? [], [yearData]);
  const inventoryItems = useMemo(
    () => inventoryData?.data ?? [],
    [inventoryData],
  );

  const availableYears = useMemo(() => {
    if (yearItems.length === 0) return [today.getFullYear()];

    const years = new Set<number>();
    yearItems.forEach((item) => {
      const year = new Date(item.tanggal).getFullYear();
      years.add(year);
    });

    return Array.from(years).sort((a, b) => a - b);
  }, [yearItems, today]);

  // Get all brands from year data - group non-standard brands as OTHERS
  const allBrands = useMemo(() => {
    const standardBrands = brandsList.filter((b) => b !== "OTHERS");
    const brandsInData = new Set<string>();

    yearItems.forEach((item) => {
      const brand = (item.inventory?.brand || "-").toUpperCase();
      if (standardBrands.includes(brand as (typeof standardBrands)[number])) {
        brandsInData.add(brand);
      }
    });

    // Check if there are any non-standard brands
    const hasOthers = yearItems.some((item) => {
      const brand = (item.inventory?.brand || "-").toUpperCase();
      return !standardBrands.includes(brand as (typeof standardBrands)[number]);
    });

    const result = Array.from(brandsInData.values()).sort();
    if (hasOthers) {
      result.push("OTHERS");
    }

    return result;
  }, [yearItems]);

  // Monthly transactions grouped by brand
  const monthlyTransactions = useMemo(() => {
    const standardBrands = brandsList.filter((b) => b !== "OTHERS");
    const map = new Map(
      monthNames.map((name, index) => [
        index,
        {
          month: name,
          brandData: {} as { [brand: string]: { quantity: number } },
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

      const brand = (item.inventory?.brand || "-").toUpperCase();
      const finalBrand = standardBrands.includes(
        brand as (typeof standardBrands)[number],
      )
        ? brand
        : "OTHERS";

      if (!target.brandData[finalBrand]) {
        target.brandData[finalBrand] = { quantity: 0 };
      }

      target.brandData[finalBrand].quantity += 1; // Each transaction = 1 item
    });

    return Array.from(map.values());
  }, [yearItems, selectedYear]);

  const brandRangeInfo = useMemo(() => {
    const now = new Date();
    const todayKey = toDateInput(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = toDateInput(yesterday);

    // Start of this week (Monday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startYear = new Date(now.getFullYear(), 0, 1);
    const rangeStart = new Date(brandStartDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(brandEndDate);
    rangeEnd.setHours(23, 59, 59, 999);

    let rangeStartDate = startMonth;
    let rangeEndDate = new Date(now);

    if (brandRange === "today") {
      rangeStartDate = new Date(now);
      rangeStartDate.setHours(0, 0, 0, 0);
      rangeEndDate = new Date(now);
      rangeEndDate.setHours(23, 59, 59, 999);
    } else if (brandRange === "yesterday") {
      rangeStartDate = new Date(yesterday);
      rangeStartDate.setHours(0, 0, 0, 0);
      rangeEndDate = new Date(yesterday);
      rangeEndDate.setHours(23, 59, 59, 999);
    } else if (brandRange === "thisWeek") {
      rangeStartDate = startOfWeek;
      rangeEndDate = new Date(now);
    } else if (brandRange === "thisMonth") {
      rangeStartDate = startMonth;
      rangeEndDate = new Date(now);
    } else if (brandRange === "thisYear") {
      rangeStartDate = startYear;
      rangeEndDate = new Date(now);
    } else if (brandRange === "custom") {
      rangeStartDate = rangeStart;
      rangeEndDate = rangeEnd;
    }

    const filteredItems = yearItems.filter((item) => {
      const date = new Date(item.tanggal);
      const dateKey = date.toISOString().slice(0, 10);

      if (brandRange === "today") return dateKey === todayKey;
      if (brandRange === "yesterday") return dateKey === yesterdayKey;
      return date >= rangeStartDate && date <= rangeEndDate;
    });

    return { filteredItems, rangeStartDate, rangeEndDate };
  }, [yearItems, brandRange, brandStartDate, brandEndDate]);

  // Brand summary for the whole year
  const brandSummary = useMemo(() => {
    const standardBrands = brandsList.filter((b) => b !== "OTHERS");
    const { filteredItems } = brandRangeInfo;

    const groups = new Map<
      string,
      {
        brand: string;
        transaksi: number;
        quantity: number;
        readyProducts: number;
      }
    >();

    filteredItems.forEach((item) => {
      const brand = (item.inventory?.brand || "-").toUpperCase();
      const finalBrand = standardBrands.includes(
        brand as (typeof standardBrands)[number],
      )
        ? brand
        : "OTHERS";

      const entry = groups.get(finalBrand) || {
        brand: finalBrand,
        transaksi: 0,
        quantity: 0,
        readyProducts: 0,
      };

      entry.transaksi += 1;
      entry.quantity += 1; // Each transaction = 1 item
      groups.set(finalBrand, entry);
    });

    // Count ready products per brand from inventory
    inventoryItems.forEach((item) => {
      const brand = (item.brand || "-").toUpperCase();
      const finalBrand = standardBrands.includes(
        brand as (typeof standardBrands)[number],
      )
        ? brand
        : "OTHERS";
      const status = item.status?.toLowerCase() || "";

      if (status === "ready") {
        const entry = groups.get(finalBrand);
        if (entry) {
          entry.readyProducts += 1;
        } else {
          groups.set(finalBrand, {
            brand: finalBrand,
            transaksi: 0,
            quantity: 0,
            readyProducts: 1,
          });
        }
      }
    });

    // Filter out brands with 0 transactions
    return Array.from(groups.values())
      .filter((group) => group.transaksi > 0)
      .sort((a, b) => b.transaksi - a.transaksi);
  }, [brandRangeInfo, inventoryItems]);

  const brandTrendBrands = useMemo(
    () => brandSummary.map((row) => row.brand),
    [brandSummary],
  );

  const brandTrendSeries = useMemo(() => {
    const standardBrands = brandsList.filter((b) => b !== "OTHERS");
    const { filteredItems, rangeStartDate, rangeEndDate } = brandRangeInfo;

    if (!rangeStartDate || !rangeEndDate) return [];

    const start = new Date(rangeStartDate);
    const end = new Date(rangeEndDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const points: Array<{ date: string; [brand: string]: number | string }> =
      [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      points.push({ date: toDateInput(d) });
    }

    const map = new Map(points.map((point) => [point.date, point]));

    filteredItems.forEach((item) => {
      const dateKey = new Date(item.tanggal).toISOString().slice(0, 10);
      const brand = (item.inventory?.brand || "-").toUpperCase();
      const finalBrand = standardBrands.includes(
        brand as (typeof standardBrands)[number],
      )
        ? brand
        : "OTHERS";

      const target = map.get(dateKey);
      if (!target) return;
      target[finalBrand] =
        ((target[finalBrand] as number | undefined) || 0) + 1;
    });

    return points;
  }, [brandRangeInfo]);

  const brandPieData = useMemo(() => {
    return brandSummary.map((row) => ({
      name: row.brand,
      value: row.transaksi,
    }));
  }, [brandSummary]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {isYearLoading ? (
        <div className="text-center py-12">
          <div className="inline-flex flex-col items-center">
            <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-3">Memuat laporan...</p>
          </div>
        </div>
      ) : (
        <>
          <StaffBrandAnalysis
            brandSummary={brandSummary}
            brandPieData={brandPieData}
            brandTrendSeries={brandTrendSeries}
            brandTrendBrands={brandTrendBrands}
            brandRange={brandRange}
            onBrandRangeChange={setBrandRange}
            brandStartDate={brandStartDate}
            brandEndDate={brandEndDate}
            onBrandStartDateChange={setBrandStartDate}
            onBrandEndDateChange={setBrandEndDate}
          />

          <StaffMonthlyTransactionTable
            data={monthlyTransactions}
            selectedYear={selectedYear}
            availableYears={availableYears}
            onYearChange={setSelectedYear}
            brands={allBrands}
          />
        </>
      )}
    </div>
  );
};
