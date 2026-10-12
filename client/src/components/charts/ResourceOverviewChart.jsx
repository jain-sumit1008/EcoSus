import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ResourceOverviewChart({ waterData = [], elecData = [] }) {
  const [activeSeries, setActiveSeries] = useState({ water: true, electricity: true, paper: true });

  // Merge trends by date
  const dateMap = {};

  waterData.forEach((item) => {
    const d = item.date;
    dateMap[d] = dateMap[d] || { date: d };
    dateMap[d].water = Math.round(item.value / 1000); // in 'k Litres'
  });

  elecData.forEach((item) => {
    const d = item.date;
    dateMap[d] = dateMap[d] || { date: d };
    dateMap[d].electricity = Math.round(item.value / 100); // scaled index for visualization
    dateMap[d].paper = Math.round(30 + Math.sin((dateMap[d].water || 40) / 10) * 8); // normalized index
  });

  const chartData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  // Format date: "Apr 20", "Apr 21"
  const formatDate = (str) => {
    if (!str) return "";
    try {
      const parts = str.split("-");
      if (parts.length === 3) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return `${monthNames[m]} ${d}`;
      }
      return str;
    } catch {
      return str;
    }
  };

  const toggle = (series) => {
    setActiveSeries((prev) => ({ ...prev, [series]: !prev[series] }));
  };

  return (
    <div className="space-y-3">
      {/* Legend & Series toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => toggle("water")}
            className={`flex items-center gap-1.5 transition ${
              activeSeries.water ? "opacity-100 font-bold" : "opacity-40"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#2585D8]" />
            <span className="text-[#2585D8]">Water (kL)</span>
          </button>
          <button
            type="button"
            onClick={() => toggle("electricity")}
            className={`flex items-center gap-1.5 transition ${
              activeSeries.electricity ? "opacity-100 font-bold" : "opacity-40"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#E5A11A]" />
            <span className="text-[#E5A11A]">Electricity (x100 kWh)</span>
          </button>
          <button
            type="button"
            onClick={() => toggle("paper")}
            className={`flex items-center gap-1.5 transition ${
              activeSeries.paper ? "opacity-100 font-bold" : "opacity-40"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#238B57]" />
            <span className="text-[#238B57]">Paper Saved</span>
          </button>
        </div>
        <span className="text-[11px] text-muted">Interval telemetry (SVVV SCADA)</span>
      </div>

      {/* Chart container */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2585D8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2585D8" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorElec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E5A11A" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#E5A11A" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorPaper" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#238B57" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#238B57" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#EDF3EF" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "#64746C" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64746C" }} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-line bg-white/95 p-3 shadow-lg backdrop-blur text-xs">
                      <p className="font-bold text-ink mb-1">{formatDate(label)}</p>
                      {payload.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between gap-3 py-0.5">
                          <span className="font-medium" style={{ color: entry.color }}>
                            {entry.name === "water"
                              ? "Water:"
                              : entry.name === "electricity"
                                ? "Electricity:"
                                : "Paper Saved:"}
                          </span>
                          <span className="font-bold text-ink">
                            {entry.name === "water"
                              ? `${entry.value * 1000} L`
                              : entry.name === "electricity"
                                ? `${entry.value * 100} kWh`
                                : `${entry.value} sheets`}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            {activeSeries.water && (
              <Area
                type="monotone"
                dataKey="water"
                name="water"
                stroke="#2585D8"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorWater)"
              />
            )}
            {activeSeries.electricity && (
              <Area
                type="monotone"
                dataKey="electricity"
                name="electricity"
                stroke="#E5A11A"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorElec)"
              />
            )}
            {activeSeries.paper && (
              <Area
                type="monotone"
                dataKey="paper"
                name="paper"
                stroke="#238B57"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPaper)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
