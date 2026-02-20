import { useCallback, useEffect, useMemo, useState } from "react";
import { useGetInventory } from "@/hooks/queries";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { brandsList } from "@/lib/constants";
import { getBrandColor } from "@/lib/utils";
import type { InventoryItem } from "@/lib/types";
import { showToast } from "@/lib/toast";

export const StockOpnamePage = () => {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchOpenDesktop, setSearchOpenDesktop] = useState(false);
  const [searchOpenMobile, setSearchOpenMobile] = useState(false);
  const [brandFilters, setBrandFilters] = useState<string[]>([]);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [sortOption, setSortOption] = useState(
    "scanned-first" as
      | "scanned-first"
      | "unscanned-first"
      | "name-asc"
      | "name-desc"
      | "brand-asc"
      | "brand-desc"
      | "none",
  );
  const [sortOption2, setSortOption2] = useState(
    "none" as
      | "scanned-first"
      | "unscanned-first"
      | "name-asc"
      | "name-desc"
      | "brand-asc"
      | "brand-desc"
      | "none",
  );
  const [imeiInput, setImeiInput] = useState("");
  const [scannedImeis, setScannedImeis] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("stock-opname-scanned");
    if (!saved) return new Set();
    try {
      return new Set(JSON.parse(saved));
    } catch {
      return new Set();
    }
  });
  const [lastScanned, setLastScanned] = useState<string | null>(() =>
    localStorage.getItem("stock-opname-last"),
  );

  const { data, isLoading } = useGetInventory({
    page: 1,
    limit: 10000,
  });

  const items = useMemo<InventoryItem[]>(() => data?.data ?? [], [data]);
  const readyItems = useMemo(
    () => items.filter((item) => item.status === "READY"),
    [items],
  );

  const imeiMap = useMemo(() => {
    return new Map(items.map((item) => [item.imei.trim(), item]));
  }, [items]);

  const filteredStockList = useMemo(() => {
    if (!searchInput.trim()) return readyItems.slice(0, 20);
    const keyword = searchInput.toLowerCase();

    const filtered = readyItems.filter(
      (item) =>
        item.imei.trim().toLowerCase().includes(keyword) ||
        item.namaHP.toLowerCase().includes(keyword) ||
        item.brand.toLowerCase().includes(keyword),
    );

    // Sort by IMEI match position (closer to end = higher priority)
    filtered.sort((a, b) => {
      const aImei = a.imei.trim().toLowerCase();
      const bImei = b.imei.trim().toLowerCase();

      const aIndex = aImei.indexOf(keyword);
      const bIndex = bImei.indexOf(keyword);

      // If both match in IMEI, sort by position (higher index = closer to end = higher priority)
      if (aIndex !== -1 && bIndex !== -1) {
        return bIndex - aIndex; // Reverse order: higher index first
      }

      // If only one matches in IMEI, prioritize that one
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // Neither matches in IMEI, keep original order
      return 0;
    });

    return filtered.slice(0, 20);
  }, [readyItems, searchInput]);

  const selectedItem = useMemo(
    () =>
      search.trim()
        ? readyItems.find(
            (item) =>
              item.imei.trim() === search.trim() ||
              item.namaHP === search.trim(),
          )
        : undefined,
    [readyItems, search],
  );

  const filteredItems = useMemo(() => {
    return readyItems.filter((item) => {
      if (brandFilters.length > 0 && !brandFilters.includes(item.brand)) {
        return false;
      }
      if (!search.trim()) return true;

      return (
        item.imei.trim() === search.trim() || item.namaHP === search.trim()
      );
    });
  }, [readyItems, brandFilters, search]);

  const getSortValue = useCallback(
    (option: string, item: InventoryItem): number => {
      switch (option) {
        case "scanned-first":
          if (lastScanned === item.imei.trim()) return 0;
          if (scannedImeis.has(item.imei.trim())) return 1;
          return 2;
        case "unscanned-first":
          if (!scannedImeis.has(item.imei.trim())) return 0;
          if (lastScanned === item.imei.trim()) return 1;
          return 2;
        default:
          return 0;
      }
    },
    [lastScanned, scannedImeis],
  );

  const sortedItems = useMemo(() => {
    const items = [...filteredItems];

    return items.sort((a, b) => {
      // Primary sort
      if (sortOption !== "none") {
        switch (sortOption) {
          case "scanned-first":
          case "unscanned-first": {
            const diff1 =
              getSortValue(sortOption, a) - getSortValue(sortOption, b);
            if (diff1 !== 0) return diff1;
            break;
          }
          case "name-asc": {
            const nameAscDiff = a.namaHP.localeCompare(b.namaHP);
            if (nameAscDiff !== 0) return nameAscDiff;
            break;
          }
          case "name-desc": {
            const nameDescDiff = b.namaHP.localeCompare(a.namaHP);
            if (nameDescDiff !== 0) return nameDescDiff;
            break;
          }
          case "brand-asc": {
            const brandAscDiff = a.brand.localeCompare(b.brand);
            if (brandAscDiff !== 0) return brandAscDiff;
            break;
          }
          case "brand-desc": {
            const brandDescDiff = b.brand.localeCompare(a.brand);
            if (brandDescDiff !== 0) return brandDescDiff;
            break;
          }
        }
      }

      // Secondary sort
      if (sortOption2 !== "none") {
        switch (sortOption2) {
          case "scanned-first":
          case "unscanned-first": {
            const diff2 =
              getSortValue(sortOption2, a) - getSortValue(sortOption2, b);
            if (diff2 !== 0) return diff2;
            break;
          }
          case "name-asc": {
            const nameAscDiff = a.namaHP.localeCompare(b.namaHP);
            if (nameAscDiff !== 0) return nameAscDiff;
            break;
          }
          case "name-desc": {
            const nameDescDiff = b.namaHP.localeCompare(a.namaHP);
            if (nameDescDiff !== 0) return nameDescDiff;
            break;
          }
          case "brand-asc": {
            const brandAscDiff = a.brand.localeCompare(b.brand);
            if (brandAscDiff !== 0) return brandAscDiff;
            break;
          }
          case "brand-desc": {
            const brandDescDiff = b.brand.localeCompare(a.brand);
            if (brandDescDiff !== 0) return brandDescDiff;
            break;
          }
        }
      }

      // Fallback: sort by name
      return a.namaHP.localeCompare(b.namaHP);
    });
  }, [filteredItems, sortOption, sortOption2, getSortValue]);

  const totalReady = readyItems.length;
  const filteredScannedCount = sortedItems.filter((item) =>
    scannedImeis.has(item.imei.trim()),
  ).length;
  const filteredRemainingCount = Math.max(
    sortedItems.length - filteredScannedCount,
    0,
  );

  useEffect(() => {
    localStorage.setItem(
      "stock-opname-scanned",
      JSON.stringify(Array.from(scannedImeis)),
    );
    if (lastScanned) {
      localStorage.setItem("stock-opname-last", lastScanned);
    } else {
      localStorage.removeItem("stock-opname-last");
    }
  }, [scannedImeis, lastScanned]);

  const handleToggleBrand = (brand: string) => {
    setBrandFilters((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    );
  };

  const handleScanSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = imeiInput.trim();
    if (!value) return;

    const found = imeiMap.get(value);
    if (!found) {
      showToast.error("IMEI belum diinput");
      setLastScanned(null);
      return;
    }

    if (found.status === "TERJUAL") {
      showToast.warning("IMEI sudah terjual");
      setLastScanned(null);
      setImeiInput("");
      return;
    }

    setScannedImeis((prev) => {
      const next = new Set(prev);
      next.add(value);
      return next;
    });
    setLastScanned(value);
    setImeiInput("");
  };

  const handleResetScan = () => {
    setScannedImeis(new Set());
    setLastScanned(null);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">
          Stock Opname
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          {search || brandFilters.length > 0
            ? `Menampilkan ${sortedItems.length} HP dari ${totalReady} total READY`
            : "Cek HP yang READY di toko, scan IMEI untuk validasi fisik."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total READY</p>
          <p className="text-2xl font-semibold text-gray-900">
            {search || brandFilters.length > 0
              ? `${sortedItems.length}/${totalReady}`
              : totalReady}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4 shadow-sm">
          <p className="text-xs text-emerald-700">Sudah Scan</p>
          <p className="text-2xl font-semibold text-emerald-800">
            {filteredScannedCount}
          </p>
        </div>
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 shadow-sm">
          <p className="text-xs text-amber-700">Belum Scan</p>
          <p className="text-2xl font-semibold text-amber-800">
            {filteredRemainingCount}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm space-y-3">
        {/* Desktop: 1 row with all controls */}
        <div
          className="hidden lg:grid gap-3"
          style={{ gridTemplateColumns: "1fr 1fr auto auto 2fr" }}
        >
          {/* Search */}
          <div>
            <Popover
              open={searchOpenDesktop}
              onOpenChange={setSearchOpenDesktop}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between ${
                    search ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  <span className="truncate">
                    {selectedItem
                      ? `${selectedItem.imei.trim()} - ${selectedItem.namaHP}`
                      : "Cari IMEI atau Nama HP"}
                  </span>
                  <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={4}
                className="p-0 w-[--radix-popover-trigger-width]"
                style={{ zIndex: 9999 }}
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Ketik IMEI, Nama HP, atau Brand..."
                    value={searchInput}
                    onValueChange={setSearchInput}
                  />
                  <CommandList>
                    <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                    <CommandGroup>
                      {filteredStockList.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={String(item.id)}
                          onSelect={() => {
                            setSearch(item.imei.trim());
                            setSearchOpenDesktop(false);
                            setSearchInput("");
                          }}
                        >
                          <div className="flex flex-col text-xs sm:text-sm">
                            <div className="font-medium">
                              {item.imei.trim()} - {item.namaHP}
                            </div>
                            <div className="text-gray-500 text-[10px] sm:text-xs">
                              {item.brand} • {item.warna || "Tanpa warna"} •{" "}
                              {item.tanggalMasuk
                                ? new Date(
                                    item.tanggalMasuk,
                                  ).toLocaleDateString("id-ID")
                                : "-"}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Brand Filter */}
          <div className="relative">
            <button
              onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {brandFilters.length === 0
                ? "Semua Brand"
                : `${brandFilters.length} Brand Terpilih`}
            </button>
            {brandDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {brandsList.map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={brandFilters.includes(brand)}
                      onChange={() => handleToggleBrand(brand)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span
                      className="text-xs px-2 py-0.5 rounded text-white font-medium"
                      style={{ backgroundColor: getBrandColor(brand) }}
                    >
                      {brand}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Sort 1 */}
          <select
            value={sortOption}
            onChange={(e) =>
              setSortOption(
                e.target.value as
                  | "scanned-first"
                  | "unscanned-first"
                  | "name-asc"
                  | "name-desc"
                  | "brand-asc"
                  | "brand-desc"
                  | "none",
              )
            }
            className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          >
            <option value="scanned-first">✓ Sudah Scan</option>
            <option value="unscanned-first">✗ Belum Scan</option>
            <option value="name-asc">Nama A-Z</option>
            <option value="name-desc">Nama Z-A</option>
            <option value="brand-asc">Brand A-Z</option>
            <option value="brand-desc">Brand Z-A</option>
            <option value="none">--- Tidak ---</option>
          </select>

          {/* Sort 2 */}
          <select
            value={sortOption2}
            onChange={(e) =>
              setSortOption2(
                e.target.value as
                  | "scanned-first"
                  | "unscanned-first"
                  | "name-asc"
                  | "name-desc"
                  | "brand-asc"
                  | "brand-desc"
                  | "none",
              )
            }
            className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          >
            <option value="none">--- Tidak ---</option>
            <option value="scanned-first">✓ Sudah Scan</option>
            <option value="unscanned-first">✗ Belum Scan</option>
            <option value="name-asc">Nama A-Z</option>
            <option value="name-desc">Nama Z-A</option>
            <option value="brand-asc">Brand A-Z</option>
            <option value="brand-desc">Brand Z-A</option>
          </select>

          {/* Scan Form */}
          <form onSubmit={handleScanSubmit} className="flex gap-2">
            <input
              value={imeiInput}
              onChange={(e) => setImeiInput(e.target.value)}
              placeholder="Scan / input IMEI"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
            >
              Scan
            </button>
            <button
              type="button"
              onClick={handleResetScan}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition whitespace-nowrap"
            >
              Reset
            </button>
          </form>
        </div>

        {/* Mobile: 3 rows */}
        <div className="lg:hidden space-y-3">
          {/* Row 1: Search + Brand Filter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Popover
                open={searchOpenMobile}
                onOpenChange={setSearchOpenMobile}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between ${
                      search ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <span className="truncate">
                      {selectedItem
                        ? `${selectedItem.imei.trim()} - ${selectedItem.namaHP}`
                        : "Cari IMEI atau Nama HP"}
                    </span>
                    <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={4}
                  className="p-0 w-[--radix-popover-trigger-width]"
                  style={{ zIndex: 9999 }}
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Ketik IMEI, Nama HP, atau Brand..."
                      value={searchInput}
                      onValueChange={setSearchInput}
                    />
                    <CommandList>
                      <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                      <CommandGroup>
                        {filteredStockList.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={String(item.id)}
                            onSelect={() => {
                              setSearch(item.imei.trim());
                              setSearchOpenMobile(false);
                              setSearchInput("");
                            }}
                          >
                            <div className="flex flex-col text-xs sm:text-sm">
                              <div className="font-medium">
                                {item.imei.trim()} - {item.namaHP}
                              </div>
                              <div className="text-gray-500 text-[10px] sm:text-xs">
                                {item.brand} • {item.warna || "Tanpa warna"} •{" "}
                                {item.tanggalMasuk
                                  ? new Date(
                                      item.tanggalMasuk,
                                    ).toLocaleDateString("id-ID")
                                  : "-"}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="relative">
              <button
                onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {brandFilters.length === 0
                  ? "Semua Brand"
                  : `${brandFilters.length} Brand Terpilih`}
              </button>
              {brandDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {brandsList.map((brand) => (
                    <label
                      key={brand}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={brandFilters.includes(brand)}
                        onChange={() => handleToggleBrand(brand)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span
                        className="text-xs px-2 py-0.5 rounded text-white font-medium"
                        style={{ backgroundColor: getBrandColor(brand) }}
                      >
                        {brand}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Sort 1 + Sort 2 */}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={sortOption}
              onChange={(e) =>
                setSortOption(
                  e.target.value as
                    | "scanned-first"
                    | "unscanned-first"
                    | "name-asc"
                    | "name-desc"
                    | "brand-asc"
                    | "brand-desc"
                    | "none",
                )
              }
              className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[130px]"
            >
              <option value="scanned-first">✓ Sudah Scan</option>
              <option value="unscanned-first">✗ Belum Scan</option>
              <option value="name-asc">Nama A-Z</option>
              <option value="name-desc">Nama Z-A</option>
              <option value="brand-asc">Brand A-Z</option>
              <option value="brand-desc">Brand Z-A</option>
              <option value="none">--- Tidak ---</option>
            </select>

            <select
              value={sortOption2}
              onChange={(e) =>
                setSortOption2(
                  e.target.value as
                    | "scanned-first"
                    | "unscanned-first"
                    | "name-asc"
                    | "name-desc"
                    | "brand-asc"
                    | "brand-desc"
                    | "none",
                )
              }
              className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[130px]"
            >
              <option value="none">--- Tidak ---</option>
              <option value="scanned-first">✓ Sudah Scan</option>
              <option value="unscanned-first">✗ Belum Scan</option>
              <option value="name-asc">Nama A-Z</option>
              <option value="name-desc">Nama Z-A</option>
              <option value="brand-asc">Brand A-Z</option>
              <option value="brand-desc">Brand Z-A</option>
            </select>
          </div>

          {/* Row 3: Scan Input + Buttons */}
          <form onSubmit={handleScanSubmit} className="flex gap-2">
            <input
              value={imeiInput}
              onChange={(e) => setImeiInput(e.target.value)}
              placeholder="Scan / input IMEI"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
            >
              Scan
            </button>
            <button
              type="button"
              onClick={handleResetScan}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition whitespace-nowrap"
            >
              Reset
            </button>
          </form>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-600">
          Memuat data stock opname...
        </div>
      ) : (
        <>
          <div
            className="grid gap-2 sm:gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            {sortedItems.map((item) => {
              const isScanned = scannedImeis.has(item.imei.trim());
              const isLast = lastScanned === item.imei.trim();
              const cardClass = isLast
                ? "border-amber-300 bg-amber-50"
                : isScanned
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-gray-200 bg-white";

              return (
                <div
                  key={item.id}
                  className={`rounded-md border p-2 sm:p-3 shadow-sm transition ${cardClass}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">
                        {item.namaHP}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold text-white"
                          style={{ backgroundColor: getBrandColor(item.brand) }}
                        >
                          {item.brand}
                        </span>
                        {item.warna && (
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            {item.warna}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 space-y-0.5 text-[10px] sm:text-xs text-gray-600">
                    <p>
                      IMEI: <span className="font-medium">{item.imei}</span>
                    </p>
                    <p>
                      {item.tanggalMasuk
                        ? item.tanggalMasuk
                            .slice(0, 10)
                            .split("-")
                            .reverse()
                            .join("/")
                        : "-"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
