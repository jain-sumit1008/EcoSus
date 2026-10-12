import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
const required = isTest ? [] : ["MONGODB_URI", "AUTH_SECRET"];

function numberEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }
  return value;
}

export function loadEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    port: Number(process.env.PORT || 5000),
    nodeEnv: process.env.NODE_ENV || "development",
    mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecopulse",
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    authSecret: process.env.AUTH_SECRET || (isTest ? "test-auth-secret-please-change" : undefined),
    sessionSecret: process.env.SESSION_SECRET || process.env.AUTH_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
    cookieName: process.env.COOKIE_NAME || "ecopulse_token",
    webauthn: {
      rpName: process.env.WEBAUTHN_RP_NAME || "EcoPulse",
      rpId: process.env.WEBAUTHN_RP_ID || "localhost",
      origin: process.env.WEBAUTHN_ORIGIN || "http://localhost:5173",
    },
    waterAnomalyThresholdPercent: numberEnv("WATER_ANOMALY_THRESHOLD_PERCENT", 30),
    electricityAnomalyThresholdPercent: numberEnv("ELECTRICITY_ANOMALY_THRESHOLD_PERCENT", 30),
    electricityTariffPerKwh: numberEnv("ELECTRICITY_TARIFF_PER_KWH", 15),
    co2KgPerKwh: numberEnv("CO2_KG_PER_KWH", 0.7),
    paperSheetsPerClassSession: numberEnv("PAPER_SHEETS_PER_CLASS_SESSION", 1),
    greeneryTargetPercent: numberEnv("GREENERY_TARGET_PERCENT", 60),
    demoMode: String(process.env.DEMO_MODE || "true") === "true",
    parkingStaleMinutes: numberEnv("PARKING_STALE_MINUTES", 30),
  };
}

export const env = loadEnv();
