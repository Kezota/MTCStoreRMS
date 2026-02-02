import { Router } from "express";
import {
  register,
  login,
  getCurrentUser,
  getAllUsers,
  changePassword,
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
router.patch("/change-password", protect, restrictTo("ADMIN"), changePassword);

export default router;
