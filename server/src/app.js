import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import authRoutes from "./modules/auth/auth.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import waterRoutes from "./modules/water/water.routes.js";
import electricityRoutes from "./modules/electricity/electricity.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import parkingRoutes from "./modules/parking/parking.routes.js";
import greeneryRoutes from "./modules/greenery/greenery.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";
import demoRoutes from "./modules/demo/demo.routes.js";
import sheetsRoutes from "./modules/sheets/sheets.routes.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/api", apiLimiter);

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      message: "EcoPulse API is running",
      data: { status: "ok", time: new Date().toISOString() },
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/water", waterRoutes);
  app.use("/api/electricity", electricityRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/parking", parkingRoutes);
  app.use("/api/greenery", greeneryRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/demo", demoRoutes);
  app.use("/api/sheets", sheetsRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
