import { env } from "../../config/env.js";
import { ElectricityReading } from "../../models/ElectricityReading.js";
import { ApiError } from "../../utils/ApiError.js";
import * as alertsService from "../alerts/alerts.service.js";

const BASELINE_SAMPLE_SIZE = 7;

export function estimates(consumptionKwh) {
  return {
    estimatedCost: Number((consumptionKwh * env.electricityTariffPerKwh).toFixed(2)),
    estimatedEmissionsKgCO2e: Number((consumptionKwh * env.co2KgPerKwh).toFixed(2)),
    tariffPerKwh: env.electricityTariffPerKwh,
    co2KgPerKwh: env.co2KgPerKwh,
    methodology:
      "Cost = kWh × ELECTRICITY_TARIFF_PER_KWH. Emissions = kWh × CO2_KG_PER_KWH. These are configurable demonstration factors, not verified local utility tariffs.",
  };
}

export async function computeBaseline(block, excludeId) {
  const filter = { block };
  if (excludeId) filter._id = { $ne: excludeId };
  const samples = await ElectricityReading.find(filter).sort({ recordedAt: -1 }).limit(BASELINE_SAMPLE_SIZE).lean();
  if (samples.length < 3) {
    return { baseline: null, sampleCount: samples.length, reason: "insufficient_history" };
  }
  const baseline = samples.reduce((sum, item) => sum + item.consumptionKwh, 0) / samples.length;
  return { baseline, sampleCount: samples.length, reason: null };
}

export function recommendElectricity(deviationPercent, recordedAt) {
  const hour = new Date(recordedAt).getUTCHours();
  const parts = [
    "Investigate unusual load rather than treating this as verified waste.",
    "Review classroom HVAC, lab equipment, and lighting schedules.",
  ];
  if (hour < 6 || hour > 20) parts.push("Possible after-hours consumption; check if equipment was left on.");
  if (deviationPercent >= 50) parts.push("Large spike versus baseline; inspect a specific building or meter.");
  return parts.join(" ");
}

export async function createReading(payload, user) {
  const recordedAt = new Date(payload.recordedAt);
  if (Number.isNaN(recordedAt.getTime())) {
    throw new ApiError(400, "Invalid timestamp", "VALIDATION_ERROR");
  }
  const reading = await ElectricityReading.create({
    block: payload.block,
    building: payload.building,
    meterId: payload.meterId,
    consumptionKwh: payload.consumptionKwh,
    recordedAt,
    recordedBy: user?._id,
    source: payload.source || "manual",
    notes: payload.notes,
  });

  const { baseline, sampleCount, reason } = await computeBaseline(payload.block, reading._id);
  let alert = null;
  let detection = { baseline, sampleCount, reason, deviationPercent: null, alertGenerated: false };

  if (baseline && baseline > 0) {
    const deviationPercent = ((payload.consumptionKwh - baseline) / baseline) * 100;
    detection.deviationPercent = Number(deviationPercent.toFixed(2));
    if (deviationPercent >= env.electricityAnomalyThresholdPercent) {
      alert = await alertsService.createAnomalyAlert({
        resourceType: "electricity",
        relatedReading: reading._id,
        block: payload.block,
        observedValue: payload.consumptionKwh,
        baselineValue: Number(baseline.toFixed(2)),
        deviationPercent: detection.deviationPercent,
        title: `Unusual electricity use in Block ${payload.block}`,
        description: `Observed ${payload.consumptionKwh} kWh against a ${sampleCount}-reading baseline of ${baseline.toFixed(1)} kWh.`,
        recommendation: recommendElectricity(deviationPercent, recordedAt),
        source: payload.source === "simulated" ? "simulated" : "automated",
        threshold: env.electricityAnomalyThresholdPercent,
      });
      detection.alertGenerated = true;
    }
  }

  return { reading, alert, detection, estimates: estimates(payload.consumptionKwh) };
}

export async function listReadings({ block, building, from, to, page = 1, limit = 20 }) {
  const filter = {};
  if (block) filter.block = block;
  if (building) filter.building = building;
  if (from || to) {
    filter.recordedAt = {};
    if (from) filter.recordedAt.$gte = new Date(from);
    if (to) filter.recordedAt.$lte = new Date(to);
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    ElectricityReading.find(filter).sort({ recordedAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    ElectricityReading.countDocuments(filter),
  ]);
  return { items, total };
}

export async function listAlerts(query) {
  return alertsService.listAlerts({ ...query, resourceType: "electricity" });
}

export async function addAlertAction(id, body, user) {
  return alertsService.recordAlertAction(id, body, user);
}
