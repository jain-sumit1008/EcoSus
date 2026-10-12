import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    subjectName: { type: String, required: true, trim: true },
    subjectCode: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    classroom: { type: String, required: true, trim: true },
    expectedStudentCount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["scheduled", "active", "closed", "revoked"], default: "scheduled" },
    qrTokenHash: { type: String },
    qrExpiresAt: { type: Date },
    qrGeneratedAt: { type: Date },
    qrValidityMinutes: { type: Number, default: 30, min: 1, max: 180 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    source: { type: String, enum: ["manual", "simulated"], default: "manual" },
  },
  { timestamps: true }
);

export const AttendanceSession = mongoose.model("AttendanceSession", attendanceSessionSchema);
