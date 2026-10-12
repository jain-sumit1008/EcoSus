import { getSummary } from "../dashboard/dashboard.service.js";
import { Alert } from "../../models/Alert.js";
import { SustainabilityAction } from "../../models/SustainabilityAction.js";
import { WaterReading } from "../../models/WaterReading.js";
import { ElectricityReading } from "../../models/ElectricityReading.js";
import { AttendanceRecord } from "../../models/AttendanceRecord.js";
import { ApiError } from "../../utils/ApiError.js";

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const safe = str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")
    ? `'${str}`
    : str;
  if (/[",\n]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

export async function getReportSummary(query) {
  const summary = await getSummary(query);
  const [openAlerts, resolvedAlerts, actions] = await Promise.all([
    Alert.countDocuments({ status: { $in: ["open", "investigating"] } }),
    Alert.countDocuments({ status: "resolved" }),
    SustainabilityAction.find().sort({ createdAt: -1 }).limit(50).lean(),
  ]);
  return {
    ...summary,
    alerts: {
      ...summary.alerts,
      openCount: openAlerts,
      resolvedCount: resolvedAlerts,
    },
    correctiveActions: actions,
    classification: {
      measurements: "Water and electricity interval readings stored in MongoDB.",
      estimates: "Paper avoided, electricity cost, and CO2e use documented configurable factors.",
      demoRecords: "Records with source=simulated.",
      verifiedInterventions: "Only completed SustainabilityAction items with documented methodology.",
    },
  };
}

export async function exportCsv({ dataset, from, to, block }) {
  const filter = {};
  if (from || to) {
    filter.recordedAt = {};
    if (from) filter.recordedAt.$gte = new Date(from);
    if (to) filter.recordedAt.$lte = new Date(to);
  }
  if (block) filter.block = block;

  let rows = [];
  let headers = [];

  if (dataset === "water") {
    headers = ["block", "consumptionLitres", "recordedAt", "source", "meterId", "notes"];
    rows = await WaterReading.find(filter).sort({ recordedAt: -1 }).limit(2000).lean();
  } else if (dataset === "electricity") {
    headers = ["block", "building", "consumptionKwh", "recordedAt", "source", "meterId", "notes"];
    rows = await ElectricityReading.find(filter).sort({ recordedAt: -1 }).limit(2000).lean();
  } else if (dataset === "alerts") {
    headers = ["resourceType", "block", "title", "observedValue", "baselineValue", "deviationPercent", "severity", "status", "source", "detectedAt"];
    const alertFilter = {};
    if (block) alertFilter.block = block;
    rows = await Alert.find(alertFilter).sort({ detectedAt: -1 }).limit(2000).lean();
  } else if (dataset === "attendance") {
    headers = ["student", "subject", "status", "verificationMethod", "verificationStatus", "markedAt"];
    const records = await AttendanceRecord.find()
      .populate("studentId", "name studentId")
      .populate("sessionId", "subjectName subjectCode")
      .limit(2000)
      .lean();
    rows = records.map((row) => ({
      student: row.studentId?.studentId || row.studentId?.name,
      subject: row.sessionId?.subjectName,
      status: row.status,
      verificationMethod: row.verificationMethod,
      verificationStatus: row.verificationStatus,
      markedAt: row.markedAt,
    }));
  } else {
    throw new ApiError(400, "Unsupported export dataset. Use water, electricity, alerts, or attendance.", "UNSUPPORTED_EXPORT");
  }

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((key) => escapeCsv(row[key])).join(","));
  }
  return lines.join("\n");
}
