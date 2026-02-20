import { Router } from "express";
import authRoutes from "./authRoutes";
import inventoryRoutes from "./inventoryRoutes";
import penjualanRoutes from "./penjualanRoutes";
import dashboardRoutes from "./dashboardRoutes";
import customerRoutes from "./customerRoutes";

const router = Router();

// API Welcome Message
router.get("/", (_, response) => {
  response.send({
    message: "MTC Store RMS API v2.0",
  });
});

/**
 * Insert your router here
 * @example router.use("/example", exampleRouter)
 */
router.use("/api/auth", authRoutes);
router.use("/api/inventory", inventoryRoutes);
router.use("/api/penjualan", penjualanRoutes);
router.use("/api/dashboard", dashboardRoutes);
router.use("/api/customers", customerRoutes);

export default router;
