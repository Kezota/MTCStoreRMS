import { Router } from "express";
import {
  getAllInventory,
  getInventoryById,
  createInventory,
  createBulkInventory,
  updateInventory,
  deleteInventory,
  getInventoryModalsByNamaHP,
  getNamaHPByBrand,
} from "../controllers/InventoryController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = Router();

// All routes require authentication
router.use(protect);

// Get all inventory items (with optional filters)
router.get("/", getAllInventory);

// Get modalAwal list by namaHP
router.get("/by-nama", getInventoryModalsByNamaHP);

// Get unique nama HP filtered by brand
router.get("/nama-by-brand", getNamaHPByBrand);

// Get single inventory item by ID
router.get("/:id", getInventoryById);

// Create new inventory item (ADMIN only)
router.post("/", restrictTo("ADMIN"), createInventory);

// Create multiple inventory items at once (bulk create - ADMIN only)
router.post("/bulk", restrictTo("ADMIN"), createBulkInventory);

// Update inventory item (ADMIN only)
router.patch("/:id", restrictTo("ADMIN"), updateInventory);

// Delete inventory item (ADMIN only)
router.delete("/:id", restrictTo("ADMIN"), deleteInventory);

export default router;
