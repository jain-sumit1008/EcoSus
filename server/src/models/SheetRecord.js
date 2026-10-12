import mongoose from "mongoose";

const sheetRecordSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["paper", "digital"], required: true, index: true },
    sheetNumber: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    block: { type: String, enum: ["A", "B", "C", "D", "E"], default: "A" },
    date: { type: Date, required: true, default: Date.now },
    sessionRef: { type: mongoose.Schema.Types.ObjectId, ref: "AttendanceSession" },
    studentCount: { type: Number, required: true, min: 0, default: 0 },
    presentCount: { type: Number, min: 0, default: 0 },
    absentCount: { type: Number, min: 0, default: 0 },
    sheetsUsed: { type: Number, required: true, min: 0, default: 0 }, // For paper registers
    sheetsAvoided: { type: Number, required: true, min: 0, default: 0 }, // For digital sessions
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["active", "archived", "verified"], default: "active" },
    notes: { type: String, trim: true },
    source: { type: String, enum: ["manual", "simulated", "system"], default: "manual" },
  },
  { timestamps: true }
);

sheetRecordSchema.index({ type: 1, date: -1 });

export const SheetRecord = mongoose.model("SheetRecord", sheetRecordSchema);
