import { env } from "../../config/env.js";
import { ParkingArea } from "../../models/ParkingArea.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../../models/AuditLog.js";
import { SVVV_PARKING_CONFIG } from "../../config/parkingCoordinates.js";

export function withFreshness(area) {
  const ageMs = Date.now() - new Date(area.lastUpdatedAt).getTime();
  const stale = ageMs > env.parkingStaleMinutes * 60 * 1000;
  let availabilityStatus = "available";
  if (stale) availabilityStatus = "unknown";
  else if (area.availableSpaces <= 0) availabilityStatus = "full";
  return {
    ...area,
    freshness: stale ? "stale" : area.source === "integrated" ? "live" : area.source,
    availabilityStatus,
    occupancyPercent: area.totalSpaces ? Math.round((area.occupiedSpaces / area.totalSpaces) * 100) : 0,
    mapUrl:
      Number.isFinite(area.latitude) && Number.isFinite(area.longitude)
        ? `https://www.google.com/maps?q=${area.latitude},${area.longitude}`
        : null,
  };
}

export function getBlockRestriction(blockCode, region, userRole) {
  if (userRole === "admin" || userRole === "parkingManager") {
    return { isRestricted: false, reason: null };
  }
  if (userRole === "faculty") {
    if (region === "student") {
      return { isRestricted: true, reason: "Restricted: Dedicated for Students (Blocks C & D)" };
    }
    return { isRestricted: false, reason: null };
  }
  if (userRole === "student") {
    if (region === "faculty") {
      return { isRestricted: true, reason: "Restricted: Reserved for Faculty & Staff (Blocks A & B)" };
    }
    return { isRestricted: false, reason: null };
  }
  return { isRestricted: false, reason: null };
}

export async function listAreas() {
  const items = await ParkingArea.find().sort({ name: 1 }).lean();
  return items.map(withFreshness);
}

export async function getArea(id) {
  const area = await ParkingArea.findById(id).lean();
  if (!area) throw new ApiError(404, "Parking area not found", "NOT_FOUND");
  return withFreshness(area);
}

export async function listBlocks(user) {
  const items = await ParkingArea.find().sort({ block: 1, name: 1 }).lean();
  const blocks = items.map((area) => {
    const fresh = withFreshness(area);
    const restriction = getBlockRestriction(area.block, area.region, user?.role);
    const cfg = SVVV_PARKING_CONFIG.blocks[area.block] || {};
    return {
      ...fresh,
      prefix: cfg.prefix || area.block,
      nearestGate: area.nearestGate || cfg.nearestGate || "Main Gate 1",
      coordinates: {
        lat: area.latitude ?? cfg.coordinates?.lat ?? 22.824,
        lng: area.longitude ?? cfg.coordinates?.lng ?? 75.834,
      },
      ...restriction,
    };
  });

  return {
    blocks,
    gates: SVVV_PARKING_CONFIG.gates,
    campus: SVVV_PARKING_CONFIG.campus,
    userRole: user?.role || "guest",
  };
}

export async function getBlockDetails(blockCode, user) {
  const normalized = blockCode.toUpperCase();
  let area = await ParkingArea.findOne({ block: normalized });
  if (!area) {
    // Fallback search by ID or name
    area = await ParkingArea.findById(blockCode).catch(() => null);
  }
  if (!area) throw new ApiError(404, `Parking block ${blockCode} not found`, "NOT_FOUND");

  // Ensure slots are populated if empty
  if (!area.slots || area.slots.length === 0) {
    const slots = [];
    const occupiedCount = area.occupiedSpaces;
    const reservedCount = area.reservedSpaces;
    for (let i = 1; i <= area.totalSpaces; i++) {
      let status = "available";
      let occupantRole = "none";
      if (i <= occupiedCount) {
        status = "occupied";
        occupantRole = area.region === "faculty" ? "faculty" : area.region === "student" ? "student" : "visitor";
      } else if (i <= occupiedCount + reservedCount) {
        status = "reserved";
        occupantRole = "faculty";
      }
      slots.push({
        slotNumber: `${area.block}-${String(i).padStart(2, "0")}`,
        status,
        vehicleType: i % 3 === 0 ? "bike" : "car",
        occupantRole,
        occupiedAt: status === "occupied" ? new Date(Date.now() - (i * 12) * 60 * 1000) : null,
      });
    }
    area.slots = slots;
    await area.save();
  }

  const fresh = withFreshness(area.toObject());
  const restriction = getBlockRestriction(area.block, area.region, user?.role);
  const cfg = SVVV_PARKING_CONFIG.blocks[area.block] || {};

  return {
    ...fresh,
    prefix: cfg.prefix || area.block,
    nearestGate: area.nearestGate || cfg.nearestGate || "Main Gate 1",
    coordinates: {
      lat: area.latitude ?? cfg.coordinates?.lat ?? 22.824,
      lng: area.longitude ?? cfg.coordinates?.lng ?? 75.834,
    },
    ...restriction,
  };
}

