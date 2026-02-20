import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../utils/http/AppError";

interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

/**
 * Middleware to verify JWT token and protect routes
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided. Please log in.", 401);
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default-secret",
    ) as JwtPayload;

    // Attach user info to request
    (req as any).user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError("Invalid token. Please log in again.", 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError("Token expired. Please log in again.", 401));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to restrict access to specific roles
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }

    next();
  };
};

/**
 * Middleware to check if staff can edit penjualan (within 10 minutes of creation)
 * Admins bypass this check
 */
export const checkPenjualanEditTime = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userRole = (req as any).user?.role;

    // Admin can always edit
    if (userRole === "ADMIN") {
      return next();
    }

    // For staff, check if penjualan was created within 10 minutes
    if (userRole === "STAFF") {
      const prisma = new PrismaClient();

      const penjualanId = parseInt(req.params.id);
      const penjualan = await prisma.penjualan.findUnique({
        where: { id: penjualanId },
      });

      if (!penjualan) {
        return next(new AppError("Penjualan not found", 404));
      }

      const now = new Date();
      const createdAt = new Date(penjualan.createdAt);
      const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      if (diffInMinutes > 10) {
        return next(
          new AppError(
            "Staff can only edit penjualan within 10 minutes of creation",
            403,
          ),
        );
      }

      await prisma.$disconnect();
    }

    next();
  } catch (error) {
    next(error);
  }
};
