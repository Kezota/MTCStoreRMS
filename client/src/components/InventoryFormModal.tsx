import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Plus, Trash2, Check, ChevronsUpDown, X } from "lucide-react";
import { brandsList } from "@/lib/constants";
import {
  useCreateInventoryMutation,
  useCreateBulkInventoryMutation,
  useUpdateInventoryMutation,
} from "@/hooks/mutations/useInventoryMutations";
import {
  useGetInventoryModalsByNamaHP,
  useGetNamaHPByBrand,
} from "@/hooks/queries/useInventoryQueries";
import type { InventoryItem } from "@/lib/types";
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
import { getBrandColor, cn, normalizeDateInput } from "@/lib/utils";

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  item?: InventoryItem | null;
  namaHPOptions?: string[];
}

interface PhoneVariant {
  id: number;
  imei: string;
  warna: string;
}

const FORM_STORAGE_KEY = "inventory_form_draft";

const labelClass = "block text-xs sm:text-sm font-medium text-slate-700 mb-1";
const fieldBase =
  "w-full min-h-10 md:min-h-0 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";
const inputClass = `${fieldBase} px-3`;
const moneyInputClass = `${fieldBase} pl-10 pr-3`;
const triggerClass = `${inputClass} text-left flex items-center justify-between gap-2`;
const commandItemClass = "py-3 md:py-1.5";

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

interface FormData {
  tanggalMasuk: string;
  brand: string;
  namaHP: string;
  modalAwal: string;
  cashback: string;
  modalFinal: string;
  status: "READY" | "TERJUAL" | "DIKEMBALIKAN";
}

const saveFormToStorage = (formData: FormData, variants: PhoneVariant[]) => {
  try {
    localStorage.setItem(
      FORM_STORAGE_KEY,
      JSON.stringify({ form: formData, variants }),
    );
  } catch (error) {
    console.error("Failed to save form to localStorage:", error);
  }
};

const loadFormFromStorage = () => {
  try {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Failed to load form from localStorage:", error);
    return null;
  }
};

