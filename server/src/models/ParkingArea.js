import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    slotNumber: { type: String, required: true },
    status: { type: String, enum: ["available", "occupied", "reserved"], default: "available" },
    vehicleType: { type: String, enum: ["car", "bike"], default: "car" },
    occupantRole: { type: String, enum: ["student", "faculty", "visitor", "none"], default: "none" },
    occupiedAt: { type: Date },
  },
  { _id: false }
);

const hourlyHistorySchema = new mongoose.Schema(
  {
    hour: { type: String, required: true },
    occupancyPercent: { type: Number, required: true },
    occupied: { type: Number, required: true },
    available: { type: Number, required: true },
  },
  { _id: false }
);

const parkingAreaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    block: { type: String, enum: ["A", "B", "C", "D", "E"], index: true },
    region: { type: String, enum: ["faculty", "student", "general"], default: "general", index: true },
    nearestGate: { type: String, default: "Main Gate 1" },
    locationDescription: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    totalSpaces: { type: Number, required: true, min: 1 },
    availableSpaces: { type: Number, required: true, min: 0 },
    occupiedSpaces: { type: Number, required: true, min: 0 },
    reservedSpaces: { type: Number, required: true, min: 0, default: 0 },
    slots: { type: [slotSchema], default: [] },
    hourlyHistory: { type: [hourlyHistorySchema], default: [] },
    hourlyRateCar: { type: Number, default: 20 },
    hourlyRateBike: { type: Number, default: 10 },
    dailyMaxRate: { type: Number, default: 100 },
    gracePeriodMinutes: { type: Number, default: 15 },
    operatingHours: { type: String, default: "07:00 AM - 09:30 PM" },
    amenities: {
      type: [String],
      default: ["CCTV Surveillance", "Campus Security", "Covered Shade"],
    },
    lastUpdatedAt: { type: Date, default: Date.now },
    source: { type: String, enum: ["manual", "simulated", "integrated"], default: "manual" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

parkingAreaSchema.pre("validate", function occupancyCheck(next) {
  // If block is not specified, attempt to infer from name (e.g. "P1 - Block A" or "Block A")
  if (!this.block && this.name) {
    const match = this.name.match(/Block\s*([A-E])/i) || this.name.match(/\b([A-E])\b/i);
    if (match) this.block = match[1].toUpperCase();
  }

  const sum = this.availableSpaces + this.occupiedSpaces + this.reservedSpaces;
  if (sum !== this.totalSpaces) {
    next(new Error("available + occupied + reserved must equal totalSpaces"));
    return;
  }
  next();
});

export const ParkingArea = mongoose.model("ParkingArea", parkingAreaSchema);
