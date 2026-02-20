import { z } from "zod";

// Create Customer Schema
export const createCustomerSchema = z.object({
  nama: z.string().min(1, "Nama is required").max(100, "Nama max 100 chars"),
  nomorHP: z
    .string()
    .min(10, "Nomor HP harus minimal 10 digit")
    .max(20, "Nomor HP max 20 digit")
    .optional()
    .or(z.literal("")),
});

// Update Customer Schema
export const updateCustomerSchema = z.object({
  nama: z
    .string()
    .min(1, "Nama is required")
    .max(100, "Nama max 100 chars")
    .optional(),
  nomorHP: z
    .string()
    .min(10, "Nomor HP harus minimal 10 digit")
    .max(20, "Nomor HP max 20 digit")
    .optional()
    .or(z.literal("")),
});

// Query Filters Schema
export const customerQuerySchema = z.object({
  // Filters
  search: z.string().optional(),
  nomorHP: z.string().optional(),

  // Pagination
  page: z.string().optional().default("1"),
  limit: z.string().optional(),

  // Sorting
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Customer Purchases Query Schema
export const customerPurchasesQuerySchema = z.object({
  // Filters
  search: z.string().optional(),
  nomorHP: z.string().optional(),
  namaHP: z.string().optional(),
  imei: z.string().optional(),
  brand: z.string().optional(),

  // Pagination
  page: z.string().optional().default("1"),
  limit: z.string().optional(),

  // Sorting
  sortBy: z.string().optional().default("tanggal"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
export type CustomerPurchasesQueryInput = z.infer<
  typeof customerPurchasesQuerySchema
>;
