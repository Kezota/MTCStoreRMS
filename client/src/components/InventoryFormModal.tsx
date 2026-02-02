import { useState, useEffect, type FormEvent } from "react";
import { X } from "lucide-react";
import { brandsList } from "@/lib/constants";
import {
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
} from "@/hooks/mutations/useInventoryMutations";
import { useGetInventoryModalsByNamaHP } from "@/hooks/queries/useInventoryQueries";
import type { InventoryItem } from "@/lib/types";

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  item?: InventoryItem | null;
}

export const InventoryFormModal = ({
  isOpen,
  onClose,
  isEditMode,
  item,
}: InventoryFormModalProps) => {
  const [form, setForm] = useState({
    tanggalMasuk: "",
    imei: "",
    brand: "",
    namaHP: "",
    warna: "",
    modalAwal: "",
    cashback: "",
    modalFinal: "",
    status: "READY" as "READY" | "TERJUAL",
  });

  const createMutation = useCreateInventoryMutation();
  const updateMutation = useUpdateInventoryMutation();
  const { data: modalData } = useGetInventoryModalsByNamaHP(form.namaHP);
  const modalOptions = modalData?.data.modals ?? [];

  // Initialize form when modal opens or item changes
  useEffect(() => {
    if (isOpen && isEditMode && item) {
      setForm({
        tanggalMasuk: new Date(item.tanggalMasuk).toISOString().slice(0, 10),
        imei: item.imei,
        brand: item.brand,
        namaHP: item.namaHP,
        warna: item.warna || "",
        modalAwal: String(item.modalAwal ?? ""),
        cashback: item.cashback ? String(item.cashback) : "",
        modalFinal: String(item.modalFinal ?? ""),
        status: item.status,
      });
    } else if (isOpen && !isEditMode) {
      setForm({
        tanggalMasuk: "",
        imei: "",
        brand: "",
        namaHP: "",
        warna: "",
        modalAwal: "",
        cashback: "",
        modalFinal: "",
        status: "READY",
      });
    }
  }, [isOpen, isEditMode, item]);

  const handleSubmitForm = async (event: FormEvent) => {
    event.preventDefault();

    const basePayload = {
      tanggalMasuk: form.tanggalMasuk,
      imei: form.imei,
      brand: form.brand,
      namaHP: form.namaHP,
      warna: form.warna || undefined,
      modalAwal: parseFloat(form.modalAwal),
      cashback: form.cashback ? parseFloat(form.cashback) : undefined,
      modalFinal: form.modalFinal ? parseFloat(form.modalFinal) : 0,
    };

    if (isEditMode && item) {
      await updateMutation.mutateAsync({
        id: item.id,
        payload: {
          ...basePayload,
          status: form.status,
        },
      });
    } else {
      await createMutation.mutateAsync(basePayload);
    }

    onClose();
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between border-b p-4 sticky top-0 bg-white">
          <h2 className="text-lg font-bold">
            {isEditMode ? "Edit Inventory" : "Tambah Inventory"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitForm} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Tanggal Masuk */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal Masuk
              </label>
              <input
                type="date"
                required
                value={form.tanggalMasuk}
                onChange={(e) =>
                  setForm({ ...form, tanggalMasuk: e.target.value })
                }
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* IMEI */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                IMEI
              </label>
              <input
                type="text"
                required
                value={form.imei}
                onChange={(e) => setForm({ ...form, imei: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Brand
              </label>
              <select
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Brand --</option>
                {brandsList.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Nama HP */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama HP
              </label>
              <input
                type="text"
                required
                value={form.namaHP}
                onChange={(e) => setForm({ ...form, namaHP: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Warna */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Warna
              </label>
              <input
                type="text"
                value={form.warna}
                onChange={(e) => setForm({ ...form, warna: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Modal Awal - with combobox for suggestions */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Modal Awal
              </label>
              {modalOptions.length > 0 && (
                <select
                  value={form.modalAwal}
                  onChange={(e) => {
                    if (e.target.value !== "") {
                      setForm({ ...form, modalAwal: e.target.value });
                    } else {
                      setForm({ ...form, modalAwal: "" });
                    }
                  }}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
                >
                  <option value="">-- Pilih dari History --</option>
                  {modalOptions.map((modal) => (
                    <option key={modal} value={modal}>
                      Rp {parseFloat(modal).toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="number"
                required
                value={form.modalAwal}
                onChange={(e) =>
                  setForm({ ...form, modalAwal: e.target.value })
                }
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Atau input manual"
              />
            </div>

            {/* Cashback */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Cashback
              </label>
              <input
                type="number"
                value={form.cashback}
                onChange={(e) => setForm({ ...form, cashback: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Modal Final */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Modal Final
              </label>
              <input
                type="number"
                value={form.modalFinal}
                onChange={(e) =>
                  setForm({ ...form, modalFinal: e.target.value })
                }
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status - only on edit */}
            {isEditMode && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
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
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="READY">Ready</option>
                  <option value="TERJUAL">Terjual</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium disabled:opacity-50"
            >
              {isLoading ? "Loading..." : isEditMode ? "Update" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
