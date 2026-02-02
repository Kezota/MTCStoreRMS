import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/http/AppError";

const prisma = new PrismaClient();

/**
 * Register a new user
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, password, nama, role } = req.body;

    // Validation
    if (!username || !password || !nama) {
      throw new AppError("Username, password, and nama are required", 400);
    }

    if (role && !["ADMIN", "STAFF"].includes(role)) {
      throw new AppError("Invalid role value", 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new AppError("Username already exists", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        nama,
        role: role || "STAFF", // Default to STAFF if not provided
      },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      throw new AppError("Username and password are required", 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new AppError("Invalid username or password", 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid username or password", 401);
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || "default-secret";
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiresIn } as jwt.SignOptions,
    );

    res.json({
      status: "success",
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          username: user.username,
          nama: user.nama,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user (requires authentication)
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      status: "success",
      results: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create user (Admin only)
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, password, nama, role } = req.body;

    if (!username || !password || !nama) {
      throw new AppError("Username, password, and nama are required", 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new AppError("Username already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        nama,
        role: role || "STAFF",
      },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, nama, password, role } = req.body;

    if (Number.isNaN(userId)) {
      throw new AppError("Invalid user id", 400);
    }

    if (!username && !nama && !password && !role) {
      throw new AppError("At least one field is required to update", 400);
    }

    if (role && !["ADMIN", "STAFF"].includes(role)) {
      throw new AppError("Invalid role value", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new AppError("Username already exists", 400);
      }
    }

    const data: {
      username?: string;
      nama?: string;
      role?: "ADMIN" | "STAFF";
      password?: string;
    } = {};

    if (username) data.username = username;
    if (nama) data.nama = nama;
    if (role) data.role = role;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({
      status: "success",
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = parseInt(req.params.id);
    const requesterId = (req as any).user?.id;

    if (Number.isNaN(userId)) {
      throw new AppError("Invalid user id", 400);
    }

    if (requesterId === userId) {
      throw new AppError("You cannot delete your own account", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      status: "success",
      message: "User deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password (Admin only)
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, newPassword } = req.body;

    // Validation
    if (!userId || !newPassword) {
      throw new AppError("User ID and new password are required", 400);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        password: hashedPassword,
      },
    });

    res.json({
      status: "success",
      message: `Password updated successfully for user: ${user.username}`,
    });
  } catch (error) {
    next(error);
  }
};
