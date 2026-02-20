import { Router } from "express";
import {
  getAllPenjualan,
  getPenjualanById,
  createPenjualan,
  updatePenjualan,
  deletePenjualan,
} from "../controllers/PenjualanController";
import {
  protect,
  restrictTo,
  checkPenjualanEditTime,
} from "../middleware/authMiddleware";

const router = Router();

// Protect all routes
router.use(protect);

// GET all penjualan with filters
router.get("/", getAllPenjualan);

// GET penjualan by ID
router.get("/:id", getPenjualanById);

// POST create new penjualan (all authenticated users)
router.post("/", createPenjualan);

// PATCH update penjualan (staff: within 10 mins, admin: anytime)
router.patch("/:id", checkPenjualanEditTime, updatePenjualan);

// DELETE penjualan (ADMIN only)
router.delete("/:id", restrictTo("ADMIN"), deletePenjualan);

export default router;
