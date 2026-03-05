import { useState, useMemo, useCallback } from "react";
import { useGetInventory } from "@/hooks/queries/useInventoryQueries";
import { useDeleteInventoryMutation } from "@/hooks/mutations/useInventoryMutations";
import { InventoryFormModal } from "@/components/InventoryFormModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Plus,
  ArrowUp,
  ArrowDown,
  X,
  Edit2,
  Trash2,
  ChevronsUpDown,
  Eye,
} from "lucide-react";
import { brandsList } from "@/lib/constants";
import { getBrandColor, normalizeDateInput } from "@/lib/utils";
import type { InventoryItem } from "@/lib/types";

interface FilterState {
  search: string;
  status: "" | "READY" | "TERJUAL" | "DIKEMBALIKAN";
  brands: string[];
  tanggal: string;
}

interface SortField {
  field: string;
  order: "asc" | "desc";
}

const sortFieldOptions = [
  { label: "Tanggal Masuk", value: "tanggalMasuk" },
  { label: "IMEI", value: "imei" },
  { label: "Brand", value: "brand" },
  { label: "Nama HP", value: "namaHP" },
  { label: "Warna", value: "warna" },
  { label: "Modal Awal", value: "modalAwal" },
  { label: "Modal Final", value: "modalFinal" },
  { label: "Status", value: "status" },
  { label: "Dibuat", value: "createdAt" },
];

