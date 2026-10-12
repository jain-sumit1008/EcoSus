import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { setupTestApp, teardownTestApp } from "./helpers.js";
import { WaterReading } from "../src/models/WaterReading.js";
import { ElectricityReading } from "../src/models/ElectricityReading.js";
import { AttendanceSession } from "../src/models/AttendanceSession.js";
import { AttendanceRecord } from "../src/models/AttendanceRecord.js";
import { createReading } from "../src/modules/water/water.service.js";
import { createReading as createElec } from "../src/modules/electricity/electricity.service.js";
import { generateQr, submitRecord, closeSession, validateQr } from "../src/modules/attendance/attendance.service.js";
import { updateOccupancy } from "../src/modules/parking/parking.service.js";
import { ParkingArea } from "../src/models/ParkingArea.js";
import { prioritize } from "../src/modules/greenery/greenery.service.js";
import { User } from "../src/models/User.js";
import { Alert } from "../src/models/Alert.js";
import { updateAlertStatus } from "../src/modules/alerts/alerts.service.js";

let app;
let adminCookie;
let studentCookie;
let facultyCookie;

async function login(email, password) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res;
}

beforeAll(async () => {
  app = await setupTestApp();
  const admin = await login("admin@svvv.edu", "Admin@123");
  adminCookie = admin.headers["set-cookie"];
  const student = await login("student@svvv.edu", "Student@123");
  studentCookie = student.headers["set-cookie"];
  const faculty = await login("faculty@svvv.edu", "Faculty@123");
  facultyCookie = faculty.headers["set-cookie"];
});

afterAll(async () => {
  await teardownTestApp();
});

describe("health and auth", () => {
  it("returns health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("logs in with valid credentials", async () => {
    const res = await login("admin@svvv.edu", "Admin@123");
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("admin");
  });

  it("rejects invalid login", async () => {
    const res = await login("admin@svvv.edu", "wrong-password");
    expect(res.status).toBe(401);
  });
});

describe("readings and anomalies", () => {
  it("rejects negative water readings", async () => {
    const res = await request(app)
      .post("/api/water/readings")
      .set("Cookie", adminCookie)
      .send({ block: "A", consumptionLitres: -1, recordedAt: new Date().toISOString() });
    expect(res.status).toBe(400);
  });

  it("detects water anomaly vs baseline", async () => {
    await WaterReading.deleteMany({ block: "D" });
    await WaterReading.create({
      block: "D",
      consumptionLitres: 1000,
      recordedAt: new Date(Date.now() - 86400000),
      source: "simulated",
    });
    await WaterReading.create({
      block: "D",
      consumptionLitres: 1100,
      recordedAt: new Date(Date.now() - 2 * 86400000),
      source: "simulated",
    });
    await WaterReading.create({
      block: "D",
      consumptionLitres: 900,
      recordedAt: new Date(Date.now() - 3 * 86400000),
      source: "simulated",
    });
    const result = await createReading(
      { block: "D", consumptionLitres: 2000, recordedAt: new Date().toISOString(), source: "simulated" },
      { _id: (await User.findOne({ role: "admin" }))._id }
    );
    expect(result.detection.alertGenerated).toBe(true);
    expect(result.alert.source).toBe("simulated");
  });

  it("detects electricity anomaly", async () => {
    await ElectricityReading.deleteMany({ block: "E" });
    const admin = await User.findOne({ role: "admin" });
    await createElec({ block: "E", consumptionKwh: 100, recordedAt: new Date(Date.now() - 86400000).toISOString(), source: "simulated" }, admin);
    await createElec({ block: "E", consumptionKwh: 110, recordedAt: new Date(Date.now() - 2 * 86400000).toISOString(), source: "simulated" }, admin);
    await createElec({ block: "E", consumptionKwh: 90, recordedAt: new Date(Date.now() - 3 * 86400000).toISOString(), source: "simulated" }, admin);
    const result = await createElec(
      { block: "E", consumptionKwh: 300, recordedAt: new Date().toISOString(), source: "simulated" },
      admin
    );
    expect(result.detection.alertGenerated).toBe(true);
  });
});

describe("alerts", () => {
  it("transitions open -> investigating -> resolved", async () => {
    const alert = await Alert.create({
      resourceType: "water",
      block: "A",
      title: "Test",
      description: "Test",
      observedValue: 10,
      baselineValue: 5,
      deviationPercent: 100,
      severity: "high",
      status: "open",
      recommendation: "Inspect",
      source: "simulated",
    });
    const investigating = await updateAlertStatus(alert._id, { status: "investigating" }, null);
    expect(investigating.status).toBe("investigating");
    const resolved = await updateAlertStatus(alert._id, { status: "resolved", resolutionNotes: "Checked meter" }, null);
    expect(resolved.status).toBe("resolved");
  });
});

