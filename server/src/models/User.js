import mongoose from "mongoose";

const webauthnCredentialSchema = new mongoose.Schema(
  {
    credentialID: { type: String, required: true },
    credentialPublicKey: { type: String, required: true },
    counter: { type: Number, default: 0 },
    transports: [{ type: String }],
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ["admin", "faculty", "student", "parkingManager"],
      required: true,
    },
    allowedRoles: {
      type: [String],
      enum: ["admin", "faculty", "student", "parkingManager"],
      default: function () {
        return this && this.role ? [this.role] : [];
      },
    },
    studentId: { type: String, unique: true, sparse: true, trim: true },
    department: { type: String, trim: true },
    active: { type: Boolean, default: true },
    webauthnCredentials: { type: [webauthnCredentialSchema], default: [] },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  if (!this.allowedRoles || this.allowedRoles.length === 0) {
    this.allowedRoles = [this.role];
  }
  next();
});

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    allowedRoles: this.allowedRoles && this.allowedRoles.length ? this.allowedRoles : [this.role],
    studentId: this.studentId,
    department: this.department,
    active: this.active,
    hasWebAuthn: Boolean(this.webauthnCredentials?.length),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User = mongoose.model("User", userSchema);