const clearFormStorage = () => {
  try {
    localStorage.removeItem(FORM_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear form from localStorage:", error);
  }
};

export const InventoryFormModal = ({
  isOpen,
  onClose,
  isEditMode,
  item,
  namaHPOptions = [],
}: InventoryFormModalProps) => {
  const [form, setForm] = useState({
    tanggalMasuk: "",
    brand: "",
    namaHP: "",
    modalAwal: "",
    cashback: "",
    modalFinal: "",
    status: "READY" as "READY" | "TERJUAL" | "DIKEMBALIKAN",
  });

  const [phoneVariants, setPhoneVariants] = useState<PhoneVariant[]>([
    { id: 1, imei: "", warna: "" },
  ]);

  const [brandOpen, setBrandOpen] = useState(false);
  const [namaHPOpen, setNamaHPOpen] = useState(false);
  const [lastEditedField, setLastEditedField] = useState<
    "cashback" | "modalFinal" | null
  >(null);

  const createMutation = useCreateInventoryMutation();
  const createBulkMutation = useCreateBulkInventoryMutation();
  const updateMutation = useUpdateInventoryMutation();

  // Only fetch modal options when there's a namaHP value AND modal is open
  const shouldFetchModals = isOpen && form.namaHP.trim().length > 2;
  const { data: modalData } = useGetInventoryModalsByNamaHP(
    shouldFetchModals ? form.namaHP : undefined,
  );
  const modalOptions = useMemo(() => modalData?.data.modals ?? [], [modalData]);

  // Fetch nama HP options filtered by brand
  const shouldFetchNamaHP = isOpen && form.brand.trim().length > 0;
  const { data: namaHPByBrandData } = useGetNamaHPByBrand(
    shouldFetchNamaHP ? form.brand : undefined,
  );
  const filteredNamaHPOptions = useMemo(() => {
    if (namaHPByBrandData?.data?.namaHPs) {
      return namaHPByBrandData.data.namaHPs;
    }
    return namaHPOptions;
  }, [namaHPByBrandData, namaHPOptions]);

  // Initialize form when opening create mode - restore from localStorage if available
  useEffect(() => {
    if (isOpen && !isEditMode) {
      const saved = loadFormFromStorage();
      if (saved && saved.form && saved.variants) {
        setForm(saved.form);
        setPhoneVariants(saved.variants);
      } else {
        setForm({
          tanggalMasuk: new Date().toISOString().slice(0, 10),
          brand: "",
          namaHP: "",
          modalAwal: "",
          cashback: "",
          modalFinal: "",
          status: "READY" as "READY" | "TERJUAL" | "DIKEMBALIKAN",
        });
        setPhoneVariants([{ id: 1, imei: "", warna: "" }]);
      }
    }
  }, [isOpen, isEditMode]);

  // Initialize form when editing
  useEffect(() => {
    if (isOpen && isEditMode && item) {
      // Clear any draft when editing
      clearFormStorage();
      setForm({
        tanggalMasuk: new Date(item.tanggalMasuk).toISOString().slice(0, 10),
        brand: item.brand,
        namaHP: item.namaHP,
        modalAwal: String(item.modalAwal ?? ""),
        cashback: item.cashback ? String(item.cashback) : "",
        modalFinal: String(item.modalFinal ?? ""),
        status: item.status,
      });
      setPhoneVariants([{ id: 1, imei: item.imei, warna: item.warna || "" }]);
    }
  }, [isOpen, isEditMode, item]);

  // Format number to Rupiah display (without Rp prefix)
  const formatToRupiah = useCallback((value: string): string => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }, []);

  // Parse Rupiah display back to number
  const parseFromRupiah = useCallback((value: string): string => {
    return value.replace(/\./g, "");
  }, []);

  // Save form to localStorage on every change (only in create mode)
  useEffect(() => {
    if (isOpen && !isEditMode) {
      saveFormToStorage(form, phoneVariants);
    }
  }, [form, phoneVariants, isOpen, isEditMode]);

  // Auto-calculate modalFinal when cashback changes OR cashback when modalFinal changes
  useEffect(() => {
    if (!form.modalAwal) return;

    const modalAwalNum = parseFloat(parseFromRupiah(form.modalAwal));
    if (isNaN(modalAwalNum) || modalAwalNum === 0) return;

    // User edited cashback -> calculate modalFinal
    if (lastEditedField === "cashback") {
      const cashbackStr = form.cashback.trim();

      if (!cashbackStr || cashbackStr === "0") {
        // Cashback cleared or set to 0 -> modalFinal = modalAwal
        setForm((prev) => ({
          ...prev,
          modalFinal: String(modalAwalNum),
        }));
      } else {
        const cashbackNum = parseFloat(parseFromRupiah(cashbackStr));
        if (!isNaN(cashbackNum)) {
          const calculatedModalFinal = modalAwalNum - cashbackNum;
          setForm((prev) => ({
            ...prev,
            modalFinal: String(calculatedModalFinal), // Allow negative if cashback > modalAwal
          }));
        }
      }
    }
    // User edited modalFinal -> calculate cashback
    else if (lastEditedField === "modalFinal") {
      const modalFinalStr = form.modalFinal.trim();

      if (!modalFinalStr || modalFinalStr === "0") {
        // ModalFinal cleared -> no cashback; on save it falls back to modalAwal.
        // (Setting cashback = modalAwal here used to save Modal Final as Rp 0.)
        setForm((prev) => ({
          ...prev,
          cashback: "",
        }));
      } else {
        const modalFinalNum = parseFloat(parseFromRupiah(modalFinalStr));
        if (!isNaN(modalFinalNum)) {
          const calculatedCashback = modalAwalNum - modalFinalNum;
          setForm((prev) => ({
            ...prev,
            cashback: String(calculatedCashback), // Can be negative if modalFinal > modalAwal
          }));
        }
      }
    }
  }, [
    form.modalAwal,
    form.cashback,
    form.modalFinal,
    lastEditedField,
    parseFromRupiah,
  ]);

  const handleAddVariant = useCallback(() => {
    const newId = Math.max(...phoneVariants.map((v) => v.id), 0) + 1;
    setPhoneVariants([...phoneVariants, { id: newId, imei: "", warna: "" }]);
  }, [phoneVariants]);

  const handleRemoveVariant = useCallback((id: number) => {
    setPhoneVariants((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const handleVariantChange = useCallback(
    (id: number, field: "imei" | "warna", value: string) => {
      setPhoneVariants((prev) =>
        prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
      );
    },
    [],
  );

  const handleSubmitForm = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      const modalAwalValue = parseFloat(parseFromRupiah(form.modalAwal));
      const cashbackValue = form.cashback
        ? parseFloat(parseFromRupiah(form.cashback))
        : null;
      const modalFinalValue = form.modalFinal
        ? parseFloat(parseFromRupiah(form.modalFinal))
        : modalAwalValue - (cashbackValue || 0); // Default to modalAwal if not provided

      // A phone can't cost Rp 0; this usually means cashback equals modal awal
      if (!(modalFinalValue > 0)) {
        alert(
          "Modal Final tidak boleh Rp 0 atau minus. Cek lagi Modal Awal dan Cashback.",
        );
        return;
      }

      const normalizedTanggalMasuk =
        normalizeDateInput(form.tanggalMasuk) || form.tanggalMasuk;

      const baseData = {
        tanggalMasuk: normalizedTanggalMasuk,
        brand: form.brand,
        namaHP: form.namaHP,
        modalAwal: modalAwalValue,
        cashback: cashbackValue,
        modalFinal: modalFinalValue,
      };

      if (isEditMode && item) {
        await updateMutation.mutateAsync({
          id: item.id,
          payload: {
            ...baseData,
            imei: phoneVariants[0].imei,
            warna: phoneVariants[0].warna || undefined,
            status: form.status,
          },
        });
      } else {
        // Create multiple items using bulk API
        const items = phoneVariants.map((variant) => ({
          ...baseData,
          imei: variant.imei,
          warna: variant.warna || undefined,
        }));

        await createBulkMutation.mutateAsync({ items });
      }

      // Reset form after successful submit
      clearFormStorage();
      setForm({
        tanggalMasuk: "",
        brand: "",
        namaHP: "",
        modalAwal: "",
        cashback: "",
        modalFinal: "",
        status: "READY",
      });
      setPhoneVariants([{ id: 1, imei: "", warna: "" }]);

      onClose();
    },
    [
      form,
      phoneVariants,
      isEditMode,
      item,
      updateMutation,
      createBulkMutation,
      parseFromRupiah,
      onClose,
    ],
  );

  const isLoading =
    createMutation.isPending ||
    createBulkMutation.isPending ||
    updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-[calc(100%-1.5rem)] max-h-[85dvh] sm:max-h-[90vh] flex-col gap-0 overflow-hidden rounded-xl border p-0 max-w-lg sm:max-w-4xl [&>button:last-child]:hidden">
        <DialogHeader className="flex-row items-center justify-between gap-2 space-y-0 px-4 sm:px-6 py-2 sm:py-3 border-b bg-white text-left flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg">
            {isEditMode ? "Edit Inventory" : "Tambah Inventory"}
          </DialogTitle>
          <DialogClose
            aria-label="Tutup"
            className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="h-5 w-5" />
          </DialogClose>
        </DialogHeader>

        <form
          onSubmit={handleSubmitForm}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="px-4 sm:px-6 py-4 overflow-y-auto overscroll-contain flex-1">
            <div className="space-y-4">
              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Tanggal Masuk */}
                <div>
                  <label htmlFor="inventory-tanggal-masuk" className={labelClass}>
                    Tanggal Masuk
                  </label>
                  <input
                    id="inventory-tanggal-masuk"
                    type="date"
                    required
                    placeholder="Pilih tanggal"
                    value={form.tanggalMasuk}
                    onChange={(e) =>
                      setForm({ ...form, tanggalMasuk: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className={labelClass}>Brand</label>
                  <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          triggerClass,
                          !form.brand && "text-slate-500",
                        )}
                      >
                        <span className="truncate">
                          {form.brand || "Pilih atau ketik brand..."}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    {brandOpen && (
                      <PopoverContent
                        side="bottom"
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput
                            placeholder="Cari atau ketik brand baru..."
                            value={form.brand}
                            onValueChange={(value) =>
                              setForm({ ...form, brand: value })
                            }
                            autoComplete="off"
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="py-2 px-3 text-sm">
                                Ketik untuk menambah brand baru:{" "}
                                <span className="font-semibold">
                                  {form.brand}
                                </span>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {brandsList.map((brand) => (
                                <CommandItem
                                  key={brand}
                                  value={brand}
                                  onSelect={(value) => {
                                    setForm({ ...form, brand: value });
                                    setBrandOpen(false);
                                  }}
                                  className={cn(
                                    "flex items-center justify-between",
                                    commandItemClass,
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                                      style={{
                                        backgroundColor: getBrandColor(brand),
                                      }}
                                    >
                                      {brand}
                                    </span>
                                  </div>
                                  <Check
                                    className={cn(
                                      "h-4 w-4",
                                      form.brand === brand
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    )}
                  </Popover>
                </div>

                {/* Nama HP */}
                <div>
                  <label className={labelClass}>Nama HP</label>
                  <Popover open={namaHPOpen} onOpenChange={setNamaHPOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          triggerClass,
                          !form.namaHP && "text-slate-500",
                        )}
                      >
                        <span className="truncate">
                          {form.namaHP || "Pilih atau ketik nama HP..."}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    {namaHPOpen && (
                      <PopoverContent
                        side="bottom"
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput
                            placeholder="Cari atau ketik nama HP..."
                            value={form.namaHP}
                            onValueChange={(value) =>
                              setForm({ ...form, namaHP: value })
                            }
                            autoComplete="off"
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="py-2 px-3 text-sm">
                                Ketik untuk menambah:{" "}
                                <span className="font-semibold">
                                  {form.namaHP}
                                </span>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredNamaHPOptions
                                .filter(
                                  (hp) =>
                                    hp
                                      .toLowerCase()
                                      .includes(form.namaHP.toLowerCase()) ||
                                    form.namaHP === "",
                                )
                                .slice(0, 10)
                                .map((hp) => (
                                  <CommandItem
                                    key={hp}
                                    value={hp}
                                    onSelect={(value) => {
                                      setForm({ ...form, namaHP: value });
                                      setNamaHPOpen(false);
                                    }}
                                    className={cn(
                                      "flex items-center justify-between",
                                      commandItemClass,
                                    )}
                                  >
                                    <span className="truncate">{hp}</span>
                                    <Check
                                      className={cn(
                                        "h-4 w-4 shrink-0",
                                        form.namaHP === hp
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    )}
                  </Popover>
                </div>

                {/* Modal Awal */}
                <div className="sm:col-span-1">
                  <label htmlFor="inventory-modal-awal" className={labelClass}>
                    Modal Awal
                  </label>
                  {modalOptions.length > 0 && (
                    <select
                      aria-label="Pilih modal awal dari history"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          setForm({ ...form, modalAwal: e.target.value });
                        }
                      }}
                      className={cn(inputClass, "mb-2 md:mb-1.5")}
                    >
                      <option value="">-- Pilih dari History --</option>
                      {modalOptions.map((modal) => (
                        <option key={modal} value={modal}>
                          Rp {parseFloat(modal).toLocaleString("id-ID")}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                      Rp
                    </span>
                    <input
                      id="inventory-modal-awal"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      enterKeyHint="next"
                      onKeyDown={focusNextFieldOnEnter}
                      required
                      value={formatToRupiah(form.modalAwal)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          modalAwal: parseFromRupiah(e.target.value),
                        })
                      }
                      placeholder="contoh: 2.500.000"
                      className={moneyInputClass}
                    />
                  </div>
                </div>

                {/* Cashback */}
                <div className="sm:col-span-1">
                  <label htmlFor="inventory-cashback" className={labelClass}>
                    Cashback (Opsional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                      Rp
                    </span>
                    <input
                      id="inventory-cashback"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      enterKeyHint="next"
                      onKeyDown={focusNextFieldOnEnter}
                      value={formatToRupiah(form.cashback)}
                      onChange={(e) => {
                        setLastEditedField("cashback");
                        setForm({
                          ...form,
                          cashback: parseFromRupiah(e.target.value),
                        });
                      }}
                      placeholder="0"
                      className={moneyInputClass}
                    />
                  </div>
                </div>

                {/* Modal Final */}
                <div className="sm:col-span-1">
                  <label htmlFor="inventory-modal-final" className={labelClass}>
                    Modal Final (Opsional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                      Rp
                    </span>
                    <input
                      id="inventory-modal-final"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      enterKeyHint="next"
                      onKeyDown={focusNextFieldOnEnter}
                      value={formatToRupiah(form.modalFinal)}
                      onChange={(e) => {
                        setLastEditedField("modalFinal");
                        setForm({
                          ...form,
                          modalFinal: parseFromRupiah(e.target.value),
                        });
                      }}
                      placeholder="0"
                      className={moneyInputClass}
                    />
                  </div>
                </div>

                {/* Status - only on edit */}
                {isEditMode && (
                  <div className="sm:col-span-1">
                    <label htmlFor="inventory-status" className={labelClass}>
                      Status
                    </label>
                    <select
                      id="inventory-status"
                      value={form.status}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          status: e.target.value as
                            | "READY"
                            | "TERJUAL"
                            | "DIKEMBALIKAN",
                        })
                      }
                      className={inputClass}
                    >
                      <option value="READY">Ready</option>
                      <option value="TERJUAL">Terjual</option>
                      <option value="DIKEMBALIKAN">Dikembalikan</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Phone Variants Section */}
              <div className="border-t pt-4">
                <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 mb-3">
                  <span className="block text-sm font-semibold text-slate-900">
                    {isEditMode ? "IMEI & Warna" : "Daftar HP (IMEI & Warna)"}
                  </span>
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="flex min-h-10 md:min-h-0 items-center gap-1.5 md:gap-1 px-4 md:px-3 py-2 md:py-1.5 bg-blue-600 text-white text-sm md:text-xs font-medium rounded-lg md:rounded hover:bg-blue-700 active:bg-blue-800 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      Tambah HP
                    </button>
                  )}
                </div>

                <div className="space-y-3 border rounded-lg p-2 sm:p-3 bg-slate-50/50 sm:max-h-[40vh] sm:overflow-y-auto sm:pr-2">
                  {phoneVariants.map((variant, index) => (
                    <div
                      key={variant.id}
                      className="flex flex-row items-start gap-2 sm:gap-3 p-3 bg-white rounded-lg border border-slate-200"
                    >
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* IMEI */}
                        <div>
                          <label
                            htmlFor={`inventory-imei-${variant.id}`}
                            className={labelClass}
                          >
                            IMEI {!isEditMode && `#${index + 1}`}
                          </label>
                          <input
                            id={`inventory-imei-${variant.id}`}
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            enterKeyHint="next"
                            onKeyDown={focusNextFieldOnEnter}
                            required
                            placeholder="15 digit IMEI"
                            value={variant.imei}
                            onChange={(e) =>
                              handleVariantChange(
                                variant.id,
                                "imei",
                                e.target.value,
                              )
                            }
                            className={inputClass}
                          />
                        </div>

                        {/* Warna */}
                        <div>
                          <label
                            htmlFor={`inventory-warna-${variant.id}`}
                            className={labelClass}
                          >
                            Warna
                          </label>
                          <input
                            id={`inventory-warna-${variant.id}`}
                            type="text"
                            autoComplete="off"
                            enterKeyHint={
                              index < phoneVariants.length - 1
                                ? "next"
                                : "done"
                            }
                            onKeyDown={
                              index < phoneVariants.length - 1
                                ? focusNextFieldOnEnter
                                : undefined
                            }
                            required
                            placeholder="contoh: Hitam"
                            value={variant.warna}
                            onChange={(e) =>
                              handleVariantChange(
                                variant.id,
                                "warna",
                                e.target.value,
                              )
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Remove button */}
                      {!isEditMode && phoneVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(variant.id)}
                          className="flex-shrink-0 mt-[26px] md:mt-6 flex h-11 w-11 md:h-9 md:w-9 items-center justify-center text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                          title="Hapus HP ini"
                          aria-label={`Hapus HP #${index + 1}`}
                        >
                          <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer - stays visible at the bottom */}
          <div className="grid grid-cols-2 gap-3 px-4 py-3 border-t bg-slate-50 flex-shrink-0 sm:flex sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 sm:min-h-0 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-sm font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-10 sm:min-h-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryFormModal;
