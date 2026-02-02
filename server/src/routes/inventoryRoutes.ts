import { Router } from "express";
import {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
} from "../controllers/InventoryController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = Router();

// All routes require authentication
router.use(protect);

// Get all inventory items (with optional filters)
router.get("/", getAllInventory);

// Get single inventory item by ID
router.get("/:id", getInventoryById);

// Create new inventory item (authenticated users)
router.post("/", createInventory);

// Update inventory item (authenticated users)
router.patch("/:id", updateInventory);

// Delete inventory item (Admin only)
router.delete("/:id", restrictTo("ADMIN"), deleteInventory);

export default router;