export async function updateSlotStatus(blockCode, slotNumber, payload, user) {
  const normalized = blockCode.toUpperCase();
  const area = await ParkingArea.findOne({ block: normalized });
  if (!area) throw new ApiError(404, `Parking block ${blockCode} not found`, "NOT_FOUND");

  const slot = area.slots.find((s) => s.slotNumber.toUpperCase() === slotNumber.toUpperCase());
  if (!slot) throw new ApiError(404, `Slot ${slotNumber} not found in Block ${blockCode}`, "NOT_FOUND");

  if (payload.status) slot.status = payload.status;
  if (payload.vehicleType) slot.vehicleType = payload.vehicleType;
  if (payload.occupantRole) slot.occupantRole = payload.occupantRole;
  if (payload.status === "occupied" && !slot.occupiedAt) {
    slot.occupiedAt = new Date();
  } else if (payload.status === "available") {
    slot.occupiedAt = null;
    slot.occupantRole = "none";
  }

  // Recalculate totals
  area.availableSpaces = area.slots.filter((s) => s.status === "available").length;
  area.occupiedSpaces = area.slots.filter((s) => s.status === "occupied").length;
  area.reservedSpaces = area.slots.filter((s) => s.status === "reserved").length;
  area.lastUpdatedAt = new Date();
  area.updatedBy = user._id;

  await area.save();
  await writeAudit({
    actor: user._id,
    action: "parking.slot.update",
    entityType: "ParkingArea",
    entityId: String(area._id),
    metadata: { block: area.block, slotNumber, newStatus: slot.status },
  });

  return getBlockDetails(area.block, user);
}

export async function getBlockAnalysis(selectedBlock = "A") {
  const blocks = await ParkingArea.find().sort({ block: 1 }).lean();
  const blockMap = {};
  blocks.forEach((b) => {
    blockMap[b.block] = withFreshness(b);
  });

  const target = blockMap[selectedBlock.toUpperCase()] || blocks[0] || {};

  // Standard hourly occupancy profile for campus simulation if empty
  const defaultHours = [
    { hour: "08:00", occupancyPercent: 25, occupied: Math.round(target.totalSpaces * 0.25), available: Math.round(target.totalSpaces * 0.75) },
    { hour: "09:00", occupancyPercent: 55, occupied: Math.round(target.totalSpaces * 0.55), available: Math.round(target.totalSpaces * 0.45) },
    { hour: "10:00", occupancyPercent: 88, occupied: Math.round(target.totalSpaces * 0.88), available: Math.round(target.totalSpaces * 0.12) },
    { hour: "11:00", occupancyPercent: 92, occupied: Math.round(target.totalSpaces * 0.92), available: Math.round(target.totalSpaces * 0.08) },
    { hour: "12:00", occupancyPercent: 85, occupied: Math.round(target.totalSpaces * 0.85), available: Math.round(target.totalSpaces * 0.15) },
    { hour: "13:00", occupancyPercent: 78, occupied: Math.round(target.totalSpaces * 0.78), available: Math.round(target.totalSpaces * 0.22) },
    { hour: "14:00", occupancyPercent: 82, occupied: Math.round(target.totalSpaces * 0.82), available: Math.round(target.totalSpaces * 0.18) },
    { hour: "15:00", occupancyPercent: 65, occupied: Math.round(target.totalSpaces * 0.65), available: Math.round(target.totalSpaces * 0.35) },
    { hour: "16:00", occupancyPercent: 40, occupied: Math.round(target.totalSpaces * 0.4), available: Math.round(target.totalSpaces * 0.6) },
    { hour: "17:00", occupancyPercent: 20, occupied: Math.round(target.totalSpaces * 0.2), available: Math.round(target.totalSpaces * 0.8) },
  ];

  const hourlyHistory = target.hourlyHistory && target.hourlyHistory.length > 0 ? target.hourlyHistory : defaultHours;

  const comparison = blocks.map((b) => ({
    block: b.block || b.name,
    name: b.name,
    region: b.region,
    totalSpaces: b.totalSpaces,
    occupiedSpaces: b.occupiedSpaces,
    availableSpaces: b.availableSpaces,
    reservedSpaces: b.reservedSpaces,
    occupancyPercent: b.totalSpaces ? Math.round((b.occupiedSpaces / b.totalSpaces) * 100) : 0,
    nearestGate: b.nearestGate || "Main Gate 1",
  }));

  const vehicleDistribution = {
    cars: target.slots ? target.slots.filter((s) => s.vehicleType === "car" && s.status === "occupied").length : Math.round(target.occupiedSpaces * 0.6),
    bikes: target.slots ? target.slots.filter((s) => s.vehicleType === "bike" && s.status === "occupied").length : Math.round(target.occupiedSpaces * 0.4),
  };

  return {
    selectedBlock: target.block || selectedBlock,
    blockName: target.name,
    region: target.region,
    totalSpaces: target.totalSpaces || 0,
    availableSpaces: target.availableSpaces || 0,
    occupiedSpaces: target.occupiedSpaces || 0,
    reservedSpaces: target.reservedSpaces || 0,
    occupancyPercent: target.totalSpaces ? Math.round((target.occupiedSpaces / target.totalSpaces) * 100) : 0,
    hourlyHistory,
    comparison,
    vehicleDistribution,
    peakHours: "10:00 AM - 12:30 PM",
  };
}

export async function updateOccupancy(id, payload, user) {
  const area = await ParkingArea.findById(id);
  if (!area) throw new ApiError(404, "Parking area not found", "NOT_FOUND");
  const reserved = payload.reservedSpaces ?? area.reservedSpaces;
  const sum = payload.availableSpaces + payload.occupiedSpaces + reserved;
  if (sum !== area.totalSpaces) {
    throw new ApiError(
      400,
      "availableSpaces + occupiedSpaces + reservedSpaces must equal totalSpaces",
      "CAPACITY_MISMATCH"
    );
  }
  area.availableSpaces = payload.availableSpaces;
  area.occupiedSpaces = payload.occupiedSpaces;
  area.reservedSpaces = reserved;
  area.lastUpdatedAt = new Date();
  area.updatedBy = user._id;
  if (payload.source) area.source = payload.source;
  await area.save();
  await writeAudit({
    actor: user._id,
    action: "parking.occupancy",
    entityType: "ParkingArea",
    entityId: String(area._id),
  });
  return withFreshness(area.toObject());
}
