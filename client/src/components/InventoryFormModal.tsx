import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type FormEvent,
} from "react";
import { Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
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
import { getBrandColor, cn } from "@/lib/utils";

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

interface FormData {
  tanggalMasuk: string;
  brand: string;
  namaHP: string;
  modalAwal: string;
  cashback: string;
  modalFinal: string;
  status: "READY" | "TERJUAL";
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
    status: "READY" as "READY" | "TERJUAL",
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
          status: "READY" as "READY" | "TERJUAL",
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
        // ModalFinal cleared or set to 0 -> cashback = modalAwal
        setForm((prev) => ({
          ...prev,
          cashback: String(modalAwalNum),
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

      const baseData = {
        tanggalMasuk: form.tanggalMasuk,
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
      <DialogContent className="max-w-2xl sm:max-w-4xl max-h-[95vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b sticky top-0 bg-white z-10 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">
            {isEditMode ? "Edit Inventory" : "Tambah Inventory"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmitForm}
          className="flex flex-col h-full flex-1 overflow-hidden"
        >
          <div className="px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto flex-1">
            <div className="space-y-4 sm:space-y-6">
              {/* Common Fields */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Tanggal Masuk */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Tanggal Masuk
                  </label>
                  <input
                    type="date"
                    required
                    placeholder="Pilih tanggal"
                    value={form.tanggalMasuk}
                    onChange={(e) =>
                      setForm({ ...form, tanggalMasuk: e.target.value })
                    }
                    className="w-full px-2 sm:px-3 py-1 sm:py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Brand
                  </label>
                  <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between",
                          !form.brand && "text-slate-500",
                        )}
                      >
                        <span className="truncate">
                          {form.brand || "Pilih atau ketik brand..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    {brandOpen && (
                      <PopoverContent
                        side="bottom"
                        className="w-[--radix-popover-trigger-width] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput
                            placeholder="Cari atau ketik brand baru..."
                            value={form.brand}
                            onValueChange={(value) =>
                              setForm({ ...form, brand: value })
                            }
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="py-2 px-3 text-xs sm:text-sm">
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
                                  className="flex items-center justify-between"
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
                                      "h-3 w-3 sm:h-4 sm:w-4",
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
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Nama HP
                  </label>
                  <Popover open={namaHPOpen} onOpenChange={setNamaHPOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between",
                          !form.namaHP && "text-slate-500",
                        )}
                      >
                        <span className="truncate">
                          {form.namaHP || "Pilih atau ketik nama HP..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    {namaHPOpen && (
                      <PopoverContent
                        side="bottom"
                        className="w-[--radix-popover-trigger-width] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput
                            placeholder="Cari atau ketik nama HP..."
                            value={form.namaHP}
                            onValueChange={(value) =>
                              setForm({ ...form, namaHP: value })
                            }
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="py-2 px-3 text-xs sm:text-sm">
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
                                    className="flex items-center justify-between"
                                  >
                                    <span className="truncate">{hp}</span>
                                    <Check
                                      className={cn(
                                        "h-3 w-3 sm:h-4 sm:w-4 shrink-0",
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
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Modal Awal
                  </label>
                  {modalOptions.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          setForm({ ...form, modalAwal: e.target.value });
                        }
                      }}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1.5"
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
                    <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs sm:text-sm pointer-events-none">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      value={formatToRupiah(form.modalAwal)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          modalAwal: parseFromRupiah(e.target.value),
                        })
                      }
                      placeholder="0"
                      className="w-full pl-7 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Cashback */}
                <div className="sm:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Cashback (Opsional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs sm:text-sm pointer-events-none">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={formatToRupiah(form.cashback)}
                      onChange={(e) => {
                        setLastEditedField("cashback");
                        setForm({
                          ...form,
                          cashback: parseFromRupiah(e.target.value),
                        });
                      }}
                      placeholder="0"
                      className="w-full pl-7 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Modal Final */}
                <div className="sm:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Modal Final (Opsional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs sm:text-sm pointer-events-none">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={formatToRupiah(form.modalFinal)}
                      onChange={(e) => {
                        setLastEditedField("modalFinal");
                        setForm({
                          ...form,
                          modalFinal: parseFromRupiah(e.target.value),
                        });
                      }}
                      placeholder="0"
                      className="w-full pl-7 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Status - only on edit */}
                {isEditMode && (
                  <div className="sm:col-span-1">
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          status: e.target.value as "READY" | "TERJUAL",
                        })
                      }
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="READY">Ready</option>
                      <option value="TERJUAL">Terjual</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Phone Variants Section */}
              <div className="border-t pt-3 sm:pt-4">
                <div className="flex flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-900">
                    {isEditMode ? "IMEI & Warna" : "Daftar HP (IMEI & Warna)"}
                  </label>
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 whitespace-nowrap"
                    >
                      <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Tambah HP
                    </button>
                  )}
                </div>

                <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-2 sm:space-y-3 border rounded-lg p-2 sm:p-3 bg-slate-50/50">
                  {phoneVariants.map((variant, index) => (
                    <div
                      key={variant.id}
                      className="flex flex-row items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-slate-200"
                    >
                      <div className="flex-1 w-full grid grid-cols-2 gap-2 sm:gap-3">
                        {/* IMEI */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-0.5 sm:mb-1">
                            IMEI {!isEditMode && `#${index + 1}`}
                          </label>
                          <input
                            type="text"
                            required
                            value={variant.imei}
                            onChange={(e) =>
                              handleVariantChange(
                                variant.id,
                                "imei",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Warna */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-0.5 sm:mb-1">
                            Warna
                          </label>
                          <input
                            type="text"
                            required
                            value={variant.warna}
                            onChange={(e) =>
                              handleVariantChange(
                                variant.id,
                                "warna",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Remove button */}
                      {!isEditMode && phoneVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(variant.id)}
                          className="flex-shrink-0 p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded transition-colors mt-0"
                          title="Hapus HP ini"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                  ))}
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

export default InventoryFormModal;
