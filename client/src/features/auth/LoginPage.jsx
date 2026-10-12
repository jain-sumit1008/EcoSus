import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Leaf, ShieldCheck, GraduationCap, School, Car, ArrowRight, Lock, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import CampusSilhouette from "../../components/layout/CampusSilhouette.jsx";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton.jsx";

const schema = z.object({
  email: z.string().email("Please enter a valid institutional email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const DEMO_PRESETS = [
  { role: "admin", name: "Anjali Rathore", email: "admin@svvv.edu", pass: "Admin@123", icon: ShieldCheck, title: "Campus Administrator" },
  { role: "faculty", name: "Dr. Mehta", email: "faculty@svvv.edu", pass: "Faculty@123", icon: School, title: "Faculty - CS Dept" },
  { role: "student", name: "Rahul Sharma", email: "student@svvv.edu", pass: "Student@123", icon: GraduationCap, title: "Student (BCA)" },
  { role: "parkingManager", name: "Parking Desk", email: "parking@svvv.edu", pass: "Parking@123", icon: Car, title: "Parking Manager" },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const [submitError, setSubmitError] = useState(null);
  const [selectedRole, setSelectedRole] = useState("admin");

  const activePreset = DEMO_PRESETS.find((p) => p.role === selectedRole) || DEMO_PRESETS[0];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@svvv.edu", password: "Admin@123" },
  });

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (values) => {
    try {
      setSubmitError(null);
      await login(values);
    } catch (error) {
      setSubmitError(error.message || "Failed to sign in. Verify backend is running on port 5000.");
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedRole(preset.role);
    setValue("email", preset.email);
    setValue("password", preset.pass);
    setSubmitError(null);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-12 bg-page">
      {/* Left Column (5/12): Brand Showcase & SVVV Campus Mission */}
      <div className="hidden lg:col-span-5 bg-gradient-to-b from-[#073B2C] via-[#0E513D] to-[#176B45] p-10 text-white lg:flex lg:flex-col lg:justify-between shadow-2xl relative overflow-hidden">
        {/* Background glow circle */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-emerald-300 backdrop-blur border border-white/20">
              <Leaf size={26} className="stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-tight">SVVV INDORE</p>
              <p className="text-xs uppercase tracking-widest text-emerald-300 font-semibold">
                Resource Intelligence
              </p>
            </div>
          </div>

          <div className="mt-14 space-y-3">
            <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30">
              Smart Sustainable Campus
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              EcoPulse
            </h1>
            <p className="text-sm font-medium text-emerald-100/90 leading-relaxed max-w-sm">
              Empowering Shri Vaishnav Vidyapeeth Vishwavidyalaya with automated telemetry, paperless workflows, and real-time sustainability intelligence.
            </p>
          </div>

          <div className="mt-10 space-y-3 max-w-sm">
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
              <span className="text-base">💧</span>
              <p className="text-xs font-medium text-emerald-100">Smart Water Flow & Leak Anomaly Detection</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
              <span className="text-base">⚡</span>
              <p className="text-xs font-medium text-emerald-100">Peak Demand & After-Hours Energy Monitoring</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
              <span className="text-base">📱</span>
              <p className="text-xs font-medium text-emerald-100">Paperless Attendance with Passkey Verification</p>
            </div>
          </div>
        </div>

        {/* Silhouette Footer */}
        <div className="relative z-10 pt-6">
          <CampusSilhouette />
        </div>
      </div>

      {/* Right Column (7/12): Login Form & Quick Demo Switcher */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">Sign In to EcoPulse</h2>
            <p className="mt-1 text-xs text-muted">
              Access the sustainability intelligence dashboard for SVVV Indore.
            </p>
          </div>

          {/* Role Segmented Selector for Hackathon Demo Autofill */}
          <div className="card p-5 shadow-card space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Quick Demo Access
                </span>
                <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold text-forest border border-emerald-200">
                  Autofill Credentials
                </span>
              </div>

              {/* 4-Segmented Aligned Pill Control */}
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-page p-1 border border-line">
                {DEMO_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = preset.role === selectedRole;
                  return (
                    <button
                      key={preset.role}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 text-center transition-all ${
                        isSelected
                          ? "bg-white text-forest shadow-xs font-bold border border-emerald-200"
                          : "text-muted hover:text-ink hover:bg-white/60 font-medium"
                      }`}
                    >
                      <Icon size={16} className={isSelected ? "text-forest" : "text-muted"} />
                      <span className="text-[11px] capitalize truncate w-full">
                        {preset.role === "parkingManager" ? "Staff" : preset.role}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected account summary preview banner */}
              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-mint/50 px-3 py-1.5 border border-emerald-100 text-[11px]">
                <div className="flex items-center gap-1.5 text-forest font-semibold">
                  <ShieldCheck size={14} className="shrink-0" />
                  <span className="truncate">{activePreset?.name}</span>
                </div>
                <span className="text-[10px] text-muted truncate max-w-[170px]">{activePreset?.title}</span>
              </div>
            </div>

            {/* Official Google Sign-In Option */}
            <div className="pt-1">
              <GoogleSignInButton />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-line w-full" />
              <span className="bg-card px-2.5 text-[10px] font-bold text-muted uppercase tracking-wider shrink-0">
                Or sign in with password
              </span>
              <div className="border-t border-line w-full" />
            </div>

            {/* Standard Login Form */}
            <form className="space-y-4 pt-1" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block" htmlFor="email">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-3 text-muted pointer-events-none" />
                  <input
                    id="email"
                    className="input pl-9 text-xs font-medium"
                    type="email"
                    placeholder="name@svvv.edu"
                    autoComplete="username"
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-error font-medium">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-3 text-muted pointer-events-none" />
                  <input
                    id="password"
                    className="input pl-9 text-xs font-medium"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-error font-medium">{errors.password.message}</p>}
              </div>

              {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-error font-medium">
                  {submitError}
                </div>
              )}

              <button
                className="btn-primary w-full text-xs font-bold py-3 bg-[#176B45] hover:bg-[#073B2C] shadow-md transition flex items-center justify-center gap-2"
                type="submit"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? "Authenticating..." : "Sign in to Dashboard"}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-muted">
            Shri Vaishnav Vidyapeeth Vishwavidyalaya · Indore (M.P.)
          </p>
        </div>
      </div>
    </div>
  );
}
