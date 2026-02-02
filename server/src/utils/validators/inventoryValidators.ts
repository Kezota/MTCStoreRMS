import { z } from "zod";

// Create Inventory Schema
export const createInventorySchema = z.preprocess(
  (input) => {
    if (input && typeof input === "object") {
      const data = input as Record<string, unknown>;
      return {
        tanggalMasuk: data.tanggalMasuk ?? data.tanggal_masuk,
        imei: data.imei,
        brand: data.brand,
        namaHP: data.namaHP ?? data.nama_hp,
        warna: data.warna,
        modalAwal: data.modalAwal ?? data.modal_awal,
        cashback: data.cashback,
        modalFinal: data.modalFinal ?? data.modal_final,
      };
    }
    return input;
  },
  z.object({
    tanggalMasuk: z
      .string()
      .min(1, "Tanggal masuk is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal masuk must be YYYY-MM-DD"),
    imei: z
      .string()
      .min(1, "IMEI is required")
      .max(20, "IMEI max 20 characters"),
    brand: z
      .string()
      .min(1, "Brand is required")
      .max(50, "Brand max 50 characters"),
    namaHP: z
      .string()
      .min(1, "Nama HP is required")
      .max(100, "Nama HP max 100 characters"),
    warna: z.string().max(50, "Warna max 50 characters").optional().nullable(),
    modalAwal: z.number().positive("Modal awal harus diisi dan harus positif"),
    cashback: z
      .number()
      .nonnegative("Cashback cannot be negative")
      .optional()
      .nullable(),
    modalFinal: z.number().positive("Modal final must be positive").optional(),
  }),
);

// Update Inventory Schema
export const updateInventorySchema = z.preprocess(
  (input) => {
    if (input && typeof input === "object") {
      const data = input as Record<string, unknown>;
      const hasKey = (key: string) =>
        Object.prototype.hasOwnProperty.call(data, key);
      const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);
      const output: Record<string, unknown> = {};

      if (hasKey("tanggalMasuk") || hasKey("tanggal_masuk")) {
        output.tanggalMasuk = emptyToUndefined(
          data.tanggalMasuk ?? data.tanggal_masuk,
        );
      }

      if (hasKey("imei")) output.imei = emptyToUndefined(data.imei);
      if (hasKey("brand")) output.brand = emptyToUndefined(data.brand);

      if (hasKey("namaHP") || hasKey("nama_hp")) {
        output.namaHP = emptyToUndefined(data.namaHP ?? data.nama_hp);
      }

      if (hasKey("warna")) output.warna = emptyToUndefined(data.warna);

      if (hasKey("modalAwal") || hasKey("modal_awal")) {
        output.modalAwal = emptyToUndefined(data.modalAwal ?? data.modal_awal);
      }

      if (hasKey("cashback")) output.cashback = emptyToUndefined(data.cashback);

      if (hasKey("modalFinal") || hasKey("modal_final")) {
        output.modalFinal = emptyToUndefined(
          data.modalFinal ?? data.modal_final,
        );
      }

      if (hasKey("status")) output.status = emptyToUndefined(data.status);

      return output;
    }

    return input;
  },
  z.object({
    tanggalMasuk: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal masuk must be YYYY-MM-DD")
      .optional(),
    imei: z.string().max(20, "IMEI max 20 characters").optional(),
    brand: z.string().max(50, "Brand max 50 characters").optional(),
    namaHP: z.string().max(100, "Nama HP max 100 characters").optional(),
    warna: z.string().max(50, "Warna max 50 characters").optional().nullable(),
    modalAwal: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => {
        if (typeof val === "string") return parseFloat(val);
        return val;
      }),
    cashback: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((val) => {
        if (val === null || val === undefined) return null;
        if (typeof val === "string") return parseFloat(val);
        return val;
      }),
    modalFinal: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => {
        if (typeof val === "string") return parseFloat(val);
        return val;
      }),
    status: z.enum(["READY", "TERJUAL"]).optional(),
  }),
);

// Query Filters Schema
export const inventoryQuerySchema = z.object({
  // Filters
  status: z.enum(["READY", "TERJUAL"]).optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  warna: z.string().optional(),
  minModalAwal: z.string().optional(),
  maxModalAwal: z.string().optional(),
  minModalFinal: z.string().optional(),
  maxModalFinal: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),

  // Pagination
  page: z.string().optional().default("1"),
  limit: z.string().optional(),

  // Sorting (supports multiple fields separated by comma)
  // Example: sortBy=tanggalMasuk,modalFinal&sortOrder=desc,asc
  sortBy: z.string().optional().default("tanggalMasuk"),
  sortOrder: z.string().optional().default("desc"),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>;
