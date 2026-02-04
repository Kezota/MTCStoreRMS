import { useState, useMemo } from "react";
import { useGetPenjualan } from "@/hooks/queries/usePenjualanQueries";
import { useDeletePenjualanMutation } from "@/hooks/mutations/usePenjualanMutations";
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
  GripHorizontal,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  Plus,
  X,
  ChevronsUpDown,
} from "lucide-react";
import { brandsList } from "@/lib/constants";
import { getBrandColor } from "@/lib/utils";
import type { PenjualanItem, InventoryItem } from "@/lib/types";

interface FilterState {
  search: string;
  metodeBayar: string;
  brands: string[];
  tanggal: string;
}

interface SortField {
  field: string;
  order: "asc" | "desc";
}

const METODE_BAYAR_OPTIONS = ["CASH", "TRANSFER"];

const SORT_FIELD_OPTIONS = [
  { value: "tanggal", label: "Tanggal" },
  { value: "hargaJual", label: "Harga Jual" },
  { value: "profit", label: "Profit" },
  { value: "metodeBayar", label: "Metode Bayar" },
  { value: "brand", label: "Brand" },
  { value: "createdAt", label: "Created At" },
];

export const PenjualanPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    metodeBayar: "",
    brands: [],
    tanggal: "",
  });
  const [sorts, setSorts] = useState<SortField[]>([
    { field: "tanggal", order: "desc" },
    { field: "", order: "desc" },
    { field: "", order: "desc" },
  ]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<PenjualanItem | null>(null);

  const deleteMutation = useDeletePenjualanMutation();
  const { data: inventoryData } = useGetInventory({ page: 1, limit: 10000 });

  const searchValue = filters.search.trim();

  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = { page, limit: 1000 };

    if (searchValue) {
      if (/^\d+$/.test(searchValue)) {
        params.imei = searchValue;
      } else {
        params.namaHP = searchValue;
      }
    }
    if (filters.metodeBayar) params.metodeBayar = filters.metodeBayar;
    if (filters.tanggal) {
      params.tanggal = filters.tanggal; // Format: YYYY-MM-DD
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
  }, [filters, sorts, page, searchValue]);

  const { data, isLoading, error } = useGetPenjualan(queryParams);

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
    setFilters({ search: "", metodeBayar: "", brands: [], tanggal: "" });
    setSorts([
      { field: "tanggal", order: "desc" },
      { field: "", order: "desc" },
      { field: "", order: "desc" },
    ]);
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

  const handleDeletePenjualan = async (id: number) => {
    const confirmed = window.confirm("Hapus penjualan ini?");
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting penjualan:", error);
      alert("Gagal menghapus penjualan");
    }
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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
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
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Penjualan</h1>
          <p className="text-sm text-slate-600">
            Total: {data?.pagination.total || 0} item
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-xs sm:text-sm"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Tambah Penjualan
        </button>
      </div>

      {/* Filter & Sort Panel */}
      <div className="bg-white/90 rounded-lg border border-slate-200/80 my-7 p-2 sm:p-4 space-y-2 sm:space-y-4">
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
                    {selectedItem?.inventory
                      ? `${selectedItem.inventory.imei} - ${selectedItem.inventory.namaHP}`
                      : "Cari IMEI atau Nama HP"}
                  </span>
                  <ChevronsUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent
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

          <select
            value={filters.metodeBayar}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, metodeBayar: e.target.value }));
              setPage(1);
            }}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Metode Bayar</option>
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
              placeholder="Pilih tanggal"
              value={filters.tanggal}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, tanggal: e.target.value }))
              }
              className="w-full px-2 sm:px-3 py-1 sm:py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            />
          </div>
        </div>
        {/* Sort Section */}
        <div className="space-y-1.5 sm:space-y-3 border-t border-slate-200 pt-2 sm:pt-4">
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
                    className="p-0.5 sm:p-1 hover:bg-slate-200 rounded transition flex-shrink-0"
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
        <button
          onClick={handleClearFilters}
          className="w-full text-xs px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
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
          <div className="hidden md:block rounded-lg border border-slate-200/80 bg-white/90 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="px-3 py-2 text-sm text-slate-600 w-12">
                    No.
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Tanggal
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    IMEI
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Brand
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Nama HP
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Harga Jual
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Modal Final
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Diskon
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Profit
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Metode Bayar
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Keterangan
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
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
                    <TableCell className="px-3 py-2 text-sm font-medium text-slate-600 w-12">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm font-medium text-slate-900 border-l border-slate-200/70">
                      {new Date(item.tanggal).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      {item.inventory?.imei}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm border-l border-slate-200/70">
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
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      {item.inventory?.namaHP}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      {formatRupiah(item.hargaJual)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      {formatRupiah(item.inventory?.modalFinal || 0)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      {item.diskon ? formatRupiah(item.diskon) : "-"}
                    </TableCell>
                    <TableCell
                      className={`px-3 py-2 text-sm font-semibold border-l border-slate-200/70 ${Number(item.profit) < 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      {formatRupiah(item.profit)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm border-l border-slate-200/70">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.metodeBayar === "CASH"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.metodeBayar}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70 max-w-xs break-words whitespace-normal">
                      {item.keterangan || "-"}
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
                          onClick={() => handleDeletePenjualan(item.id)}
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
        )}

        {/* Mobile Table */}
        <div className="md:hidden overflow-x-auto rounded-lg border border-slate-200/80 bg-white/90">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 w-8">
                  No.
                </TableHead>
                <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                  Tgl
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
                  Harga
                </TableHead>
                <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                  Modal
                </TableHead>
                <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                  Profit
                </TableHead>
                <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
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
                  <TableCell className="px-1 py-0.5 text-[10px] font-medium text-slate-600 w-8">
                    {(page - 1) * limit + index + 1}
                  </TableCell>
                  <TableCell className="px-1 py-0.5 text-[10px] font-medium text-slate-900 border-l border-slate-200/70">
                    {new Date(item.tanggal).toLocaleDateString("id-ID", {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    {item.inventory?.imei}
                  </TableCell>
                  <TableCell className="px-1 py-0.5 text-[10px] border-l border-slate-200/70">
                    <span
                      style={{
                        backgroundColor: getBrandColor(
                          item.inventory?.brand || "",
                        ),
                      }}
                      className="px-1 py-0.5 rounded text-[8px] font-medium text-white"
                    >
                      {item.inventory?.brand || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    {item.inventory?.namaHP?.substring(0, 12) || "-"}
                  </TableCell>
                  <TableCell className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    {formatRupiah(item.hargaJual)}
                  </TableCell>
                  <TableCell className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    {formatRupiah(item.inventory?.modalFinal || 0)}
                  </TableCell>
                  <TableCell
                    className={`px-1 py-0.5 text-[10px] font-semibold border-l border-slate-200/70 ${Number(item.profit) < 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    {formatRupiah(item.profit)}
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
                        onClick={() => handleDeletePenjualan(item.id)}
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
        <div className="flex-shrink-0 sm:px-6 py-3 sm:py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
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

export default PenjualanPage;
