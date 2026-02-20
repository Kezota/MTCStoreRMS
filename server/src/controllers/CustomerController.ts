import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../utils/http/AppError";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  customerPurchasesQuerySchema,
} from "../utils/validators/customerValidators";

const prisma = new PrismaClient();

/**
 * Get all customer purchases with filters and pagination
 * Each row represents one purchase transaction or customer without purchase
 */
export const getAllCustomerPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate query parameters
    const queryValidation = customerPurchasesQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      throw new AppError(
        queryValidation.error.issues.map((e) => e.message).join(", "),
        400,
      );
    }

    const {
      search,
      nomorHP,
      namaHP,
      imei,
      brand,
      page,
      limit,
      sortBy,
      sortOrder,
    } = queryValidation.data;

    // Build base customer filter
    const customerWhere: any = {};

    // Search by customer name or phone
    if (search) {
      customerWhere.OR = [
        { nama: { contains: search } },
        { nomorHP: { contains: search } },
      ];
    }

    // Filter by customer phone number
    if (nomorHP) {
      customerWhere.nomorHP = { contains: nomorHP };
    }

    // For inventory filters, we'll filter after getting the data
    // or do a separate query for customers with matching purchases

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = limit ? parseInt(limit) : 10;

    // Get all customers matching filter
    const allCustomers = await prisma.customer.findMany({
      where: customerWhere,
      include: {
        penjualan: {
          include: {
            inventory: true,
          },
          orderBy: {
            tanggal: "desc",
          },
        },
      },
    });

    // Flatten: create one row per purchase, or one row for customer without purchase
    const flattened: any[] = [];
    for (const customer of allCustomers) {
      if (customer.penjualan.length === 0) {
        // Customer without purchase
        flattened.push({
          id: null,
          tanggal: null,
          inventoryId: null,
          customerId: customer.id,
          hargaJual: null,
          diskon: null,
          profit: null,
          metodeBayar: null,
          keterangan: null,
          createdAt: customer.createdAt,
          customer: {
            id: customer.id,
            nama: customer.nama,
            nomorHP: customer.nomorHP,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt,
          },
          inventory: null,
        });
      } else {
        // Customer with purchases - create row for each purchase
        for (const penjualan of customer.penjualan) {
          flattened.push({
            id: penjualan.id,
            tanggal: penjualan.tanggal,
            inventoryId: penjualan.inventoryId,
            customerId: penjualan.customerId,
            hargaJual: penjualan.hargaJual,
            diskon: penjualan.diskon,
            profit: penjualan.profit,
            metodeBayar: penjualan.metodeBayar,
            keterangan: penjualan.keterangan,
            createdAt: penjualan.createdAt,
            customer: {
              id: customer.id,
              nama: customer.nama,
              nomorHP: customer.nomorHP,
              createdAt: customer.createdAt,
              updatedAt: customer.updatedAt,
            },
            inventory: penjualan.inventory,
          });
        }
      }
    }

    // Apply inventory filters
    let filtered = flattened;
    if (namaHP) {
      filtered = filtered.filter(
        (item) =>
          item.inventory &&
          item.inventory.namaHP.toLowerCase().includes(namaHP.toLowerCase()),
      );
    }
    if (imei) {
      filtered = filtered.filter(
        (item) => item.inventory && item.inventory.imei.includes(imei),
      );
    }
    if (brand) {
      filtered = filtered.filter(
        (item) =>
          item.inventory &&
          item.inventory.brand.toLowerCase().includes(brand.toLowerCase()),
      );
    }

    // Sorting
    const sortOrderValue = sortOrder === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "customerNama":
          aVal = a.customer?.nama || "";
          bVal = b.customer?.nama || "";
          break;
        case "customerNomorHP":
          aVal = a.customer?.nomorHP || "";
          bVal = b.customer?.nomorHP || "";
          break;
        case "namaHP":
          aVal = a.inventory?.namaHP || "";
          bVal = b.inventory?.namaHP || "";
          break;
        case "imei":
          aVal = a.inventory?.imei || "";
          bVal = b.inventory?.imei || "";
          break;
        case "brand":
          aVal = a.inventory?.brand || "";
          bVal = b.inventory?.brand || "";
          break;
        case "tanggal":
          aVal = a.tanggal || new Date(0);
          bVal = b.tanggal || new Date(0);
          break;
        case "hargaJual":
          aVal = parseFloat(a.hargaJual || "0");
          bVal = parseFloat(b.hargaJual || "0");
          break;
        default:
          aVal = a.createdAt || new Date(0);
          bVal = b.createdAt || new Date(0);
      }

      if (aVal < bVal) return -1 * sortOrderValue;
      if (aVal > bVal) return 1 * sortOrderValue;
      return 0;
    });

    // Pagination
    const total = filtered.length;
    const skip = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(skip, skip + limitNum);

    res.json({
      status: "success",
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      data: paginated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all customers with filters and pagination
 */
export const getAllCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate query parameters
    const queryValidation = customerQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      throw new AppError(
        queryValidation.error.issues.map((e) => e.message).join(", "),
        400,
      );
    }

    const { search, nomorHP, page, limit, sortBy, sortOrder } =
      queryValidation.data;

    // Build filter object
    const where: any = {};

    // Search by name or phone
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { nomorHP: { contains: search } },
      ];
    }

    // Filter by exact phone number
    if (nomorHP) {
      where.nomorHP = { contains: nomorHP };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = limit ? parseInt(limit) : undefined;
    const skip = limitNum ? (pageNum - 1) * limitNum : undefined;

    // Sorting
    const allowedSortFields = ["id", "nama", "nomorHP", "createdAt"];
    const sortByField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const sortOrderValue =
      sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "desc";

    // Get total count
    const total = await prisma.customer.count({ where });

    // Get paginated data
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { [sortByField]: sortOrderValue },
      skip,
      take: limitNum,
    });

    res.json({
      status: "success",
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: limitNum ? Math.ceil(total / limitNum) : 1,
      },
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single customer by ID
 */
export const getCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    res.json({
      status: "success",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new customer
 */
export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate request body
    const validation = createCustomerSchema.safeParse(req.body);

    if (!validation.success) {
      throw new AppError(
        validation.error.issues.map((e) => e.message).join(", "),
        400,
      );
    }

    const { nama, nomorHP } = validation.data;

    // Check if phone number already exists
    const existingCustomer = nomorHP
      ? await prisma.customer.findFirst({
          where: { nomorHP },
        })
      : null;

    if (existingCustomer) {
      throw new AppError("Phone number already exists", 400);
    }

    const customer = await prisma.customer.create({
      data: {
        nama,
        nomorHP: nomorHP || "",
      },
    });

    res.status(201).json({
      status: "success",
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update customer
 */
export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validation = updateCustomerSchema.safeParse(req.body);

    if (!validation.success) {
      throw new AppError(
        validation.error.issues.map((e) => e.message).join(", "),
        400,
      );
    }

    const { nama, nomorHP } = validation.data;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCustomer) {
      throw new AppError("Customer not found", 404);
    }

    // If updating phone number, check if it already exists
    if (nomorHP && nomorHP !== existingCustomer.nomorHP) {
      const duplicatePhone = await prisma.customer.findFirst({
        where: { nomorHP },
      });

      if (duplicatePhone) {
        throw new AppError("Phone number already exists", 400);
      }
    }

    // Build update data
    const updateData: any = {};
    if (nama !== undefined && nama !== null) updateData.nama = nama;
    if (nomorHP !== undefined && nomorHP !== null) updateData.nomorHP = nomorHP;

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({
      status: "success",
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete customer
 */
export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCustomer) {
      throw new AppError("Customer not found", 404);
    }

    await prisma.customer.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      status: "success",
      message: "Customer deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