export const InventoryPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "",
    brands: [],
    tanggal: "",
  });

  const [sorts, setSorts] = useState<SortField[]>([
    { field: "tanggalMasuk", order: "desc" },
  ]);

  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);

  const deleteMutation = useDeleteInventoryMutation();

  const searchValue = filters.search.trim();

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = {
      page,
      limit: 1000,
    };

    if (searchValue) {
      if (/^\d+$/.test(searchValue)) {
        params.imei = searchValue;
      } else {
        params.namaHP = searchValue;
      }
    }
    if (filters.status) params.status = filters.status;

    // Multi-brand filter
    const activeBrands = filters.brands.filter((b) => b);
    if (activeBrands.length > 0) {
      params.brand = activeBrands.join(",");
    }

    if (filters.tanggal) {
      const normalizedTanggal =
        normalizeDateInput(filters.tanggal) || filters.tanggal;
      params.tanggalMasuk = normalizedTanggal; // Format: YYYY-MM-DD
    }

    // Build sort params only for non-empty fields
    const activeSorts = sorts.filter((s) => s.field);
    if (activeSorts.length > 0) {
      params.sortBy = activeSorts.map((s) => s.field).join(",");
      params.sortOrder = activeSorts.map((s) => s.order).join(",");
    }

    return params;
  }, [filters, sorts, page, searchValue]);

  const { data, isLoading, error } = useGetInventory(queryParams);

  const handleToggleBrand = (brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
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

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      brands: [],
      tanggal: "",
    });
    setSorts([{ field: "tanggalMasuk", order: "desc" }]);
    setSearchInput("");
  };

  const handleOpenCreate = useCallback(() => {
    setIsEditMode(false);
    setEditingItem(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((item: InventoryItem) => {
    setIsEditMode(true);
    setEditingItem(item);
    setIsFormOpen(true);
  }, []);

  const handleDeleteInventory = async (id: number) => {
    const confirmed = window.confirm("Hapus inventory ini?");
    if (!confirmed) return;
    await deleteMutation.mutateAsync(id);
  };

  const inventory = useMemo(() => data?.data || [], [data]);

  const filteredInventoryList = useMemo(() => {
    if (!searchInput.trim()) return inventory.slice(0, 20);
    const search = searchInput.toLowerCase();

    const filtered = inventory.filter(
      (item) =>
        item.imei?.toLowerCase().includes(search) ||
        item.namaHP?.toLowerCase().includes(search) ||
        item.brand?.toLowerCase().includes(search),
    );

    // Sort by IMEI match position (closer to end = higher priority)
    filtered.sort((a, b) => {
      const aImei = a.imei?.toLowerCase() || "";
      const bImei = b.imei?.toLowerCase() || "";

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
  }, [inventory, searchInput]);

  const selectedItem = useMemo(
    () =>
      filters.search.trim()
        ? inventory.find(
            (item) =>
              item.imei === filters.search || item.namaHP === filters.search,
          )
        : undefined,
    [inventory, filters.search],
  );

  const namaHPOptions = useMemo(
    () =>
      Array.from(new Set(inventory.map((item) => item.namaHP))).filter(Boolean),
    [inventory],
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Total: {data?.pagination.total || 0} item
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-xs sm:text-sm"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Tambah Inventory
        </button>
      </div>

      {/* Filter & Sort Panel */}
      <div className="bg-white/90 rounded-lg border border-slate-200/80 p-2 sm:p-4 space-y-2 sm:space-y-4">
        {/* Basic Filters - Compact on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3">
          <div>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded text-xs sm:text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between ${
                    filters.search ? "text-slate-900" : "text-slate-500"
                  }`}
                >
                  <span className="truncate">
                    {selectedItem
                      ? `${selectedItem.imei} - ${selectedItem.namaHP}`
                      : "Cari IMEI atau Nama HP"}
                  </span>
                  <ChevronsUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="p-0 w-[--radix-popover-trigger-width]"
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
                      {filteredInventoryList.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={String(item.id)}
                          onSelect={() => {
                            setFilters((prev) => ({
                              ...prev,
                              search: item.imei,
                            }));
                            setSearchOpen(false);
                            setSearchInput("");
                          }}
                        >
                          <div className="flex flex-col text-xs sm:text-sm">
                            <div className="font-medium">
                              {item.imei} - {item.namaHP}
                            </div>
                            <div className="text-slate-500 text-[10px] sm:text-xs">
                              {item.brand} • {item.warna || "Tanpa warna"} •{" "}
                              {item.status}
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
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as
                    | ""
                    | "READY"
                    | "TERJUAL"
                    | "DIKEMBALIKAN",
                })
              }
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
            >
              <option value="">Semua Status</option>
              <option value="READY">Ready</option>
              <option value="TERJUAL">Terjual</option>
              <option value="DIKEMBALIKAN">Dikembalikan</option>
            </select>
            {filters.status && (
              <span
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium text-white pointer-events-none"
                style={{
                  backgroundColor:
                    filters.status === "READY" ? "#16a34a" : "#dc2626",
                }}
              >
                {filters.status === "READY" ? " " : " "}
              </span>
            )}
          </div>

          {/* Brand Multi-Select Dropdown */}
          <div className="relative">
            <button
              onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded text-xs sm:text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                    className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => handleToggleBrand(brand)}
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded border-slate-300"
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

          <div className="relative">
            <input
              type="date"
              placeholder="Tanggal"
              value={filters.tanggal}
              onChange={(e) =>
                setFilters({ ...filters, tanggal: e.target.value })
              }
              className="w-full px-2 sm:px-3 py-1 sm:py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            />
          </div>
        </div>

        {/* Sort Section - Single field */}
        <div className="space-y-1 sm:space-y-">
          {/* <div className="text-xs sm:text-sm font-semibold text-slate-700">
            Urutkan
          </div> */}
          <div className="flex flex-row gap-2 items-center">
            <div className="flex-1 grid grid-cols-1 gap-1.5 sm:gap-3">
              {sorts.map((sort, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 sm:gap-2 bg-slate-50 p-1.5 sm:p-3 rounded border border-slate-200"
                >
                  <select
                    value={sort.field}
                    onChange={(e) =>
                      handleUpdateSort(index, e.target.value, sort.order)
                    }
                    className="flex-1 px-1.5 sm:px-2 py-0.5 sm:py-1 border border-slate-200 rounded text-[11px] sm:text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Kosong --</option>
                    {sortFieldOptions.map((opt) => (
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
                      className="p-0.5 sm:p-1 hover:bg-slate-200 rounded transition flex-shrink-0"
                      title="Toggle ascending/descending"
                    >
                      {sort.order === "asc" ? (
                        <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      ) : (
                        <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleClearFilters}
              className="shrink-0 text-xs px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-semibold text-slate-900">
                {isEditMode ? "Edit Inventory" : "Tambah Inventory"}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
                Detail Inventory
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
                      {viewingItem.imei}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Tanggal Masuk
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-900">
                      {new Date(viewingItem.tanggalMasuk).toLocaleDateString(
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
                      Brand
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          backgroundColor: getBrandColor(
                            viewingItem.brand || "",
                          ),
                        }}
                        className="px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium text-white"
                      >
                        {viewingItem.brand}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Nama HP
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-900">
                      {viewingItem.namaHP}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Warna
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-900">
                      {viewingItem.warna || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Modal Awal
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-900">
                      Rp{" "}
                      {Number(viewingItem.modalAwal).toLocaleString("id-ID") ||
                        "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Modal Final
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-900">
                      Rp{" "}
                      {Number(viewingItem.modalFinal).toLocaleString("id-ID") ||
                        "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Cashback
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-900">
                      {viewingItem.cashback
                        ? `Rp ${Number(viewingItem.cashback).toLocaleString(
                            "id-ID",
                          )}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                      Status
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                        viewingItem.status === "READY"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {viewingItem.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sales Info - Show if Status is TERJUAL */}
              {viewingItem.status === "TERJUAL" &&
                viewingItem.penjualan &&
                viewingItem.penjualan.length > 0 && (
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-4">
                      Info Penjualan
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 bg-green-50 p-2 sm:p-4 rounded-lg border border-green-200">
                      <div>
                        <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                          Tanggal Terjual
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-slate-900">
                          {new Date(
                            viewingItem.penjualan[0].tanggal,
                          ).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                          Harga Jual
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900">
                          Rp{" "}
                          {Number(
                            viewingItem.penjualan[0].hargaJual,
                          ).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                          Diskon
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-slate-900">
                          {viewingItem.penjualan[0].diskon &&
                          Number(viewingItem.penjualan[0].diskon) > 0
                            ? `Rp ${Number(
                                viewingItem.penjualan[0].diskon,
                              ).toLocaleString("id-ID")}`
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                          Metode Bayar
                        </p>
                        <span
                          className={`inline-block px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                            viewingItem.penjualan[0].metodeBayar === "CASH"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {viewingItem.penjualan[0].metodeBayar}
                        </span>
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                          Profit
                        </p>
                        <p
                          className={`text-xs sm:text-sm font-semibold ${
                            Number(viewingItem.penjualan[0].profit) < 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          Rp{" "}
                          {Number(
                            viewingItem.penjualan[0].profit,
                          ).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <InventoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        isEditMode={isEditMode}
        item={editingItem}
        namaHPOptions={namaHPOptions}
      />

      {/* Loading & Error States */}
      {isLoading && (
        <div className="text-center py-8 text-slate-600">Loading...</div>
      )}

      {error && (
        <div className="text-center py-8 text-red-600">
          Error loading inventory
        </div>
      )}

      {!isLoading && inventory.length === 0 && (
        <div className="text-center py-8 text-slate-600">
          Tidak ada data inventory
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && inventory.length > 0 && (
        <>
          <div className="hidden md:block rounded-lg border border-slate-200/80 bg-white/90 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="px-3 py-2 text-sm text-slate-600 w-12">
                    No.
                  </TableHead>
                  <TableHead className="px-6 py-3 text-sm text-slate-600 border-l border-slate-200/70">
                    Tanggal Masuk
                  </TableHead>
                  <TableHead className="px-6 py-3 text-sm text-slate-600 border-l border-slate-200/70">
                    IMEI
                  </TableHead>
                  <TableHead className="px-6 py-3 text-sm text-slate-600 border-l border-slate-200/70">
                    Brand
                  </TableHead>
                  <TableHead className="px-6 py-3 text-sm text-slate-600 border-l border-slate-200/70">
                    Nama HP
                  </TableHead>
                  <TableHead className="px-6 py-3 text-sm text-slate-600 border-l border-slate-200/70">
                    Warna
                  </TableHead>
                  <TableHead className="px-6 py-3 text-sm text-slate-600 border-l border-slate-200/70">
                    Modal Awal
                  </TableHead>
                  <TableHead className="px-6 py-3 text-sm text-slate-600 border-l border-slate-200/70">
                    Cashback
                  </TableHead>
                  <TableHead className="px-6 py-3 text-sm text-slate-600 border-l border-slate-200/70">
                    Modal Final
                  </TableHead>
                  <TableHead className="px-6 py-3 text-sm text-slate-600 border-l border-slate-200/70">
                    Status
                  </TableHead>
                  <TableHead className="px-6 py-3 text-sm text-slate-600 border-l border-slate-200/70">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className="odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/40"
                  >
                    <TableCell className="px-3 py-2 text-sm font-medium text-slate-600 w-12">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm font-medium text-slate-900 border-l border-slate-200/70">
                      {new Date(item.tanggalMasuk).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      {item.imei}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm border-l border-slate-200/70">
                      <span
                        style={{
                          backgroundColor: getBrandColor(item.brand),
                        }}
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                      >
                        {item.brand}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      {item.namaHP}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      {item.warna || "-"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      Rp {parseFloat(item.modalAwal).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      {item.cashback && parseFloat(item.cashback) !== 0
                        ? `Rp ${parseFloat(item.cashback).toLocaleString("id-ID")}`
                        : "-"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      Rp {parseFloat(item.modalFinal).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm border-l border-slate-200/70">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === "READY"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm border-l border-slate-200/70">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingItem(item)}
                          className="inline-flex items-center gap-0.5 p-1.5 text-slate-600 hover:bg-slate-100 rounded transition"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-0.5 p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInventory(item.id)}
                          className="inline-flex items-center gap-0.5 p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Table */}
          <div className="md:hidden overflow-x-auto rounded-lg border border-slate-200/80 bg-white/90">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 w-8">
                    No.
                  </TableHead>
                  <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    Tgl Masuk
                  </TableHead>
                  <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    IMEI
                  </TableHead>
                  <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    Brand
                  </TableHead>
                  <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    Nama
                  </TableHead>
                  <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    Warna
                  </TableHead>
                  <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    Modal Awal
                  </TableHead>
                  <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    Cashback
                  </TableHead>
                  <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    Modal Final
                  </TableHead>
                  <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    Status
                  </TableHead>
                  <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className="odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/40"
                  >
                    <TableCell className="px-1 py-0.5 text-[10px] font-medium text-slate-600 w-8">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-1 py-0.5 text-[10px] font-medium text-slate-900 border-l border-slate-200/70">
                      {new Date(item.tanggalMasuk).toLocaleDateString("id-ID", {
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                      {item.imei}
                    </TableCell>
                    <TableCell className="px-1 py-0.5 text-[10px] border-l border-slate-200/70">
                      <span
                        style={{
                          backgroundColor: getBrandColor(item.brand),
                        }}
                        className="px-1 py-0.5 rounded text-[8px] font-medium text-white inline-block"
                      >
                        {item.brand}
                      </span>
                    </TableCell>
                    <TableCell className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                      {item.namaHP.substring(0, 15)}
                    </TableCell>
                    <TableCell className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                      {item.warna?.substring(0, 10) || "-"}
                    </TableCell>
                    <TableCell className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                      Rp{" "}
                      {parseFloat(item.modalAwal).toLocaleString("id-ID", {
                        maximumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                      {item.cashback && parseFloat(item.cashback) !== 0
                        ? `Rp ${parseFloat(item.cashback).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`
                        : "-"}
                    </TableCell>
                    <TableCell className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                      Rp{" "}
                      {parseFloat(item.modalFinal).toLocaleString("id-ID", {
                        maximumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell className="px-1 py-0.5 text-[10px] border-l border-slate-200/70">
                      <span
                        className={`px-0.5 py-0.5 rounded text-[8px] font-medium ${
                          item.status === "READY"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-1 py-0.5 text-[10px] border-l border-slate-200/70">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => setViewingItem(item)}
                          className="inline-flex items-center gap-0.5 p-1 text-slate-600 hover:bg-slate-100 rounded transition"
                          title="View"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-0.5 p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteInventory(item.id)}
                          className="inline-flex items-center gap-0.5 p-1 text-red-600 hover:bg-red-50 rounded transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* Pagination */}
      {data?.pagination && (
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="text-xs sm:text-sm text-slate-600">
            Showing {(page - 1) * limit + 1} to{" "}
            {Math.min(page * limit, data.pagination.total)} of{" "}
            {data.pagination.total} results
          </div>

          <div className="flex gap-1 sm:gap-2 items-center">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-2 sm:px-3 py-1 border border-slate-200 rounded text-xs disabled:opacity-50 hover:bg-slate-100 transition"
            >
              Previous
            </button>

            <div className="text-xs sm:text-sm text-slate-600">
              Page {page} of {data.pagination.pages}
            </div>

            <button
              onClick={() => setPage(Math.min(data.pagination.pages, page + 1))}
              disabled={page === data.pagination.pages}
              className="px-2 sm:px-3 py-1 border border-slate-200 rounded text-xs disabled:opacity-50 hover:bg-slate-100 transition"
            >
              Next
            </button>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="1000">1000</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
