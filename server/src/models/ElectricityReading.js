import mongoose from "mongoose";

const electricityReadingSchema = new mongoose.Schema(
  {
    block: { type: String, enum: ["A", "B", "C", "D", "E"], required: true, index: true },
    building: { type: String, trim: true },
    meterId: { type: String, trim: true },
    consumptionKwh: { type: Number, required: true, min: 0 },
    recordedAt: { type: Date, required: true, index: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    source: { type: String, enum: ["manual", "imported", "simulated"], default: "manual" },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

electricityReadingSchema.index({ block: 1, recordedAt: -1 });

export const ElectricityReading = mongoose.model("ElectricityReading", electricityReadingSchema);
