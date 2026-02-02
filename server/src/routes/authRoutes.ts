import { Router } from "express";
import {
  register,
  login,
  getCurrentUser,
  getAllUsers,
  changePassword,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/AuthController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", protect, getCurrentUser);

// Admin only routes
router.get("/users", protect, restrictTo("ADMIN"), getAllUsers);
router.post("/users", protect, restrictTo("ADMIN"), createUser);
router.patch("/users/:id", protect, restrictTo("ADMIN"), updateUser);
router.delete("/users/:id", protect, restrictTo("ADMIN"), deleteUser);
router.patch("/change-password", protect, restrictTo("ADMIN"), changePassword);

export default router;
