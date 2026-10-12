import { Alert } from "../../models/Alert.js";
import { SustainabilityAction } from "../../models/SustainabilityAction.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../../models/AuditLog.js";

export function severityFromDeviation(deviationPercent, threshold) {
  if (deviationPercent >= threshold * 2) return "high";
  if (deviationPercent >= threshold) return "medium";
  return "low";
}

export async function createAnomalyAlert({
  resourceType,
  relatedReading,
  block,
  observedValue,
  baselineValue,
  deviationPercent,
  title,
  description,
  recommendation,
  source = "automated",
  threshold,
}) {
  const existing = await Alert.findOne({
    relatedReading,
    resourceType,
    status: { $in: ["open", "investigating"] },
  });
  if (existing) return existing;

  return Alert.create({
    resourceType,
    relatedReading,
    block,
    title,
    description,
    observedValue,
    baselineValue,
    deviationPercent,
    severity: severityFromDeviation(deviationPercent, threshold),
    recommendation,
    source,
    detectedAt: new Date(),
  });
}

export async function listAlerts({ resourceType, status, block, page = 1, limit = 20 }) {
  const filter = {};
  if (resourceType) filter.resourceType = resourceType;
  if (status) filter.status = status;
  if (block) filter.block = block;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Alert.find(filter).sort({ detectedAt: -1 }).skip(skip).limit(limit).lean(),
    Alert.countDocuments(filter),
  ]);
  return { items, total };
}

const allowedTransitions = {
  open: ["investigating", "resolved"],
  investigating: ["resolved"],
  resolved: [],
};

export async function updateAlertStatus(id, { status, resolutionNotes }, actor) {
  const alert = await Alert.findById(id);
  if (!alert) throw new ApiError(404, "Alert not found", "NOT_FOUND");
  if (!allowedTransitions[alert.status].includes(status)) {
    throw new ApiError(400, `Cannot change status from ${alert.status} to ${status}`, "INVALID_TRANSITION");
  }
  alert.status = status;
  if (status === "resolved") {
    alert.resolvedAt = new Date();
    alert.resolutionNotes = resolutionNotes || alert.resolutionNotes;
  }
  await alert.save();
  await writeAudit({
    actor: actor?._id,
    action: "alert.status",
    entityType: "Alert",
    entityId: String(alert._id),
    metadata: { status },
  });
  return alert;
}

export async function recordAlertAction(id, { title, description, status = "in_progress" }, actor) {
  const alert = await Alert.findById(id);
  if (!alert) throw new ApiError(404, "Alert not found", "NOT_FOUND");
  const action = await SustainabilityAction.create({
    module: alert.resourceType,
    block: alert.block,
    title: title || `Corrective action for ${alert.title}`,
    description: description || "Corrective action recorded from alert workflow.",
    priority: alert.severity,
    status,
    createdBy: actor?._id,
    source: "manual",
  });
  if (alert.status === "open") {
    alert.status = "investigating";
    await alert.save();
  }
  await writeAudit({
    actor: actor?._id,
    action: "alert.action",
    entityType: "Alert",
    entityId: String(alert._id),
    metadata: { actionId: String(action._id) },
  });
  return { alert, action };
}
