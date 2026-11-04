import {
  useState,
  useEffect,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { X } from "lucide-react";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from "@/hooks/mutations/useCustomerMutations";
import type { Customer } from "@/lib/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const labelClass = "block text-xs sm:text-sm font-medium text-slate-700 mb-1";
const inputClass =
  "w-full min-h-10 md:min-h-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

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

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  item?: Customer | null;
}

interface FormData {
  nama: string;
  nomorHP: string;
}

export const CustomerFormModal = ({
  isOpen,
  onClose,
  isEditMode,
  item,
}: CustomerFormModalProps) => {
  const [form, setForm] = useState<FormData>({
    nama: "",
    nomorHP: "",
  });

  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();

  // Initialize form when opening create mode
  useEffect(() => {
    if (isOpen && !isEditMode) {
      setForm({
        nama: "",
        nomorHP: "",
      });
    }
  }, [isOpen, isEditMode]);

  // Initialize form when editing
  useEffect(() => {
    if (isOpen && isEditMode && item) {
      setForm({
        nama: item.nama,
        nomorHP: item.nomorHP || "",
      });
    }
  }, [isOpen, isEditMode, item]);

  const handleSubmitForm = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (!form.nama.trim()) {
        alert("Nama harus diisi");
        return;
      }

      const baseData = {
        nama: form.nama.trim(),
        nomorHP: form.nomorHP.trim() || undefined,
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
          nama: "",
          nomorHP: "",
        });
        onClose();
      } catch (error) {
        console.error("Error submitting form:", error);
      }
    },
    [form, isEditMode, item, createMutation, updateMutation, onClose],
  );

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-[calc(100%-1.5rem)] max-h-[85dvh] sm:max-h-[90vh] flex-col gap-0 overflow-hidden rounded-xl border p-0 max-w-lg sm:max-w-lg [&>button:last-child]:hidden">
        <DialogHeader className="flex-row items-center justify-between gap-2 space-y-0 px-4 sm:px-6 py-2 sm:py-3 border-b bg-white text-left flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg">
            {isEditMode ? "Edit Pelanggan" : "Tambah Pelanggan"}
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
              {/* Nama */}
              <div>
                <label htmlFor="customer-nama" className={labelClass}>
                  Nama
                </label>
                <input
                  id="customer-nama"
                  type="text"
                  required
                  autoComplete="off"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  onKeyDown={focusNextFieldOnEnter}
                  placeholder="Masukkan nama pelanggan"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className={inputClass}
                />
              </div>

              {/* Nomor HP */}
              <div>
                <label htmlFor="customer-nomor-hp" className={labelClass}>
                  Nomor HP (opsional)
                </label>
                <input
                  id="customer-nomor-hp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  enterKeyHint="done"
                  placeholder="Masukkan nomor HP (10-20 digit)"
                  value={form.nomorHP}
                  onChange={(e) =>
                    setForm({ ...form, nomorHP: e.target.value })
                  }
                  className={inputClass}
                />
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
