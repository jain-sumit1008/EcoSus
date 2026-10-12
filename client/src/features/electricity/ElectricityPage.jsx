import { useState, useMemo } from "react";
import { Zap, DollarSign, Clock, AlertTriangle, ArrowDownRight, Lightbulb, PowerOff, Thermometer, Check } from "lucide-react";
import * as electricityApi from "../../api/electricity.api.js";
import * as dashboardApi from "../../api/dashboard.api.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import HeaderBanner from "../../components/common/HeaderBanner.jsx";
import TabsBar from "../../components/common/TabsBar.jsx";
import LoadingState from "../../components/common/LoadingState.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import TrendChart from "../../components/charts/TrendChart.jsx";
import UsageDonutChart from "../../components/charts/UsageDonutChart.jsx";
import HourlyPeakChart from "../../components/charts/HourlyPeakChart.jsx";
import { BLOCKS } from "../../constants/nav.js";

export default function ElectricityPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [readingBlock, setReadingBlock] = useState("A");
  const [readingBuilding, setReadingBuilding] = useState("Block A Academic");
  const [readingKwh, setReadingKwh] = useState("");
  const [readingTime, setReadingTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [savingReading, setSavingReading] = useState(false);

  const canWrite = ["admin", "faculty"].includes(user?.role);
  const summaryQuery = useAsync(() => dashboardApi.getSummary({}), []);
  const readingsQuery = useAsync(() => electricityApi.listReadings({ limit: 40 }), []);
  const alertsQuery = useAsync(() => electricityApi.listAlerts({ limit: 30 }), []);

  const loading = summaryQuery.loading || readingsQuery.loading || alertsQuery.loading;
  const error = summaryQuery.error || readingsQuery.error || alertsQuery.error;
  const summary = summaryQuery.data?.data;
  const alerts = alertsQuery.data?.data?.items || [];
  const readings = readingsQuery.data?.data?.items || [];

  const reloadAll = () => {
    summaryQuery.reload();
    readingsQuery.reload();
    alertsQuery.reload();
  };

  const openAlertsCount = useMemo(
    () => alerts.filter((a) => a.status !== "resolved").length,
    [alerts]
  );

  const handleSaveReading = async (e) => {
    e.preventDefault();
    if (!readingKwh || isNaN(readingKwh)) {
      toast.error("Please enter valid consumption in kWh.");
      return;
    }
    setSavingReading(true);
    try {
      const res = await electricityApi.createReading({
        block: readingBlock,
        building: readingBuilding,
        consumptionKwh: Number(readingKwh),
        recordedAt: new Date(readingTime).toISOString(),
        notes: `Manual entry by ${user?.name || "operator"}`,
        source: "manual",
      });
      if (res.data?.alert) {
        toast.error(`High electricity spike detected in Block ${readingBlock}! Alert generated.`);
      } else {
        toast.success(`Electricity reading saved for Block ${readingBlock} (${Number(readingKwh).toLocaleString()} kWh).`);
      }
      setReadingKwh("");
      reloadAll();
    } catch (err) {
      toast.error(err.message || "Failed to record reading");
    } finally {
      setSavingReading(false);
    }
  };

  const handleRecordAction = async (alertId) => {
    try {
      await electricityApi.addAlertAction(alertId, {
        title: "Load schedule review",
        description: "Checked air conditioning and lab equipment timer schedules.",
      });
      toast.success("Corrective action recorded on alert.");
      reloadAll();
    } catch (err) {
      toast.error(err.message || "Failed to record action");
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reloadAll} />;

  // Suggested actions matching reference screenshot
  const suggestedActions = [
    {
      id: "a1",
      title: "Turn off idle devices",
      desc: "Block 3 computer labs have 42 workstations in sleep mode overnight.",
      icon: PowerOff,
      action: "Notify IT Lab admin",
    },
    {
      id: "a2",
      title: "Check AC schedule",
      desc: "Block 2 auditorium chiller is set to cooling after 8:00 PM.",
      icon: Thermometer,
      action: "Set automated cutoff",
    },
    {
      id: "a3",
      title: "Replace inefficient lamps",
      desc: "Block 4 2nd floor corridor still using 40W fluorescent fixtures.",
      icon: Lightbulb,
      action: "Schedule LED retrofit",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner matching screenshot */}
      <HeaderBanner
        title="Electricity Consumption"
        subtitle="Track power usage, identify wastage and optimize energy."
        taglineTitle="Save Power"
        taglineSub="Zero Wastage Goal"
        accent="amber"
        icon={Zap}
      />

      {/* Sub Tabs */}
      <TabsBar
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "blockwise", label: "Block-wise" },
          { id: "peakhours", label: "Peak Hours" },
          { id: "alerts", label: "Alerts", count: openAlertsCount },
          { id: "reports", label: "Readings Log" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* KPI Cards matching screenshot */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Usage (Today)"
          value={summary.electricity.todayKwh.toLocaleString()}
          unit="kWh"
          change="8%"
          changeType="down"
          changeLabel="vs. last week"
          accent="amber"
          icon={Zap}
        />
        <MetricCard
          label="Est. Cost"
          value={`₹${summary.electricity.estimatedCost?.toLocaleString?.() || "1,87,200"}`}
          subtext="₹15/kWh configured tariff"
          accent="amber"
          icon={DollarSign}
          hint={summary.electricity.methodology}
        />
        <MetricCard
          label="Peak Demand"
          value="3,420 kW"
          subtext="2:00 PM – 4:00 PM"
          accent="amber"
          icon={Clock}
        />
        <MetricCard
          label="Active Anomalies"
          value={openAlertsCount}
          badge="3 unusual spikes"
          badgeColor="amber"
          accent="error"
          hint="Baseline threshold alerts"
        />
      </div>

      {/* Visualizations Section */}
      {(activeTab === "overview" || activeTab === "blockwise") && (
        <div className="grid gap-5 xl:grid-cols-2">
          {/* Electricity Usage Trend */}
          <div className="card p-5">
            <h3 className="font-bold text-ink mb-1">Electricity Usage Trend</h3>
            <p className="text-xs text-muted mb-3">Daily power consumption trend across campus</p>
            <TrendChart data={summary.electricity.trend} color="#E5A11A" unit="kWh" />
          </div>

          {/* Usage by Block Donut Chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-ink">Usage by Block</h3>
                <p className="text-xs text-muted">Campus energy consumption share per block</p>
              </div>
              <span className="text-[11px] font-semibold text-muted">Interval Total</span>
            </div>
            <UsageDonutChart
              data={summary.electricity.byBlock}
              centerLabel={`${summary.electricity.todayKwh.toLocaleString()} kWh`}
              sublabel="Today's Power"
            />
          </div>
        </div>
      )}

      {/* Peak Hour Analysis & Alerts */}
      {(activeTab === "overview" || activeTab === "peakhours" || activeTab === "alerts") && (
        <div className="grid gap-5 xl:grid-cols-12">
          {/* Peak Hour Analysis Chart (58%) */}
          <div className="card p-5 xl:col-span-7">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-ink">Peak Hour Analysis</h3>
                <p className="text-xs text-muted">Hourly campus load profile from 9:00 AM to 6:00 PM</p>
              </div>
            </div>
            <HourlyPeakChart />
          </div>

          {/* Alerts List (42%) */}
          <div className="card p-5 xl:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-ink">Recent Energy Alerts</h3>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  {openAlertsCount} Active
                </span>
              </div>

              <div className="space-y-2.5">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert._id} className="rounded-xl border border-line bg-page/50 p-3 hover:bg-amber-50/30 transition">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-ink truncate">{alert.title}</span>
                      <StatusBadge value={alert.severity} />
                    </div>
                    <p className="mt-1 text-xs text-muted">{alert.recommendation}</p>
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => handleRecordAction(alert._id)}
                        className="mt-2 text-[11px] font-bold text-amber-800 hover:text-amber-900 inline-flex items-center gap-1"
                      >
                        <span>Record corrective action →</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted italic">
              Cost & avoided emissions are calculated using configured SVVV tariff factors.
            </p>
          </div>
        </div>
      )}

      {/* Suggested Actions matching screenshot */}
      <section className="space-y-3">
        <h3 className="font-bold text-ink text-base">Suggested Actions</h3>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {suggestedActions.map((action) => {
            const Icon = action.icon;
            return (
              <div key={action.id} className="card p-4 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#E5A11A]">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-ink">{action.title}</h4>
                    <p className="mt-1 text-xs text-muted leading-relaxed">{action.desc}</p>
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => toast.success(`Action dispatched: ${action.action}`)}
                        className="btn-secondary mt-3 text-[11px] py-1 px-2.5"
                      >
                        {action.action}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add Reading Inline Bar */}
      {canWrite && (
        <form
          onSubmit={handleSaveReading}
          className="card p-4 bg-gradient-to-r from-white via-page to-white border border-line shadow-md"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-[#E5A11A]">
                <Zap size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink">Add Electricity Reading</h4>
                <p className="text-[11px] text-muted">Enter latest power meter reading for a campus facility</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-muted" htmlFor="e-block">
                  Block
                </label>
                <select
                  id="e-block"
                  className="rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-ink outline-none"
                  value={readingBlock}
                  onChange={(e) => {
                    setReadingBlock(e.target.value);
                    setReadingBuilding(`Block ${e.target.value} Academic`);
                  }}
                >
                  {BLOCKS.map((b) => (
                    <option key={b} value={b}>Block {b}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-muted" htmlFor="e-kwh">
                  Usage (kWh)
                </label>
                <input
                  id="e-kwh"
                  type="number"
                  placeholder="e.g. 2400"
                  step="0.1"
                  className="w-28 rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink outline-none"
                  value={readingKwh}
                  onChange={(e) => setReadingKwh(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-muted" htmlFor="e-time">
                  Timestamp
                </label>
                <input
                  id="e-time"
                  type="datetime-local"
                  className="rounded-xl border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={savingReading}
                className="btn-primary bg-[#B37B15] hover:bg-[#7B530E] text-xs py-2 px-4 shadow-sm"
              >
                {savingReading ? "Saving..." : "Save Reading"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Readings Log View */}
      {activeTab === "reports" && (
        <div className="card p-5">
          <h3 className="font-bold text-ink mb-3">Historical Interval Electricity Readings</h3>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-line text-muted uppercase text-[10px] font-bold sticky top-0 bg-white">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Block</th>
                  <th className="py-2.5 px-3">Building/Room</th>
                  <th className="py-2.5 px-3">Consumption</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {readings.map((r) => (
                  <tr key={r._id} className="hover:bg-page/60">
                    <td className="py-2.5 px-3">{new Date(r.recordedAt).toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-bold">Block {r.block}</td>
                    <td className="py-2.5 px-3 text-muted">{r.building || `Block ${r.block} Facility`}</td>
                    <td className="py-2.5 px-3 font-semibold text-ink">{r.consumptionKwh.toLocaleString()} kWh</td>
                    <td className="py-2.5 px-3"><StatusBadge value={r.source} /></td>
                    <td className="py-2.5 px-3 text-muted text-[11px] truncate max-w-xs">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
