import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type FormEvent,
} from "react";
import { ChevronsUpDown } from "lucide-react";
import {
  useCreatePenjualanMutation,
  useUpdatePenjualanMutation,
} from "@/hooks/mutations/usePenjualanMutations";
import type { PenjualanItem, InventoryItem } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

interface PenjualanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  item?: PenjualanItem | null;
  inventoryOptions?: InventoryItem[];
}

interface FormData {
  tanggal: string;
  inventoryId: number | null;
  hargaJual: string;
  diskon: string;
  profit: string;
  metodeBayar: string;
  keterangan: string;
}

export const PenjualanFormModal = ({
  isOpen,
  onClose,
  isEditMode,
  item,
  inventoryOptions = [],
}: PenjualanFormModalProps) => {
  const [form, setForm] = useState<FormData>({
    tanggal: "",
    inventoryId: null,
    hargaJual: "",
    diskon: "",
    profit: "",
    metodeBayar: "CASH",
    keterangan: "",
  });

  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const createMutation = useCreatePenjualanMutation();
  const updateMutation = useUpdatePenjualanMutation();

  // Initialize form when opening create mode
  useEffect(() => {
    if (isOpen && !isEditMode) {
      setForm({
        tanggal: new Date().toISOString().slice(0, 10),
        inventoryId: null,
        hargaJual: "",
        diskon: "",
        profit: "",
        metodeBayar: "CASH",
        keterangan: "",
      });
      setSearchInput("");
    }
  }, [isOpen, isEditMode]);

  // Initialize form when editing
  useEffect(() => {
    if (isOpen && isEditMode && item) {
      setForm({
        tanggal: item.tanggal.slice(0, 10),
        inventoryId: item.inventoryId,
        hargaJual: String(item.hargaJual ?? ""),
        diskon: item.diskon ? String(item.diskon) : "",
        profit: String(item.profit ?? ""),
        metodeBayar: item.metodeBayar || "CASH",
        keterangan: item.keterangan || "",
      });
      setSearchInput("");
    }
  }, [isOpen, isEditMode, item]);

  // Format number to Rupiah display
  const formatToRupiah = useCallback((value: string): string => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }, []);

  // Parse Rupiah display back to number
  const parseFromRupiah = useCallback((value: string): string => {
    return value.replace(/\./g, "");
  }, []);

  // Get selected inventory item for display
  const selectedInventory = useMemo(
    () => inventoryOptions.find((inv) => inv.id === form.inventoryId),
    [inventoryOptions, form.inventoryId],
  );

  // Filter inventory options based on search with smart IMEI prioritization
  const filteredInventory = useMemo(() => {
    if (!searchInput.trim()) return inventoryOptions;

    const search = searchInput.toLowerCase().trim();
    const filtered = inventoryOptions.filter(
      (inv) =>
        inv.imei?.toLowerCase().includes(search) ||
        inv.namaHP?.toLowerCase().includes(search) ||
        inv.brand?.toLowerCase().includes(search),
    );

    // Sort: prioritize IMEI ending with search string
    return filtered.sort((a, b) => {
      const aImei = a.imei?.toLowerCase() || "";
      const bImei = b.imei?.toLowerCase() || "";
      const aEnds = aImei.endsWith(search);
      const bEnds = bImei.endsWith(search);

      if (aEnds && !bEnds) return -1;
      if (!aEnds && bEnds) return 1;
      return 0;
    });
  }, [inventoryOptions, searchInput]);

  // Calculate profit automatically
  const calculatedProfit = useMemo(() => {
    if (!selectedInventory || !form.hargaJual) return 0;

    const hargaJual = parseFloat(parseFromRupiah(form.hargaJual));
    const diskon = form.diskon ? parseFloat(parseFromRupiah(form.diskon)) : 0;
    const modal =
      selectedInventory.modalFinal &&
      parseFloat(selectedInventory.modalFinal) > 0
        ? parseFloat(selectedInventory.modalFinal)
        : selectedInventory.modalAwal
          ? parseFloat(selectedInventory.modalAwal)
          : 0;

    // Profit = Harga Jual - Diskon - Modal
    return hargaJual - diskon - modal;
  }, [selectedInventory, form.hargaJual, form.diskon, parseFromRupiah]);

  // Update profit whenever it's calculated
  useEffect(() => {
    if (selectedInventory && form.hargaJual) {
      setForm((prev) => ({
        ...prev,
        profit: String(Math.round(calculatedProfit)),
      }));
    }
  }, [calculatedProfit, selectedInventory, form.hargaJual]);

  const handleSubmitForm = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (!form.inventoryId) {
        alert("Silakan pilih inventory");
        return;
      }

      const baseData = {
        tanggal: form.tanggal,
        inventoryId: form.inventoryId,
        hargaJual: parseFloat(parseFromRupiah(form.hargaJual)),
        diskon: form.diskon
          ? parseFloat(parseFromRupiah(form.diskon))
          : undefined,
        profit: parseFloat(parseFromRupiah(form.profit)),
        metodeBayar: form.metodeBayar,
        keterangan: form.keterangan || undefined,
      };

      try {
        if (isEditMode && item) {
          await updateMutation.mutateAsync({
            id: item.id,
            payload: baseData,
          });
        } else {
          await createMutation.mutateAsync(baseData);
        }

        setForm({
          tanggal: "",
          inventoryId: null,
          hargaJual: "",
          diskon: "",
          profit: "",
          metodeBayar: "CASH",
          keterangan: "",
        });
        setSearchInput("");
        onClose();
      } catch (error) {
        console.error("Error submitting form:", error);
      }
    },
    [
      form,
      isEditMode,
      item,
      createMutation,
      updateMutation,
      parseFromRupiah,
      onClose,
    ],
  );

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[95vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b sticky top-0 bg-white z-10 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">
            {isEditMode ? "Edit Penjualan" : "Tambah Penjualan"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmitForm}
          className="flex flex-col h-full flex-1 overflow-hidden"
        >
          <div className="px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto flex-1">
            <div className="space-y-4 sm:space-y-6">
              {/* Date & Inventory */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Tanggal */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={form.tanggal}
                    onChange={(e) =>
                      setForm({ ...form, tanggal: e.target.value })
                    }
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Inventory */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    HP (IMEI / Nama)
                  </label>
                  <Popover open={inventoryOpen} onOpenChange={setInventoryOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between",
                          !selectedInventory && "text-slate-500",
                        )}
                      >
                        <span className="truncate">
                          {selectedInventory
                            ? `${selectedInventory.imei} - ${selectedInventory.namaHP}`
                            : "Pilih HP..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Cari IMEI, Nama HP, atau Brand..."
                          value={searchInput}
                          onValueChange={setSearchInput}
                        />
                        <CommandList>
                          <CommandEmpty>
                            Tidak ada HP yang ditemukan.
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredInventory.map((inv) => (
                              <CommandItem
                                key={inv.id}
                                value={String(inv.id)}
                                onSelect={() => {
                                  setForm({ ...form, inventoryId: inv.id });
                                  setInventoryOpen(false);
                                  setSearchInput("");
                                }}
                              >
                                <div className="flex flex-col text-xs sm:text-sm">
                                  <div className="font-medium">
                                    {inv.imei} - {inv.namaHP}
                                  </div>
                                  <div className="text-slate-500 text-[10px] sm:text-xs">
                                    {inv.brand} • {inv.warna || "Tanpa warna"}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedInventory && (
                    <div className="mt-1 text-[10px] sm:text-xs text-slate-600 truncate">
                      {selectedInventory.brand} {selectedInventory.namaHP} -{" "}
                      {selectedInventory.warna || "-"}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Fields */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Harga Jual */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Harga Jual
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">Rp</span>
                    <input
                      type="text"
                      required
                      value={formatToRupiah(form.hargaJual)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          hargaJual: e.target.value,
                        })
                      }
                      className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Diskon */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Diskon (Opsional)
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">Rp</span>
                    <input
                      type="text"
                      value={formatToRupiah(form.diskon)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          diskon: e.target.value,
                        })
                      }
                      className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {selectedInventory && form.hargaJual && (
                    <div
                      className={cn(
                        "mt-1 text-[10px] sm:text-xs font-bold",
                        calculatedProfit > 0 && "text-green-600",
                        calculatedProfit < 0 && "text-red-600",
                        calculatedProfit === 0 && "text-slate-600",
                      )}
                    >
                      Profit: Rp {formatToRupiah(form.profit)}
                    </div>
                  )}
                </div>
              </div>

              {/* Metode Bayar & Keterangan */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Metode Bayar */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Metode Bayar
                  </label>
                  <select
                    required
                    value={form.metodeBayar}
                    onChange={(e) =>
                      setForm({ ...form, metodeBayar: e.target.value })
                    }
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">CASH</option>
                    <option value="TRANSFER">TRANSFER</option>
                  </select>
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={form.keterangan}
                    onChange={(e) =>
                      setForm({ ...form, keterangan: e.target.value })
                    }
                    placeholder="Contoh: Cicilan 3x..."
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end px-4 sm:px-6 py-3 sm:py-4 border-t bg-slate-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-xs sm:text-sm font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
