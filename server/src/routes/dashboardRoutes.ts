import { Router } from "express";
import { getDashboardStats } from "../controllers";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// All dashboard routes require authentication
router.use(protect);

// Get dashboard statistics
router.get("/stats", getDashboardStats);

export default router;
