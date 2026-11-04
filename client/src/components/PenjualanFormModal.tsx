import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ChevronsUpDown, Plus, X } from "lucide-react";
import {
  useCreatePenjualanMutation,
  useUpdatePenjualanMutation,
} from "@/hooks/mutations/usePenjualanMutations";
import { useGetCustomers } from "@/hooks/queries/useCustomerQueries";
import type { PenjualanItem, InventoryItem } from "@/lib/types";
import {
  Dialog,
  DialogClose,
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
import { cn, getBrandColor, normalizeDateInput } from "@/lib/utils";

interface PenjualanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  item?: PenjualanItem | null;
  inventoryOptions?: InventoryItem[];
  hideProfit?: boolean;
}

interface FormData {
  tanggal: string;
  inventoryId: number | null;
  customerId: number | null;
  customerNama: string;
  customerNomorHP: string;
  hargaJual: string;
  diskon: string;
  profit: string;
  metodeBayar: string;
  keterangan: string;
}

const STORAGE_KEY = "penjualan-form-draft";

const labelClass = "block text-sm font-medium text-slate-700 mb-1.5 md:mb-1";
const fieldBase =
  "w-full min-h-11 md:min-h-0 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";
const inputClass = `${fieldBase} px-3`;
const moneyInputClass = `${fieldBase} pl-10 pr-3`;
const triggerClass = `${inputClass} text-left flex items-center justify-between gap-2`;
const commandItemClass = "py-3 md:py-1.5";
const sectionTitleClass = "text-sm font-semibold text-slate-800";

const METODE_BAYAR_CHOICES = [
  { value: "CASH", label: "Cash" },
  { value: "TRANSFER_BNI", label: "TF BNI" },
  { value: "TRANSFER_BRI", label: "TF BRI" },
  { value: "TRANSFER_MANDIRI", label: "TF Mandiri" },
];

// On phones the keyboard's "next" key sends Enter, which would submit the
// form early. On touch devices move focus to the next field instead.
const focusNextFieldOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  const formEl = e.currentTarget.form;
  if (!formEl) return;
  e.preventDefault();
  const fields = Array.from(
    formEl.querySelectorAll<HTMLElement>("input, select, textarea"),
  ).filter(
    (el) => !(el as HTMLInputElement).disabled && el.offsetParent !== null,
  );
  const next = fields[fields.indexOf(e.currentTarget) + 1];
  if (next) next.focus();
  else e.currentTarget.blur();
};

