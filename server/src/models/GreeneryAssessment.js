import mongoose from "mongoose";

const greeneryAssessmentSchema = new mongoose.Schema(
  {
    block: { type: String, enum: ["A", "B", "C", "D", "E"], required: true, index: true },
    coveragePercent: { type: Number, required: true, min: 0, max: 100 },
    assessedAt: { type: Date, required: true, index: true },
    assessedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    targetPercent: { type: Number, required: true },
    notes: { type: String, trim: true },
    vegetationNotes: { type: String, trim: true },
    source: { type: String, enum: ["manual", "imported", "simulated"], default: "manual" },
  },
  { timestamps: true }
);

greeneryAssessmentSchema.index({ block: 1, assessedAt: -1 });

export const GreeneryAssessment = mongoose.model("GreeneryAssessment", greeneryAssessmentSchema);
