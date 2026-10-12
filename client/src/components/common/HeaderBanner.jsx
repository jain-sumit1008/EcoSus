export default function HeaderBanner({
  title,
  subtitle,
  taglineTitle,
  taglineSub,
  icon: Icon,
  accent = "emerald", // "emerald", "water", "amber", "purple", "teal"
  rightSlot,
}) {
  const themes = {
    emerald: {
      bg: "bg-gradient-to-r from-[#073B2C] via-[#0E513D] to-[#176B45]",
      iconBg: "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-300/30",
      badge: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    },
    water: {
      bg: "bg-gradient-to-r from-[#0F3759] via-[#1B4E79] to-[#2585D8]",
      iconBg: "bg-blue-400/20 text-blue-200 ring-1 ring-blue-300/30",
      badge: "bg-blue-500/20 text-blue-100 border-blue-400/30",
    },
    amber: {
      bg: "bg-gradient-to-r from-[#4A3205] via-[#7B530E] to-[#B37B15]",
      iconBg: "bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/30",
      badge: "bg-amber-500/20 text-amber-100 border-amber-400/30",
    },
    purple: {
      bg: "bg-gradient-to-r from-[#331853] via-[#4E287C] to-[#6D38AC]",
      iconBg: "bg-purple-400/20 text-purple-200 ring-1 ring-purple-300/30",
      badge: "bg-purple-500/20 text-purple-100 border-purple-400/30",
    },
    teal: {
      bg: "bg-gradient-to-r from-[#09393A] via-[#12585A] to-[#178184]",
      iconBg: "bg-teal-400/20 text-teal-200 ring-1 ring-teal-300/30",
      badge: "bg-teal-500/20 text-teal-100 border-teal-400/30",
    },
  };

  const theme = themes[accent] || themes.emerald;

  return (
    <div className={`relative overflow-hidden rounded-2xl ${theme.bg} p-5 md:p-6 text-white shadow-md select-none`}>
      {/* Decorative background glow circles */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-white/5 blur-xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Icon and Title */}
        <div className="flex items-center gap-3.5">
          {Icon ? (
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.iconBg} shadow-inner`}>
              <Icon size={24} className="stroke-[2.2]" />
            </div>
          ) : null}
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">{title}</h2>
            <p className="text-xs md:text-sm text-white/80 font-medium mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Right: Badge banner or custom slot */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {rightSlot || (taglineTitle && (
            <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 backdrop-blur-sm ${theme.badge}`}>
              <div className="text-right">
                <p className="text-xs font-bold leading-tight text-white">{taglineTitle}</p>
                {taglineSub && <p className="text-[10px] text-white/70 leading-tight">{taglineSub}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
