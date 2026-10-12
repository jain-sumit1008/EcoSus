import { z } from "zod";

const pagination = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
};

export const listReadingsSchema = z.object({
  query: z.object({
    block: z.enum(["A", "B", "C", "D", "E"]).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    ...pagination,
  }),
});

export const createReadingSchema = z.object({
  body: z.object({
    block: z.enum(["A", "B", "C", "D", "E"]),
    consumptionLitres: z.number().positive(),
    recordedAt: z.string().datetime().or(z.string().min(1)),
    meterId: z.string().optional(),
    notes: z.string().optional(),
    source: z.enum(["manual", "imported", "simulated"]).optional(),
  }),
});

export const listAlertsSchema = z.object({
  query: z.object({
    status: z.enum(["open", "investigating", "resolved"]).optional(),
    block: z.enum(["A", "B", "C", "D", "E"]).optional(),
    ...pagination,
  }),
});

export const patchAlertSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    status: z.enum(["investigating", "resolved"]),
    resolutionNotes: z.string().optional(),
  }),
});

export const alertActionSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["suggested", "in_progress", "completed"]).optional(),
  }),
});
