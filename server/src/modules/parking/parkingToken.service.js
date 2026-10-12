import crypto from "crypto";
import { ParkingToken } from "../../models/ParkingToken.js";
import { ParkingArea } from "../../models/ParkingArea.js";
import { ApiError } from "../../utils/ApiError.js";
import { loadEnv } from "../../config/env.js";

const env = loadEnv();

/**
 * Generate a unique digital token ID (format: TK-SVVV-2026-XXXX)
 */
function generateTokenId() {
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `TK-SVVV-2026-${randomSuffix}`;
}

/**
 * Generate a human-readable booking reference (format: BK-XXXXXX)
 */
function generateBookingReference() {
  return `BK-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

/**
 * Generate a secure signed verification signature for the QR payload
 */
function generateQRPayload(tokenData) {
  const secret = env.authSecret || "svvv-smart-campus-token-secret";
  const signatureRaw = `${tokenData.tokenId}:${tokenData.vehicleNumber}:${tokenData.slotNumber}:${tokenData.endTime}`;
  const signature = crypto.createHmac("sha256", secret).update(signatureRaw).digest("hex").substring(0, 16);

  return JSON.stringify({
    type: "SVVV_DIGITAL_PASS",
    tokenId: tokenData.tokenId,
    bookingRef: tokenData.bookingReference,
    block: tokenData.block,
    slot: tokenData.slotNumber,
    vNum: tokenData.vehicleNumber,
    vType: tokenData.vehicleType,
    validUntil: tokenData.endTime,
    sig: signature,
  });
}

/**
 * Reserve a parking slot and generate digital parking token
 */
export async function createReservation(payload, user) {
  const {
    facilityId,
    block: requestedBlock,
    slotNumber,
    vehicleNumber,
    vehicleType = "car",
    startTime = new Date(),
    durationHours = 2,
  } = payload;

  if (!slotNumber) {
    throw new ApiError(400, "Slot number is required", "MISSING_SLOT");
  }

  if (!vehicleNumber) {
    throw new ApiError(400, "Vehicle registration number is required", "MISSING_VEHICLE_NUM");
  }

  const cleanVehicleNum = vehicleNumber.trim().toUpperCase();
  const cleanSlotNum = slotNumber.trim().toUpperCase();
  const parsedDuration = Math.max(0.5, Math.min(24, Number(durationHours) || 2));
  const reservationStart = new Date(startTime);
  const reservationEnd = new Date(reservationStart.getTime() + parsedDuration * 60 * 60 * 1000);
  // Expiry is 45 mins after reservation start if unentered
  const expiryTime = new Date(reservationStart.getTime() + 45 * 60 * 1000);

  // 1. Find Parking Facility
  let area = null;
  if (facilityId) {
    area = await ParkingArea.findById(facilityId);
  } else if (requestedBlock) {
    area = await ParkingArea.findOne({ block: requestedBlock.toUpperCase() });
  }

  if (!area) {
    throw new ApiError(404, "Target parking facility or block not found", "FACILITY_NOT_FOUND");
  }

  // 2. Validate Slot Existence
  const targetSlot = area.slots.find((s) => s.slotNumber.toUpperCase() === cleanSlotNum);
  if (!targetSlot) {
    throw new ApiError(404, `Slot ${cleanSlotNum} does not exist in ${area.name}`, "SLOT_NOT_FOUND");
  }

  // 3. Prevent Double Booking / Race Conditions
  // Check for active token in database for this block & slot
  const conflictingToken = await ParkingToken.findOne({
    block: area.block,
    slotNumber: cleanSlotNum,
    status: { $in: ["RESERVED", "CHECKED_IN", "ACTIVE"] },
  });

  if (conflictingToken) {
    throw new ApiError(
      409,
      `Slot ${cleanSlotNum} in Block ${area.block} is already reserved or occupied. Please select an alternate slot.`,
      "SLOT_ALREADY_BOOKED"
    );
  }

  // Atomic update to mark slot as reserved and decrement available spaces
  const updatedArea = await ParkingArea.findOneAndUpdate(
    {
      _id: area._id,
      "slots.slotNumber": cleanSlotNum,
      "slots.status": "available",
      availableSpaces: { $gt: 0 },
    },
    {
      $set: { "slots.$.status": "reserved" },
      $inc: { availableSpaces: -1, reservedSpaces: 1 },
      lastUpdatedAt: new Date(),
    },
    { new: true }
  );

  if (!updatedArea) {
    throw new ApiError(
      409,
      `Slot ${cleanSlotNum} was just booked by another user. Please choose another slot.`,
      "SLOT_UNAVAILABLE"
    );
  }

  // 4. Calculate Pricing
  const isBike = vehicleType === "bike";
  const baseRate = isBike ? area.hourlyRateBike || 10 : area.hourlyRateCar || 20;
  const estimatedTotal = Math.min(baseRate * parsedDuration, area.dailyMaxRate || 100);

  // University admin/permit holders get pre-validated waiver
  const isPermit = user.role === "admin";
  const paymentStatus = isPermit ? "EXEMPT_PERMIT" : "PENDING";

  // 5. Generate Unique Identifiers
  let tokenId = generateTokenId();
  let bookingReference = generateBookingReference();

  // Ensure collision safety
  let attempts = 0;
  while ((await ParkingToken.exists({ tokenId })) && attempts < 5) {
    tokenId = generateTokenId();
    attempts++;
  }

  const tokenData = {
    tokenId,
    bookingReference,
    user: user.id || user._id,
    userName: user.name || "SVVV User",
    userEmail: user.email || "user@svvv.edu",
    userRole: user.role || "student",
    parkingArea: area._id,
    facilityName: area.name,
    block: area.block,
    nearestGate: area.nearestGate || "Main Gate 1",
    slotNumber: cleanSlotNum,
    vehicleNumber: cleanVehicleNum,
    vehicleType,
    startTime: reservationStart,
    expectedDurationHours: parsedDuration,
    endTime: reservationEnd,
    expiresAt: expiryTime,
    status: "RESERVED",
    pricing: {
      baseRatePerHour: baseRate,
      estimatedTotal,
      finalAmount: estimatedTotal,
      paymentStatus,
      paymentMethod: isPermit ? "UNIVERSITY_PERMIT" : "CAMPUS_UPI",
    },
  };

  tokenData.qrPayload = generateQRPayload(tokenData);

  const token = await ParkingToken.create(tokenData);
  return token;
}

/**
 * List tokens belonging to the authenticated user
 */
export async function getMyTokens(user, filters = {}) {
  const query = { user: user.id || user._id };
  if (filters.status) {
    query.status = filters.status;
  }

  const tokens = await ParkingToken.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit ? Number(filters.limit) : 50);

  return tokens;
}

/**
 * Retrieve a specific token by Token ID, Booking Reference, or Mongo ID
 */
export async function getTokenById(identifier, user) {
  if (!identifier) {
    throw new ApiError(400, "Token ID or Booking Reference is required", "MISSING_TOKEN_ID");
  }

  const token = await ParkingToken.findOne({
    $or: [{ tokenId: identifier.toUpperCase().trim() }, { bookingReference: identifier.toUpperCase().trim() }],
  });

  if (!token) {
    throw new ApiError(404, `Token '${identifier}' not found in the system.`, "TOKEN_NOT_FOUND");
  }

  // Role authorization: users can only view their own token unless admin or parkingManager
  const isPrivileged = user.role === "admin" || user.role === "parkingManager";
  if (!isPrivileged && token.user.toString() !== (user.id || user._id).toString()) {
    throw new ApiError(403, "You do not have permission to view this parking token.", "FORBIDDEN");
  }

  return token;
}

/**
 * Cancel a reserved parking token
 */
export async function cancelReservation(tokenId, reason = "User requested cancellation", user) {
  if (!tokenId) {
    throw new ApiError(400, "Token ID is required", "MISSING_TOKEN_ID");
  }

  const token = await ParkingToken.findOne({ tokenId: tokenId.toUpperCase().trim() });

  if (!token) {
    throw new ApiError(404, `Token '${tokenId}' not found.`, "TOKEN_NOT_FOUND");
  }

  const isPrivileged = user.role === "admin" || user.role === "parkingManager";
  if (!isPrivileged && token.user.toString() !== (user.id || user._id).toString()) {
    throw new ApiError(403, "You are not authorized to cancel this reservation.", "FORBIDDEN");
  }

  if (token.status !== "RESERVED") {
    throw new ApiError(
      400,
      `Cannot cancel a token with status '${token.status}'. Only RESERVED tokens can be cancelled.`,
      "CANNOT_CANCEL"
    );
  }

  token.status = "CANCELLED";
  token.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: user.id || user._id,
    reason,
  };
  await token.save();

  // Atomically release the reserved slot back to available in ParkingArea
  await ParkingArea.findOneAndUpdate(
    { _id: token.parkingArea, "slots.slotNumber": token.slotNumber },
    {
      $set: { "slots.$.status": "available" },
      $inc: { reservedSpaces: -1, availableSpaces: 1 },
      lastUpdatedAt: new Date(),
    }
  );

  return token;
}

/**
 * Gate Staff Entry Verification
 * Scans or enters token ID at campus gate, verifies validity, and checks in the vehicle
 */
export async function verifyGateEntry({ tokenId, gateId = "Main Gate 1", confirmedVehicleNumber, notes }, staffUser) {
  if (!tokenId) {
    throw new ApiError(400, "Token ID or Booking Reference is required", "MISSING_TOKEN_ID");
  }

  const token = await ParkingToken.findOne({
    $or: [{ tokenId: tokenId.toUpperCase().trim() }, { bookingReference: tokenId.toUpperCase().trim() }],
  });

  if (!token) {
    throw new ApiError(404, `Parking token '${tokenId}' was not found.`, "INVALID_TOKEN");
  }

  // Validate state transitions
  if (token.status === "COMPLETED") {
    throw new ApiError(400, "This token has already been completed and checked out.", "TOKEN_ALREADY_COMPLETED");
  }

  if (token.status === "CHECKED_IN" || token.status === "ACTIVE") {
    throw new ApiError(400, `Vehicle has already entered at ${token.checkIn?.checkedInAt?.toLocaleTimeString() || "earlier"}.`, "ALREADY_CHECKED_IN");
  }

  if (token.status === "CANCELLED") {
    throw new ApiError(400, "This parking reservation was cancelled.", "TOKEN_CANCELLED");
  }

  if (token.status === "EXPIRED") {
    throw new ApiError(400, "This parking token has expired due to late arrival.", "TOKEN_EXPIRED");
  }

  // Check if arrival is well past the expiry window
  const now = new Date();
  if (now > token.expiresAt) {
    token.status = "EXPIRED";
    await token.save();

    // Release slot back
    await ParkingArea.findOneAndUpdate(
      { _id: token.parkingArea, "slots.slotNumber": token.slotNumber },
      {
        $set: { "slots.$.status": "available" },
        $inc: { reservedSpaces: -1, availableSpaces: 1 },
        lastUpdatedAt: new Date(),
      }
    );

    throw new ApiError(400, "Reservation window has expired. The slot has been released.", "TOKEN_EXPIRED");
  }

  // Vehicle number match check if staff manually entered vehicle plate
  if (confirmedVehicleNumber) {
    const normConfirmed = confirmedVehicleNumber.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const normToken = token.vehicleNumber.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (normConfirmed !== normToken) {
      throw new ApiError(
        400,
        `Vehicle number mismatch: Pass specifies '${token.vehicleNumber}', but scanner entered '${confirmedVehicleNumber}'.`,
        "VEHICLE_MISMATCH"
      );
    }
  }

  // Transition to CHECKED_IN
  token.status = "CHECKED_IN";
  token.checkIn = {
    checkedInAt: now,
    gate: gateId,
    verifiedBy: staffUser.id || staffUser._id,
    staffName: staffUser.name || "Gate Officer",
    vehicleConfirmed: true,
    notes: notes || "Entry verified at campus gate",
  };
  await token.save();

  // Atomically update slot to occupied
  await ParkingArea.findOneAndUpdate(
    { _id: token.parkingArea, "slots.slotNumber": token.slotNumber },
    {
      $set: {
        "slots.$.status": "occupied",
        "slots.$.occupiedAt": now,
        "slots.$.occupantRole": token.userRole || "student",
      },
      $inc: { reservedSpaces: -1, occupiedSpaces: 1 },
      lastUpdatedAt: new Date(),
    }
  );

  return token;
}

/**
 * Gate Staff Exit Verification & Billing
 * Computes actual duration, overtime fees, settles payment, and releases slot
 */
export async function verifyGateExit({ tokenId, gateId = "Main Gate 1", paymentMethod = "CAMPUS_UPI", notes }, staffUser) {
  if (!tokenId) {
    throw new ApiError(400, "Token ID or Booking Reference is required", "MISSING_TOKEN_ID");
  }

  const token = await ParkingToken.findOne({
    $or: [{ tokenId: tokenId.toUpperCase().trim() }, { bookingReference: tokenId.toUpperCase().trim() }],
  });

  if (!token) {
    throw new ApiError(404, `Parking token '${tokenId}' was not found.`, "INVALID_TOKEN");
  }

  if (token.status === "COMPLETED") {
    throw new ApiError(400, "This parking session has already been completed and exited.", "ALREADY_COMPLETED");
  }

  if (token.status !== "CHECKED_IN" && token.status !== "ACTIVE" && token.status !== "RESERVED") {
    throw new ApiError(400, `Cannot exit token with status '${token.status}'. Vehicle must be checked in first.`, "INVALID_EXIT_STATE");
  }

  const exitTime = new Date();
  const startTime = token.checkIn?.checkedInAt || token.startTime;
  const actualMinutes = Math.max(1, Math.round((exitTime.getTime() - startTime.getTime()) / (60 * 1000)));
  const reservedMinutes = (token.expectedDurationHours || 2) * 60;
  const overtimeMinutes = Math.max(0, actualMinutes - reservedMinutes);

  // 15-minute grace period on exit before overtime charge applies
  let overtimeCharge = 0;
  if (overtimeMinutes > 15) {
    const billableOvertimeHours = Math.ceil((overtimeMinutes - 15) / 60);
    overtimeCharge = billableOvertimeHours * (token.pricing.baseRatePerHour || 20);
  }

  const finalAmount = (token.pricing.estimatedTotal || 0) + overtimeCharge;

  token.pricing.actualDurationMinutes = actualMinutes;
  token.pricing.overtimeMinutes = overtimeMinutes;
  token.pricing.overtimeCharge = overtimeCharge;
  token.pricing.finalAmount = finalAmount;
  token.pricing.paymentStatus = token.pricing.paymentStatus === "EXEMPT_PERMIT" ? "EXEMPT_PERMIT" : "PAID";
  token.pricing.paymentMethod = paymentMethod;
  token.pricing.paidAt = exitTime;
  token.pricing.transactionId = `TXN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  token.status = "COMPLETED";
  token.checkOut = {
    checkedOutAt: exitTime,
    gate: gateId,
    verifiedBy: staffUser.id || staffUser._id,
    staffName: staffUser.name || "Exit Gate Officer",
    notes: notes || "Exit clearance complete",
  };
  await token.save();

  // Atomically free slot back to available
  const areaUpdate = await ParkingArea.findOneAndUpdate(
    { _id: token.parkingArea, "slots.slotNumber": token.slotNumber },
    {
      $set: {
        "slots.$.status": "available",
        "slots.$.occupantRole": "none",
        "slots.$.occupiedAt": null,
      },
      $inc: { occupiedSpaces: -1, availableSpaces: 1 },
      lastUpdatedAt: new Date(),
    },
    { new: true }
  );

  return {
    token,
    receipt: {
      tokenId: token.tokenId,
      bookingReference: token.bookingReference,
      vehicleNumber: token.vehicleNumber,
      block: token.block,
      slotNumber: token.slotNumber,
      entryTime: startTime,
      exitTime,
      actualDurationMinutes: actualMinutes,
      reservedDurationHours: token.expectedDurationHours,
      overtimeMinutes,
      overtimeCharge,
      finalAmount,
      paymentStatus: token.pricing.paymentStatus,
      paymentMethod,
      transactionId: token.pricing.transactionId,
    },
  };
}

