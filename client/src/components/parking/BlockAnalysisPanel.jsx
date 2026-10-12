import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Car, Bike, TrendingUp, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function BlockAnalysisPanel({
  blocks = [],
  selectedBlock = "A",
  analysisData = null,
  onSelectBlock,
}) {
  const [metricView, setMetricView] = useState("occupancy");

  const comparisonData = (analysisData?.comparison || blocks).map((b) => ({
    name: `Block ${b.block || b.name?.slice(0, 2)}`,
    block: b.block,
    total: b.totalSpaces || 0,
    occupied: b.occupiedSpaces || 0,
    available: b.availableSpaces || 0,
    percent: b.totalSpaces ? Math.round((b.occupiedSpaces / b.totalSpaces) * 100) : 0,
    region: b.region || "general",
  }));

  const hourlyData = analysisData?.hourlyHistory || [
    { hour: "08:00", occupancyPercent: 20, occupied: 6, available: 24 },
    { hour: "09:00", occupancyPercent: 50, occupied: 15, available: 15 },
    { hour: "10:00", occupancyPercent: 85, occupied: 26, available: 4 },
    { hour: "11:00", occupancyPercent: 92, occupied: 28, available: 2 },
    { hour: "12:00", occupancyPercent: 82, occupied: 25, available: 5 },
    { hour: "13:00", occupancyPercent: 75, occupied: 23, available: 7 },
    { hour: "14:00", occupancyPercent: 80, occupied: 24, available: 6 },
    { hour: "15:00", occupancyPercent: 60, occupied: 18, available: 12 },
    { hour: "16:00", occupancyPercent: 35, occupied: 11, available: 19 },
    { hour: "17:00", occupancyPercent: 15, occupied: 5, available: 25 },
  ];

  const currentBlock = blocks.find((b) => b.block === selectedBlock) || blocks[0] || {};
  const vehicleStats = analysisData?.vehicleDistribution || {
    cars: Math.round((currentBlock.occupiedSpaces || 16) * 0.65),
    bikes: Math.round((currentBlock.occupiedSpaces || 16) * 0.35),
  };

  return (
    <div className="space-y-6">
      {/* Block Selector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-xs">
        <div>
          <h3 className="font-bold text-ink">SVVV Parking Block Analysis</h3>
          <p className="text-xs text-muted">Compare utilization, peak load hours, and capacity across Blocks A–E</p>
        </div>

        {/* Block Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-page p-1 rounded-xl border border-line">
          {["A", "B", "C", "D", "E"].map((bCode) => {
            const isSel = selectedBlock === bCode;
            return (
              <button
                key={bCode}
                type="button"
                onClick={() => onSelectBlock(bCode)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  isSel
                    ? "bg-[#238B57] text-white shadow-xs"
                    : "text-ink hover:bg-mint/60"
                }`}
              >
                Block {bCode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Analytical KPI Cards for Selected Block */}
      <div className="grid gap-3.5 grid-cols-2 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-muted font-medium">Selected Lot</p>
          <p className="text-xl font-extrabold text-ink mt-0.5">Block {selectedBlock}</p>
          <p className="text-[11px] font-semibold text-[#176B45] capitalize">{currentBlock.region || "Faculty"} Area</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-muted font-medium">Current Occupancy</p>
          <p className="text-xl font-extrabold text-ink mt-0.5">
            {currentBlock.occupancyPercent ?? 53}%
          </p>
          <p className="text-[11px] text-muted">
            {currentBlock.occupiedSpaces ?? 16} / {currentBlock.totalSpaces ?? 30} slots used
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-muted font-medium">Daily Peak Hours</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock size={16} className="text-amber-500" />
            <p className="text-sm font-extrabold text-ink">10:00 AM – 12:30 PM</p>
          </div>
          <p className="text-[11px] text-muted">Average 88%–92% capacity</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-muted font-medium">Vehicle Distribution</p>
          <div className="flex items-center gap-3 mt-1 text-xs font-bold text-ink">
            <span className="flex items-center gap-1 text-[#2585D8]">
              <Car size={14} /> {vehicleStats.cars} Cars
            </span>
            <span className="flex items-center gap-1 text-[#238B57]">
              <Bike size={14} /> {vehicleStats.bikes} Bikes
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1: Hourly Occupancy Trend for Selected Block */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-ink text-sm">
                Hourly Occupancy Profile · Block {selectedBlock}
              </h4>
              <p className="text-xs text-muted">Campus arrival and departure flow (08:00 – 17:00)</p>
            </div>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#176B45] border border-emerald-200">
              Live Sensor Feed
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#238B57" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#238B57" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#64746C" }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: "#64746C" }} domain={[0, 100]} />
                <Tooltip
                  formatter={(val) => [`${val}%`, "Occupancy"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #DCE7E0" }}
                />
                <Area
                  type="monotone"
                  dataKey="occupancyPercent"
                  stroke="#238B57"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#occGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Cross-Block Comparison (Blocks A–E) */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-ink text-sm">
                Cross-Block Utilization Comparison
              </h4>
              <p className="text-xs text-muted">Occupied vs Available spaces across campus zones</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64746C" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64746C" }} />
                <Tooltip
                  formatter={(val, name) => [val, name === "occupied" ? "Occupied" : "Available"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #DCE7E0" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="occupied" name="Occupied" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" name="Available" fill="#238B57" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparative Data Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-3">
          <h4 className="font-bold text-ink text-sm">Campus Parking Blocks Registry</h4>
          <p className="text-xs text-muted">Live telemetry and allocation summary for SVVV Indore</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-page text-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4 font-bold">Block / Lot</th>
                <th className="py-2.5 px-4 font-bold">Designated Region</th>
                <th className="py-2.5 px-4 font-bold">Nearest Gate</th>
                <th className="py-2.5 px-4 font-bold text-right">Capacity</th>
                <th className="py-2.5 px-4 font-bold text-right">Occupied</th>
                <th className="py-2.5 px-4 font-bold text-right">Available</th>
                <th className="py-2.5 px-4 font-bold text-right">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {comparisonData.map((row) => (
                <tr
                  key={row.block}
                  onClick={() => onSelectBlock(row.block)}
                  className={`cursor-pointer hover:bg-mint/40 transition ${
                    selectedBlock === row.block ? "bg-mint/50 font-bold" : ""
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-ink flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#176B45]" />
                    {row.name}
                  </td>
                  <td className="py-3 px-4 capitalize">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.region === "faculty"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : row.region === "student"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {row.region}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted">
                    {blocks.find((b) => b.block === row.block)?.nearestGate || "Main Gate 1"}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-ink">{row.total}</td>
                  <td className="py-3 px-4 text-right font-semibold text-error">{row.occupied}</td>
                  <td className="py-3 px-4 text-right font-bold text-[#238B57]">{row.available}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            row.percent > 85 ? "bg-error" : row.percent > 60 ? "bg-amber-500" : "bg-[#238B57]"
                          }`}
                          style={{ width: `${Math.min(100, row.percent)}%` }}
                        />
                      </div>
                      <span className="font-bold text-ink w-8">{row.percent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
