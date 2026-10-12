import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function HourlyPeakChart() {
  const hourlyData = [
    { hour: "9 AM", load: 1420 },
    { hour: "10 AM", load: 2150 },
    { hour: "11 AM", load: 2680 },
    { hour: "12 PM", load: 2950 },
    { hour: "1 PM", load: 2400 },
    { hour: "2 PM", load: 3420, isPeak: true },
    { hour: "3 PM", load: 3350, isPeak: true },
    { hour: "4 PM", load: 2980 },
    { hour: "5 PM", load: 1850 },
    { hour: "6 PM", load: 1120 },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-ink">Peak Demand Hours (2:00 PM – 4:00 PM)</span>
        <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-800 text-[10px]">
          Peak: 3,420 kW
        </span>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#64746C" }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: "#64746C" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-line bg-white/95 p-2.5 shadow-md backdrop-blur text-xs">
                      <p className="font-bold text-ink">{label}</p>
                      <p className="text-amber-600 font-bold mt-0.5">{item.load.toLocaleString()} kW</p>
                      {item.isPeak && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-error">
                          ★ High tariff period
                        </span>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="load" radius={[4, 4, 0, 0]}>
              {hourlyData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isPeak ? "#E5A11A" : "#F8D486"}
                  className="transition hover:opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
