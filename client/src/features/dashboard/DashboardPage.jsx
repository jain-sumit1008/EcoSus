import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Droplets,
  Zap,
  FileText,
  CarFront,
  Leaf,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertCircle,
  Play,
  RotateCw,
  ClipboardCheck,
  ShieldCheck,
  School,
  GraduationCap,
  MapPin,
  Clock,
  CheckCircle2,
  QrCode,
  Camera,
} from "lucide-react";
import * as dashboardApi from "../../api/dashboard.api.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import LoadingState from "../../components/common/LoadingState.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import ResourceOverviewChart from "../../components/charts/ResourceOverviewChart.jsx";
import AlertList from "../../components/alerts/AlertList.jsx";

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [running, setRunning] = useState(false);

  const isAdmin = user?.role === "admin";
  const isFaculty = user?.role === "faculty";
  const isStudent = user?.role === "student";

  const { data, error, loading, reload } = useAsync(
    () => dashboardApi.getSummary({ from, to }),
    [from, to]
  );
  const summary = data?.data;

  const runDemo = async () => {
    setRunning(true);
    try {
      const result = await dashboardApi.runDemo();
      toast.success(result.message || "Demo scenario executed! Anomaly generated for Block C.");
      await reload();
    } catch (err) {
      toast.error(err.message || "Failed to execute demo scenario");
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!summary) return null;

  const campusTime = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const parkingOccupancy =
    summary.parking.total > 0
      ? Math.round((summary.parking.occupied / summary.parking.total) * 100)
      : 53;

  return (
    <div className="space-y-6">
      {/* SVVV Campus Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-r from-[#073B2C] via-[#0E513D] to-[#176B45] p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-0 h-40 w-40 rounded-full bg-emerald-300/10 blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-200">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm border border-white/10">
                <Calendar size={13} />
                <span>{campusTime} · SVVV Realtime</span>
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 border border-emerald-400/30 text-emerald-300 capitalize">
                {user?.role || "Student"} Portal
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white pt-1">
              Welcome back, {user?.name || "SVVV User"}!
            </h2>
            <p className="text-sm font-medium text-emerald-100/90 leading-relaxed">
              {isAdmin && "Campus Operations Command: Real-time telemetry, resource wastage tracking, and policy governance across Blocks A–E."}
              {isFaculty && "Faculty Academic Portal: Monitor classroom attendance, manage digital muster sheets, and view designated faculty parking."}
              {isStudent && "Student Sustainability Hub: Track your paperless attendance records and check real-time parking availability at North Gate 2."}
            </p>
          </div>

          {/* Right Banner Controls - Only Admin gets date range filter and Demo Scenario */}
          {isAdmin && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/15">
                <input
                  className="rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold text-ink outline-none"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  aria-label="From date"
                />
                <span className="text-xs text-emerald-200 font-bold">to</span>
                <input
                  className="rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold text-ink outline-none"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  aria-label="To date"
                />
              </div>

              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-[#073B2C] shadow-md transition hover:bg-emerald-50 active:scale-95 disabled:opacity-60"
                type="button"
                onClick={runDemo}
                disabled={running}
              >
                {running ? <RotateCw size={14} className="animate-spin" /> : <Play size={14} className="fill-current" />}
                <span>{running ? "Simulating..." : "Run Demo Scenario"}</span>
              </button>
            </div>
          )}

          {/* Quick Shortcuts for Student */}
          {isStudent && (
            <div className="flex items-center gap-3">
              <Link
                to="/attendance?action=scan"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-[#073B2C] shadow-md transition hover:bg-emerald-50"
              >
                <Camera size={15} />
                <span>Scan Attendance QR</span>
              </Link>
              <Link
                to="/attendance"
                className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white border border-white/20 transition hover:bg-white/20"
              >
                <ClipboardCheck size={15} />
                <span>My Attendance</span>
              </Link>
            </div>
          )}

          {/* Quick Shortcuts for Faculty */}
          {isFaculty && (
            <div className="flex items-center gap-3">
              <Link
                to="/attendance?action=generate"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-[#073B2C] shadow-md transition hover:bg-emerald-50"
              >
                <QrCode size={15} />
                <span>Generate Class QR</span>
              </Link>
              <Link
                to="/attendance"
                className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white border border-white/20 transition hover:bg-white/20"
              >
                <ClipboardCheck size={15} />
                <span>Class Records</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* KPI Metric Cards */}
      <section className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Card 1: Water Usage */}
        <MetricCard
          label="Water Consumption"
          value={summary.water.todayLitres.toLocaleString()}
          unit="L"
          change="12%"
          changeType="down"
          changeLabel="vs. baseline"
          accent="water"
          icon={Droplets}
          hint="Daily metered volume"
        />

        {/* Card 2: Electricity Usage */}
        <MetricCard
          label="Electricity Usage"
          value={summary.electricity.todayKwh.toLocaleString()}
          unit="kWh"
          change="8%"
          changeType="down"
          changeLabel="vs. baseline"
          accent="amber"
          icon={Zap}
        />

        {/* Card 3: Paper Saved */}
        <MetricCard
          label="Paper Sheets Avoided"
          value={summary.paper.estimatedSheetsAvoided.toLocaleString()}
          unit="sheets"
          subtext="≈ 2.48 reams avoided"
          accent="purple"
          icon={FileText}
          hint="100% digital sessions"
        />

        {/* Card 4: Parking Status */}
        <MetricCard
          label={isStudent ? "Student Parking (C & D)" : isFaculty ? "Faculty Parking (A & B)" : "Campus Parking"}
          value={`${parkingOccupancy}%`}
          subtext={`${summary.parking.available} available spaces`}
          accent="teal"
          icon={CarFront}
        />

        {/* Card 5: Green Coverage */}
        <MetricCard
          label="Campus Green Coverage"
          value={`${summary.greenery.averageCoveragePercent}%`}
          badge="Healthy Canopy"
          badgeColor="emerald"
          accent="primary"
          icon={Leaf}
        />
      </section>

      {/* Middle Section: Resource Overview Chart & Quick Insights */}
      <section className="grid gap-5 lg:grid-cols-12">
        {/* Left Column (65%): Resource Usage Overview */}
        <div className="card p-5 lg:col-span-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-ink">Resource Usage & Efficiency Telemetry</h3>
              <p className="text-xs text-muted">Daily water, energy and paper conservation telemetry across campus</p>
            </div>
          </div>
          <ResourceOverviewChart
            waterData={summary.water.trend}
            elecData={summary.electricity.trend}
          />
        </div>

        {/* Right Column (35%): Role-Tailored Highlights */}
        <div className="card p-5 lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-[#238B57]" />
              <h3 className="font-bold text-ink">Campus Highlights</h3>
            </div>
            <p className="text-xs text-muted mb-4">Real-time alerts, parking updates and sustainability milestones</p>

            <div className="space-y-3">
              {/* Role-Specific Item 1 */}
              {isStudent && (
                <div className="flex items-start gap-2.5 rounded-xl border border-line/60 bg-purple-50/40 p-2.5 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED] font-bold">
                    🎓
                  </span>
                  <p className="text-ink leading-relaxed">
                    Student Gate: Enter via <strong>North Gate 2</strong> for quick access to Blocks C & D parking.
                  </p>
                </div>
              )}

              {isFaculty && (
                <div className="flex items-start gap-2.5 rounded-xl border border-line/60 bg-blue-50/40 p-2.5 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#2585D8] font-bold">
                    🏛️
                  </span>
                  <p className="text-ink leading-relaxed">
                    Faculty Gate: Enter via <strong>Main Gate 1</strong> for reserved faculty parking in Blocks A & B.
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2.5 rounded-xl border border-line/60 bg-blue-50/40 p-2.5 text-xs">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#2585D8] font-bold">
                  💧
                </span>
                <p className="text-ink leading-relaxed">
                  Water usage is <strong className="text-[#2585D8]">12% lower</strong> than baseline across Blocks A and B.
                </p>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-line/60 bg-amber-50/40 p-2.5 text-xs">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[#E5A11A] font-bold">
                  ⚡
                </span>
                <p className="text-ink leading-relaxed">
                  <strong className="text-amber-800">Block C</strong> shows after-hours lab electricity load.
                </p>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-line/60 bg-emerald-50/40 p-2.5 text-xs">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#238B57] font-bold">
                  🌿
                </span>
                <p className="text-ink leading-relaxed">
                  <strong className="text-[#176B45]">Block D</strong> tree plantation scheduled for this weekend.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line text-[11px] text-muted flex items-center justify-between">
            <span>Status: SVVV Sensor Grid Live</span>
            <span className="font-semibold text-[#238B57]">Active</span>
          </div>
        </div>
      </section>

      {/* Explore Modules Grid */}
      <section className="space-y-3">
        <h3 className="font-bold text-ink text-base">Campus Modules</h3>
        <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Module 1: Attendance */}
          <Link
            to="/attendance"
            className="card p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border-line/80 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] group-hover:scale-110 transition">
              <ClipboardCheck size={20} />
            </div>
            <h4 className="mt-3 font-bold text-ink text-sm">
              {isStudent ? "My Attendance" : isFaculty ? "Attendance & QR Sessions" : "Attendance Records"}
            </h4>
            <p className="mt-1 text-xs text-muted line-clamp-2">
              {isStudent
                ? "Track personal lectures, eligibility & scan classroom QR codes"
                : isFaculty
                ? "Generate active class QR sessions & view student check-ins"
                : "Tabular student attendance records, filters, search & CSV export"}
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-bold text-[#7C3AED]">
              <span>Open module</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Module 2: Smart Parking */}
          <Link
            to="/parking"
            className="card p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border-line/80 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#0D9488] group-hover:scale-110 transition">
              <CarFront size={20} />
            </div>
            <h4 className="mt-3 font-bold text-ink text-sm">Smart Parking</h4>
            <p className="mt-1 text-xs text-muted line-clamp-2">
              SVVV Main Gate & North Gate 2 parking blocks with live slot availability
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-bold text-[#0D9488]">
              <span>Open module</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Module 3: Water (Admin / Faculty) */}
          {(isAdmin || isFaculty) && (
            <Link
              to="/water"
              className="card p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border-line/80 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#2585D8] group-hover:scale-110 transition">
                <Droplets size={20} />
              </div>
              <h4 className="mt-3 font-bold text-ink text-sm">Water Consumption</h4>
              <p className="mt-1 text-xs text-muted line-clamp-2">Flow monitoring, baseline comparison and anomaly alerts</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-[#2585D8]">
                <span>Open module</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
              </div>
            </Link>
          )}

          {/* Module 4: Greenery */}
          <Link
            to="/greenery"
            className="card p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border-line/80 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#238B57] group-hover:scale-110 transition">
              <Leaf size={20} />
            </div>
            <h4 className="mt-3 font-bold text-ink text-sm">Campus Greenery</h4>
            <p className="mt-1 text-xs text-muted line-clamp-2">Block canopy percentage, tree census and flora</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-bold text-[#238B57]">
              <span>Open module</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>
      </section>

      {/* Admin-Only Section: Alerts & Priority Interventions (Hidden for students and faculty) */}
      {isAdmin && (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink">Recent Sustainability Alerts</h3>
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-error">
                {summary.alerts.openCount} Open
              </span>
            </div>
            <AlertList items={summary.alerts.recent} />
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink">Administrative Action Pipeline</h3>
              <span className="text-xs text-muted">Operations management</span>
            </div>
            <div className="space-y-2.5">
              {summary.recentActions.slice(0, 4).map((action) => (
                <div key={action._id} className="rounded-xl border border-line bg-page/40 p-3 hover:bg-mint/30 transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink">{action.title}</span>
                    <StatusBadge value={action.priority} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{action.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
