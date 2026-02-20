import { useState, useMemo } from "react";
import { useGetCustomerPurchases } from "@/hooks/queries/useCustomerQueries";
import { useDeleteCustomerMutation } from "@/hooks/mutations/useCustomerMutations";
import { CustomerFormModal } from "@/components/CustomerFormModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  Plus,
  X,
  Eye,
  ChevronsUpDown,
  GripHorizontal,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { brandsList } from "@/lib/constants";
import { getBrandColor } from "@/lib/utils";
import type { Customer, CustomerPurchase } from "@/lib/types";

interface FilterState {
  searchNama: string;
  searchNomorHP: string;
  brand: string;
  searchHP: string;
}

interface SortField {
  field: string;
  order: "asc" | "desc";
}

interface SortOption {
  value: string;
  label: string;
}

const SORT_FIELD_OPTIONS: SortOption[] = [
  { value: "tanggal", label: "Tanggal Beli" },
  { value: "customerNama", label: "Nama Customer" },
  { value: "customerNomorHP", label: "Nomor HP" },
  { value: "brand", label: "Brand" },
  { value: "namaHP", label: "Nama HP" },
  { value: "hargaJual", label: "Harga Jual" },
  { value: "createdAt", label: "Created At" },
];

export const CustomerPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(1000);
  const [filters, setFilters] = useState<FilterState>({
    searchNama: "",
    searchNomorHP: "",
    brand: "",
    searchHP: "",
  });
  const [sorts, setSorts] = useState<SortField[]>([
    { field: "tanggal", order: "desc" },
    { field: "", order: "desc" },
    { field: "", order: "desc" },
  ]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [brandOpen, setBrandOpen] = useState(false);
  const [searchHPOpen, setSearchHPOpen] = useState(false);
  const [searchHPInput, setSearchHPInput] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<Customer | null>(null);
  const [viewingItem, setViewingItem] = useState<CustomerPurchase | null>(null);

  const deleteMutation = useDeleteCustomerMutation();

  const searchNamaValue = filters.searchNama.trim();
  const searchNomorHPValue = filters.searchNomorHP.trim();
  const searchHPValue = filters.searchHP.trim();

  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = { page, limit };

    if (searchNamaValue) {
      params.search = searchNamaValue;
    }

    if (searchNomorHPValue) {
      params.nomorHP = searchNomorHPValue;
    }

    if (filters.brand) {
      params.brand = filters.brand;
    }

    // Check if searchHP is IMEI (digits only) or Nama HP
    if (searchHPValue) {
      if (/^\d+$/.test(searchHPValue)) {
        params.imei = searchHPValue;
      } else {
        params.namaHP = searchHPValue;
      }
    }

    const activeSorts = sorts.filter((s) => s.field);
    if (activeSorts.length > 0) {
      params.sortBy = activeSorts.map((s) => s.field).join(",");
      params.sortOrder = activeSorts.map((s) => s.order).join(",");
    }

    return params;
  }, [
    searchNamaValue,
    searchNomorHPValue,
    filters.brand,
    searchHPValue,
    page,
    limit,
    sorts,
  ]);

  const { data, isLoading, error } = useGetCustomerPurchases(queryParams);

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

  // const handleClearFilters = () => {
  //   setFilters({ searchNama: "", searchNomorHP: "", brand: "", searchHP: "" });
  //   setSorts([
  //     { field: "tanggal", order: "desc" },
  //     { field: "", order: "desc" },
  //     { field: "", order: "desc" },
  //   ]);
  //   setSearchHPInput("");
  // };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (purchase: CustomerPurchase) => {
    // For editing, we need to create a Customer object from purchase
    const customer: Customer = {
      id: purchase.customer.id,
      nama: purchase.customer.nama,
      nomorHP: purchase.customer.nomorHP || "",
      createdAt: purchase.customer.createdAt,
      updatedAt: purchase.customer.updatedAt,
    };
    setIsEditMode(true);
    setEditingItem(customer);
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = async (id: number) => {
    const confirmed = window.confirm(
      "Hapus customer ini? Semua data pembelian customer akan dihapus.",
    );
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Gagal menghapus customer");
    }
  };

  const purchases = useMemo(() => data?.data || [], [data]);

  const formatRupiah = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
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
                Detail Pembelian
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
              {/* Customer Details */}
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

              {viewingItem.inventory ? (
                <>
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
                          {viewingItem.inventory.imei}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                          Brand
                        </p>
                        <span
                          style={{
                            backgroundColor: getBrandColor(
                              viewingItem.inventory.brand,
                            ),
                          }}
                          className="px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium text-white"
                        >
                          {viewingItem.inventory.brand}
                        </span>
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                          Nama HP
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-slate-900">
                          {viewingItem.inventory.namaHP}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                          Warna
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-slate-900">
                          {viewingItem.inventory.warna || "-"}
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
                          {viewingItem.tanggal
                            ? new Date(viewingItem.tanggal).toLocaleDateString(
                                "id-ID",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                          Harga Jual
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900">
                          {viewingItem.hargaJual
                            ? formatRupiah(viewingItem.hargaJual)
                            : "-"}
                        </p>
                      </div>
                      {viewingItem.diskon &&
                        parseFloat(viewingItem.diskon) > 0 && (
                          <div>
                            <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                              Diskon
                            </p>
                            <p className="text-xs sm:text-sm font-medium text-slate-900">
                              {formatRupiah(viewingItem.diskon)}
                            </p>
                          </div>
                        )}
                      {viewingItem.metodeBayar && (
                        <div>
                          <p className="text-[11px] sm:text-xs text-slate-600 mb-0.5 sm:mb-1">
                            Metode Bayar
                          </p>
                          <span
                            className={`inline-block px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                              viewingItem.metodeBayar === "CASH"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {viewingItem.metodeBayar}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

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
                </>
              ) : (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Detail Pembelian
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 italic bg-slate-50 p-2 sm:p-4 rounded-lg">
                    Customer ini belum melakukan pembelian
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setIsEditMode(false);
          setEditingItem(null);
        }}
        isEditMode={isEditMode}
        item={editingItem}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            Pelanggan
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Total: {data?.pagination.total || 0} entri (customer & pembelian)
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-xs sm:text-sm"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Tambah Pelanggan
        </button>
      </div>

      {/* Filter & Sort Panel */}
      <div className="bg-white/90 rounded-lg border border-slate-200/80 my-3 sm:my-4 p-2 sm:p-4 space-y-2 sm:space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3">
          <input
            type="text"
            placeholder="Cari nama customer..."
            value={filters.searchNama}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchNama: e.target.value }))
            }
            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            placeholder="Cari nomor HP..."
            value={filters.searchNomorHP}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchNomorHP: e.target.value }))
            }
            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Search HP (IMEI or Nama HP) */}
          <Popover open={searchHPOpen} onOpenChange={setSearchHPOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded text-xs sm:text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between ${
                  filters.searchHP ? "text-slate-900" : "text-slate-500"
                }`}
              >
                <span className="truncate">
                  {filters.searchHP || "Cari IMEI atau Nama HP"}
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
                  placeholder="Ketik IMEI atau Nama HP..."
                  value={searchHPInput}
                  onValueChange={setSearchHPInput}
                />
                <CommandList>
                  <CommandEmpty>Ketik untuk mencari.</CommandEmpty>
                  <CommandGroup>
                    {/* Show search input as an option if it has content */}
                    {searchHPInput.trim() && (
                      <CommandItem
                        key="search-input"
                        value="search-input"
                        onSelect={() => {
                          setFilters((prev) => ({
                            ...prev,
                            searchHP: searchHPInput.trim(),
                          }));
                          setSearchHPOpen(false);
                          setSearchHPInput("");
                        }}
                      >
                        <div className="flex flex-col text-xs sm:text-sm w-full">
                          <div className="font-medium text-blue-600">
                            Cari: "{searchHPInput}"
                          </div>
                          <div className="text-slate-500 text-[10px] sm:text-xs">
                            {/^\d+$/.test(searchHPInput.trim())
                              ? "Cari berdasarkan IMEI"
                              : "Cari berdasarkan Nama HP"}
                          </div>
                        </div>
                      </CommandItem>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Brand Filter */}
          <Popover open={brandOpen} onOpenChange={setBrandOpen}>
            <PopoverTrigger asChild>
              <button className="px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between">
                <span className="truncate">
                  {filters.brand || "Filter Brand..."}
                </span>
                <ChevronsUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Cari brand..." />
                <CommandList>
                  <CommandEmpty>Tidak ada brand ditemukan.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setFilters((prev) => ({ ...prev, brand: "" }));
                        setBrandOpen(false);
                      }}
                    >
                      Semua Brand
                    </CommandItem>
                    {brandsList.map((brand) => (
                      <CommandItem
                        key={brand}
                        value={brand}
                        onSelect={() => {
                          setFilters((prev) => ({ ...prev, brand }));
                          setBrandOpen(false);
                        }}
                      >
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: getBrandColor(brand) }}
                        >
                          {brand}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Sort Section */}
        <div className="space-y-1.5 sm:space-y-3 border-t border-slate-200 pt-2 sm:pt-4">
          {/* <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm font-semibold text-slate-700">
              Urutkan
            </div>
            <button
              onClick={handleClearFilters}
              className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition"
            >
              Reset
            </button>
          </div> */}
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
            <span className="text-red-500">Error loading data</span>
          </div>
        ) : purchases.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            Tidak ada data customer
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
                    Customer
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Nomor HP
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Brand
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Nama HP
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    IMEI
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Tanggal Beli
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Harga Jual
                  </TableHead>
                  <TableHead className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((item, index) => (
                  <TableRow
                    key={`${item.customer.id}-${item.id || "no-purchase"}-${index}`}
                    className="odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/40"
                  >
                    <TableCell className="px-3 py-2 text-sm font-medium text-slate-600 w-12">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm border-l border-slate-200/70">
                      <div className="font-medium text-slate-900">
                        {item.customer.nama}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      {item.customer.nomorHP || "-"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm border-l border-slate-200/70">
                      {item.inventory ? (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: getBrandColor(
                              item.inventory.brand,
                            ),
                            color: "white",
                          }}
                        >
                          {item.inventory.brand}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-900 border-l border-slate-200/70">
                      {item.inventory?.namaHP || "-"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70 font-mono">
                      {item.inventory?.imei || "-"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 border-l border-slate-200/70">
                      {item.tanggal
                        ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-900 border-l border-slate-200/70">
                      {item.hargaJual
                        ? `Rp ${parseFloat(item.hargaJual).toLocaleString("id-ID")}`
                        : "-"}
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
                          onClick={() => handleDeleteCustomer(item.customer.id)}
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
                  Customer
                </TableHead>
                <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                  HP
                </TableHead>
                <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                  Tanggal
                </TableHead>
                <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                  Harga
                </TableHead>
                <TableHead className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((item, index) => (
                <TableRow
                  key={`${item.customer.id}-${item.id || "no-purchase"}-${index}`}
                  className="odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/40"
                >
                  <TableCell className="px-1 py-0.5 text-[10px] font-medium text-slate-600 w-8">
                    {(page - 1) * limit + index + 1}
                  </TableCell>
                  <TableCell className="px-1 py-0.5 text-[10px] border-l border-slate-200/70">
                    <div className="font-medium text-slate-900">
                      {item.customer.nama}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {item.customer.nomorHP || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="px-1 py-0.5 text-[10px] border-l border-slate-200/70">
                    {item.inventory ? (
                      <>
                        <div className="font-medium text-slate-900">
                          {item.inventory.brand}
                        </div>
                        <div className="text-[9px] text-slate-600 truncate max-w-[100px]">
                          {item.inventory.namaHP}
                        </div>
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    {item.tanggal
                      ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="px-1 py-0.5 text-[10px] text-slate-600 border-l border-slate-200/70">
                    {item.hargaJual
                      ? `Rp ${parseFloat(item.hargaJual).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`
                      : "-"}
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
                        onClick={() => handleDeleteCustomer(item.customer.id)}
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
      </div>

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
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPage;
