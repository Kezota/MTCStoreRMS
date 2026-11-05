import { useState, useMemo } from "react";
import { useGetPenjualan } from "@/hooks/queries/usePenjualanQueries";
import { useGetInventory } from "@/hooks/queries/useInventoryQueries";
import { PenjualanFormModal } from "@/components/PenjualanFormModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-head";
import { applyHeaderSort, type SortField } from "@/lib/sort";
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
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  Edit2,
  Plus,
  X,
  ChevronsUpDown,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { brandsList } from "@/lib/constants";
import {
  getBrandColor,
  normalizeDateInput,
  capitalizeFirstLetter,
  formatMetodeBayar,
  getMetodeBayarColor,
} from "@/lib/utils";
import type { PenjualanItem, InventoryItem } from "@/lib/types";

interface FilterState {
  search: string;
  metodeBayar: string;
  brands: string[];
  tanggal: string;
}

const METODE_BAYAR_OPTIONS = ["CASH", "TRANSFER_BNI", "TRANSFER_BRI"];

// Numbers and dates read best biggest/newest first on the first click
const DESC_FIRST_FIELDS = ["tanggal", "hargaJual", "modalFinal", "diskon", "profit"];

const SORT_FIELD_OPTIONS = [
  { value: "tanggal", label: "Tanggal" },
  { value: "hargaJual", label: "Harga Jual" },
  { value: "metodeBayar", label: "Metode Bayar" },
  { value: "brand", label: "Brand" },
  { value: "createdAt", label: "Created At" },
];

