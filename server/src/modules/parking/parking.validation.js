import { z } from "zod";

export const occupancySchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    availableSpaces: z.number().int().min(0),
    occupiedSpaces: z.number().int().min(0),
    reservedSpaces: z.number().int().min(0).optional(),
    source: z.enum(["manual", "simulated", "integrated"]).optional(),
  }),
});
