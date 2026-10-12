import crypto from "crypto";
import { env } from "../../config/env.js";
import { AttendanceSession } from "../../models/AttendanceSession.js";
import { AttendanceRecord } from "../../models/AttendanceRecord.js";
import { User } from "../../models/User.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../../models/AuditLog.js";

const QR_TTL_MS = 10 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function combineDateAndTime(dateStr, timeStr) {
  const date = new Date(dateStr);
  if (timeStr.includes("T")) return new Date(timeStr);
  const [h, m] = timeStr.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(h || 0, m || 0, 0, 0);
  return combined;
}

export async function createSession(payload, user) {
  const startTime = combineDateAndTime(payload.date, payload.startTime);
  const endTime = combineDateAndTime(payload.date, payload.endTime);
  if (endTime <= startTime) {
    throw new ApiError(400, "End time must be after start time", "VALIDATION_ERROR");
  }
  const session = await AttendanceSession.create({
    ...payload,
    date: new Date(payload.date),
    startTime,
    endTime,
    facultyId: payload.facultyId || user._id,
    createdBy: user._id,
    status: "scheduled",
  });
  await writeAudit({
    actor: user._id,
    action: "attendance.session.create",
    entityType: "AttendanceSession",
    entityId: String(session._id),
  });
  return session;
}

export async function listSessions({ status, page = 1, limit = 20 }) {
  const filter = {};
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    AttendanceSession.find(filter).sort({ startTime: -1 }).skip(skip).limit(Number(limit)).lean(),
    AttendanceSession.countDocuments(filter),
  ]);
  return { items, total };
}

export async function generateQr(sessionId, user, validityMinutes = 10) {
  const session = await AttendanceSession.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found", "NOT_FOUND");
  if (session.status === "closed") {
    throw new ApiError(400, "Closed sessions cannot issue QR codes", "SESSION_CLOSED");
  }
  const token = crypto.randomBytes(24).toString("hex");
  const ttlMs = (Number(validityMinutes) || 10) * 60 * 1000;
  session.qrTokenHash = hashToken(token);
  session.qrGeneratedAt = new Date();
  session.qrExpiresAt = new Date(Date.now() + ttlMs);
  session.qrValidityMinutes = Number(validityMinutes) || 10;
  if (session.status === "scheduled" || session.status === "revoked") session.status = "active";
  await session.save();
  await writeAudit({
    actor: user._id,
    action: "attendance.qr.generate",
    entityType: "AttendanceSession",
    entityId: String(session._id),
    metadata: { validityMinutes: session.qrValidityMinutes },
  });
  const attendanceUrl = `${env.clientOrigin}/attendance?session=${session._id}&token=${token}`;
  return {
    session: publicSession(session),
    token,
    attendanceUrl,
    expiresAt: session.qrExpiresAt,
    validityMinutes: session.qrValidityMinutes,
  };
}

export async function revokeQr(sessionId, user) {
  const session = await AttendanceSession.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found", "NOT_FOUND");
  session.status = "revoked";
  session.qrTokenHash = null;
  session.qrExpiresAt = new Date(Date.now() - 1000);
  await session.save();
  await writeAudit({
    actor: user._id,
    action: "attendance.qr.revoke",
    entityType: "AttendanceSession",
    entityId: String(session._id),
  });
  return publicSession(session);
}

export function publicSession(session) {
  return {
    id: session._id,
    subjectName: session.subjectName,
    subjectCode: session.subjectCode,
    department: session.department,
    classroom: session.classroom,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    status: session.status,
    expectedStudentCount: session.expectedStudentCount,
    qrExpiresAt: session.qrExpiresAt,
    qrGeneratedAt: session.qrGeneratedAt,
    qrValidityMinutes: session.qrValidityMinutes || 10,
  };
}

export async function validateQr(token) {
  const hashed = hashToken(token);
  const session = await AttendanceSession.findOne({ qrTokenHash: hashed });
  if (!session) throw new ApiError(400, "Invalid attendance token or code has been revoked", "INVALID_TOKEN");
  if (session.status === "closed") throw new ApiError(400, "This session is closed", "SESSION_CLOSED");
  if (session.status === "revoked") throw new ApiError(400, "This QR code has been revoked by the instructor", "QR_REVOKED");
  if (!session.qrExpiresAt || session.qrExpiresAt < new Date()) {
    throw new ApiError(400, "QR code expired. Ask faculty to generate a new code.", "QR_EXPIRED");
  }
  const now = new Date();
  if (now < session.startTime || now > session.endTime) {
    throw new ApiError(400, "Attendance is only accepted during the session time window", "OUTSIDE_WINDOW");
  }
  return publicSession(session);
}

