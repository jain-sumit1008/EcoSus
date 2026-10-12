import { useState } from "react";
import { FileBarChart, Download, Filter, Droplets, Zap, FileText, Car, Leaf, CheckCircle2, ShieldAlert } from "lucide-react";
import * as reportsApi from "../../api/reports.api.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useToast } from "../../context/ToastContext.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import HeaderBanner from "../../components/common/HeaderBanner.jsx";
import LoadingState from "../../components/common/LoadingState.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { BLOCKS } from "../../constants/nav.js";

export default function ReportsPage() {
  const toast = useToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [block, setBlock] = useState("");
  const [exporting, setExporting] = useState(null);

  const { data, error, loading, reload } = useAsync(
    () => reportsApi.getSummary({ from, to, block }),
    [from, to, block]
  );
  const report = data?.data;

  const handleExportCsv = async (dataset) => {
    setExporting(dataset);
    try {
      await reportsApi.exportCsv({ dataset, from, to, block });
      toast.success(`${dataset.toUpperCase()} CSV report generated & downloaded.`);
    } catch (err) {
      toast.error(err.message || `Failed to export ${dataset} CSV`);
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <HeaderBanner
        title="Sustainability Reports & Audit"
        subtitle="Consolidated campus resource consumption, verified metrics, and dataset export."
        taglineTitle="Export & Audit"
        taglineSub="Verified Data Log"
        accent="emerald"
        icon={FileBarChart}
      />

      {/* Filter Bar & Export Actions */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-muted">From:</span>
            <input
              className="rounded-xl border border-line bg-page px-2.5 py-1.5 text-xs text-ink outline-none"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-label="From date"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-muted">To:</span>
            <input
              className="rounded-xl border border-line bg-page px-2.5 py-1.5 text-xs text-ink outline-none"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-label="To date"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-muted">Block:</span>
            <select
              className="rounded-xl border border-line bg-page px-2.5 py-1.5 text-xs font-semibold text-ink outline-none"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              aria-label="Campus block"
            >
              <option value="">All Blocks (A–E)</option>
              {BLOCKS.map((item) => (
                <option key={item} value={item}>Block {item}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CSV Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {["water", "electricity", "alerts", "attendance"].map((dataset) => (
            <button
              key={dataset}
              type="button"
              disabled={Boolean(exporting)}
              onClick={() => handleExportCsv(dataset)}
              className="btn-secondary text-xs capitalize py-1.5 px-3 flex items-center gap-1.5 shadow-2xs"
            >
              <Download size={13} className="text-muted" />
              <span>{exporting === dataset ? "Exporting..." : `${dataset} CSV`}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cross-Module KPI Cards */}
      <div className="grid gap-3.5 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Water Usage" value={report.water.todayLitres.toLocaleString()} unit="L" accent="water" icon={Droplets} />
        <MetricCard label="Electricity" value={report.electricity.todayKwh.toLocaleString()} unit="kWh" accent="amber" icon={Zap} />
        <MetricCard label="Paper Avoided" value={report.paper.estimatedSheetsAvoided.toLocaleString()} unit="sheets" accent="purple" icon={FileText} />
        <MetricCard label="Sessions" value={report.attendance.sessionsInRange} accent="primary" />
        <MetricCard label="Parking Free" value={report.parking.available} unit="spaces" accent="teal" icon={Car} />
        <MetricCard label="Greenery Avg" value={`${report.greenery.averageCoveragePercent}%`} accent="primary" icon={Leaf} />
      </div>

      {/* Data Quality & Classification Section */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Classification Mapping (60%) */}
        <div className="card p-5 lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#238B57]" />
            <h3 className="font-bold text-ink">Metric Classification & Methodology</h3>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Per campus auditing criteria, the system distinguishes between direct interval telemetry,
            calculated estimates, simulated demo rows, and verified physical actions:
          </p>

          <div className="space-y-2 pt-2">
            {Object.entries(report.classification || {}).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-line bg-page/50 p-2.5 text-xs flex items-start gap-2">
                <span className="font-bold text-ink uppercase tracking-wide min-w-28 text-[11px]">{key}:</span>
                <span className="text-muted">{value}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted italic pt-2">
            * Note on export formats: CSV is directly implemented and stream-ready. PDF / Excel exports are reserved for institution enterprise reporting.
          </p>
        </div>

        {/* Corrective Actions Log (40%) */}
        <div className="card p-5 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink">Corrective Actions Pipeline</h3>
              <span className="text-xs text-muted">Audited</span>
            </div>

            <div className="space-y-2.5">
              {(report.correctiveActions || []).map((action) => (
                <div key={action._id} className="rounded-xl border border-line bg-page/50 p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-ink">{action.title}</span>
                    <StatusBadge value={action.status} />
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">{action.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line text-xs text-muted flex items-center justify-between">
            <span>Open Alerts: <strong>{report.alerts.openCount}</strong></span>
            <span>Resolved: <strong className="text-emerald-700">{report.alerts.resolvedCount}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