export const PenjualanFormModal = ({
  isOpen,
  onClose,
  isEditMode,
  item,
  inventoryOptions = [],
  hideProfit = false,
}: PenjualanFormModalProps) => {
  const [form, setForm] = useState<FormData>({
    tanggal: "",
    inventoryId: null,
    customerId: null,
    customerNama: "",
    customerNomorHP: "",
    hargaJual: "",
    diskon: "",
    profit: "",
    metodeBayar: "CASH",
    keterangan: "",
  });

  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("new");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [diskonOpen, setDiskonOpen] = useState(false);

  const createMutation = useCreatePenjualanMutation();
  const updateMutation = useUpdatePenjualanMutation();

  // Load draft from localStorage on mount
  useEffect(() => {
    if (isOpen && !isEditMode) {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setForm(draft.form);
          setCustomerMode(draft.customerMode || "new");
        } catch {
          // If parsing fails, use default
          setForm({
            tanggal: new Date().toISOString().slice(0, 10),
            inventoryId: null,
            customerId: null,
            customerNama: "",
            customerNomorHP: "",
            hargaJual: "",
            diskon: "",
            profit: "",
            metodeBayar: "CASH",
            keterangan: "",
          });
          setCustomerMode("new");
        }
      } else {
        setForm({
          tanggal: new Date().toISOString().slice(0, 10),
          inventoryId: null,
          customerId: null,
          customerNama: "",
          customerNomorHP: "",
          hargaJual: "",
          diskon: "",
          profit: "",
          metodeBayar: "CASH",
          keterangan: "",
        });
        setCustomerMode("new");
      }
      setCustomerSearchInput("");
      setSearchInput("");
      setDiskonOpen(false);
    }
  }, [isOpen, isEditMode]);

  // Initialize form when editing
  useEffect(() => {
    if (isOpen && isEditMode && item) {
      setForm({
        tanggal: item.tanggal.slice(0, 10),
        inventoryId: item.inventoryId,
        customerId: item.customerId ?? null,
        customerNama: item.customer?.nama || "",
        customerNomorHP: item.customer?.nomorHP || "",
        hargaJual: String(item.hargaJual ?? ""),
        diskon: item.diskon ? String(item.diskon) : "",
        profit: String(item.profit ?? ""),
        metodeBayar: item.metodeBayar || "CASH",
        keterangan: item.keterangan || "",
      });
      setCustomerMode(item.customerId ? "existing" : "existing");
      setCustomerSearchInput("");
      setSearchInput("");
    }
  }, [isOpen, isEditMode, item]);

  // Save draft to localStorage whenever form changes (only in create mode)
  useEffect(() => {
    if (!isEditMode && isOpen) {
      const hasData = form.inventoryId || form.customerNama || form.hargaJual;
      if (hasData) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ form, customerMode }),
        );
      }
    }
  }, [form, customerMode, isEditMode, isOpen]);

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

  const customerSearchValue = customerSearchInput.trim();
  const customerQueryParams = useMemo(() => {
    if (!customerSearchValue) {
      return { page: 1, limit: 20 };
    }

    if (/^\d+$/.test(customerSearchValue)) {
      return { page: 1, limit: 20, nomorHP: customerSearchValue };
    }

    return { page: 1, limit: 20, search: customerSearchValue };
  }, [customerSearchValue]);

  const { data: customerData } = useGetCustomers(customerQueryParams);
  const customerOptions = useMemo(
    () => customerData?.data || [],
    [customerData],
  );

  const selectedCustomer = useMemo(
    () => customerOptions.find((cust) => cust.id === form.customerId),
    [customerOptions, form.customerId],
  );

  // Filter inventory options based on search with smart IMEI prioritization
  // Only show READY items (not TERJUAL)
  const filteredInventory = useMemo(() => {
    const readyItems = inventoryOptions.filter((inv) => inv.status === "READY");

    if (!searchInput.trim()) return readyItems;

    const search = searchInput.toLowerCase().trim();
    const filtered = readyItems.filter(
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

    // Use modalFinal if available and not 0, otherwise use modalAwal
    let modal = 0;
    const modalFinalValue = selectedInventory.modalFinal
      ? parseFloat(String(selectedInventory.modalFinal))
      : null;
    const modalAwalValue = selectedInventory.modalAwal
      ? parseFloat(String(selectedInventory.modalAwal))
      : 0;

    // Prefer modalFinal if it's a valid number > 0, otherwise use modalAwal
    if (
      modalFinalValue !== null &&
      !isNaN(modalFinalValue) &&
      modalFinalValue > 0
    ) {
      modal = modalFinalValue;
    } else {
      modal = modalAwalValue;
    }

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

  const handleSuccessfulSubmit = useCallback(() => {
    // Clear draft after successful submit
    localStorage.removeItem(STORAGE_KEY);
    onClose();
  }, [onClose]);

  const handleSubmitForm = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      const hasExistingCustomer =
        customerMode === "existing" && !!form.customerId;
      const hasNewCustomer =
        customerMode === "new" && form.customerNama.trim().length > 0;

      // Customer is now optional
      // if (!hasExistingCustomer && !hasNewCustomer) {
      //   alert("Pilih customer atau isi nama customer baru");
      //   return;
      // }

      if (!form.inventoryId) {
        alert("Silakan pilih inventory");
        return;
      }

      const normalizedTanggal =
        normalizeDateInput(form.tanggal) || form.tanggal;

      const baseData = {
        tanggal: normalizedTanggal,
        inventoryId: form.inventoryId,
        customerId: hasExistingCustomer ? form.customerId : undefined,
        customerNama: hasNewCustomer ? form.customerNama.trim() : undefined,
        customerNomorHP:
          hasNewCustomer && form.customerNomorHP.trim()
            ? form.customerNomorHP.trim()
            : undefined,
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
          customerId: null,
          customerNama: "",
          customerNomorHP: "",
          hargaJual: "",
          diskon: "",
          profit: "",
          metodeBayar: "CASH",
          keterangan: "",
        });
        setCustomerMode("existing");
        setCustomerSearchInput("");
        setSearchInput("");
        handleSuccessfulSubmit();
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
      customerMode,
      handleSuccessfulSubmit,
    ],
  );

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-[calc(100%-1.5rem)] max-h-[85dvh] sm:max-h-[90vh] flex-col gap-0 overflow-hidden rounded-xl border p-0 max-w-lg sm:max-w-3xl [&>button:last-child]:hidden">
        <DialogHeader className="flex-row items-center justify-between gap-2 space-y-0 px-4 sm:px-6 py-2 sm:py-3 border-b bg-white text-left flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">
            {isEditMode ? "Edit Penjualan" : "Tambah Penjualan"}
          </DialogTitle>
          <DialogClose
            aria-label="Tutup"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="h-5 w-5" />
          </DialogClose>
        </DialogHeader>

        <form
          onSubmit={handleSubmitForm}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="px-4 sm:px-6 py-4 overflow-y-auto overscroll-contain flex-1">
            <div className="space-y-5">
              {/* 1. HP yang dijual */}
              <div>
                <label className={labelClass}>HP yang dijual</label>
                <Popover open={inventoryOpen} onOpenChange={setInventoryOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        triggerClass,
                        !selectedInventory && "text-slate-500",
                      )}
                    >
                      <span className="truncate">
                        {selectedInventory
                          ? "Ganti HP..."
                          : "Ketik IMEI atau nama HP..."}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Cari IMEI, Nama HP, atau Brand..."
                        value={searchInput}
                        onValueChange={setSearchInput}
                        autoComplete="off"
                      />
                      <CommandList>
                        <CommandEmpty>Tidak ada HP yang ditemukan.</CommandEmpty>
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
                              className={commandItemClass}
                            >
                              <div className="flex flex-col text-sm">
                                <div className="font-medium">
                                  {inv.imei} - {inv.namaHP}
                                </div>
                                <div className="text-slate-500 text-xs">
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
                  <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/60 p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold text-white"
                        style={{
                          backgroundColor: getBrandColor(selectedInventory.brand),
                        }}
                      >
                        {selectedInventory.brand}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 break-words">
                        {selectedInventory.namaHP}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      IMEI{" "}
                      <span className="font-mono">{selectedInventory.imei}</span>
                      {selectedInventory.warna
                        ? ` • ${selectedInventory.warna}`
                        : ""}
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Harga */}
              <div>
                <label htmlFor="penjualan-harga-jual" className={labelClass}>
                  Harga Jual
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">
                    Rp
                  </span>
                  <input
                    id="penjualan-harga-jual"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    enterKeyHint="next"
                    onKeyDown={focusNextFieldOnEnter}
                    required
                    placeholder="contoh: 2.500.000"
                    value={formatToRupiah(form.hargaJual)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        hargaJual: e.target.value,
                      })
                    }
                    className={cn(moneyInputClass, "text-base font-semibold")}
                  />
                </div>

                {diskonOpen || form.diskon ? (
                  <div className="mt-3">
                    <label htmlFor="penjualan-diskon" className={labelClass}>
                      Diskon
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">
                        Rp
                      </span>
                      <input
                        id="penjualan-diskon"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        enterKeyHint="next"
                        onKeyDown={focusNextFieldOnEnter}
                        placeholder="0"
                        value={formatToRupiah(form.diskon)}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            diskon: e.target.value,
                          })
                        }
                        className={moneyInputClass}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDiskonOpen(true)}
                    className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-lg px-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah diskon
                  </button>
                )}

                {!hideProfit && selectedInventory && form.hargaJual && (
                  <div
                    className={cn(
                      "mt-2 text-sm font-semibold",
                      calculatedProfit > 0 && "text-green-600",
                      calculatedProfit < 0 && "text-red-600",
                      calculatedProfit === 0 && "text-slate-600",
                    )}
                  >
                    Profit: Rp {formatToRupiah(form.profit)}
                  </div>
                )}
              </div>

              {/* 3. Metode Bayar */}
              <div>
                <span className={labelClass}>Bayar pakai</span>
                <div
                  role="radiogroup"
                  aria-label="Metode Bayar"
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  {METODE_BAYAR_CHOICES.map((choice) => {
                    const active = form.metodeBayar === choice.value;
                    return (
                      <button
                        key={choice.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() =>
                          setForm({ ...form, metodeBayar: choice.value })
                        }
                        className={cn(
                          "min-h-11 rounded-lg border text-sm font-semibold transition",
                          active
                            ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100",
                        )}
                      >
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Customer */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={sectionTitleClass}>Customer</span>
                  <span className="text-xs text-slate-500">boleh dikosongkan</span>
                </div>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    aria-pressed={customerMode === "new"}
                    onClick={() => {
                      setCustomerMode("new");
                      setForm((prev) => ({
                        ...prev,
                        customerId: null,
                      }));
                    }}
                    className={cn(
                      "min-h-10 rounded-md text-sm font-medium transition",
                      customerMode === "new"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600",
                    )}
                  >
                    Customer baru
                  </button>
                  <button
                    type="button"
                    aria-pressed={customerMode === "existing"}
                    onClick={() => {
                      setCustomerMode("existing");
                      setForm((prev) => ({
                        ...prev,
                        customerNama: "",
                        customerNomorHP: "",
                      }));
                    }}
                    className={cn(
                      "min-h-10 rounded-md text-sm font-medium transition",
                      customerMode === "existing"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600",
                    )}
                  >
                    Sudah pernah beli
                  </button>
                </div>

                {customerMode === "existing" ? (
                  <div>
                    <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            triggerClass,
                            !selectedCustomer && "text-slate-500",
                          )}
                        >
                          <span className="truncate">
                            {selectedCustomer
                              ? `${selectedCustomer.nama}${selectedCustomer.nomorHP ? ` - ${selectedCustomer.nomorHP}` : ""}`
                              : "Cari nama atau nomor HP..."}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="bottom"
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                      >
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Cari nama atau nomor HP..."
                            value={customerSearchInput}
                            onValueChange={setCustomerSearchInput}
                            autoComplete="off"
                          />
                          <CommandList>
                            <CommandEmpty>
                              Tidak ada customer yang ditemukan.
                            </CommandEmpty>
                            <CommandGroup>
                              {customerOptions.map((cust) => (
                                <CommandItem
                                  key={cust.id}
                                  value={String(cust.id)}
                                  onSelect={() => {
                                    setForm((prev) => ({
                                      ...prev,
                                      customerId: cust.id,
                                      customerNama: cust.nama,
                                      customerNomorHP: cust.nomorHP || "",
                                    }));
                                    setCustomerOpen(false);
                                    setCustomerSearchInput("");
                                  }}
                                  className={commandItemClass}
                                >
                                  <div className="flex flex-col text-sm">
                                    <div className="font-medium">
                                      {cust.nama}
                                    </div>
                                    <div className="text-slate-500 text-xs">
                                      {cust.nomorHP}
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
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="penjualan-customer-nama"
                        className={labelClass}
                      >
                        Nama
                      </label>
                      <input
                        id="penjualan-customer-nama"
                        type="text"
                        autoComplete="off"
                        autoCapitalize="words"
                        enterKeyHint="next"
                        onKeyDown={focusNextFieldOnEnter}
                        value={form.customerNama}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            customerNama: e.target.value,
                          }))
                        }
                        placeholder="Nama customer"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="penjualan-customer-nomor-hp"
                        className={labelClass}
                      >
                        Nomor HP
                      </label>
                      <input
                        id="penjualan-customer-nomor-hp"
                        type="tel"
                        inputMode="tel"
                        autoComplete="off"
                        enterKeyHint="next"
                        onKeyDown={focusNextFieldOnEnter}
                        value={form.customerNomorHP}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            customerNomorHP: e.target.value,
                          }))
                        }
                        placeholder="contoh: 081234567890"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Lain-lain */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="penjualan-keterangan" className={labelClass}>
                    Keterangan{" "}
                    <span className="font-normal text-slate-500">(opsional)</span>
                  </label>
                  <input
                    id="penjualan-keterangan"
                    type="text"
                    enterKeyHint="done"
                    value={form.keterangan}
                    onChange={(e) =>
                      setForm({ ...form, keterangan: e.target.value })
                    }
                    placeholder="contoh: DP 500rb, sisa minggu depan"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="penjualan-tanggal" className={labelClass}>
                    Tanggal
                  </label>
                  <input
                    id="penjualan-tanggal"
                    type="date"
                    required
                    value={form.tanggal}
                    onChange={(e) =>
                      setForm({ ...form, tanggal: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer - stays visible at the bottom */}
          <div className="grid grid-cols-2 gap-3 px-4 py-3 border-t bg-slate-50 flex-shrink-0 sm:flex sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 sm:min-h-0 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-base sm:text-sm font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-11 sm:min-h-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 text-base sm:text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
