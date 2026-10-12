import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { setupTestApp, teardownTestApp } from "./helpers.js";
import { ParkingArea } from "../src/models/ParkingArea.js";
import { ParkingToken } from "../src/models/ParkingToken.js";

let app;
let adminCookie;
let studentCookie;

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

  // Ensure a test Parking Area for Block A exists
  await ParkingArea.deleteMany({});
  await ParkingArea.create({
    name: "Block A - Main Administrative Parking",
    block: "A",
    region: "general",
    nearestGate: "Main Gate 1",
    locationDescription: "North of Central Library and Admin Block",
    latitude: 22.8252,
    longitude: 75.8456,
    totalSpaces: 10,
    availableSpaces: 10,
    occupiedSpaces: 0,
    reservedSpaces: 0,
    hourlyRateCar: 20,
    hourlyRateBike: 10,
    dailyMaxRate: 100,
    slots: [
      { slotNumber: "A-01", status: "available", vehicleType: "car" },
      { slotNumber: "A-02", status: "available", vehicleType: "car" },
      { slotNumber: "A-03", status: "available", vehicleType: "bike" },
      { slotNumber: "A-04", status: "available", vehicleType: "car" },
    ],
  });
});

afterAll(async () => {
  await teardownTestApp();
});

describe("Smart Parking Digital Token Lifecycle & Gate Operations", () => {
  let createdTokenId;

  it("allows student to reserve a slot and receive digital token with QR payload", async () => {
    const res = await request(app)
      .post("/api/parking/tokens/reserve")
      .set("Cookie", studentCookie)
      .send({
        block: "A",
        slotNumber: "A-01",
        vehicleNumber: "MP-09-AB-1234",
        vehicleType: "car",
        durationHours: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();

    const token = res.body.data.token;
    expect(token.tokenId).toMatch(/^TK-SVVV-2026-[A-F0-9]+$/);
    expect(token.status).toBe("RESERVED");
    expect(token.slotNumber).toBe("A-01");
    expect(token.vehicleNumber).toBe("MP-09-AB-1234");
    expect(token.pricing.estimatedTotal).toBe(40);
    expect(token.qrPayload).toBeDefined();

    createdTokenId = token.tokenId;

    // Verify slot in ParkingArea is now marked 'reserved'
    const area = await ParkingArea.findOne({ block: "A" });
    const slot = area.slots.find((s) => s.slotNumber === "A-01");
    expect(slot.status).toBe("reserved");
    expect(area.reservedSpaces).toBe(1);
    expect(area.availableSpaces).toBe(9);
  });

  it("prevents double booking when another user attempts to reserve the same slot", async () => {
    const res = await request(app)
      .post("/api/parking/tokens/reserve")
      .set("Cookie", adminCookie)
      .send({
        block: "A",
        slotNumber: "A-01",
        vehicleNumber: "MP-09-CD-9999",
        vehicleType: "car",
        durationHours: 3,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("allows student to retrieve active tokens in 'my tokens'", async () => {
    const res = await request(app)
      .get("/api/parking/tokens/my")
      .set("Cookie", studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.tokens.length).toBeGreaterThanOrEqual(1);
    const pass = res.body.data.tokens.find((t) => t.tokenId === createdTokenId);
    expect(pass).toBeDefined();
    expect(pass.status).toBe("RESERVED");
  });

  it("allows retrieving token details by ID", async () => {
    const res = await request(app)
      .get(`/api/parking/tokens/${createdTokenId}`)
      .set("Cookie", studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.token.tokenId).toBe(createdTokenId);
  });

  it("gate staff successfully verifies entry check-in and updates slot to occupied", async () => {
    const res = await request(app)
      .post("/api/parking/gate/entry")
      .set("Cookie", adminCookie)
      .send({
        tokenId: createdTokenId,
        gateId: "Main Gate 1",
        confirmedVehicleNumber: "MP-09-AB-1234",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.token.status).toBe("CHECKED_IN");
    expect(res.body.data.token.checkIn.vehicleConfirmed).toBe(true);

    // Verify slot in ParkingArea transitioned to 'occupied'
    const area = await ParkingArea.findOne({ block: "A" });
    const slot = area.slots.find((s) => s.slotNumber === "A-01");
    expect(slot.status).toBe("occupied");
    expect(area.occupiedSpaces).toBe(1);
    expect(area.reservedSpaces).toBe(0);
  });

  it("rejects duplicate entry check-in for already checked-in vehicle", async () => {
    const res = await request(app)
      .post("/api/parking/gate/entry")
      .set("Cookie", adminCookie)
      .send({
        tokenId: createdTokenId,
        gateId: "Main Gate 1",
      });

    expect(res.status).toBe(400);
  });

  it("gate staff successfully verifies exit checkout, processes payment, and releases slot", async () => {
    const res = await request(app)
      .post("/api/parking/gate/exit")
      .set("Cookie", adminCookie)
      .send({
        tokenId: createdTokenId,
        gateId: "Main Gate 1",
        paymentMethod: "CAMPUS_UPI",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.token.status).toBe("COMPLETED");
    expect(res.body.data.receipt).toBeDefined();
    expect(res.body.data.receipt.paymentStatus).toBe("PAID");

    // Verify slot in ParkingArea is released back to available
    const area = await ParkingArea.findOne({ block: "A" });
    const slot = area.slots.find((s) => s.slotNumber === "A-01");
    expect(slot.status).toBe("available");
    expect(area.occupiedSpaces).toBe(0);
    expect(area.availableSpaces).toBe(10);
  });

  it("allows cancellation of a newly reserved slot and restores availability", async () => {
    // 1. Reserve slot A-02
    const reserveRes = await request(app)
      .post("/api/parking/tokens/reserve")
      .set("Cookie", studentCookie)
      .send({
        block: "A",
        slotNumber: "A-02",
        vehicleNumber: "MP-09-ZX-5555",
        vehicleType: "car",
        durationHours: 1,
      });

    expect(reserveRes.status).toBe(201);
    const tokenToCancel = reserveRes.body.data.token.tokenId;

    // 2. Cancel the reservation
    const cancelRes = await request(app)
      .post(`/api/parking/tokens/${tokenToCancel}/cancel`)
      .set("Cookie", studentCookie)
      .send({ reason: "Plans changed" });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.token.status).toBe("CANCELLED");

    // 3. Verify slot is back to available
    const area = await ParkingArea.findOne({ block: "A" });
    const slot = area.slots.find((s) => s.slotNumber === "A-02");
    expect(slot.status).toBe("available");
  });

  it("provides operational metrics on gate dashboard for staff", async () => {
    const res = await request(app)
      .get("/api/parking/gate/dashboard")
      .set("Cookie", adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.overview).toBeDefined();
    expect(res.body.data.activity).toBeDefined();
    expect(res.body.data.facilities.length).toBeGreaterThanOrEqual(1);
  });
});
