import bcrypt from "bcrypt";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { User } from "../src/models/User.js";
import { WaterReading } from "../src/models/WaterReading.js";
import { ElectricityReading } from "../src/models/ElectricityReading.js";
import { Alert } from "../src/models/Alert.js";
import { AttendanceSession } from "../src/models/AttendanceSession.js";
import { AttendanceRecord } from "../src/models/AttendanceRecord.js";
import { ParkingArea } from "../src/models/ParkingArea.js";
import { GreeneryAssessment } from "../src/models/GreeneryAssessment.js";
import { SustainabilityAction } from "../src/models/SustainabilityAction.js";
import { SheetRecord } from "../src/models/SheetRecord.js";
import { ParkingToken } from "../src/models/ParkingToken.js";
import { env } from "../src/config/env.js";

const DEMO_TAG = "seed-v1";

async function upsertUser(data) {
  const { password, ...rest } = data;
  const passwordHash = await bcrypt.hash(password, 10);
  return User.findOneAndUpdate(
    { email: data.email },
    { ...rest, passwordHash },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

function daysAgo(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

export async function seedDemoData() {
  const admin = await upsertUser({
    name: "Anjali Rathore",
    email: "admin@svvv.edu",
    password: "Admin@123",
    role: "admin",
    allowedRoles: ["admin", "faculty", "student"],
    department: "Campus Operations",
    active: true,
  });
  const faculty = await upsertUser({
    name: "Dr. Mehta",
    email: "faculty@svvv.edu",
    password: "Faculty@123",
    role: "faculty",
    allowedRoles: ["faculty"],
    department: "Computer Science",
    active: true,
  });
  const student = await upsertUser({
    name: "Rahul Sharma",
    email: "student@svvv.edu",
    password: "Student@123",
    role: "student",
    allowedRoles: ["student"],
    studentId: "SVVV2024001",
    department: "Computer Science",
    active: true,
  });
  await upsertUser({
    name: "Priya Verma",
    email: "student2@svvv.edu",
    password: "Student@123",
    role: "student",
    allowedRoles: ["student"],
    studentId: "SVVV2024002",
    department: "Computer Science",
    active: true,
  });
  await upsertUser({
    name: "Parking Desk",
    email: "parking@svvv.edu",
    password: "Parking@123",
    role: "parkingManager",
    allowedRoles: ["parkingManager"],
    department: "Estate",
    active: true,
  });

  await WaterReading.deleteMany({ notes: DEMO_TAG });
  await ElectricityReading.deleteMany({ notes: DEMO_TAG });
  await Alert.deleteMany({ description: { $regex: DEMO_TAG } });
  await AttendanceSession.deleteMany({ classroom: { $regex: DEMO_TAG } });
  await AttendanceRecord.deleteMany({ source: "simulated" });
  await GreeneryAssessment.deleteMany({ notes: DEMO_TAG });
  await SustainabilityAction.deleteMany({ source: "simulated" });
  await ParkingArea.deleteMany({ locationDescription: { $regex: "SVVV main gate" } });

  const blocks = ["A", "B", "C", "D", "E"];
  const waterBase = { A: 12800, B: 11400, C: 10200, D: 8000, E: 5800 };
  const elecBase = { A: 3494, B: 2746, C: 2995, D: 1997, E: 1248 };

  const waterDocs = [];
  const elecDocs = [];
  for (let day = 6; day >= 0; day -= 1) {
    for (const block of blocks) {
      waterDocs.push({
        block,
        meterId: `W-${block}-01`,
        consumptionLitres: waterBase[block] + (day === 0 ? 0 : Math.round(Math.sin(day) * 350)),
        recordedAt: daysAgo(day, 9),
        recordedBy: admin._id,
        source: "simulated",
        notes: DEMO_TAG,
      });
      elecDocs.push({
        block,
        building: `Block ${block} Academic`,
        meterId: `E-${block}-01`,
        consumptionKwh: elecBase[block] + (day === 0 ? 0 : Math.round(Math.cos(day) * 90)),
        recordedAt: daysAgo(day, 18),
        recordedBy: admin._id,
        source: "simulated",
        notes: DEMO_TAG,
      });
    }
  }
  await WaterReading.insertMany(waterDocs);
  await ElectricityReading.insertMany(elecDocs);

  const coverage = { A: 85, B: 76, C: 48, D: 54, E: 62 };
  await GreeneryAssessment.insertMany(
    blocks.map((block) => ({
      block,
      coveragePercent: coverage[block],
      assessedAt: daysAgo(1, 11),
      assessedBy: admin._id,
      targetPercent: env.greeneryTargetPercent,
      notes: DEMO_TAG,
      vegetationNotes: "Demonstration visual assessment only.",
      source: "simulated",
    }))
  );

  await ParkingArea.deleteMany({});
  await SheetRecord.deleteMany({});

  const blockConfigs = [
    {
      block: "A",
      name: "Block A - Faculty Parking",
      region: "faculty",
      nearestGate: "Main Gate 1",
      locationDescription: "Dedicated parking near Administrative & CS Academic Block",
      lat: 22.824,
      lng: 75.8338,
      totalSpaces: 30,
      availableSpaces: 12,
      occupiedSpaces: 16,
      reservedSpaces: 2,
    },
    {
      block: "B",
      name: "Block B - Faculty & Staff",
      region: "faculty",
      nearestGate: "Main Gate 1",
      locationDescription: "Faculty & senior administrative staff parking near Central Library",
      lat: 22.8245,
      lng: 75.8342,
      totalSpaces: 40,
      availableSpaces: 15,
      occupiedSpaces: 23,
      reservedSpaces: 2,
    },
    {
      block: "C",
      name: "Block C - Student Parking North",
      region: "student",
      nearestGate: "North Gate 2",
      locationDescription: "Student parking for two-wheelers and four-wheelers near Science block",
      lat: 22.8248,
      lng: 75.8349,
      totalSpaces: 50,
      availableSpaces: 22,
      occupiedSpaces: 26,
      reservedSpaces: 2,
    },
    {
      block: "D",
      name: "Block D - Student Parking South",
      region: "student",
      nearestGate: "North Gate 2",
      locationDescription: "Student parking near Sports Complex & Auditorium",
      lat: 22.8238,
      lng: 75.8346,
      totalSpaces: 60,
      availableSpaces: 28,
      occupiedSpaces: 30,
      reservedSpaces: 2,
    },
    {
      block: "E",
      name: "Block E - General & Visitors",
      region: "general",
      nearestGate: "Main Gate 1",
      locationDescription: "General parking for campus visitors, parents, and temporary permits",
      lat: 22.8234,
      lng: 75.8335,
      totalSpaces: 40,
      availableSpaces: 18,
      occupiedSpaces: 20,
      reservedSpaces: 2,
    },
  ];

  for (const b of blockConfigs) {
    const slots = [];
    for (let i = 1; i <= b.totalSpaces; i++) {
      let status = "available";
      let occupantRole = "none";
      if (i <= b.occupiedSpaces) {
        status = "occupied";
        occupantRole = b.region === "faculty" ? "faculty" : b.region === "student" ? "student" : "visitor";
      } else if (i <= b.occupiedSpaces + b.reservedSpaces) {
        status = "reserved";
        occupantRole = "faculty";
      }
      slots.push({
        slotNumber: `${b.block}-${String(i).padStart(2, "0")}`,
        status,
        vehicleType: i % 3 === 0 ? "bike" : "car",
        occupantRole,
        occupiedAt: status === "occupied" ? daysAgo(0, 8 + (i % 4)) : null,
      });
    }

    const hourlyHistory = [
      { hour: "08:00", occupancyPercent: 20, occupied: Math.round(b.totalSpaces * 0.2), available: Math.round(b.totalSpaces * 0.8) },
      { hour: "09:00", occupancyPercent: 50, occupied: Math.round(b.totalSpaces * 0.5), available: Math.round(b.totalSpaces * 0.5) },
      { hour: "10:00", occupancyPercent: 85, occupied: Math.round(b.totalSpaces * 0.85), available: Math.round(b.totalSpaces * 0.15) },
      { hour: "11:00", occupancyPercent: Math.round((b.occupiedSpaces / b.totalSpaces) * 100), occupied: b.occupiedSpaces, available: b.availableSpaces },
      { hour: "12:00", occupancyPercent: 82, occupied: Math.round(b.totalSpaces * 0.82), available: Math.round(b.totalSpaces * 0.18) },
      { hour: "13:00", occupancyPercent: 75, occupied: Math.round(b.totalSpaces * 0.75), available: Math.round(b.totalSpaces * 0.25) },
      { hour: "14:00", occupancyPercent: 80, occupied: Math.round(b.totalSpaces * 0.8), available: Math.round(b.totalSpaces * 0.2) },
      { hour: "15:00", occupancyPercent: 60, occupied: Math.round(b.totalSpaces * 0.6), available: Math.round(b.totalSpaces * 0.4) },
      { hour: "16:00", occupancyPercent: 35, occupied: Math.round(b.totalSpaces * 0.35), available: Math.round(b.totalSpaces * 0.65) },
      { hour: "17:00", occupancyPercent: 15, occupied: Math.round(b.totalSpaces * 0.15), available: Math.round(b.totalSpaces * 0.85) },
    ];

    await ParkingArea.create({
      name: b.name,
      block: b.block,
      region: b.region,
      nearestGate: b.nearestGate,
      locationDescription: b.locationDescription,
      latitude: b.lat,
      longitude: b.lng,
      totalSpaces: b.totalSpaces,
      availableSpaces: b.availableSpaces,
      occupiedSpaces: b.occupiedSpaces,
      reservedSpaces: b.reservedSpaces,
      slots,
      hourlyHistory,
      lastUpdatedAt: new Date(),
      source: "simulated",
      updatedBy: admin._id,
    });
  }

  await ParkingToken.deleteMany({});
  const blockAArea = await ParkingArea.findOne({ block: "A" });
  const blockCArea = await ParkingArea.findOne({ block: "C" });

  await ParkingToken.insertMany([
    {
      tokenId: "TK-SVVV-2026-7842",
      bookingReference: "BK-902144",
      user: student._id,
      userName: student.name,
      userEmail: student.email,
      userRole: "student",
      parkingArea: blockCArea ? blockCArea._id : admin._id,
      facilityName: "Block C - Student Parking North",
      block: "C",
      nearestGate: "North Gate 2",
      slotNumber: "C-05",
      vehicleNumber: "MP-09-WA-4321",
      vehicleType: "bike",
      startTime: new Date(),
      expectedDurationHours: 3,
      endTime: new Date(Date.now() + 3 * 3600000),
      expiresAt: new Date(Date.now() + 45 * 60000),
      status: "RESERVED",
      pricing: {
        baseRatePerHour: 10,
        estimatedTotal: 30,
        finalAmount: 30,
        paymentStatus: "PENDING",
        paymentMethod: "CAMPUS_UPI",
      },
      qrPayload: JSON.stringify({
        type: "SVVV_DIGITAL_PASS",
        tokenId: "TK-SVVV-2026-7842",
        bookingRef: "BK-902144",
        block: "C",
        slot: "C-05",
        vNum: "MP-09-WA-4321",
        vType: "bike",
        validUntil: new Date(Date.now() + 3 * 3600000).toISOString(),
      }),
    },
    {
      tokenId: "TK-SVVV-2026-1930",
      bookingReference: "BK-441890",
      user: faculty._id,
      userName: faculty.name,
      userEmail: faculty.email,
      userRole: "faculty",
      parkingArea: blockAArea ? blockAArea._id : admin._id,
      facilityName: "Block A - Faculty Parking",
      block: "A",
      nearestGate: "Main Gate 1",
      slotNumber: "A-03",
      vehicleNumber: "MP-09-BC-8899",
      vehicleType: "car",
      startTime: daysAgo(0, 9),
      expectedDurationHours: 4,
      endTime: new Date(Date.now() + 2 * 3600000),
      expiresAt: new Date(Date.now() + 4 * 3600000),
      status: "CHECKED_IN",
      pricing: {
        baseRatePerHour: 20,
        estimatedTotal: 80,
        finalAmount: 80,
        paymentStatus: "PENDING",
        paymentMethod: "CAMPUS_UPI",
      },
      checkIn: {
        checkedInAt: daysAgo(0, 9),
        gate: "Main Gate 1",
        verifiedBy: admin._id,
        staffName: "Officer Sharma",
        vehicleConfirmed: true,
        notes: "Faculty RFID matched, cleared for entry",
      },
      qrPayload: JSON.stringify({
        type: "SVVV_DIGITAL_PASS",
        tokenId: "TK-SVVV-2026-1930",
        bookingRef: "BK-441890",
        block: "A",
        slot: "A-03",
        vNum: "MP-09-BC-8899",
        vType: "car",
        validUntil: new Date(Date.now() + 2 * 3600000).toISOString(),
      }),
    },
    {
      tokenId: "TK-SVVV-2026-5511",
      bookingReference: "BK-310022",
      user: student._id,
      userName: student.name,
      userEmail: student.email,
      userRole: "student",
      parkingArea: blockCArea ? blockCArea._id : admin._id,
      facilityName: "Block C - Student Parking North",
      block: "C",
      nearestGate: "North Gate 2",
      slotNumber: "C-12",
      vehicleNumber: "MP-09-WA-4321",
      vehicleType: "bike",
      startTime: daysAgo(1, 10),
      expectedDurationHours: 2,
      endTime: daysAgo(1, 12),
      expiresAt: daysAgo(1, 13),
      status: "COMPLETED",
      pricing: {
        baseRatePerHour: 10,
        estimatedTotal: 20,
        actualDurationMinutes: 110,
        overtimeMinutes: 0,
        overtimeCharge: 0,
        finalAmount: 20,
        paymentStatus: "PAID",
        paymentMethod: "CAMPUS_UPI",
        transactionId: "TXN-87AB21CC",
        paidAt: daysAgo(1, 12),
      },
      checkIn: {
        checkedInAt: daysAgo(1, 10),
        gate: "North Gate 2",
        verifiedBy: admin._id,
        staffName: "Gate Officer Verma",
        vehicleConfirmed: true,
        notes: "Morning class parking",
      },
      checkOut: {
        checkedOutAt: daysAgo(1, 12),
        gate: "North Gate 2",
        verifiedBy: admin._id,
        staffName: "Gate Officer Verma",
        notes: "Completed normal duration",
      },
      qrPayload: JSON.stringify({
        type: "SVVV_DIGITAL_PASS",
        tokenId: "TK-SVVV-2026-5511",
        bookingRef: "BK-310022",
        block: "C",
        slot: "C-12",
        vNum: "MP-09-WA-4321",
        vType: "bike",
        validUntil: daysAgo(1, 12).toISOString(),
      }),
    },
  ]);

  await SheetRecord.insertMany([
    {
      type: "paper",
      sheetNumber: "PS-2024-0001",
      title: "BCA-401 Semester Muster Register",
      department: "Computer Science",
      block: "A",
      date: daysAgo(3, 10),
      studentCount: 32,
      presentCount: 28,
      absentCount: 4,
      sheetsUsed: 2,
      sheetsAvoided: 0,
      enteredBy: faculty._id,
      status: "archived",
      notes: "Physical muster sheet filed in Department Archive Room A-102.",
      source: "simulated",
    },
    {
      type: "paper",
      sheetNumber: "PS-2024-0002",
      title: "CS-202 Database Systems Laboratory Muster",
      department: "Computer Science",
      block: "B",
      date: daysAgo(2, 14),
      studentCount: 45,
      presentCount: 41,
      absentCount: 4,
      sheetsUsed: 3,
      sheetsAvoided: 0,
      enteredBy: faculty._id,
      status: "archived",
      notes: "Paper roll ledger with manual signatures.",
      source: "simulated",
    },
    {
      type: "digital",
      sheetNumber: "DS-2024-0001",
      title: "BCA-401 Smart Attendance Session",
      department: "Computer Science",
      block: "A",
      date: daysAgo(0, 10),
      studentCount: 32,
      presentCount: 31,
      absentCount: 1,
      sheetsUsed: 0,
      sheetsAvoided: 32,
      enteredBy: faculty._id,
      status: "verified",
      notes: "Paperless QR session with face verification audit log.",
      source: "simulated",
    },
    {
      type: "digital",
      sheetNumber: "DS-2024-0002",
      title: "MCA-102 Advanced Algorithms Digital Muster",
      department: "Computer Science",
      block: "A",
      date: daysAgo(1, 11),
      studentCount: 28,
      presentCount: 27,
      absentCount: 1,
      sheetsUsed: 0,
      sheetsAvoided: 28,
      enteredBy: faculty._id,
      status: "verified",
      notes: "Fully electronic record; no paper printed.",
      source: "simulated",
    },
  ]);

  const session = await AttendanceSession.create({
    subjectName: "Computer Science",
    subjectCode: "BCA-401",
    department: "Computer Science",
    facultyId: faculty._id,
    date: daysAgo(0, 0),
    startTime: daysAgo(0, 10),
    endTime: daysAgo(0, 11),
    classroom: `BCA-401 ${DEMO_TAG}`,
    expectedStudentCount: 32,
    status: "active",
    createdBy: faculty._id,
    source: "simulated",
  });

  await AttendanceRecord.create({
    sessionId: session._id,
    studentId: student._id,
    status: "present",
    verificationMethod: "demo",
    verificationStatus: "simulated",
    markedAt: new Date(),
    source: "simulated",
  });

  await Alert.insertMany([
    {
      resourceType: "water",
      block: "A",
      title: "High usage in Block 1 (A)",
      description: `Water usage exceeded baseline by 33% ${DEMO_TAG}`,
      observedValue: 32000,
      baselineValue: 24000,
      deviationPercent: 33,
      severity: "high",
      status: "open",
      recommendation: "Inspect Block 1 meters and valve assemblies. Possible problem, not confirmed leak.",
      source: "simulated",
      detectedAt: daysAgo(0, 8),
    },
    {
      resourceType: "water",
      block: "C",
      title: "Possible leak in Block 3 (C)",
      description: `Unusual consumption rate detected ${DEMO_TAG}`,
      observedValue: 21000,
      baselineValue: 16000,
      deviationPercent: 31,
      severity: "medium",
      status: "investigating",
      recommendation: "Inspect Block 3 underground pipes and tanks.",
      source: "simulated",
      detectedAt: daysAgo(1, 14),
    },
    {
      resourceType: "electricity",
      block: "C",
      title: "High consumption in Block 3",
      description: `Possible after-hours load ${DEMO_TAG}`,
      observedValue: 3800,
      baselineValue: 2800,
      deviationPercent: 35,
      severity: "high",
      status: "open",
      recommendation: "Check lab equipment and corridor lighting after hours.",
      source: "simulated",
      detectedAt: daysAgo(0, 7),
    },
    {
      resourceType: "electricity",
      block: "B",
      title: "AC running after hours in Block 2",
      description: `Auditorium HVAC units active past schedule ${DEMO_TAG}`,
      observedValue: 3200,
      baselineValue: 2400,
      deviationPercent: 33,
      severity: "medium",
      status: "open",
      recommendation: "Review HVAC and lighting runtime schedules.",
      source: "simulated",
      detectedAt: daysAgo(1, 20),
    },
  ]);

  await SustainabilityAction.insertMany([
    {
      module: "water",
      block: "C",
      title: "Inspect Block 3 for pipe leaks",
      description: "Field team inspection scheduled for underground lines.",
      priority: "high",
      status: "in_progress",
      estimatedImpact: {
        value: 6300,
        unit: "L/day",
        methodology: "Estimated potential savings if anomaly resolved.",
      },
      createdBy: admin._id,
      source: "simulated",
    },
    {
      module: "water",
      block: "D",
      title: "Check Block 4 after-hours usage",
      description: "Verify hostel cleaning water tap valves.",
      priority: "medium",
      status: "suggested",
      createdBy: admin._id,
      source: "simulated",
    },
    {
      module: "greenery",
      block: "C",
      title: "Tree plantation drive (Block 3)",
      description: "Priority block coverage is 48% (target 60%). Plant 120 saplings.",
      priority: "high",
      status: "in_progress",
      createdBy: admin._id,
      source: "simulated",
    },
    {
      module: "greenery",
      block: "D",
      title: "Improve irrigation system (Blocks 3, 4)",
      description: "Install drip irrigation lines to conserve water while expanding coverage.",
      priority: "high",
      status: "suggested",
      createdBy: admin._id,
      source: "simulated",
    },
    {
      module: "greenery",
      block: "A",
      title: "Native plants & biodiversity (Overall campus)",
      description: "Add 26 native flower and shrub species across campus walkways.",
      priority: "medium",
      status: "completed",
      createdBy: admin._id,
      source: "simulated",
    },
  ]);

  return { admin, faculty, student };
}

if (process.argv[1] && process.argv[1].includes("seedDemoData")) {
  connectDatabase()
    .then(seedDemoData)
    .then(() => {
      console.info("Demo data seeded. Local accounts:");
      console.info("  admin@svvv.edu / Admin@123");
      console.info("  faculty@svvv.edu / Faculty@123");
      console.info("  student@svvv.edu / Student@123");
      console.info("  parking@svvv.edu / Parking@123");
    })
    .then(disconnectDatabase)
    .catch(async (error) => {
      console.error(error);
      await disconnectDatabase();
      process.exit(1);
    });
}
