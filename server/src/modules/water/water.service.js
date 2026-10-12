import { env } from "../../config/env.js";
import { WaterReading } from "../../models/WaterReading.js";
import { Alert } from "../../models/Alert.js";
import { ApiError } from "../../utils/ApiError.js";
import * as alertsService from "../alerts/alerts.service.js";

const BASELINE_SAMPLE_SIZE = 7;

export async function computeBaseline(block, excludeId) {
  const filter = { block };
  if (excludeId) filter._id = { $ne: excludeId };
  const samples = await WaterReading.find(filter).sort({ recordedAt: -1 }).limit(BASELINE_SAMPLE_SIZE).lean();
  if (samples.length < 3) {
    return { baseline: null, sampleCount: samples.length, reason: "insufficient_history" };
  }
  const baseline = samples.reduce((sum, item) => sum + item.consumptionLitres, 0) / samples.length;
  return { baseline, sampleCount: samples.length, reason: null };
}

export function recommendWater(deviationPercent, recordedAt) {
  const hour = new Date(recordedAt).getUTCHours();
  const parts = [
    "This is a possible anomaly, not a confirmed physical leak.",
    "Inspect meters, tanks, and recent maintenance logs for Block usage.",
  ];
  if (hour < 5 || hour > 21) parts.push("Usage occurred outside typical campus hours; check after-hours irrigation or overflow.");
  if (deviationPercent >= 50) parts.push("Deviation is large; inspect for tank overflow or a stuck valve.");
  return parts.join(" ");
}

export async function createReading(payload, user) {
  const recordedAt = new Date(payload.recordedAt);
  if (Number.isNaN(recordedAt.getTime())) {
    throw new ApiError(400, "Invalid timestamp", "VALIDATION_ERROR");
  }
  const reading = await WaterReading.create({
    block: payload.block,
    meterId: payload.meterId,
    consumptionLitres: payload.consumptionLitres,
    recordedAt,
    recordedBy: user?._id,
    source: payload.source || "manual",
    notes: payload.notes,
  });

  const { baseline, sampleCount, reason } = await computeBaseline(payload.block, reading._id);
  let alert = null;
  let detection = { baseline, sampleCount, reason, deviationPercent: null, alertGenerated: false };

  if (baseline && baseline > 0) {
    const deviationPercent = ((payload.consumptionLitres - baseline) / baseline) * 100;
    detection.deviationPercent = Number(deviationPercent.toFixed(2));
    if (deviationPercent >= env.waterAnomalyThresholdPercent) {
      alert = await alertsService.createAnomalyAlert({
        resourceType: "water",
        relatedReading: reading._id,
        block: payload.block,
        observedValue: payload.consumptionLitres,
        baselineValue: Number(baseline.toFixed(2)),
        deviationPercent: detection.deviationPercent,
        title: `High water usage in Block ${payload.block}`,
        description: `Observed ${payload.consumptionLitres} L against a ${sampleCount}-reading baseline of ${baseline.toFixed(1)} L (interval consumption).`,
        recommendation: recommendWater(deviationPercent, recordedAt),
        source: payload.source === "simulated" ? "simulated" : "automated",
        threshold: env.waterAnomalyThresholdPercent,
      });
      detection.alertGenerated = true;
    }
  }

  return { reading, alert, detection };
}

export async function listReadings({ block, from, to, page = 1, limit = 20 }) {
  const filter = {};
  if (block) filter.block = block;
  if (from || to) {
    filter.recordedAt = {};
    if (from) filter.recordedAt.$gte = new Date(from);
    if (to) filter.recordedAt.$lte = new Date(to);
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    WaterReading.find(filter).sort({ recordedAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    WaterReading.countDocuments(filter),
  ]);
  return { items, total };
}

export async function listAlerts(query) {
  return alertsService.listAlerts({ ...query, resourceType: "water" });
}

export async function patchAlert(id, body, user) {
  return alertsService.updateAlertStatus(id, body, user);
}

export async function addAlertAction(id, body, user) {
  return alertsService.recordAlertAction(id, body, user);
}

export async function todayTotals(from, to) {
  const match = {
    recordedAt: { $gte: from, $lte: to },
  };
  const [agg] = await WaterReading.aggregate([
    { $match: match },
    { $group: { _id: "$block", litres: { $sum: "$consumptionLitres" } } },
  ]);
  const byBlock = await WaterReading.aggregate([
    { $match: match },
    { $group: { _id: "$block", litres: { $sum: "$consumptionLitres" } } },
  ]);
  const total = byBlock.reduce((sum, row) => sum + row.litres, 0);
  return { total, byBlock };
}

export { Alert };
