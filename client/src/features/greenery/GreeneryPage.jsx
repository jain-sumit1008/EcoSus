import { useState } from "react";
import { Leaf, Trees, Sprout, CheckCircle2, AlertTriangle, Plus, Check } from "lucide-react";
import * as greeneryApi from "../../api/greenery.api.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import HeaderBanner from "../../components/common/HeaderBanner.jsx";
import TabsBar from "../../components/common/TabsBar.jsx";
import LoadingState from "../../components/common/LoadingState.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import BlockBarChart from "../../components/charts/BlockBarChart.jsx";
import CampusGreeneryMap from "../../components/greenery/CampusGreeneryMap.jsx";
import { BLOCKS } from "../../constants/nav.js";

export default function GreeneryPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Assessment form state
  const [assessBlock, setAssessBlock] = useState("C");
  const [coverageVal, setCoverageVal] = useState("48");
  const [assessDate, setAssessDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [assessNotes, setAssessNotes] = useState("");
  const [savingAssess, setSavingAssess] = useState(false);

  const canWrite = ["admin", "faculty"].includes(user?.role);
  const blocksQuery = useAsync(() => greeneryApi.listBlocks(), []);
  const actionsQuery = useAsync(() => greeneryApi.listActions(), []);

  const loading = blocksQuery.loading || actionsQuery.loading;
  const error = blocksQuery.error || actionsQuery.error;
  const payload = blocksQuery.data?.data;
  const actions = actionsQuery.data?.data?.items || [];
  const blocks = payload?.blocks || [];

  const reloadAll = () => {
    blocksQuery.reload();
    actionsQuery.reload();
  };

  const handleSaveAssessment = async (e) => {
    e.preventDefault();
    setSavingAssess(true);
    try {
      await greeneryApi.createAssessment({
        block: assessBlock,
        coveragePercent: Number(coverageVal),
        assessedAt: new Date(assessDate).toISOString(),
        notes: assessNotes || "Field survey visual assessment",
      });
      toast.success(`Greenery assessment recorded for Block ${assessBlock} (${coverageVal}%).`);
      setAssessNotes("");
      reloadAll();
    } catch (err) {
      toast.error(err.message || "Failed to record assessment");
    } finally {
      setSavingAssess(false);
    }
  };

  const handleCompleteAction = async (actionId) => {
    try {
      await greeneryApi.patchAction(actionId, { status: "completed" });
      toast.success("Action marked as completed!");
      reloadAll();
    } catch (err) {
      toast.error(err.message || "Failed to update action");
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reloadAll} />;

  // Priority blocks list matching reference screenshot
  const priorityBlocks = [
    { rank: 1, block: "Block 3", coverage: 48, status: "Low greenery", tip: "Plant more trees & shrubs", color: "text-error" },
    { rank: 2, block: "Block 4", coverage: 54, status: "Low greenery", tip: "Add ground cover & native plants", color: "text-amber-600" },
    { rank: 3, block: "Block 5", coverage: 62, status: "Low greenery", tip: "Increase tree shade & flora", color: "text-amber-600" },
  ];

  // Bar chart formatted data
  const chartData = [
    { block: "Block 1", value: 85 },
    { block: "Block 2", value: 76 },
    { block: "Block 3", value: 48 },
    { block: "Block 4", value: 54 },
    { block: "Block 5", value: 62 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner matching screenshot */}
      <HeaderBanner
        title="Greenery & Biodiversity"
        subtitle="Monitor green cover, promote biodiversity, build a healthier campus."
        taglineTitle="More Green"
        taglineSub="Better Tomorrow"
        accent="emerald"
        icon={Leaf}
      />

      {/* Sub Tabs */}
      <TabsBar
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "blocks", label: "Block Analysis" },
          { id: "map", label: "Campus Map" },
          { id: "recommendations", label: "Recommendations & Actions", count: actions.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 3 KPI Cards matching screenshot */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-3">
        <MetricCard
          label="Total Green Cover"
          value="72%"
          change="3%"
          changeType="down"
          changeLabel="vs. last year"
          accent="primary"
          icon={Leaf}
        />
        <MetricCard
          label="Trees Count"
          value="1,245"
          subtext="Geo-tagged botanical census"
          accent="primary"
          icon={Trees}
        />
        <MetricCard
          label="Biodiversity Index"
          value="Good"
          badge="26 species added"
          badgeColor="emerald"
          accent="primary"
          icon={Sprout}
        />
      </div>

      {/* Visualizations Section: Block-wise Greenery (Left) & Campus Map (Right) */}
      {(activeTab === "overview" || activeTab === "blocks" || activeTab === "map") && (
        <div className="grid gap-5 xl:grid-cols-2">
          {/* Block-wise Greenery Bar Chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-ink">Block-wise Greenery</h3>
                <p className="text-xs text-muted">Estimated vegetation canopy percentage per block</p>
              </div>
              <span className="text-xs font-bold text-[#176B45]">Target: {payload.targetPercent || 60}%</span>
            </div>
            <BlockBarChart data={chartData} color="#238B57" />
          </div>

          {/* Campus Map Schematic View */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-ink">Campus Greenery Map</h3>
                <p className="text-xs text-muted">SVVV aerial zone layout color-coded by canopy density</p>
              </div>
            </div>
            <CampusGreeneryMap blocks={blocks} />
          </div>
        </div>
      )}

      {/* Lower Section: Priority Blocks for Improvement (Left) & Suggested Actions (Right) */}
      {(activeTab === "overview" || activeTab === "recommendations") && (
        <div className="grid gap-5 xl:grid-cols-12">
          {/* Priority Blocks for Improvement (50%) */}
          <div className="card p-5 xl:col-span-6 space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="font-bold text-ink text-sm">Priority Blocks for Improvement</h3>
              <span className="text-xs text-muted font-medium">Ranked by shortfall</span>
            </div>

            <div className="space-y-3">
              {priorityBlocks.map((item) => (
                <div
                  key={item.rank}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-page/50 p-3 hover:bg-mint/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-line text-xs font-black text-ink shadow-2xs">
                      {item.rank}
                    </span>
                    <div>
                      <p className="font-bold text-ink text-xs">
                        {item.block} · <span className={item.color}>{item.status} ({item.coverage}%)</span>
                      </p>
                      <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                        <span>→ {item.tip}</span>
                      </p>
                    </div>
                  </div>
                  <span className="rounded bg-red-100 text-error px-2 py-0.5 text-[10px] font-bold">
                    Priority
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Actions (50%) */}
          <div className="card p-5 xl:col-span-6 space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="font-bold text-ink text-sm">Suggested Botanical Actions</h3>
              <span className="text-xs text-muted font-medium">{actions.length} Interventions</span>
            </div>

            <div className="space-y-2.5">
              {actions.map((act) => (
                <div
                  key={act._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-page/50 p-3 hover:bg-mint/30 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-ink text-xs">{act.title}</p>
                      <StatusBadge value={act.status} />
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">{act.description}</p>
                  </div>

                  {canWrite && act.status !== "completed" && (
                    <button
                      type="button"
                      onClick={() => handleCompleteAction(act._id)}
                      className="btn-secondary text-[11px] py-1 px-2.5 shrink-0 flex items-center gap-1"
                    >
                      <Check size={12} />
                      <span>Complete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Record Assessment Inline Bar */}
      {canWrite && (
        <form
          onSubmit={handleSaveAssessment}
          className="card p-4 bg-gradient-to-r from-white via-page to-white border border-line shadow-md"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-[#238B57]">
                <Sprout size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink">Record Canopy Assessment</h4>
                <p className="text-[11px] text-muted">Update vegetative ground coverage survey for a campus block</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-muted" htmlFor="g-block">
                  Block
                </label>
                <select
                  id="g-block"
                  className="rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-ink outline-none"
                  value={assessBlock}
                  onChange={(e) => setAssessBlock(e.target.value)}
                >
                  {BLOCKS.map((b) => (
                    <option key={b} value={b}>Block {b}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-muted" htmlFor="g-coverage">
                  Coverage %
                </label>
                <input
                  id="g-coverage"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 54"
                  className="w-24 rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink outline-none"
                  value={coverageVal}
                  onChange={(e) => setCoverageVal(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-muted" htmlFor="g-notes">
                  Notes
                </label>
                <input
                  id="g-notes"
                  type="text"
                  placeholder="Survey remarks..."
                  className="w-40 rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none"
                  value={assessNotes}
                  onChange={(e) => setAssessNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={savingAssess}
                className="btn-primary bg-[#176B45] hover:bg-[#073B2C] text-xs py-2 px-4 shadow-sm"
              >
                {savingAssess ? "Saving..." : "Save Assessment"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
