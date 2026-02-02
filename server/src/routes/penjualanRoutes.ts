import { Router } from "express";
import {
  getAllPenjualan,
  getPenjualanById,
  createPenjualan,
  updatePenjualan,
  deletePenjualan,
} from "../controllers/PenjualanController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = Router();

// Protect all routes
router.use(protect);

// GET all penjualan with filters
router.get("/", getAllPenjualan);

// GET penjualan by ID
router.get("/:id", getPenjualanById);

// POST create new penjualan
router.post("/", createPenjualan);

// PATCH update penjualan
router.patch("/:id", updatePenjualan);

// DELETE penjualan (admin only)
router.delete("/:id", restrictTo("ADMIN"), deletePenjualan);

export default router;
