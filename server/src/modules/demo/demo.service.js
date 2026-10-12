import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { WaterReading } from "../../models/WaterReading.js";
import { writeAudit } from "../../models/AuditLog.js";
import { createReading as createWaterReading } from "../water/water.service.js";

export async function runDemo(user) {
  if (!env.demoMode && user.role !== "admin") {
    throw new ApiError(403, "Demo scenario is disabled outside development", "DEMO_DISABLED");
  }

  const now = new Date();
  const baselineSamples = await WaterReading.find({ block: "C" }).sort({ recordedAt: -1 }).limit(5).lean();
  const baseline =
    baselineSamples.length >= 3
      ? baselineSamples.reduce((sum, row) => sum + row.consumptionLitres, 0) / baselineSamples.length
      : 1800;
  const spike = Number((baseline * 1.85).toFixed(1));

  const result = await createWaterReading(
    {
      block: "C",
      consumptionLitres: spike,
      recordedAt: now.toISOString(),
      meterId: "W-C-DEMO",
      notes: "Demo scenario: simulated high usage for Block C. Not a confirmed leak.",
      source: "simulated",
    },
    user
  );

  await writeAudit({
    actor: user._id,
    action: "demo.run",
    entityType: "WaterReading",
    entityId: String(result.reading._id),
    metadata: { block: "C", simulated: true },
  });

  return {
    message: "Demo scenario created a simulated high water reading for Block C.",
    reading: result.reading,
    alert: result.alert,
    detection: result.detection,
  };
}
