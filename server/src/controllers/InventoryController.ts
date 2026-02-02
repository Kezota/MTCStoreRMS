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

    // Brand filter
    if (brand) {
      where.brand = { contains: brand };
    }

    // Color filter
    if (warna) {
      where.warna = { contains: warna };
    }

    // Search filter (IMEI, nama HP, or brand)
    if (search) {
      where.OR = [
        { imei: { contains: search } },
        { namaHP: { contains: search } },
        { brand: { contains: search } },
      ];
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