export const StaffPenjualanPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(500);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    metodeBayar: "",
    brands: [],
    tanggal: "",
  });
  const [sorts, setSorts] = useState<SortField[]>([
    { field: "tanggal", order: "desc" },
  ]);
  const [searchOpen, setSearchOpen] = useState(false);
  // Phones show only the search box until the user taps Filter
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<PenjualanItem | null>(null);
  const [viewingItem, setViewingItem] = useState<PenjualanItem | null>(null);

  const { data: inventoryData } = useGetInventory({ page: 1, limit: 10000 });

  const searchValue = filters.search.trim();

  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = { page, limit };

    if (searchValue) {
      if (/^\d+$/.test(searchValue)) {
        params.imei = searchValue;
      } else {
        params.namaHP = searchValue;
      }
    }
    if (filters.metodeBayar) params.metodeBayar = filters.metodeBayar;
    if (filters.tanggal) {
      const normalizedTanggal =
        normalizeDateInput(filters.tanggal) || filters.tanggal;
      params.tanggal = normalizedTanggal; // Format: YYYY-MM-DD
    }

    // Multi-brand filter
    const activeBrands = filters.brands.filter((b) => b);
    if (activeBrands.length > 0) {
      params.brand = activeBrands.join(",");
    }

    const activeSorts = sorts.filter((s) => s.field);
    if (activeSorts.length > 0) {
      params.sortBy = activeSorts.map((s) => s.field).join(",");
      params.sortOrder = activeSorts.map((s) => s.order).join(",");
    }

    return params;
  }, [filters, sorts, page, limit, searchValue]);

  const { data, isLoading, error, isPlaceholderData } = useGetPenjualan(queryParams);
  // Old rows stay on screen while a new sort/filter loads; show that it's working
  const isRefreshing = isPlaceholderData;


  const handleToggleBrand = (brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
    setPage(1);
  };

  const handleUpdateSort = (
    index: number,
    field: string,
    order: "asc" | "desc",
  ) => {
    const newSorts = [...sorts];
    newSorts[index] = { field, order };
    setSorts(newSorts);
  };

  const handleHeaderSort = (field: string) => {
    setSorts((prev) =>
      applyHeaderSort(
        prev,
        field,
        DESC_FIRST_FIELDS.includes(field) ? "desc" : "asc",
      ),
    );
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      metodeBayar: "",
      brands: [],
      tanggal: "",
    });
    setSorts([{ field: "tanggal", order: "desc" }]);
    setSearchInput("");
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: PenjualanItem) => {
    setIsEditMode(true);
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const formatRupiah = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const penjualan = useMemo(() => data?.data || [], [data]);

  const filteredPenjualanList = useMemo(() => {
    if (!searchInput.trim()) return penjualan.slice(0, 20);
    const search = searchInput.toLowerCase();

    const filtered = penjualan.filter(
      (item) =>
        item.inventory?.imei?.toLowerCase().includes(search) ||
        item.inventory?.namaHP?.toLowerCase().includes(search) ||
        item.inventory?.brand?.toLowerCase().includes(search),
    );

    // Sort by IMEI match position (closer to end = higher priority)
    filtered.sort((a, b) => {
      const aImei = a.inventory?.imei?.toLowerCase() || "";
      const bImei = b.inventory?.imei?.toLowerCase() || "";

      const aIndex = aImei.indexOf(search);
      const bIndex = bImei.indexOf(search);

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
  }, [penjualan, searchInput]);

  const selectedItem = useMemo(
    () =>
      filters.search.trim()
        ? penjualan.find(
            (item) =>
              item.inventory?.imei === filters.search ||
              item.inventory?.namaHP === filters.search,
          )
        : undefined,
    [penjualan, filters.search],
  );

  const inventoryOptions: InventoryItem[] = useMemo(
    () => inventoryData?.data || [],
    [inventoryData],
  );

  const activeFilterCount = [filters.metodeBayar, filters.brands.length > 0, filters.tanggal].filter(Boolean).length;

  return (
    <div className="w-full flex h-[calc(100dvh-5.0625rem)] min-h-[26rem] flex-col sm:h-[calc(100dvh-6.5625rem)]">
      {/* View Modal */}
      {viewingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4"
          onClick={() => setViewingItem(null)}
        >
          <div
            className="w-full max-w-2xl rounded-lg bg-white shadow-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-3 sm:px-4 py-2 sm:py-3 sticky top-0 bg-white">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                Detail Penjualan
              </h2>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
              {/* Phone Details */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-4">
                  Detail HP
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 bg-slate-50 p-2 sm:p-4 rounded-lg">
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      IMEI
                    </p>
                    <p className="font-mono text-xs sm:text-sm font-semibold text-slate-900">
                      {viewingItem.inventory?.imei}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Tanggal Masuk
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-900">
                      {viewingItem.inventory?.tanggalMasuk
                        ? new Date(
                            viewingItem.inventory.tanggalMasuk,
                          ).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Brand
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          backgroundColor: getBrandColor(
                            viewingItem.inventory?.brand || "",
                          ),
                        }}
                        className="px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium text-white"
                      >
                        {viewingItem.inventory?.brand}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Nama HP
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-900">
                      {viewingItem.inventory?.namaHP}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Warna
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-900">
                      {viewingItem.inventory?.warna || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-4">
                  Detail Transaksi
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 bg-blue-50 p-2 sm:p-4 rounded-lg border border-blue-200">
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Tanggal
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-900">
                      {new Date(viewingItem.tanggal).toLocaleDateString(
                        "id-ID",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Harga Jual
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900">
                      {formatRupiah(viewingItem.hargaJual)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Metode Bayar
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                        getMetodeBayarColor(viewingItem.metodeBayar)
                      }`}
                    >
                      {formatMetodeBayar(viewingItem.metodeBayar)}
                    </span>
                  </div>
                  {viewingItem.user && (
                    <div>
                      <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                        Diinput Oleh
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-slate-900">
                        {viewingItem.user.nama}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              {viewingItem.customer && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-4">
                    Detail Customer
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 bg-slate-50 p-2 sm:p-4 rounded-lg">
                    <div>
                      <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                        Nama
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900">
                        {viewingItem.customer.nama}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                        Nomor HP
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-slate-900">
                        {viewingItem.customer.nomorHP || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Keterangan */}
              {viewingItem.keterangan && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                    Keterangan
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-2 sm:p-4 rounded-lg break-words">
                    {viewingItem.keterangan}
                  </p>
                </div>
              )}

              {/* Diinput Oleh */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                  Diinput Oleh
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-2 sm:p-4 rounded-lg">
                  {viewingItem.user?.nama || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <PenjualanFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setIsEditMode(false);
          setEditingItem(null);
        }}
        isEditMode={isEditMode}
        item={editingItem}
        inventoryOptions={inventoryOptions}
        hideProfit={true}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            Penjualan
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Total: {data?.pagination.total || 0} item
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex min-h-9 sm:min-h-11 items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition font-semibold text-sm shadow-sm"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Tambah Penjualan
        </button>
      </div>

      {/* Filter & Sort Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm my-2 sm:my-3 p-2 sm:p-2.5 space-y-2 md:flex md:items-center md:gap-2 md:space-y-0">
        {/* Basic Filters - Compact on mobile */}
        <div
          className={`md:flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 ${filtersOpen ? "" : "max-sm:[&>*:not(:first-child)]:hidden"}`}
        >
          <div className="col-span-2 sm:col-span-1 flex gap-2">
            <div className="flex-1 min-w-0">
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`w-full min-h-9 md:min-h-0 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between ${
                    filters.search ? "text-slate-900" : "text-slate-500"
                  }`}
                >
                  <span className="truncate">
                    {selectedItem?.inventory
                      ? `${selectedItem.inventory.imei} - ${selectedItem.inventory.namaHP}`
                      : "Cari IMEI atau Nama HP"}
                  </span>
                  <ChevronsUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="p-0 w-[var(--radix-popover-trigger-width)]"
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Cari IMEI, Nama HP, atau Brand..."
                    value={searchInput}
                    onValueChange={setSearchInput}
                  />
                  <CommandList>
                    <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                    <CommandGroup>
                      {/* Show search input as an option if it has content */}
                      {searchInput.trim() && (
                        <CommandItem
                          key="search-input"
                          value="search-input"
                          onSelect={() => {
                            setFilters((prev) => ({
                              ...prev,
                              search: searchInput.trim(),
                            }));
                            setSearchOpen(false);
                            setSearchInput("");
                          }}
                        >
                          <div className="flex flex-col text-xs sm:text-sm w-full">
                            <div className="font-medium text-blue-600">
                              Cari: "{searchInput}"
                            </div>
                            <div className="text-slate-500 text-[10px] sm:text-xs">
                              Cari semua item yang cocok dengan text ini
                            </div>
                          </div>
                        </CommandItem>
                      )}
                      {filteredPenjualanList.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={String(item.id)}
                          onSelect={() => {
                            setFilters((prev) => ({
                              ...prev,
                              search: item.inventory?.imei || "",
                            }));
                            setSearchOpen(false);
                            setSearchInput("");
                          }}
                        >
                          <div className="flex flex-col text-xs sm:text-sm">
                            <div className="font-medium">
                              {item.inventory?.imei} - {item.inventory?.namaHP}
                            </div>
                            <div className="text-slate-500 text-[10px] sm:text-xs">
                              {item.inventory?.brand} •{" "}
                              {item.inventory?.warna || "Tanpa warna"} •{" "}
                              {new Date(item.tanggal).toLocaleDateString(
                                "id-ID",
                              )}
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
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className={`sm:hidden flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition ${
                filtersOpen
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <select
            value={filters.metodeBayar}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, metodeBayar: e.target.value }));
              setPage(1);
            }}
            className="w-full min-h-9 md:min-h-0 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Metode</option>
            {METODE_BAYAR_OPTIONS.map((metode) => (
              <option key={metode} value={metode}>
                {metode}
              </option>
            ))}
          </select>

          {/* Brand Multi-Select Dropdown */}
          <div className="relative">
            <button
              onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
              className="w-full min-h-9 md:min-h-0 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {filters.brands.length === 0
                ? "Semua Brand"
                : `${filters.brands.length} Brand Terpilih`}
            </button>
            {brandDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {brandsList.map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-3 px-3 py-2.5 md:py-2 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => handleToggleBrand(brand)}
                      className="w-5 h-5 md:w-4 md:h-4 rounded border-slate-300"
                    />
                    <span
                      className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-white font-medium"
                      style={{ backgroundColor: getBrandColor(brand) }}
                    >
                      {brand}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="relative col-span-2 sm:col-span-1">
            <input
              type="date"
              placeholder="Pilih tanggal"
              value={filters.tanggal}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, tanggal: e.target.value }))
              }
              className="w-full min-h-9 md:min-h-0 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {/* Sort Section */}
        <div className={`md:shrink-0 space-y-1.5 sm:space-y-3 border-t border-slate-200 pt-2 sm:pt-4 ${filtersOpen ? "" : "max-sm:hidden"}`}>
          <div className="flex items-center gap-1.5 sm:gap-3">
            {sorts.map((sort, index) => (
              <div
                key={index}
                className="flex md:hidden items-center gap-2 bg-slate-50 p-1.5 sm:p-2 rounded-lg border border-slate-200 flex-1"
              >
                <select
                  value={sort.field}
                  onChange={(e) =>
                    handleUpdateSort(index, e.target.value, sort.order)
                  }
                  className="flex-1 min-h-9 md:min-h-0 px-2 py-1 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Urutkan --</option>
                  {SORT_FIELD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {sort.field && (
                  <button
                    onClick={() =>
                      handleUpdateSort(
                        index,
                        sort.field,
                        sort.order === "asc" ? "desc" : "asc",
                      )
                    }
                    className="flex min-h-9 min-w-9 md:min-h-8 md:min-w-8 items-center justify-center bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition flex-shrink-0"
                    title="Balik urutan (naik/turun)"
                  >
                    {sort.order === "asc" ? (
                      <ArrowUp className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={handleClearFilters}
              className="shrink-0 min-h-9 md:min-h-0 text-sm px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <AlertCircle className="w-8 h-8 text-red-500 mr-2" />
            <span className="text-red-500">Error loading penjualan data</span>
          </div>
        ) : penjualan.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            Tidak ada data penjualan
          </div>
        ) : (
          <>
          <div
            className={`flex min-h-0 flex-col rounded-lg border border-slate-200/80 bg-white/90 overflow-hidden transition-opacity ${isRefreshing ? "opacity-60" : ""}`}
            aria-busy={isRefreshing}
          >
            <Table fitScreen>
              <TableHeader sticky>
                <TableRow className="bg-slate-50">
                  <TableHead className="px-2 py-2 text-sm text-slate-600 w-12">
                    No.
                  </TableHead>
                  <SortableTableHead
                    field="tanggal"
                    sorts={sorts}
                    onSort={handleHeaderSort}
                    loading={isRefreshing}
                    className="text-sm text-slate-600 border-l border-slate-200/70"
                  >
                    Tanggal
                  </SortableTableHead>
                  <SortableTableHead
                    field="imei"
                    sorts={sorts}
                    onSort={handleHeaderSort}
                    loading={isRefreshing}
                    className="text-sm text-slate-600 border-l border-slate-200/70"
                  >
                    IMEI
                  </SortableTableHead>
                  <SortableTableHead
                    field="brand"
                    sorts={sorts}
                    onSort={handleHeaderSort}
                    loading={isRefreshing}
                    className="text-sm text-slate-600 border-l border-slate-200/70"
                  >
                    Brand
                  </SortableTableHead>
                  <SortableTableHead
                    field="namaHP"
                    sorts={sorts}
                    onSort={handleHeaderSort}
                    loading={isRefreshing}
                    className="text-sm text-slate-600 border-l border-slate-200/70"
                  >
                    Nama HP
                  </SortableTableHead>
                  <SortableTableHead
                    field="hargaJual"
                    sorts={sorts}
                    onSort={handleHeaderSort}
                    loading={isRefreshing}
                    className="text-sm text-slate-600 border-l border-slate-200/70"
                  >
                    Harga Jual
                  </SortableTableHead>
                  <SortableTableHead
                    field="metodeBayar"
                    sorts={sorts}
                    onSort={handleHeaderSort}
                    loading={isRefreshing}
                    className="text-sm text-slate-600 border-l border-slate-200/70"
                  >
                    Bayar
                  </SortableTableHead>
                  <TableHead className="px-2 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Keterangan
                  </TableHead>
                  <TableHead className="px-2 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Oleh
                  </TableHead>
                  <TableHead className="px-2 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penjualan.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className="odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/40"
                  >
                    <TableCell className="px-2 py-2 text-sm font-medium text-slate-600 w-12">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm font-medium text-slate-900 border-l border-slate-200/70">
                      {new Date(item.tanggal).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="px-2 py-2 text-xs font-mono text-slate-600 border-l border-slate-200/70">
                      {item.inventory?.imei}
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm border-l border-slate-200/70">
                      <span
                        style={{
                          backgroundColor: getBrandColor(
                            item.inventory?.brand || "",
                          ),
                        }}
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                      >
                        {item.inventory?.brand || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm text-slate-600 border-l border-slate-200/70 whitespace-normal">
                      <div className="min-w-[8rem] max-w-[13rem] break-words">
                        {item.inventory?.namaHP}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      {formatRupiah(item.hargaJual)}
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm border-l border-slate-200/70">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          getMetodeBayarColor(item.metodeBayar)
                        }`}
                      >
                        {formatMetodeBayar(item.metodeBayar)}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm text-slate-600 border-l border-slate-200/70 whitespace-normal">
                      <div className="min-w-[7rem] max-w-[11rem] break-words">
                        {item.keterangan || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      {item.user?.username
                        ? capitalizeFirstLetter(item.user.username)
                        : "-"}
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm border-l border-slate-200/70">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => setViewingItem(item)}
                          className="inline-flex items-center gap-0.5 p-1 text-slate-600 hover:bg-slate-100 rounded transition"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-0.5 p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          </>
        )}
      </div>

      {/* Modal Template */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-semibold text-slate-900">
                {isEditMode ? "Edit Penjualan" : "Tambah Penjualan"}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600">
                Form penjualan akan dibuat di sini.
                {isEditMode && editingItem && (
                  <span className="block mt-2 text-sm">
                    Editing ID: {editingItem.id}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && (
        <div className="flex-shrink-0 px-1 sm:px-2 py-1.5 border-t border-slate-200 flex flex-col sm:flex-row gap-1.5 sm:items-center sm:justify-between">
          <div className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
            Menampilkan {(page - 1) * limit + 1}–
            {Math.min(page * limit, data.pagination.total)} dari{" "}
            {data.pagination.total} data
          </div>

          <div className="flex gap-2 items-center justify-between sm:justify-end">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="min-h-8 md:min-h-0 px-2.5 py-0.5 border border-slate-200 bg-white rounded-md text-xs sm:text-sm disabled:opacity-50 hover:bg-slate-100 transition"
            >
              Sebelumnya
            </button>

            <div className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">
              Hal {page} / {data.pagination.totalPages}
            </div>

            <button
              onClick={() =>
                setPage(Math.min(data.pagination.totalPages, page + 1))
              }
              disabled={page === data.pagination.totalPages}
              className="min-h-8 md:min-h-0 px-2.5 py-0.5 border border-slate-200 bg-white rounded-md text-xs sm:text-sm disabled:opacity-50 hover:bg-slate-100 transition"
            >
              Berikutnya
            </button>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              className="hidden sm:block px-1.5 py-0.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="500">500</option>
              <option value="1000">1000</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPenjualanPage;
