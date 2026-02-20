import { z } from "zod";

// Create Penjualan Schema
export const createPenjualanSchema = z.preprocess(
  (input) => {
    if (input && typeof input === "object") {
      const data = input as Record<string, unknown>;
      return {
        tanggal: data.tanggal,
        inventoryId: data.inventoryId ?? data.inventory_id,
        customerId: data.customerId ?? data.customer_id,
        customerNama: data.customerNama ?? data.customer_nama,
        customerNomorHP: data.customerNomorHP ?? data.customer_nomor_hp,
        hargaJual: data.hargaJual ?? data.harga_jual,
        diskon: data.diskon,
        profit: data.profit,
        metodeBayar: data.metodeBayar ?? data.metode_bayar,
        keterangan: data.keterangan,
      };
    }
    return input;
  },
  z.object({
    tanggal: z
      .string()
      .min(1, "Tanggal is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal must be YYYY-MM-DD"),
    inventoryId: z
      .number()
      .int("Inventory ID must be an integer")
      .positive("Inventory ID must be positive"),
    customerId: z
      .number()
      .int("Customer ID must be an integer")
      .positive("Customer ID must be positive")
      .optional(),
    customerNama: z
      .string()
      .max(100, "Customer nama max 100 characters")
      .optional(),
    customerNomorHP: z
      .string()
      .max(20, "Customer nomor HP max 20 characters")
      .optional(),
    hargaJual: z.number().positive("Harga jual must be positive"),
    diskon: z
      .number()
      .nonnegative("Diskon cannot be negative")
      .optional()
      .nullable(),
    profit: z.number().optional(),
    metodeBayar: z
      .string()
      .min(1, "Metode bayar is required")
      .max(50, "Metode bayar max 50 characters"),
    keterangan: z.string().optional().nullable(),
  }),
);

// Update Penjualan Schema
export const updatePenjualanSchema = z.preprocess(
  (input) => {
    if (input && typeof input === "object") {
      const data = input as Record<string, unknown>;
      const hasKey = (key: string) =>
        Object.prototype.hasOwnProperty.call(data, key);
      const output: Record<string, unknown> = {};

      if (hasKey("tanggal")) output.tanggal = data.tanggal;
      if (hasKey("inventoryId") || hasKey("inventory_id")) {
        output.inventoryId = data.inventoryId ?? data.inventory_id;
      }
      if (hasKey("customerId") || hasKey("customer_id")) {
        output.customerId = data.customerId ?? data.customer_id;
      }
      if (hasKey("customerNama") || hasKey("customer_nama")) {
        output.customerNama = data.customerNama ?? data.customer_nama;
      }
      if (hasKey("customerNomorHP") || hasKey("customer_nomor_hp")) {
        output.customerNomorHP = data.customerNomorHP ?? data.customer_nomor_hp;
      }
      if (hasKey("hargaJual") || hasKey("harga_jual")) {
        output.hargaJual = data.hargaJual ?? data.harga_jual;
      }
      if (hasKey("diskon")) output.diskon = data.diskon;
      if (hasKey("profit")) output.profit = data.profit;
      if (hasKey("metodeBayar") || hasKey("metode_bayar")) {
        output.metodeBayar = data.metodeBayar ?? data.metode_bayar;
      }
      if (hasKey("keterangan")) output.keterangan = data.keterangan;

      return output;
    }

    return input;
  },
  z.object({
    tanggal: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal must be YYYY-MM-DD")
      .optional(),
    inventoryId: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => {
        if (typeof val === "string") return parseInt(val);
        return val;
      }),
    customerId: z
      .union([z.number(), z.string(), z.null()])
      .optional()
      .transform((val) => {
        if (val === null) return null;
        if (typeof val === "string") {
          const parsed = parseInt(val);
          return isNaN(parsed) ? undefined : parsed;
        }
        return val;
      }),
    customerNama: z
      .string()
      .max(100, "Customer nama max 100 characters")
      .optional(),
    customerNomorHP: z
      .string()
      .max(20, "Customer nomor HP max 20 characters")
      .optional(),
    hargaJual: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => {
        if (typeof val === "string") return parseFloat(val);
        return val;
      }),
    diskon: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((val) => {
        if (val === null || val === undefined) return null;
        if (typeof val === "string") return parseFloat(val);
        return val;
      }),
    profit: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => {
        if (typeof val === "string") return parseFloat(val);
        return val;
      }),
    metodeBayar: z
      .string()
      .max(50, "Metode bayar max 50 characters")
      .optional(),
    keterangan: z.string().optional().nullable(),
  }),
);

// Query Filters Schema
export const penjualanQuerySchema = z.object({
  // Filters
  inventoryId: z.string().optional(),
  metodeBayar: z.string().optional(),
  search: z.string().optional(), // Search by keterangan or metodeBayar
  imei: z.string().optional(), // Search by IMEI
  namaHP: z.string().optional(), // Search by Nama HP
  brand: z.string().optional(), // Filter by brand (comma-separated)
  warna: z.string().optional(), // Filter by warna
  tanggal: z.string().optional(), // Filter by exact date (YYYY-MM-DD)
  minHargaJual: z.string().optional(),
  maxHargaJual: z.string().optional(),
  minProfit: z.string().optional(),
  maxProfit: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),

  // Pagination
  page: z.string().optional().default("1"),
  limit: z.string().optional(),

  // Sorting
  sortBy: z.string().optional().default("tanggal"),
  sortOrder: z.string().optional().default("desc"),
});

export type CreatePenjualanInput = z.infer<typeof createPenjualanSchema>;
export type UpdatePenjualanInput = z.infer<typeof updatePenjualanSchema>;
export type PenjualanQueryInput = z.infer<typeof penjualanQuerySchema>;
