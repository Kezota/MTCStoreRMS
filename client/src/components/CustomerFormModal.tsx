import { useState, useEffect, useCallback, type FormEvent } from "react";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from "@/hooks/mutations/useCustomerMutations";
import type { Customer } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      <DialogContent className="max-w-md sm:max-w-lg max-h-[95vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b sticky top-0 bg-white z-10 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">
            {isEditMode ? "Edit Pelanggan" : "Tambah Pelanggan"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmitForm}
          className="flex flex-col h-full flex-1 overflow-hidden"
        >
          <div className="px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto flex-1">
            <div className="space-y-4 sm:space-y-6">
              {/* Nama */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama pelanggan"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Nomor HP */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Nomor HP (opsional)
                </label>
                <input
                  type="tel"
                  placeholder="Masukkan nomor HP (10-20 digit)"
                  value={form.nomorHP}
                  onChange={(e) =>
                    setForm({ ...form, nomorHP: e.target.value })
                  }
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
