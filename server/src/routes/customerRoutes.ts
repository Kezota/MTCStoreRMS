import { Router } from "express";
import {
  getAllCustomers,
  getAllCustomerPurchases,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/CustomerController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// All routes require authentication
router.use(protect);

// Get all customer purchases (must be before /:id)
router.get("/purchases", getAllCustomerPurchases);

// Get all customers
router.get("/", getAllCustomers);

// Get customer by ID
router.get("/:id", getCustomerById);

// Create customer
router.post("/", createCustomer);

// Update customer
router.patch("/:id", updateCustomer);

// Delete customer
router.delete("/:id", deleteCustomer);

export default router;