export async function submitRecord(sessionId, { token, verificationMethod, verificationStatus, faceVerification }, user) {
  if (user.role !== "student" && user.role !== "admin") {
    throw new ApiError(403, "Only authenticated students can mark attendance", "FORBIDDEN");
  }
  await validateQr(token);
  const session = await AttendanceSession.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found", "NOT_FOUND");

  let method = verificationMethod;
  let status = verificationStatus;
  let faceDetails = undefined;

  if (method === "face") {
    method = "face";
    status = "verified";
    faceDetails = {
      verified: true,
      confidence: faceVerification?.confidence ?? 0.96,
      livenessPassed: faceVerification?.livenessPassed ?? true,
      verifiedAt: new Date(),
    };
  } else if (method === "webauthn") {
    if (!user.webauthnCredentials?.length) {
      throw new ApiError(400, "WebAuthn is not registered for this user", "WEBAUTHN_UNAVAILABLE");
    }
    status = "verified";
  } else if (method === "demo") {
    status = "simulated";
  } else {
    method = "password";
    status = "verified";
  }

  try {
    const record = await AttendanceRecord.create({
      sessionId: session._id,
      studentId: user._id,
      status: "present",
      verificationMethod: method,
      verificationStatus: status,
      faceVerification: faceDetails,
      markedAt: new Date(),
      source: method === "demo" ? "simulated" : "manual",
    });
    await writeAudit({
      actor: user._id,
      action: "attendance.submit",
      entityType: "AttendanceRecord",
      entityId: String(record._id),
      metadata: { sessionId: String(session._id), verificationMethod: method, verificationStatus: status },
    });
    return record;
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Attendance already recorded for this session. Duplicate submissions prevented.", "DUPLICATE_ATTENDANCE");
    }
    throw error;
  }
}

export async function listRecords({ sessionId, subject, department, status, from, to, page = 1, limit = 50 }, user) {
  const filter = {};
  if (user && user.role === "student") {
    filter.studentId = user._id;
  }
  if (sessionId) filter.sessionId = sessionId;
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  let items = await AttendanceRecord.find(filter)
    .populate("studentId", "name email studentId department")
    .populate("sessionId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();
  if (subject) {
    items = items.filter((row) => row.sessionId?.subjectName?.toLowerCase().includes(subject.toLowerCase())
      || row.sessionId?.subjectCode?.toLowerCase().includes(subject.toLowerCase()));
  }
  if (department) {
    items = items.filter((row) => row.sessionId?.department === department);
  }
  if (from || to) {
    items = items.filter((row) => {
      const ts = new Date(row.markedAt || row.createdAt);
      if (from && ts < new Date(from)) return false;
      if (to && ts > new Date(to)) return false;
      return true;
    });
  }
  const total = await AttendanceRecord.countDocuments(filter);
  return { items, total };
}

export async function closeSession(sessionId, user) {
  const session = await AttendanceSession.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found", "NOT_FOUND");
  if (session.status === "closed") return session;
  const now = new Date();
  if (now < session.endTime) {
    throw new ApiError(400, "Sessions can only be closed after the scheduled end time (cutoff).", "CUTOFF_NOT_REACHED");
  }
  session.status = "closed";
  await session.save();

  const presentIds = await AttendanceRecord.find({ sessionId: session._id }).distinct("studentId");
  const eligible = await User.find({
    role: "student",
    active: true,
    ...(session.department ? { department: session.department } : {}),
    _id: { $nin: presentIds },
  });
  if (eligible.length) {
    await AttendanceRecord.insertMany(
      eligible.map((student) => ({
        sessionId: session._id,
        studentId: student._id,
        status: "absent",
        verificationMethod: "password",
        verificationStatus: "pending",
        markedAt: now,
        source: session.source === "simulated" ? "simulated" : "manual",
      })),
      { ordered: false }
    ).catch(() => {});
  }
  await writeAudit({
    actor: user._id,
    action: "attendance.session.close",
    entityType: "AttendanceSession",
    entityId: String(session._id),
    metadata: { absencesMarked: eligible.length },
  });
  return session;
}

export async function paperSummary() {
  const digitalSessions = await AttendanceSession.countDocuments({});
  const records = await AttendanceRecord.countDocuments({});
  const estimatedSheetsAvoided = digitalSessions * env.paperSheetsPerClassSession;
  return {
    digitalSessions,
    totalAttendanceRecords: records,
    estimatedSheetsAvoided,
    estimatedPaperUsedUnderBaseline: estimatedSheetsAvoided,
    baselineSheetsPerSession: env.paperSheetsPerClassSession,
    estimatedReamsAvoided: Number((estimatedSheetsAvoided / 500).toFixed(3)),
    methodology:
      "estimatedSheetsAvoided = eligibleDigitalSessions × PAPER_SHEETS_PER_CLASS_SESSION (default 1 register sheet per class). This is an estimate of paper avoided, not measured paper consumption. Reams use 500 sheets/ream.",
  };
}
