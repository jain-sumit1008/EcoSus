import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "AttendanceSession", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["present", "absent"], required: true },
    verificationMethod: { type: String, enum: ["face", "password", "webauthn", "demo"], required: true },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "simulated", "failed"],
      required: true,
    },
    faceVerification: {
      verified: { type: Boolean, default: false },
      confidence: { type: Number },
      livenessPassed: { type: Boolean, default: false },
      verifiedAt: { type: Date },
    },
    markedAt: { type: Date },
    source: { type: String, enum: ["manual", "simulated"], default: "manual" },
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model("AttendanceRecord", attendanceRecordSchema);
