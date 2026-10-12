import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function CircularGauge({
  percent = 88,
  primaryColor = "#238B57",
  secondaryColor = "#E5E7EB",
  centerValue,
  centerLabel = "Attendance",
  stats = [], // [{ label: "Present", value: 28, color: "text-[#238B57]" }]
}) {
  const data = [
    { value: percent },
    { value: Math.max(0, 100 - percent) },
  ];

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative h-40 w-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={48}
              outerRadius={68}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={primaryColor} />
              <Cell fill={secondaryColor} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-ink tracking-tight">
            {centerValue !== undefined ? centerValue : `${percent}%`}
          </span>
          <span className="text-[10px] uppercase font-bold text-muted tracking-wider">{centerLabel}</span>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="mt-2 flex items-center justify-center gap-4 text-xs">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className={`font-bold ${stat.color || "text-ink"}`}>{stat.value}</p>
              <p className="text-[10px] text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