/**
 * Staff Operations Metrics & Live Gate Dashboard
 */
export async function getStaffDashboard() {
  const areas = await ParkingArea.find().lean();

  let totalCapacity = 0;
  let availableSpaces = 0;
  let occupiedSpaces = 0;
  let reservedSpaces = 0;

  for (const a of areas) {
    totalCapacity += a.totalSpaces || 0;
    availableSpaces += a.availableSpaces || 0;
    occupiedSpaces += a.occupiedSpaces || 0;
    reservedSpaces += a.reservedSpaces || 0;
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayEntries, todayExits, activeTokens, todayPaid] = await Promise.all([
    ParkingToken.countDocuments({ "checkIn.checkedInAt": { $gte: startOfDay } }),
    ParkingToken.countDocuments({ "checkOut.checkedOutAt": { $gte: startOfDay } }),
    ParkingToken.countDocuments({ status: { $in: ["RESERVED", "CHECKED_IN", "ACTIVE"] } }),
    ParkingToken.find({ "pricing.paidAt": { $gte: startOfDay } }, "pricing.finalAmount").lean(),
  ]);

  const todayRevenue = todayPaid.reduce((sum, t) => sum + (t.pricing?.finalAmount || 0), 0);

  const recentTransactions = await ParkingToken.find()
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

  return {
    overview: {
      totalCapacity,
      availableSpaces,
      occupiedSpaces,
      reservedSpaces,
      occupancyRate: totalCapacity ? Math.round(((occupiedSpaces + reservedSpaces) / totalCapacity) * 100) : 0,
    },
    activity: {
      todayEntries,
      todayExits,
      activeTokens,
      todayRevenue,
    },
    facilities: areas.map((a) => ({
      id: a._id,
      name: a.name,
      block: a.block,
      total: a.totalSpaces,
      available: a.availableSpaces,
      occupied: a.occupiedSpaces,
      reserved: a.reservedSpaces,
      rateCar: a.hourlyRateCar || 20,
      rateBike: a.hourlyRateBike || 10,
      gate: a.nearestGate || "Main Gate 1",
    })),
    recentTransactions,
  };
}
