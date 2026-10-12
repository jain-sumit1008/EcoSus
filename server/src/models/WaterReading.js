import mongoose from "mongoose";

const waterReadingSchema = new mongoose.Schema(
  {
    block: { type: String, enum: ["A", "B", "C", "D", "E"], required: true, index: true },
    meterId: { type: String, trim: true },
    consumptionLitres: { type: Number, required: true, min: 0 },
    recordedAt: { type: Date, required: true, index: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    source: { type: String, enum: ["manual", "imported", "simulated"], default: "manual" },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

waterReadingSchema.index({ block: 1, recordedAt: -1 });

export const WaterReading = mongoose.model("WaterReading", waterReadingSchema);
