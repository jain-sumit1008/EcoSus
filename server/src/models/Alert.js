import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    resourceType: { type: String, enum: ["water", "electricity"], required: true, index: true },
    relatedReading: { type: mongoose.Schema.Types.ObjectId },
    block: { type: String, enum: ["A", "B", "C", "D", "E"], required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    observedValue: { type: Number, required: true },
    baselineValue: { type: Number, required: true },
    deviationPercent: { type: Number, required: true },
    severity: { type: String, enum: ["low", "medium", "high"], required: true },
    status: { type: String, enum: ["open", "investigating", "resolved"], default: "open", index: true },
    recommendation: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    detectedAt: { type: Date, default: Date.now, index: true },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String },
    source: { type: String, enum: ["manual", "automated", "simulated"], default: "automated" },
  },
  { timestamps: true }
);

alertSchema.index({ relatedReading: 1, status: 1 });

export const Alert = mongoose.model("Alert", alertSchema);
