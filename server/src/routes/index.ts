import { Router } from "express";
import authRoutes from "./authRoutes";

const router = Router();

// API Welcome Message
router.get("/", (_, response) => {
  response.send({
    message: "MTC Store RMS API v1.0.0",
  });
});

/**
 * Insert your router here
 * @example router.use("/example", exampleRouter)
 */
router.use("/auth", authRoutes);

export default router;
