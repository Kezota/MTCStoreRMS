import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../utils/http/AppError";
import {
  createInventorySchema,
  updateInventorySchema,
  inventoryQuerySchema,
} from "../utils/validators/inventoryValidators";
import { z } from "zod";

const prisma = new PrismaClient();

/**
 * Get all inventory items with filters and pagination
 */
export const getAllInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate query parameters
    const queryValidation = inventoryQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      throw new AppError(
        queryValidation.error.issues.map((e) => e.message).join(", "),
        400,
      );
    }

    const {
      status,
      brand,
      search,
      imei,
      namaHP,
      warna,
      minModalAwal,
      maxModalAwal,
      minModalFinal,
      maxModalFinal,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = queryValidation.data;

    // Build filter object
    const where: any = {};

    // Status filter
    if (status) {
      where.status = status;
    }

    // Brand filter - support multiple brands (comma-separated)
    if (brand) {
      const brands = brand.split(",").map((b) => b.trim());
      if (brands.length > 1) {
        where.OR = (where.OR || []).concat(
          brands.map((b) => ({ brand: { contains: b } })),
        );
      } else {
        where.brand = { contains: brands[0] };
      }
    }

    // Color filter (single warna)
    if (warna) {
      where.warna = { contains: warna };
    }

    // IMEI filter (exact column search)
    if (imei) {
      where.imei = { contains: imei };
    }

    // Nama HP filter (exact column search)
    if (namaHP) {
      where.namaHP = { contains: namaHP };
    }

    // Search filter (IMEI, nama HP, or brand)
    if (search) {
      where.OR = (where.OR || []).concat([
        { imei: { contains: search } },
        { namaHP: { contains: search } },
        { brand: { contains: search } },
      ]);
    }

    // Price range filters
    if (minModalAwal || maxModalAwal) {
      where.modalAwal = {};
      if (minModalAwal) where.modalAwal.gte = parseFloat(minModalAwal);
      if (maxModalAwal) where.modalAwal.lte = parseFloat(maxModalAwal);
    }

    if (minModalFinal || maxModalFinal) {
      where.modalFinal = {};
      if (minModalFinal) where.modalFinal.gte = parseFloat(minModalFinal);
      if (maxModalFinal) where.modalFinal.lte = parseFloat(maxModalFinal);
    }

    // Date range filter
    if (startDate || endDate) {
      where.tanggalMasuk = {};
      if (startDate) where.tanggalMasuk.gte = new Date(startDate);
      if (endDate) where.tanggalMasuk.lte = new Date(endDate);
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = limit ? parseInt(limit) : undefined;
    const skip = limitNum ? (pageNum - 1) * limitNum : undefined;

    // Sorting - support multiple fields
    const allowedSortFields = [
      "id",
      "tanggalMasuk",
      "imei",
      "brand",
      "namaHP",
      "warna",
      "modalAwal",
      "cashback",
      "modalFinal",
      "status",
      "createdAt",
    ];

    const sortByFields = sortBy.split(",").map((f) => f.trim());
    const sortOrderValues = sortOrder.split(",").map((o) => o.trim());

    // Build orderBy array
    const orderBy: any[] = sortByFields.map((field, index) => {
      // Validate field
      if (!allowedSortFields.includes(field)) {
        throw new AppError(`Invalid sort field: ${field}`, 400);
      }

      const order = sortOrderValues[index] || sortOrderValues[0] || "desc";

      // Validate order
      if (order !== "asc" && order !== "desc") {
        throw new AppError(`Invalid sort order: ${order}`, 400);
      }

      return { [field]: order };
    });

    // Get total count for pagination
    const totalCount = await prisma.inventoryHP.count({ where });

    // Get inventory with filters and pagination
    const inventory = await prisma.inventoryHP.findMany({
      where,
      ...(skip !== undefined && { skip }),
      ...(limitNum !== undefined && { take: limitNum }),
      orderBy,
      include: {
        penjualan: true,
      },
    });

    res.json({
      status: "success",
      results: inventory.length,
      pagination: {
        page: pageNum,
        limit: limitNum || totalCount,
        total: totalCount,
        totalPages: limitNum ? Math.ceil(totalCount / limitNum) : 1,
      },
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get modalAwal list by namaHP
 */
export const getInventoryModalsByNamaHP = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const schema = z.object({ namaHP: z.string().min(1) });
    const validation = schema.safeParse(req.query);

    if (!validation.success) {
      throw new AppError(
        validation.error.issues.map((e) => e.message).join(", "),
        400,
      );
    }

    const { namaHP } = validation.data;

    const items = await prisma.inventoryHP.findMany({
      where: {
        namaHP: { contains: namaHP },
      },
      select: {
        modalAwal: true,
      },
      orderBy: {
        modalAwal: "asc",
      },
    });

    const modals = Array.from(
      new Set(items.map((item) => String(item.modalAwal))),
    );

    res.json({
      status: "success",
      results: modals.length,
      data: {
        namaHP,
        modals,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unique nama HP filtered by brand
 */
export const getNamaHPByBrand = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { brand } = req.query;

    if (!brand || typeof brand !== "string") {
      throw new AppError("Brand parameter is required", 400);
    }

    const namaHPList = await prisma.inventoryHP.findMany({
      where: {
        brand: {
          contains: brand,
        },
      },
      select: {
        namaHP: true,
      },
      distinct: ["namaHP"],
      orderBy: {
        namaHP: "asc",
      },
    });

    const namaHPs = namaHPList.map((item) => item.namaHP);

    res.json({
      status: "success",
      results: namaHPs.length,
      data: {
        brand,
        namaHPs,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single inventory item by ID
 */
export const getInventoryById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const inventory = await prisma.inventoryHP.findUnique({
      where: { id: parseInt(id) },
      include: {
        penjualan: true,
      },
    });

    if (!inventory) {
      throw new AppError("Inventory item not found", 404);
    }

    res.json({
      status: "success",
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new inventory item
 */
export const createInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate request body
    const validation = createInventorySchema.safeParse(req.body);

    if (!validation.success) {
      throw new AppError(
        validation.error.issues.map((e) => e.message).join(", "),
        400,
      );
    }

    const {
      tanggalMasuk,
      imei,
      brand,
      namaHP,
      warna,
      modalAwal,
      cashback,
      modalFinal,
    } = validation.data;

    // Check if IMEI already exists
    const existingInventory = await prisma.inventoryHP.findUnique({
      where: { imei },
    });

    if (existingInventory) {
      throw new AppError("IMEI already exists in inventory", 400);
    }

    // Sync modalAwal and modalFinal to be the same
    const modalValue = modalFinal && modalFinal !== 0 ? modalFinal : modalAwal;

    const inventory = await prisma.inventoryHP.create({
      data: {
        tanggalMasuk: new Date(tanggalMasuk),
        imei,
        brand,
        namaHP,
        warna: warna || null,
        modalAwal: modalValue,
        cashback: cashback || null,
        modalFinal: modalValue,
      },
    });

    res.status(201).json({
      status: "success",
      message: "Inventory item created successfully",
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update inventory item
 */
export const updateInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validation = updateInventorySchema.safeParse(req.body);

    if (!validation.success) {
      throw new AppError(
        validation.error.issues.map((e) => e.message).join(", "),
        400,
      );
    }

    const {
      tanggalMasuk,
      imei,
      brand,
      namaHP,
      warna,
      modalAwal,
      cashback,
      modalFinal,
      status,
    } = validation.data;

    // Check if inventory exists
    const existingInventory = await prisma.inventoryHP.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingInventory) {
      throw new AppError("Inventory item not found", 404);
    }

    // If updating IMEI, check if new IMEI already exists
    if (imei && imei !== existingInventory.imei) {
      const duplicateIMEI = await prisma.inventoryHP.findUnique({
        where: { imei },
      });

      if (duplicateIMEI) {
        throw new AppError("IMEI already exists in inventory", 400);
      }
    }

    // Build update data - only include fields that are actually provided
    const updateData: any = {};

    if (tanggalMasuk) updateData.tanggalMasuk = new Date(tanggalMasuk);
    if (imei) updateData.imei = imei;
    if (brand) updateData.brand = brand;
    if (namaHP) updateData.namaHP = namaHP;
    if (warna !== undefined && warna !== null) updateData.warna = warna;

    // Sync modalAwal and modalFinal - always keep them the same
    if (modalFinal !== undefined) {
      updateData.modalAwal = modalFinal;
      updateData.modalFinal = modalFinal;
    } else if (modalAwal !== undefined && modalAwal !== null) {
      updateData.modalAwal = modalAwal;
      updateData.modalFinal = modalAwal;
    }

    if (cashback !== undefined && cashback !== null)
      updateData.cashback = cashback;
    if (status) updateData.status = status;

    // Update inventory and recalculate penjualan profit if modalAwal or modalFinal changed
    const inventory = await prisma.$transaction(async (tx) => {
      // Update inventory
      const updatedInventory = await tx.inventoryHP.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      // If modalAwal or modalFinal changed, update profit for related penjualan
      if (
        (modalAwal !== undefined && modalAwal !== null) ||
        (modalFinal !== undefined && modalFinal !== null)
      ) {
        // Find all penjualan for this inventory
        const penjualanList = await tx.penjualan.findMany({
          where: { inventoryId: parseInt(id) },
        });

        // Recalculate profit for each penjualan
        for (const penjualan of penjualanList) {
          let newModalBase =
            modalFinal !== undefined && modalFinal !== null
              ? parseFloat(String(modalFinal))
              : parseFloat(String(updatedInventory.modalAwal));

          if (!newModalBase || newModalBase === 0) {
            newModalBase = parseFloat(String(updatedInventory.modalAwal));
          }

          const newProfit =
            parseFloat(String(penjualan.hargaJual)) -
            (penjualan.diskon ? parseFloat(String(penjualan.diskon)) : 0) -
            newModalBase;

          await tx.penjualan.update({
            where: { id: penjualan.id },
            data: { profit: newProfit },
          });
        }
      }

      return updatedInventory;
    });

    res.json({
      status: "success",
      message: "Inventory item updated successfully",
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create multiple inventory items at once (bulk create)
 */
export const createBulkInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError("Items array is required and must not be empty", 400);
    }

    // Validate all items
    const validatedItems = items.map((item, index) => {
      const validation = createInventorySchema.safeParse(item);
      if (!validation.success) {
        throw new AppError(
          `Item ${index + 1}: ${validation.error.issues.map((e) => e.message).join(", ")}`,
          400,
        );
      }
      return validation.data;
    });

    // Check for duplicate IMEIs in the batch
    const imeis = validatedItems.map((item) => item.imei);
    const uniqueImeis = new Set(imeis);
    if (uniqueImeis.size !== imeis.length) {
      throw new AppError("Duplicate IMEIs found in the batch", 400);
    }

    // Check if any IMEI already exists in database
    const existingInventory = await prisma.inventoryHP.findMany({
      where: {
        imei: {
          in: imeis,
        },
      },
    });

    if (existingInventory.length > 0) {
      const existingImeis = existingInventory
        .map((item) => item.imei)
        .join(", ");
      throw new AppError(
        `The following IMEIs already exist: ${existingImeis}`,
        400,
      );
    }

    // Create all items
    const createdItems = await prisma.$transaction(
      validatedItems.map((item) => {
        const modalValue =
          item.modalFinal && item.modalFinal !== 0
            ? item.modalFinal
            : item.modalAwal;

        return prisma.inventoryHP.create({
          data: {
            tanggalMasuk: new Date(item.tanggalMasuk),
            imei: item.imei,
            brand: item.brand,
            namaHP: item.namaHP,
            warna: item.warna || null,
            modalAwal: modalValue,
            cashback: item.cashback || null,
            modalFinal: modalValue,
          },
        });
      }),
    );

    res.status(201).json({
      status: "success",
      message: `${createdItems.length} inventory items created successfully`,
      data: createdItems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete inventory item
 */
export const deleteInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // Check if inventory exists
    const existingInventory = await prisma.inventoryHP.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingInventory) {
      throw new AppError("Inventory item not found", 404);
    }

    await prisma.inventoryHP.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      status: "success",
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
