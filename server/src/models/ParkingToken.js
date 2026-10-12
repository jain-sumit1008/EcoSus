import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema(
  {
    baseRatePerHour: { type: Number, required: true, default: 20 },
    estimatedTotal: { type: Number, required: true, default: 20 },
    actualDurationMinutes: { type: Number, default: 0 },
    overtimeMinutes: { type: Number, default: 0 },
    overtimeCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 20 },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "EXEMPT_PERMIT"],
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      enum: ["CAMPUS_UPI", "STUDENT_WALLET", "DEBIT_CREDIT_CARD", "UNIVERSITY_PERMIT", "CASH"],
      default: "CAMPUS_UPI",
    },
    transactionId: { type: String },
    paidAt: { type: Date },
  },
  { _id: false }
);

const checkInSchema = new mongoose.Schema(
  {
    checkedInAt: { type: Date },
    gate: { type: String, default: "Main Gate 1" },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    staffName: { type: String },
    vehicleConfirmed: { type: Boolean, default: false },
    notes: { type: String },
  },
  { _id: false }
);

const checkOutSchema = new mongoose.Schema(
  {
    checkedOutAt: { type: Date },
    gate: { type: String },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    staffName: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

const parkingTokenSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userRole: { type: String, required: true },
    parkingArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingArea",
      required: true,
      index: true,
    },
    facilityName: { type: String, required: true },
    block: {
      type: String,
      enum: ["A", "B", "C", "D", "E"],
      required: true,
      index: true,
    },
    nearestGate: { type: String, default: "Main Gate 1" },
    slotNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ["car", "bike"],
      default: "car",
      required: true,
    },
    startTime: { type: Date, required: true, default: Date.now },
    expectedDurationHours: { type: Number, required: true, default: 2, min: 0.5, max: 24 },
    endTime: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: [
        "RESERVED",
        "CHECKED_IN",
        "ACTIVE",
        "EXIT_PENDING",
        "COMPLETED",
        "CANCELLED",
        "EXPIRED",
        "REJECTED",
      ],
      default: "RESERVED",
      index: true,
    },
    pricing: { type: pricingSchema, default: () => ({}) },
    checkIn: { type: checkInSchema, default: null },
    checkOut: { type: checkOutSchema, default: null },
    qrPayload: { type: String, required: true },
    cancellation: {
      cancelledAt: { type: Date },
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String },
    },
  },
  { timestamps: true }
);

// Compound index to quickly find active reservations for a given slot
parkingTokenSchema.index(
  { block: 1, slotNumber: 1, status: 1 },
  { name: "slot_active_reservation_idx" }
);

export const ParkingToken = mongoose.model("ParkingToken", parkingTokenSchema);