describe("attendance", () => {
  it("rejects expired QR and duplicate attendance", async () => {
    const faculty = await User.findOne({ role: "faculty" });
    const student = await User.findOne({ email: "student@svvv.edu" });
    const now = new Date();
    const session = await AttendanceSession.create({
      subjectName: "Maths",
      subjectCode: "M101",
      department: "Computer Science",
      facultyId: faculty._id,
      date: now,
      startTime: new Date(now.getTime() - 10 * 60000),
      endTime: new Date(now.getTime() + 60 * 60000),
      classroom: "R1",
      expectedStudentCount: 10,
      status: "scheduled",
      createdBy: faculty._id,
    });
    const qr = await generateQr(session._id, faculty);
    const valid = await validateQr(qr.token);
    expect(valid.subjectCode).toBe("M101");

    session.qrExpiresAt = new Date(Date.now() - 1000);
    await session.save();
    await expect(validateQr(qr.token)).rejects.toThrow(/expired/i);

    const fresh = await generateQr(session._id, faculty);
    await submitRecord(session._id, { token: fresh.token, verificationMethod: "password" }, student);
    await expect(
      submitRecord(session._id, { token: fresh.token, verificationMethod: "password" }, student)
    ).rejects.toThrow(/already recorded/i);
  });

  it("does not mark absences before cutoff", async () => {
    const faculty = await User.findOne({ role: "faculty" });
    const now = new Date();
    const session = await AttendanceSession.create({
      subjectName: "Physics",
      subjectCode: "P101",
      department: "Computer Science",
      facultyId: faculty._id,
      date: now,
      startTime: now,
      endTime: new Date(now.getTime() + 60 * 60000),
      classroom: "R2",
      expectedStudentCount: 10,
      status: "active",
      createdBy: faculty._id,
    });
    await expect(closeSession(session._id, faculty)).rejects.toThrow(/cutoff/i);
    const absents = await AttendanceRecord.countDocuments({ sessionId: session._id, status: "absent" });
    expect(absents).toBe(0);
  });
});

