import { env } from "../../config/env.js";
import { GreeneryAssessment } from "../../models/GreeneryAssessment.js";
import { SustainabilityAction } from "../../models/SustainabilityAction.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../../models/AuditLog.js";

export function prioritize(coveragePercent, targetPercent) {
  const gap = targetPercent - coveragePercent;
  if (gap >= 15) {
    return {
      priority: "high",
      recommendation:
        "Coverage is well below the configured target. Prioritize planting in unused open space if sunlight and irrigation are available. Coverage percent alone does not prove biodiversity quality.",
    };
  }
  if (gap > 0) {
    return {
      priority: "medium",
      recommendation:
        "Moderate gap versus target. Review native species, watering needs, and maintenance before expanding canopy.",
    };
  }
  return {
    priority: "low",
    recommendation:
      "At or above the configured target. Focus on protection, soil health, and maintenance rather than expansion.",
  };
}

export async function latestByBlock() {
  const blocks = ["A", "B", "C", "D", "E"];
  const latest = await Promise.all(
    blocks.map(async (block) => {
      const assessment = await GreeneryAssessment.findOne({ block }).sort({ assessedAt: -1 }).lean();
      if (!assessment) {
        return {
          block,
          coveragePercent: null,
          targetPercent: env.greeneryTargetPercent,
          gap: null,
          missingFactors: ["space availability", "native species", "sunlight", "water requirements", "maintenance"],
          ...prioritize(0, env.greeneryTargetPercent),
          source: null,
        };
      }
      const ranked = prioritize(assessment.coveragePercent, assessment.targetPercent);
      return {
        ...assessment,
        gap: Number((assessment.targetPercent - assessment.coveragePercent).toFixed(1)),
        ...ranked,
        missingFactors: ["space availability", "native species", "sunlight", "water requirements", "maintenance"],
      };
    })
  );
  const withValues = latest.filter((row) => row.coveragePercent !== null);
  const average = withValues.length
    ? Number((withValues.reduce((sum, row) => sum + row.coveragePercent, 0) / withValues.length).toFixed(1))
    : 0;
  return { blocks: latest, average, targetPercent: env.greeneryTargetPercent };
}

export async function getBlock(id) {
  const data = await latestByBlock();
  const block = data.blocks.find((row) => row.block === id || String(row._id) === id);
  if (!block) throw new ApiError(404, "Block not found", "NOT_FOUND");
  return block;
}

export async function createAssessment(payload, user) {
  const assessment = await GreeneryAssessment.create({
    ...payload,
    assessedAt: new Date(payload.assessedAt),
    assessedBy: user._id,
    targetPercent: env.greeneryTargetPercent,
    source: payload.source || "manual",
  });
  await writeAudit({
    actor: user._id,
    action: "greenery.assessment",
    entityType: "GreeneryAssessment",
    entityId: String(assessment._id),
  });
  return assessment;
}

export async function listActions() {
  return SustainabilityAction.find({ module: "greenery" }).sort({ createdAt: -1 }).lean();
}

export async function createAction(payload, user) {
  const action = await SustainabilityAction.create({
    ...payload,
    createdBy: user._id,
  });
  return action;
}

export async function patchAction(id, payload, user) {
  const action = await SustainabilityAction.findById(id);
  if (!action) throw new ApiError(404, "Action not found", "NOT_FOUND");
  Object.assign(action, payload);
  if (payload.status === "completed") action.completedAt = new Date();
  await action.save();
  await writeAudit({
    actor: user._id,
    action: "greenery.action.update",
    entityType: "SustainabilityAction",
    entityId: String(action._id),
  });
  return action;
}
