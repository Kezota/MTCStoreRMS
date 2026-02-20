import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../utils/http/AppError";
import {
  createPenjualanSchema,
  updatePenjualanSchema,
  penjualanQuerySchema,
} from "../utils/validators/penjualanValidators";

const prisma = new PrismaClient();

/**
 * Get all penjualan with filters and pagination
 */
export const getAllPenjualan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate query parameters
    const queryValidation = penjualanQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      throw new AppError(
        queryValidation.error.issues.map((e) => e.message).join(", "),
        400,
      );
    }

    const {
      inventoryId,
      metodeBayar,
      search,
      imei,
      namaHP,
      brand,
      warna,
      tanggal,
      minHargaJual,
      maxHargaJual,
      minProfit,
      maxProfit,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = queryValidation.data;

    // Build filter object
    const where: any = {};

    // Inventory ID filter
    if (inventoryId) {
      where.inventoryId = parseInt(inventoryId);
    }

    // Search by IMEI
    if (imei) {
      where.inventory = {
        imei: { contains: imei },
      };
    }

    // Search by Nama HP
    if (namaHP) {
      where.inventory = {
        namaHP: { contains: namaHP },
      };
    }

    // Filter by brand
    if (brand) {
      const brands = brand.split(",").map((b) => b.trim());
      const mainBrands = [
        "OPPO",
        "VIVO",
        "XIAOMI",
        "SAMSUNG",
        "APPLE",
        "REALME",
        "INFINIX",
        "ITEL",
        "NOKIA",
        "ADVAN",
        "TECNO",
      ];

      // Check if OTHERS is in the filter
      const hasOthers = brands.includes("OTHERS");
      const specificBrands = brands.filter((b) => b !== "OTHERS");

      if (hasOthers && specificBrands.length === 0) {
        // Only OTHERS is selected - exclude main brands
        where.inventory = {
          ...where.inventory,
          brand: { notIn: mainBrands },
        };
      } else if (hasOthers && specificBrands.length > 0) {
        // OTHERS + specific brands are selected
        where.inventory = {
          ...where.inventory,
          OR: [
            { brand: { in: specificBrands } },
            { brand: { notIn: mainBrands } },
          ],
        };
      } else {
        // Only specific brands selected
        where.inventory = {
          ...where.inventory,
          brand: { in: brands },
        };
      }
    }

    // Filter by warna
    if (warna) {
      where.inventory = {
        ...where.inventory,
        warna: { contains: warna },
      };
    }

    // Metode bayar filter
    if (metodeBayar) {
      where.metodeBayar = { contains: metodeBayar };
    }

    // Search filter (keterangan or metodeBayar)
    if (search) {
      where.OR = [
        { keterangan: { contains: search } },
        { metodeBayar: { contains: search } },
      ];
    }

    // Price range filters
    if (minHargaJual || maxHargaJual) {
      where.hargaJual = {};
      if (minHargaJual) where.hargaJual.gte = parseFloat(minHargaJual);
      if (maxHargaJual) where.hargaJual.lte = parseFloat(maxHargaJual);
    }

    // Profit range filters
    if (minProfit || maxProfit) {
      where.profit = {};
      if (minProfit) where.profit.gte = parseFloat(minProfit);
      if (maxProfit) where.profit.lte = parseFloat(maxProfit);
    }

    // Date range filter
    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) where.tanggal.gte = new Date(startDate);
      if (endDate) where.tanggal.lte = new Date(endDate);
    }

    // Single date filter (exact date)
    if (tanggal) {
      const dateStart = new Date(tanggal);
      const dateEnd = new Date(tanggal);
      dateEnd.setHours(23, 59, 59, 999);
      where.tanggal = { gte: dateStart, lte: dateEnd };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = limit ? parseInt(limit) : undefined;
    const skip = limitNum ? (pageNum - 1) * limitNum : undefined;

    // Sorting
    const allowedSortFields = [
      "id",
      "tanggal",
      "inventoryId",
      "hargaJual",
      "diskon",
      "profit",
      "metodeBayar",
      "createdAt",
      "brand",
      "imei",
      "namaHP",
      "warna",
      "modalFinal",
    ];

    const sortByFields = sortBy.split(",").map((f) => f.trim());
    const sortOrderValues = sortOrder.split(",").map((o) => o.trim());

    // Build orderBy array - handle nested inventory fields
    const orderBy: any[] = sortByFields.map((field, index) => {
      if (!allowedSortFields.includes(field)) {
        throw new AppError(`Invalid sort field: ${field}`, 400);
      }

      const order = sortOrderValues[index] || sortOrderValues[0] || "desc";

      if (order !== "asc" && order !== "desc") {
        throw new AppError(`Invalid sort order: ${order}`, 400);
      }

      // Handle inventory relation fields
      if (["brand", "imei", "namaHP", "warna", "modalFinal"].includes(field)) {
        return { inventory: { [field]: order } };
      }

      return { [field]: order };
    });

    // Get total count for pagination
    const totalCount = await prisma.penjualan.count({ where });

    // Get penjualan with filters and pagination
    const penjualan = await prisma.penjualan.findMany({
      where,
      ...(skip !== undefined && { skip }),
      ...(limitNum !== undefined && { take: limitNum }),
      orderBy,
      include: {
        inventory: true,
        customer: true,
        user: {
          select: {
            id: true,
            username: true,
            nama: true,
            role: true,
          },
        },
      },
    });

    res.json({
      status: "success",
      results: penjualan.length,
      pagination: {
        page: pageNum,
        limit: limitNum || totalCount,
        total: totalCount,
        totalPages: limitNum ? Math.ceil(totalCount / limitNum) : 1,
      },
      data: penjualan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single penjualan by ID
 */
export const getPenjualanById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const penjualan = await prisma.penjualan.findUnique({
      where: { id: parseInt(id) },
      include: {
        inventory: true,
        customer: true,
        user: {
          select: {
            id: true,
            username: true,
            nama: true,
            role: true,
          },
        },
      },
    });

    if (!penjualan) {
      throw new AppError("Penjualan not found", 404);
    }

    res.json({
      status: "success",
      data: penjualan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new penjualan
 */
export const createPenjualan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get user ID from authenticated user
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    // Validate request body
    const validation = createPenjualanSchema.safeParse(req.body);

    if (!validation.success) {
      throw new AppError(
        validation.error.issues.map((e) => e.message).join(", "),
        400,
      );
    }

    const {
      tanggal,
      inventoryId,
      customerId,
      customerNama,
      customerNomorHP,
      hargaJual,
      diskon,
      profit,
      metodeBayar,
      keterangan,
    } = validation.data;

    // Check if inventory exists
    const inventory = await prisma.inventoryHP.findUnique({
      where: { id: inventoryId },
    });

    if (!inventory) {
      throw new AppError("Inventory item not found", 404);
    }

    // Check if inventory is already sold
    if (inventory.status === "TERJUAL") {
      throw new AppError("Inventory item is already sold", 400);
    }

    // Calculate profit: hargaJual - diskon - (modalFinal or modalAwal if modalFinal is 0)
    let modalBase = parseFloat(String(inventory.modalFinal));
    if (!modalBase || modalBase === 0) {
      modalBase = parseFloat(String(inventory.modalAwal));
    }

    const finalDiskon = diskon ? parseFloat(String(diskon)) : 0;
    const calculatedProfit = hargaJual - finalDiskon - modalBase;

    let resolvedCustomerId: number | null = null;

    if (customerId) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!existingCustomer) {
        throw new AppError("Customer not found", 404);
      }

      resolvedCustomerId = existingCustomer.id;
    } else if (customerNama && customerNomorHP) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { nomorHP: customerNomorHP },
      });

      if (existingCustomer) {
        resolvedCustomerId = existingCustomer.id;
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            nama: customerNama,
            nomorHP: customerNomorHP,
          },
        });
        resolvedCustomerId = newCustomer.id;
      }
    }

    // Create penjualan and update inventory status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create penjualan record
      const penjualan = await tx.penjualan.create({
        data: {
          tanggal: new Date(tanggal),
          inventoryId,
          customerId: resolvedCustomerId,
          userId,
          hargaJual,
          diskon: diskon || null,
          profit: calculatedProfit,
          metodeBayar,
          keterangan: keterangan || null,
        },
        include: {
          inventory: true,
          user: {
            select: {
              id: true,
              username: true,
              nama: true,
              role: true,
            },
          },
        },
      });

      // Update inventory status to TERJUAL
      await tx.inventoryHP.update({
        where: { id: inventoryId },
        data: { status: "TERJUAL" },
      });

      return penjualan;
    });

    res.status(201).json({
      status: "success",
      message: "Penjualan created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update penjualan
 */
export const updatePenjualan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validation = updatePenjualanSchema.safeParse(req.body);

    if (!validation.success) {
      throw new AppError(
        validation.error.issues.map((e) => e.message).join(", "),
        400,
      );
    }

    const {
      tanggal,
      inventoryId,
      customerId,
      customerNama,
      customerNomorHP,
      hargaJual,
      diskon,
      metodeBayar,
      keterangan,
    } = validation.data;

    // Check if penjualan exists
    const existingPenjualan = await prisma.penjualan.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPenjualan) {
      throw new AppError("Penjualan not found", 404);
    }

    // If updating inventoryId, check if new inventory exists
    if (inventoryId && inventoryId !== existingPenjualan.inventoryId) {
      const inventory = await prisma.inventoryHP.findUnique({
        where: { id: inventoryId },
      });

      if (!inventory) {
        throw new AppError("Inventory item not found", 404);
      }

      if (
        inventory.status === "TERJUAL" &&
        inventory.id !== existingPenjualan.inventoryId
      ) {
        throw new AppError("New inventory item is already sold", 400);
      }
    }

    // Build update data - only include fields that are provided
    const updateData: any = {};

    if (tanggal) updateData.tanggal = new Date(tanggal);
    if (metodeBayar) updateData.metodeBayar = metodeBayar;
    if (keterangan !== undefined) updateData.keterangan = keterangan;

    if (customerNama && customerNomorHP) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { nomorHP: customerNomorHP },
      });

      if (existingCustomer) {
        updateData.customerId = existingCustomer.id;
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            nama: customerNama,
            nomorHP: customerNomorHP,
          },
        });
        updateData.customerId = newCustomer.id;
      }
    } else if (customerId !== undefined) {
      if (customerId === null) {
        updateData.customerId = null;
      } else {
        const existingCustomer = await prisma.customer.findUnique({
          where: { id: customerId },
        });

        if (!existingCustomer) {
          throw new AppError("Customer not found", 404);
        }

        updateData.customerId = existingCustomer.id;
      }
    }

    // Check if any field that affects profit is being updated
    const isProfitRelatedFieldProvided =
      hargaJual !== undefined ||
      diskon !== undefined ||
      inventoryId !== undefined;

    // If profit-related field is provided, recalculate profit
    if (isProfitRelatedFieldProvided) {
      // Determine which inventory to use for profit calculation
      const targetInventoryId = inventoryId || existingPenjualan.inventoryId;
      const targetInventory = await prisma.inventoryHP.findUnique({
        where: { id: targetInventoryId },
      });

      if (!targetInventory) {
        throw new AppError("Target inventory not found", 404);
      }

      // Calculate profit: hargaJual - diskon - (modalFinal or modalAwal if modalFinal is 0)
      const finalHargaJual = hargaJual ?? Number(existingPenjualan.hargaJual);
      const finalDiskon =
        diskon !== undefined
          ? diskon === null
            ? 0
            : Number(diskon)
          : Number(existingPenjualan.diskon || 0);

      let modalBase = parseFloat(String(targetInventory.modalFinal));
      if (!modalBase || modalBase === 0) {
        modalBase = parseFloat(String(targetInventory.modalAwal));
      }

      const calculatedProfit = finalHargaJual - finalDiskon - modalBase;

      // Update all profit-related fields
      updateData.hargaJual = finalHargaJual;
      updateData.diskon =
        diskon !== null && diskon !== undefined
          ? diskon
          : existingPenjualan.diskon;
      if (inventoryId !== undefined && inventoryId !== null)
        updateData.inventoryId = inventoryId;
      updateData.profit = calculatedProfit;
    }

    // If inventoryId is being changed, update inventory statuses
    if (inventoryId && inventoryId !== existingPenjualan.inventoryId) {
      await prisma.$transaction(async (tx) => {
        // Set old inventory back to READY
        await tx.inventoryHP.update({
          where: { id: existingPenjualan.inventoryId },
          data: { status: "READY" },
        });

        // Set new inventory to TERJUAL
        await tx.inventoryHP.update({
          where: { id: inventoryId },
          data: { status: "TERJUAL" },
        });

        // Update penjualan
        await tx.penjualan.update({
          where: { id: parseInt(id) },
          data: updateData,
        });
      });
    } else {
      // Just update penjualan without inventory status changes
      await prisma.penjualan.update({
        where: { id: parseInt(id) },
        data: updateData,
      });
    }

    // Fetch updated penjualan
    const penjualan = await prisma.penjualan.findUnique({
      where: { id: parseInt(id) },
      include: {
        inventory: true,
      },
    });

    res.json({
      status: "success",
      message: "Penjualan updated successfully",
      data: penjualan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete penjualan
 */
export const deletePenjualan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // Check if penjualan exists
    const existingPenjualan = await prisma.penjualan.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPenjualan) {
      throw new AppError("Penjualan not found", 404);
    }

    // Delete penjualan and update inventory status in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete penjualan
      await tx.penjualan.delete({
        where: { id: parseInt(id) },
      });

      // Set inventory back to READY
      await tx.inventoryHP.update({
        where: { id: existingPenjualan.inventoryId },
        data: { status: "READY" },
      });
    });

    res.json({
      status: "success",
      message: "Penjualan deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
