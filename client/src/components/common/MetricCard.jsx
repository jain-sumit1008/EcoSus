import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export default function MetricCard({
  label,
  value,
  unit,
  change,
  changeType, // "down" (green/favorable or red based on context), "up", "neutral"
  changeLabel = "vs. last week",
  subtext,
  badge,
  badgeColor = "emerald", // "emerald", "amber", "red", "blue"
  hint,
  accent = "primary", // "primary", "water", "amber", "purple", "teal", "error"
  icon: Icon,
}) {
  const accents = {
    primary: "bg-[#EAF7EF] text-[#238B57]",
    water: "bg-[#EBF4FC] text-[#2585D8]",
    amber: "bg-[#FEF6E7] text-[#E5A11A]",
    purple: "bg-[#F3EFFC] text-[#7C3AED]",
    teal: "bg-[#E8F7F8] text-[#0D9488]",
    error: "bg-[#FEECEC] text-[#DC2626]",
  };

  const badgeColors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <article className="card p-4 transition-all duration-200 hover:shadow-lg border-line/80 bg-white">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-muted tracking-tight truncate">{label}</p>
        {Icon ? (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs ${accents[accent] || accents.primary}`}>
            <Icon size={19} />
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-extrabold tracking-tight text-ink">{value}</span>
        {unit ? <span className="text-xs font-semibold text-muted">{unit}</span> : null}
      </div>

      {/* Subtext, trend or badge */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
        {change !== undefined && change !== null ? (
          <div
            className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md text-[11px] ${
              changeType === "down"
                ? "bg-emerald-50 text-emerald-700"
                : changeType === "up"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {changeType === "down" ? (
              <ArrowDownRight size={13} className="stroke-[2.5]" />
            ) : changeType === "up" ? (
              <ArrowUpRight size={13} className="stroke-[2.5]" />
            ) : (
              <Minus size={13} />
            )}
            <span>{change}</span>
            {changeLabel && <span className="font-normal text-muted ml-0.5">{changeLabel}</span>}
          </div>
        ) : null}

        {subtext ? <span className="text-[11px] font-medium text-muted">{subtext}</span> : null}

        {badge ? (
          <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${badgeColors[badgeColor] || badgeColors.emerald}`}>
            {badge}
          </span>
        ) : null}

        {hint ? <span className="text-[10px] text-muted italic">{hint}</span> : null}
      </div>
    </article>
  );
}
