import { useCallback, useEffect, useMemo, useState } from "react";
import { ColorName } from "@/components/ui/color-name";
import { useGetInventory } from "@/hooks/queries";
import { useDeleteInventoryMutation } from "@/hooks/mutations";
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
import {
  CheckCircle2,
  ChevronsUpDown,
  Circle,
  RotateCcw,
  Trash2,
  Undo2,
} from "lucide-react";
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  // Ticking a HP by hand or undoing a scan both ask for confirmation first
  const [scanConfirm, setScanConfirm] = useState<{
    item: InventoryItem;
    mode: "scan" | "unscan";
  } | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetBrands, setResetBrands] = useState<string[]>([]);

  const { data, isLoading } = useGetInventory({
    page: 1,
    limit: 10000,
  });
  const deleteMutation = useDeleteInventoryMutation();

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

  const scannedBrandCounts = useMemo(() => {
    const counts = new Map<string, number>();
    readyItems.forEach((item) => {
      if (scannedImeis.has(item.imei.trim())) {
        counts.set(item.brand, (counts.get(item.brand) ?? 0) + 1);
      }
    });
    return Array.from(counts.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [readyItems, scannedImeis]);

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

  const handleOpenResetModal = () => {
    // Pre-select brands from the active filter that have scanned items
    setResetBrands(
      brandFilters.filter((brand) =>
        scannedBrandCounts.some(([scannedBrand]) => scannedBrand === brand),
      ),
    );
    setResetModalOpen(true);
  };

  const handleToggleResetBrand = (brand: string) => {
    setResetBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    );
  };

  const handleResetScan = () => {
    setScannedImeis(new Set());
    setLastScanned(null);
    setResetModalOpen(false);
  };

  const handleResetBrands = () => {
    if (resetBrands.length === 0) return;

    setScannedImeis((prev) => {
      const next = new Set(prev);
      prev.forEach((imei) => {
        const item = imeiMap.get(imei);
        if (item && resetBrands.includes(item.brand)) {
          next.delete(imei);
        }
      });
      return next;
    });
    if (lastScanned) {
      const lastItem = imeiMap.get(lastScanned);
      if (lastItem && resetBrands.includes(lastItem.brand)) {
        setLastScanned(null);
      }
    }
    setResetModalOpen(false);
    showToast.success(`Scan ${resetBrands.join(", ")} berhasil di-reset`);
  };

  const handleConfirmScanChange = () => {
    if (!scanConfirm) return;
    const imei = scanConfirm.item.imei.trim();
    if (scanConfirm.mode === "unscan") {
      handleUnscan(imei);
    } else {
      setScannedImeis((prev) => {
        const next = new Set(prev);
        next.add(imei);
        return next;
      });
      setLastScanned(imei);
    }
    setScanConfirm(null);
  };

  const handleUnscan = (imei: string) => {
    setScannedImeis((prev) => {
      const next = new Set(prev);
      next.delete(imei);
      return next;
    });
    if (lastScanned === imei) {
      setLastScanned(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmId) return;

    deleteMutation.mutate(deleteConfirmId, {
      onSuccess: () => {
        setDeleteConfirmId(null);
        // Remove from scanned list if exists
        const deletedItem = items.find((item) => item.id === deleteConfirmId);
        if (deletedItem) {
          setScannedImeis((prev) => {
            const next = new Set(prev);
            next.delete(deletedItem.imei.trim());
            return next;
          });
          if (lastScanned === deletedItem.imei.trim()) {
            setLastScanned(null);
          }
        }
      },
      onError: (error: any) => {
        showToast.error(
          error?.response?.data?.message || "Gagal menghapus product",
        );
      },
    });
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
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total READY</p>
          <p className="text-2xl font-semibold text-gray-900">
            {search || brandFilters.length > 0
              ? `${sortedItems.length}/${totalReady}`
              : totalReady}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3 sm:p-4 shadow-sm">
          <p className="text-xs font-medium text-emerald-700">Sudah Scan</p>
          <p className="text-2xl font-semibold text-emerald-800">
            {filteredScannedCount}
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 sm:p-4 shadow-sm">
          <p className="text-xs font-medium text-amber-700">Belum Scan</p>
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
                className="p-0 w-[var(--radix-popover-trigger-width)]"
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
              onClick={handleOpenResetModal}
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
                  className="p-0 w-[var(--radix-popover-trigger-width)]"
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
              onClick={handleOpenResetModal}
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
                ? "border-amber-300 bg-amber-50 ring-2 ring-amber-200"
                : isScanned
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-slate-200 bg-white";

              return (
                <div
                  key={item.id}
                  className={`flex flex-col rounded-xl border p-3 shadow-sm transition ${cardClass}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold text-white"
                      style={{ backgroundColor: getBrandColor(item.brand) }}
                    >
                      {item.brand}
                    </span>
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="-mr-1 -mt-1 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      title="Hapus dari inventory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-900 break-words">
                    {item.namaHP}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                    {item.warna && (
                      <>
                        <ColorName name={item.warna} />
                        <span>·</span>
                      </>
                    )}
                    <span>
                      {item.tanggalMasuk
                        ? item.tanggalMasuk
                            .slice(0, 10)
                            .split("-")
                            .reverse()
                            .join("/")
                        : "-"}
                    </span>
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-600 break-all">
                    {item.imei}
                  </p>

                  <div className="mt-auto pt-3">
                    {isScanned ? (
                      <div
                        className={`flex items-center justify-between gap-1 border-t pt-2 ${isLast ? "border-amber-200" : "border-emerald-100"}`}
                      >
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          {isLast ? "Baru scan" : "Sudah scan"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setScanConfirm({ item, mode: "unscan" })}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-white hover:text-red-600 transition"
                          title="Batalkan scan HP ini"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="border-t border-slate-100 pt-2">
                        <button
                          type="button"
                          onClick={() => setScanConfirm({ item, mode: "scan" })}
                          className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition"
                          title="Tandai sudah dicek tanpa scan"
                        >
                          <Circle className="w-4 h-4" />
                          Belum scan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Scan / Unscan Confirmation */}
      {scanConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setScanConfirm(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  scanConfirm.mode === "scan" ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                {scanConfirm.mode === "scan" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Undo2 className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  {scanConfirm.mode === "scan"
                    ? "Tandai sudah dicek?"
                    : "Batalkan scan?"}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {scanConfirm.mode === "scan"
                    ? "Pastikan HP ini benar-benar ada di toko."
                    : "HP ini akan kembali ditandai belum scan."}
                </p>
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold text-white"
                    style={{
                      backgroundColor: getBrandColor(scanConfirm.item.brand),
                    }}
                  >
                    {scanConfirm.item.brand}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-900 break-words">
                    {scanConfirm.item.namaHP}
                  </p>
                  <p className="font-mono text-xs text-slate-600 break-all">
                    {scanConfirm.item.imei}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setScanConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                Kembali
              </button>
              <button
                onClick={handleConfirmScanChange}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition ${
                  scanConfirm.mode === "scan"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {scanConfirm.mode === "scan" ? "Ya, sudah dicek" : "Ya, batalkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Scan Modal */}
      {resetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setResetModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Reset Scan
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Pilih brand yang mau di-reset, atau reset semua. Untuk batalkan
                  satu per satu, klik "Batal" di kartu HP.
                </p>
              </div>
            </div>

            {scannedBrandCounts.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                Belum ada HP yang di-scan.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100">
                {scannedBrandCounts.map(([brand, count]) => (
                  <label
                    key={brand}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={resetBrands.includes(brand)}
                      onChange={() => handleToggleResetBrand(brand)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span
                      className="text-xs px-2 py-0.5 rounded text-white font-medium"
                      style={{ backgroundColor: getBrandColor(brand) }}
                    >
                      {brand}
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                      {count} scan
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleResetScan}
                disabled={scannedImeis.size === 0}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 transition disabled:opacity-50"
              >
                Reset Semua
              </button>
              <button
                onClick={handleResetBrands}
                disabled={resetBrands.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 transition disabled:opacity-50"
              >
                {resetBrands.length > 0
                  ? `Reset ${resetBrands.length} Brand`
                  : "Reset Brand"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Hapus Product?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Apakah Anda yakin ingin menghapus product ini dari inventory?
                  Product akan dihapus secara permanen.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
