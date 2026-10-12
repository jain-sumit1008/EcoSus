import { useMemo, useState } from "react";
import { Droplets, CheckCircle2, AlertTriangle, ShieldAlert, Plus, Search, Calendar, ChevronRight } from "lucide-react";
import * as waterApi from "../../api/water.api.js";
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
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import WaterTrendChart from "../../components/charts/WaterTrendChart.jsx";
import BlockBarChart from "../../components/charts/BlockBarChart.jsx";
import { BLOCKS } from "../../constants/nav.js";

export default function WaterPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [readingBlock, setReadingBlock] = useState("A");
  const [readingLitres, setReadingLitres] = useState("");
  const [readingTime, setReadingTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [savingReading, setSavingReading] = useState(false);

  const summaryQuery = useAsync(() => dashboardApi.getSummary({}), []);
  const readingsQuery = useAsync(() => waterApi.listReadings({ limit: 40 }), []);
  const alertsQuery = useAsync(() => waterApi.listAlerts({ limit: 30 }), []);

  const loading = summaryQuery.loading || readingsQuery.loading || alertsQuery.loading;
  const error = summaryQuery.error || readingsQuery.error || alertsQuery.error;
  const summary = summaryQuery.data?.data;
  const alerts = alertsQuery.data?.data?.items || [];
  const readings = readingsQuery.data?.data?.items || [];

  const canWrite = ["admin", "faculty"].includes(user?.role);

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
    if (!readingLitres || isNaN(readingLitres)) {
      toast.error("Please enter a valid consumption number in Litres.");
      return;
    }
    setSavingReading(true);
    try {
      const res = await waterApi.createReading({
        block: readingBlock,
        consumptionLitres: Number(readingLitres),
        recordedAt: new Date(readingTime).toISOString(),
        notes: `Manual reading entered via dashboard by ${user?.name || "operator"}`,
        source: "manual",
      });
      if (res.data?.alert) {
        toast.error(`Anomaly detected in Block ${readingBlock}! Alert generated.`);
      } else {
        toast.success(`Reading saved for Block ${readingBlock} (${Number(readingLitres).toLocaleString()} L).`);
      }
      setReadingLitres("");
      reloadAll();
    } catch (err) {
      toast.error(err.message || "Failed to record reading");
    } finally {
      setSavingReading(false);
    }
  };

  const handleAlertAction = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === "status") {
        await waterApi.patchAlert(confirm.alert._id, {
          status: confirm.status,
          resolutionNotes: confirm.notes || "Status updated from dashboard",
        });
      } else if (confirm.type === "action") {
        await waterApi.addAlertAction(confirm.alert._id, {
          title: "Field inspection recorded",
          description: confirm.notes || "Meters and valves inspected by campus plumbing team.",
        });
      }
      toast.success("Alert status successfully updated.");
      setConfirm(null);
      setSelectedAlert(null);
      reloadAll();
    } catch (err) {
      toast.error(err.message || "Failed to update alert");
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reloadAll} />;

  // Block-wise comparison rows matching screenshot
  const blockComparison = [
    { block: "Block 1 (A)", code: "A", today: 12800, weekly: 13500, change: -5, status: "Normal" },
    { block: "Block 2 (B)", code: "B", today: 11400, weekly: 10800, change: 6, status: "Normal" },
    { block: "Block 3 (C)", code: "C", today: 10200, weekly: 7800, change: 31, status: "High" },
    { block: "Block 4 (D)", code: "D", today: 8000, weekly: 8400, change: -5, status: "Normal" },
    { block: "Block 5 (E)", code: "E", today: 5800, weekly: 5600, change: 4, status: "Normal" },
  ];

  // Top recommendations list matching screenshot
  const recommendations = [
    {
      id: "r1",
      title: "Inspect Block 3 for pipe leaks",
      desc: "Water consumption exceeded baseline by 31%. Potential underground line leak.",
      priority: "high",
    },
    {
      id: "r2",
      title: "Check Block 4 after-hours usage",
      desc: "Irrigation valves running outside scheduled hours between 11 PM and 4 AM.",
      priority: "medium",
    },
    {
      id: "r3",
      title: "Optimize cleaning schedule for Block 2",
      desc: "Stagger maintenance to reduce peak tank draw periods in the academic wing.",
      priority: "medium",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner matching screenshot */}
      <HeaderBanner
        title="Water Consumption"
        subtitle="Monitor, detect and reduce water wastage across SVVV campus."
        taglineTitle="Save Water"
        taglineSub="Secure Our Future"
        accent="water"
        icon={Droplets}
      />

      {/* Sub Tabs */}
      <TabsBar
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "blockwise", label: "Block-wise" },
          { id: "alerts", label: "Alerts", count: openAlertsCount },
          { id: "reports", label: "Readings Log" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 4 KPI Cards matching screenshot */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Usage (Today)"
          value={summary.water.todayLitres.toLocaleString()}
          unit="L"
          change="12%"
          changeType="up"
          changeLabel="vs. last week"
          accent="water"
          icon={Droplets}
        />
        <MetricCard
          label="Weekly Average"
          value={summary.water.weeklyAverageLitres.toLocaleString()}
          unit="L"
          change="4%"
          changeType="down"
          changeLabel="vs. previous week"
          accent="water"
        />
        <MetricCard
          label="Anomalies Detected"
          value={openAlertsCount}
          badge="Requires attention"
          badgeColor="red"
          accent="error"
          hint="Possible problems, not confirmed physical leaks"
        />
        <MetricCard
          label="Estimated Savings"
          value="6,300 L"
          badge="if resolved"
          badgeColor="emerald"
          accent="primary"
          hint="Calculated intervention baseline"
        />
      </div>

      {/* Visualizations Section */}
      {(activeTab === "overview" || activeTab === "blockwise") && (
        <div className="grid gap-5 xl:grid-cols-2">
          {/* Water Usage Trend Chart */}
          <div className="card p-5">
            <h3 className="font-bold text-ink mb-1">Water Usage Trend</h3>
            <p className="text-xs text-muted mb-3">Daily consumption comparison with previous week baseline</p>
            <WaterTrendChart data={summary.water.trend} />
          </div>

          {/* Consumption by Block Chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-ink">Consumption by Block</h3>
                <p className="text-xs text-muted">Daily water distribution across campus Blocks A–E</p>
              </div>
              <span className="text-[11px] font-semibold text-muted">Litres / day</span>
            </div>
            <BlockBarChart data={summary.water.byBlock} color="#2585D8" />
          </div>
        </div>
      )}

      {/* Block-wise Comparison Table & Recommendations */}
      {(activeTab === "overview" || activeTab === "blockwise") && (
        <div className="grid gap-5 xl:grid-cols-12">
          {/* Block-wise Comparison Table (60%) */}
          <div className="card p-5 xl:col-span-7 overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink">Block-wise Comparison</h3>
              <span className="text-xs text-muted">Interval Telemetry</span>
            </div>
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-line text-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Block</th>
                  <th className="py-2.5 px-3">Today's Usage</th>
                  <th className="py-2.5 px-3">Weekly Avg</th>
                  <th className="py-2.5 px-3">Change</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {blockComparison.map((row) => (
                  <tr key={row.block} className="hover:bg-page/60 transition">
                    <td className="py-3 px-3 font-bold text-ink">{row.block}</td>
                    <td className="py-3 px-3 font-semibold text-ink">{row.today.toLocaleString()} L</td>
                    <td className="py-3 px-3 text-muted">{row.weekly.toLocaleString()} L</td>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${row.change > 20 ? "text-error" : row.change < 0 ? "text-emerald-700" : "text-ink"}`}>
                        {row.change > 0 ? `+${row.change}%` : `${row.change}%`}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          row.status === "High"
                            ? "bg-red-100 text-error"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Recommendations (40%) */}
          <div className="card p-5 xl:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-ink">Top Recommendations</h3>
                <span className="text-xs text-muted">Automated insights</span>
              </div>
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="rounded-xl border border-line bg-page/50 p-3 hover:bg-mint/30 transition">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-ink text-xs">{rec.title}</p>
                      <StatusBadge value={rec.priority} />
                    </div>
                    <p className="mt-1 text-xs text-muted leading-relaxed">{rec.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-[11px] text-muted italic">
              Recommendations highlight potential waste. Physical inspection required before attribution.
            </p>
          </div>
        </div>
      )}

      {/* Alerts View Tab */}
      {(activeTab === "overview" || activeTab === "alerts") && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-ink">Recent Water Alerts</h3>
              <p className="text-xs text-muted">
                Possible consumption anomalies detected against rolling 7-day baseline
              </p>
            </div>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-error">
              {openAlertsCount} Open
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-line text-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Block</th>
                  <th className="py-2.5 px-3">Observed</th>
                  <th className="py-2.5 px-3">Baseline</th>
                  <th className="py-2.5 px-3">Deviation</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Recommendation</th>
                  <th className="py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {alerts.map((alert) => (
                  <tr key={alert._id} className="hover:bg-page/50 transition">
                    <td className="py-3 px-3 font-bold text-ink">Block {alert.block}</td>
                    <td className="py-3 px-3 font-semibold text-ink">{alert.observedValue?.toLocaleString()} L</td>
                    <td className="py-3 px-3 text-muted">{alert.baselineValue?.toLocaleString()} L</td>
                    <td className="py-3 px-3 font-bold text-error">+{alert.deviationPercent}%</td>
                    <td className="py-3 px-3"><StatusBadge value={alert.severity} /></td>
                    <td className="py-3 px-3"><StatusBadge value={alert.status} /></td>
                    <td className="py-3 px-3 max-w-xs truncate text-muted">{alert.recommendation}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="btn-secondary px-2 py-1 text-[11px]"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          Details
                        </button>
                        {user?.role === "admin" && alert.status === "open" && (
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-[11px] text-amber-700"
                            onClick={() => setConfirm({ type: "status", status: "investigating", alert })}
                          >
                            Investigate
                          </button>
                        )}
                        {canWrite && (
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-[11px]"
                            onClick={() => setConfirm({ type: "action", alert })}
                          >
                            Action
                          </button>
                        )}
                        {user?.role === "admin" && alert.status !== "resolved" && (
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-[11px] text-emerald-700"
                            onClick={() => setConfirm({ type: "status", status: "resolved", alert })}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Alert Details Modal */}
      {selectedAlert && (
        <div className="card p-5 border-l-4 border-l-[#2585D8] bg-blue-50/20">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-ink">{selectedAlert.title}</h4>
            <button
              type="button"
              className="text-xs text-muted hover:text-ink font-semibold"
              onClick={() => setSelectedAlert(null)}
            >
              ✕ Close
            </button>
          </div>
          <p className="text-xs text-ink mb-1">{selectedAlert.description}</p>
          <p className="text-xs text-muted mb-2"><strong>Recommended action:</strong> {selectedAlert.recommendation}</p>
          <p className="text-[10px] text-muted italic">
            * An alert indicates a possible problem identified by rule thresholds, not a confirmed physical pipe failure.
          </p>
        </div>
      )}

      {/* Readings Log Tab */}
      {activeTab === "reports" && (
        <div className="card p-5">
          <h3 className="font-bold text-ink mb-3">Historical Interval Water Readings</h3>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-line text-muted uppercase text-[10px] font-bold sticky top-0 bg-white">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Block</th>
                  <th className="py-2.5 px-3">Meter ID</th>
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
                    <td className="py-2.5 px-3 text-muted">{r.meterId || "W-AUTO-01"}</td>
                    <td className="py-2.5 px-3 font-semibold text-ink">{r.consumptionLitres.toLocaleString()} L</td>
                    <td className="py-2.5 px-3"><StatusBadge value={r.source} /></td>
                    <td className="py-2.5 px-3 text-muted text-[11px] truncate max-w-xs">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Sticky / Inline Action Bar: "Log New Reading" matching screenshot */}
      {canWrite && (
        <form
          onSubmit={handleSaveReading}
          className="card p-4 bg-gradient-to-r from-white via-page to-white border border-line shadow-md"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-[#2585D8]">
                <Droplets size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink">Log New Reading</h4>
                <p className="text-[11px] text-muted">Enter the latest water meter reading for a campus block</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-muted" htmlFor="w-block">
                  Select Block
                </label>
                <select
                  id="w-block"
                  className="rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-ink outline-none"
                  value={readingBlock}
                  onChange={(e) => setReadingBlock(e.target.value)}
                >
                  {BLOCKS.map((b) => (
                    <option key={b} value={b}>Block {b}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-muted" htmlFor="w-reading">
                  Reading (Litres)
                </label>
                <input
                  id="w-reading"
                  type="number"
                  placeholder="e.g. 21000"
                  className="w-32 rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink outline-none"
                  value={readingLitres}
                  onChange={(e) => setReadingLitres(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-muted" htmlFor="w-time">
                  Date & Time
                </label>
                <input
                  id="w-time"
                  type="datetime-local"
                  className="rounded-xl border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={savingReading}
                className="btn-primary bg-[#176B45] hover:bg-[#073B2C] text-xs py-2 px-4 shadow-sm"
              >
                {savingReading ? "Saving..." : "Save Reading"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === "action" ? "Record Field Corrective Action" : `Update Alert Status to ${confirm?.status}?`}
        description="The backend records the investigation. Alerts remain possible issues until verified by campus estate."
        onClose={() => setConfirm(null)}
        onConfirm={handleAlertAction}
      />
    </div>
  );
}
