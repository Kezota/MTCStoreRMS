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

// Create new inventory item (authenticated users)
router.post("/", createInventory);

// Create multiple inventory items at once (bulk create)
router.post("/bulk", createBulkInventory);

// Update inventory item (authenticated users)
router.patch("/:id", updateInventory);

// Delete inventory item (Admin only)
router.delete("/:id", restrictTo("ADMIN"), deleteInventory);

export default router;
