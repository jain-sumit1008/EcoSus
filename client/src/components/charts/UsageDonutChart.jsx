import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#238B57", "#2585D8", "#E5A11A", "#8B5CF6", "#EC4899"];

export default function UsageDonutChart({ data = [], centerLabel = "12,480 kWh", sublabel = "Total" }) {
  const chartData = data.length
    ? data.map((d, i) => ({
        name: d.block?.length === 1 ? `Block ${d.block}` : d.block,
        value: d.value || 1,
        color: COLORS[i % COLORS.length],
      }))
    : [
        { name: "Block 1", value: 3494, color: "#238B57" },
        { name: "Block 2", value: 2746, color: "#2585D8" },
        { name: "Block 3", value: 2995, color: "#E5A11A" },
        { name: "Block 4", value: 1997, color: "#8B5CF6" },
        { name: "Block 5", value: 1248, color: "#EC4899" },
      ];

  const total = chartData.reduce((acc, c) => acc + c.value, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Donut chart */}
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const pct = ((item.value / total) * 100).toFixed(1);
                  return (
                    <div className="rounded-xl border border-line bg-white/95 p-2 shadow-lg text-xs">
                      <p className="font-bold text-ink">{item.name}</p>
                      <p className="font-semibold text-muted">
                        {item.value.toLocaleString()} ({pct}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={chartData}
              innerRadius={52}
              outerRadius={76}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centered label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-extrabold text-ink leading-tight">{centerLabel}</span>
          <span className="text-[10px] uppercase font-semibold text-muted">{sublabel}</span>
        </div>
      </div>

      {/* Legend list with percentage breakdown */}
      <div className="flex-1 space-y-1.5 w-full">
        {chartData.map((item) => {
          const pct = Math.round((item.value / total) * 100) || 0;
          return (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-ink">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">{item.value.toLocaleString()}</span>
                <span className="text-muted text-[11px] w-8 text-right font-medium">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
