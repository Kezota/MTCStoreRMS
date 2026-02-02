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
  GripHorizontal,
} from "lucide-react";
import { brandsList } from "@/lib/constants";
import { getBrandColor } from "@/lib/utils";
import type { InventoryItem } from "@/lib/types";

interface FilterState {
  search: string;
  status: "" | "READY" | "TERJUAL";
  brands: string[];
  warna: string;
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
    warna: "",
  });

  const [sorts, setSorts] = useState<SortField[]>([
    { field: "tanggalMasuk", order: "desc" },
    { field: "", order: "desc" },
    { field: "", order: "desc" },
  ]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const deleteMutation = useDeleteInventoryMutation();

  const searchValue = filters.search.trim();
  const isNumericSearch = searchValue.length > 0 && /^\d+$/.test(searchValue);

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
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

    if (filters.warna) params.warna = filters.warna;

    // Build sort params only for non-empty fields
    const activeSorts = sorts.filter((s) => s.field);
    if (activeSorts.length > 0) {
      params.sortBy = activeSorts.map((s) => s.field).join(",");
      params.sortOrder = activeSorts.map((s) => s.order).join(",");
    }

    return params;
  }, [filters, sorts, page, limit]);

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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const newSorts = [...sorts];
    const draggedSort = newSorts[draggedIndex];
    newSorts.splice(draggedIndex, 1);
    newSorts.splice(index, 0, draggedSort);
    setSorts(newSorts);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      brands: [],
      warna: "",
    });
    setSorts([
      { field: "tanggalMasuk", order: "desc" },
      { field: "", order: "desc" },
      { field: "", order: "desc" },
    ]);
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

  const inventory = data?.data || [];

  const imeiOptions = useMemo(
    () =>
      Array.from(new Set(inventory.map((item) => item.imei))).filter(Boolean),
    [inventory],
  );

  const namaHPOptions = useMemo(
    () =>
      Array.from(new Set(inventory.map((item) => item.namaHP))).filter(Boolean),
    [inventory],
  );
  const namaOptions = useMemo(
    () =>
      Array.from(new Set(inventory.map((item) => item.namaHP))).filter(Boolean),
    [inventory],
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-600">
            Total: {data?.pagination.total || 0} item
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Inventory
        </button>
      </div>

      {/* Filter & Sort Panel */}
      <div className="bg-white/90 rounded-lg border border-slate-200/80 p-2 sm:p-4 space-y-2 sm:space-y-4">
        {/* Basic Filters - Compact on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3">
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded text-xs sm:text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                  filters.search ? "text-slate-900" : "text-slate-500"
                }`}
              >
                {filters.search || "Cari IMEI atau Nama HP"}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="p-0 w-[--radix-popover-trigger-width]"
            >
              <Command>
                <CommandInput
                  placeholder="Ketik IMEI atau Nama HP..."
                  value={filters.search}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, search: value }))
                  }
                />
                <CommandList>
                  <CommandEmpty>Tidak ada hasil.</CommandEmpty>

                  {(!searchValue || !isNumericSearch) && (
                    <CommandGroup heading="Nama HP">
                      {namaOptions.slice(0, 20).map((name) => (
                        <CommandItem
                          key={name}
                          value={name}
                          onSelect={(value) => {
                            setFilters((prev) => ({ ...prev, search: value }));
                            setSearchOpen(false);
                          }}
                        >
                          {name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {(!searchValue || isNumericSearch) && (
                    <CommandGroup heading="IMEI">
                      {imeiOptions.slice(0, 20).map((imei) => (
                        <CommandItem
                          key={imei}
                          value={imei}
                          onSelect={(value) => {
                            setFilters((prev) => ({ ...prev, search: value }));
                            setSearchOpen(false);
                          }}
                        >
                          {imei}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as "" | "READY" | "TERJUAL",
                })
              }
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
            >
              <option value="">Semua Status</option>
              <option value="READY">Ready</option>
              <option value="TERJUAL">Terjual</option>
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
              type="text"
              placeholder="Warna..."
              value={filters.warna}
              onChange={(e) =>
                setFilters({ ...filters, warna: e.target.value })
              }
              className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                filters.warna ? "pr-16 sm:pr-20" : ""
              }`}
            />
            {filters.warna && (
              <span className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium text-white bg-blue-600 truncate">
                {filters.warna}
              </span>
            )}
          </div>
        </div>

        {/* Sort Section - 3 fields side by side */}
        <div className="space-y-1 sm:space-y-3 border-t border-slate-200 pt-2 sm:pt-4">
          <div className="text-xs sm:text-sm font-semibold text-slate-700">
            Urutkan
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 sm:gap-3">
            {sorts.map((sort, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={() => handleDragOver(index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-1 sm:gap-2 bg-slate-50 p-1.5 sm:p-3 rounded border transition ${
                  draggedIndex === index
                    ? "opacity-50 border-blue-400"
                    : "border-slate-200"
                } cursor-move`}
              >
                <GripHorizontal className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />

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
        </div>

        {/* Clear Filters Button */}
        <button
          onClick={handleClearFilters}
          className="w-full text-xs px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition"
        >
          Reset
        </button>
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
                      {item.cashback && parseFloat(item.cashback) > 0
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
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-0.5 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs transition"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteInventory(item.id)}
                          className="inline-flex items-center gap-0.5 px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs transition"
                        >
                          <Trash2 className="w-3 h-3" />
                          Hapus
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
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-0.5 px-1 py-0.5 text-blue-600 hover:bg-blue-50 rounded text-[8px] transition"
                        >
                          <Edit2 className="w-2 h-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteInventory(item.id)}
                          className="inline-flex items-center gap-0.5 px-1 py-0.5 text-red-600 hover:bg-red-50 rounded text-[8px] transition"
                        >
                          <Trash2 className="w-2 h-2" />
                          Hapus
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
              Page {page} of {data.pagination.totalPages}
            </div>

            <button
              onClick={() =>
                setPage(Math.min(data.pagination.totalPages, page + 1))
              }
              disabled={page === data.pagination.totalPages}
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
