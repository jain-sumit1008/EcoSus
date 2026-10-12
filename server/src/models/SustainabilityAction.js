import mongoose from "mongoose";

const sustainabilityActionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: ["water", "electricity", "paper", "parking", "greenery"],
      required: true,
    },
    block: { type: String, enum: ["A", "B", "C", "D", "E"] },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["suggested", "in_progress", "completed"], default: "suggested" },
    estimatedImpact: {
      value: Number,
      unit: String,
      methodology: String,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date },
    source: { type: String, enum: ["manual", "simulated", "automated"], default: "manual" },
  },
  { timestamps: true }
);

export const SustainabilityAction = mongoose.model("SustainabilityAction", sustainabilityActionSchema);