describe("parking, greenery, reports, authz, demo labels", () => {
  it("rejects occupancy that exceeds capacity", async () => {
    const area = await ParkingArea.findOne();
    const admin = await User.findOne({ role: "admin" });
    await expect(
      updateOccupancy(area._id, { availableSpaces: 1000, occupiedSpaces: 1000, reservedSpaces: 1000 }, admin)
    ).rejects.toThrow(/totalSpaces/i);
  });

  it("prioritizes low greenery coverage", () => {
    expect(prioritize(30, 60).priority).toBe("high");
    expect(prioritize(60, 60).priority).toBe("low");
  });

  it("returns dashboard and reports from persisted data", async () => {
    const dash = await request(app).get("/api/dashboard/summary").set("Cookie", adminCookie);
    expect(dash.status).toBe(200);
    expect(dash.body.data.water).toBeTruthy();
    const report = await request(app).get("/api/reports/summary").set("Cookie", adminCookie);
    expect(report.status).toBe(200);
    expect(report.body.data.classification).toBeTruthy();
  });

  it("blocks students from creating water readings", async () => {
    const res = await request(app)
      .post("/api/water/readings")
      .set("Cookie", studentCookie)
      .send({ block: "A", consumptionLitres: 12, recordedAt: new Date().toISOString() });
    expect(res.status).toBe(403);
  });

  it("labels demo run as simulated", async () => {
    const res = await request(app).post("/api/demo/run").set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.data.reading.source).toBe("simulated");
  });

  it("does not allow faculty-only QR from students", async () => {
    const session = await AttendanceSession.findOne();
    const res = await request(app).post(`/api/attendance/sessions/${session._id}/qr`).set("Cookie", studentCookie);
    expect(res.status).toBe(403);
  });

  it("allows faculty cookie for sessions list", async () => {
    const res = await request(app).get("/api/attendance/sessions").set("Cookie", facultyCookie);
    expect(res.status).toBe(200);
  });

  it("permits role switching only within user allowedRoles", async () => {
    // Admin has allowedRoles: ["admin", "faculty", "student"]
    const switchRes = await request(app)
      .post("/api/auth/switch-role")
      .set("Cookie", adminCookie)
      .send({ targetRole: "faculty" });
    expect(switchRes.status).toBe(200);
    expect(switchRes.body.data.user.role).toBe("faculty");

    // Ordinary student has allowedRoles: ["student"] and cannot switch to admin
    const forbiddenRes = await request(app)
      .post("/api/auth/switch-role")
      .set("Cookie", studentCookie)
      .send({ targetRole: "admin" });
    expect(forbiddenRes.status).toBe(403);

    // Switch admin back to admin
    const revertRes = await request(app)
      .post("/api/auth/switch-role")
      .set("Cookie", adminCookie)
      .send({ targetRole: "admin" });
    expect(revertRes.status).toBe(200);
    expect(revertRes.body.data.user.role).toBe("admin");
  });

  it("returns SVVV parking blocks with role-based restrictions", async () => {
    // Check student view: Block A (Faculty) should be restricted
    const studentView = await request(app).get("/api/parking/blocks").set("Cookie", studentCookie);
    expect(studentView.status).toBe(200);
    expect(studentView.body.data.blocks.length).toBeGreaterThanOrEqual(5);
    expect(studentView.body.data.gates.length).toBe(2);

    const blockA = studentView.body.data.blocks.find((b) => b.block === "A");
    expect(blockA.isRestricted).toBe(true);

    const blockC = studentView.body.data.blocks.find((b) => b.block === "C");
    expect(blockC.isRestricted).toBe(false);

    // Check parking analysis
    const analysis = await request(app).get("/api/parking/analysis?block=A").set("Cookie", adminCookie);
    expect(analysis.status).toBe(200);
    expect(analysis.body.data.analysis.hourlyHistory.length).toBeGreaterThan(0);
    expect(analysis.body.data.analysis.comparison.length).toBeGreaterThanOrEqual(5);
  });

  it("updates individual parking slot status", async () => {
    const res = await request(app)
      .patch("/api/parking/blocks/A/slots/A-01")
      .set("Cookie", adminCookie)
      .send({ status: "occupied", vehicleType: "car", occupantRole: "faculty" });
    expect(res.status).toBe(200);
    const slot = res.body.data.block.slots.find((s) => s.slotNumber === "A-01");
    expect(slot.status).toBe("occupied");
  });

  it("supports configurable QR validity and face verification attendance submission", async () => {
    const session = await AttendanceSession.findOne({ status: "active" });
    session.startTime = new Date(Date.now() - 30 * 60 * 1000);
    session.endTime = new Date(Date.now() + 60 * 60 * 1000);
    await session.save();

    const qrRes = await request(app)
      .post(`/api/attendance/sessions/${session._id}/qr`)
      .set("Cookie", facultyCookie)
      .send({ validityMinutes: 15 });
    expect(qrRes.status).toBe(200);
    expect(qrRes.body.data.validityMinutes).toBe(15);
    const token = qrRes.body.data.token;

    // Delete existing attendance record for student in this session if any
    const studentUser = await User.findOne({ email: "student@svvv.edu" });
    await AttendanceRecord.deleteMany({ sessionId: session._id, studentId: studentUser._id });

    // Submit attendance with face verification
    const submitRes = await request(app)
      .post(`/api/attendance/sessions/${session._id}/records`)
      .set("Cookie", studentCookie)
      .send({
        token,
        verificationMethod: "face",
        faceVerification: { confidence: 0.98, livenessPassed: true },
      });
    expect(submitRes.status).toBe(201);
    expect(submitRes.body.data.record.verificationMethod).toBe("face");
    expect(submitRes.body.data.record.faceVerification.verified).toBe(true);

    // Prevent duplicate submission
    const dupRes = await request(app)
      .post(`/api/attendance/sessions/${session._id}/records`)
      .set("Cookie", studentCookie)
      .send({
        token,
        verificationMethod: "face",
      });
    expect(dupRes.status).toBe(409);
  });

  it("manages paper and digital muster sheets CRUD", async () => {
    const createRes = await request(app)
      .post("/api/sheets")
      .set("Cookie", facultyCookie)
      .send({
        type: "paper",
        title: "Test Physical Muster",
        department: "Computer Science",
        block: "A",
        studentCount: 30,
        presentCount: 28,
        absentCount: 2,
        sheetsUsed: 1,
      });
    expect(createRes.status).toBe(201);
    const sheetId = createRes.body.data.sheet._id;

    const listRes = await request(app).get("/api/sheets").set("Cookie", adminCookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.length).toBeGreaterThan(0);

    const summaryRes = await request(app).get("/api/sheets/summary").set("Cookie", adminCookie);
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.totalPaperSheetsUsed).toBeGreaterThan(0);

    const deleteRes = await request(app).delete(`/api/sheets/${sheetId}`).set("Cookie", adminCookie);
    expect(deleteRes.status).toBe(200);
  });
});
