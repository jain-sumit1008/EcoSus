import { env } from "../../config/env.js";
import { AttendanceSession } from "../../models/AttendanceSession.js";

export async function paperFromSessions(from, to) {
  const filter = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }
  const digitalSessions = await AttendanceSession.countDocuments(filter);
  const estimatedSheetsAvoided = digitalSessions * env.paperSheetsPerClassSession;
  return {
    digitalSessions,
    estimatedSheetsAvoided,
    estimatedPaperUsedUnderBaseline: estimatedSheetsAvoided,
    baselineSheetsPerSession: env.paperSheetsPerClassSession,
    methodology:
      "One paper register sheet is assumed per eligible digital class session (PAPER_SHEETS_PER_CLASS_SESSION). Student-level pages are not double-counted.",
  };
}

export const attendanceServicePaper = paperFromSessions;
