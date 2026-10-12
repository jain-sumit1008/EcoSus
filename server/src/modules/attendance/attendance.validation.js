import { z } from "zod";

export const createSessionSchema = z.object({
  body: z.object({
    subjectName: z.string().min(2),
    subjectCode: z.string().min(2),
    department: z.string().min(2),
    facultyId: z.string().optional(),
    date: z.string().min(1),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    classroom: z.string().min(1),
    expectedStudentCount: z.number().int().positive(),
  }),
});

export const listSessionsSchema = z.object({
  query: z.object({
    status: z.enum(["scheduled", "active", "closed", "revoked"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string() }),
});

export const generateQrSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z
    .object({
      validityMinutes: z.coerce.number().int().min(1).max(180).optional(),
    })
    .optional(),
});

export const validateQrSchema = z.object({
  body: z.object({
    token: z.string().min(10),
  }),
});

export const submitRecordSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    token: z.string().min(10),
    verificationMethod: z.enum(["password", "webauthn", "demo", "face"]),
    verificationStatus: z.enum(["verified", "simulated", "pending", "failed"]).optional(),
    faceVerification: z
      .object({
        snapshotUrl: z.string().optional(),
        confidence: z.number().optional(),
        livenessPassed: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const listRecordsSchema = z.object({
  query: z.object({
    sessionId: z.string().optional(),
    subject: z.string().optional(),
    department: z.string().optional(),
    status: z.enum(["present", "absent"]).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  }),
});
