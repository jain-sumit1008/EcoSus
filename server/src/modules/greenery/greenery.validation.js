import { z } from "zod";

export const assessmentSchema = z.object({
  body: z.object({
    block: z.enum(["A", "B", "C", "D", "E"]),
    coveragePercent: z.number().min(0).max(100),
    assessedAt: z.string().min(1),
    notes: z.string().optional(),
    vegetationNotes: z.string().optional(),
    source: z.enum(["manual", "imported", "simulated"]).optional(),
  }),
});

export const actionCreateSchema = z.object({
  body: z.object({
    module: z.enum(["water", "electricity", "paper", "parking", "greenery"]).default("greenery"),
    block: z.enum(["A", "B", "C", "D", "E"]).optional(),
    title: z.string().min(3),
    description: z.string().min(3),
    priority: z.enum(["low", "medium", "high"]).optional(),
    status: z.enum(["suggested", "in_progress", "completed"]).optional(),
    estimatedImpact: z
      .object({
        value: z.number().optional(),
        unit: z.string().optional(),
        methodology: z.string().optional(),
      })
      .optional(),
  }),
});

export const actionPatchSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    status: z.enum(["suggested", "in_progress", "completed"]).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
  }),
});
