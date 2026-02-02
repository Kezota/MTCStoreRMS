import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get current month start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Count total HP ready
    const totalReady = await prisma.inventoryHP.count({
      where: { status: "READY" },
    });

    // Count HP sold this month
    const soldThisMonth = await prisma.penjualan.count({
      where: {
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Calculate total profit this month
    const profitThisMonth = await prisma.penjualan.aggregate({
      where: {
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        profit: true,
      },
    });

    // Calculate total sales (harga jual) this month
    const salesThisMonth = await prisma.penjualan.aggregate({
      where: {
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        hargaJual: true,
      },
    });

    res.json({
      status: "success",
      data: {
        totalReady,
        soldThisMonth,
        profitThisMonth: profitThisMonth._sum.profit || 0,
        salesThisMonth: salesThisMonth._sum.hargaJual || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
