import { env } from "../../config/env.js";
import { attendanceServicePaper } from "./helpers.js";

export { paperFromSessions } from "./helpers.js";

export function documentFactors() {
  return {
    electricityTariffPerKwh: env.electricityTariffPerKwh,
    co2KgPerKwh: env.co2KgPerKwh,
    paperSheetsPerClassSession: env.paperSheetsPerClassSession,
    greeneryTargetPercent: env.greeneryTargetPercent,
    waterAnomalyThresholdPercent: env.waterAnomalyThresholdPercent,
    electricityAnomalyThresholdPercent: env.electricityAnomalyThresholdPercent,
    notes: [
      "Tariff and emissions factors are configurable demonstration defaults, not verified SVVV utility rates.",
      "Paper avoided is estimated from digital sessions, not measured stationery consumption.",
      "Alerts indicate possible anomalies versus a recent-interval baseline, not confirmed leaks or faults.",
    ],
  };
}

export { attendanceServicePaper };
