import { Leaf } from "lucide-react";

export default function CampusSilhouette() {
  return (
    <div className="relative mt-auto border-t border-slate-700/60 px-4 pt-3 pb-4 text-slate-300">
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#2DD4BF]">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-[#2DD4BF]">
          <Leaf size={12} />
        </span>
        <span>Greener Today · Brighter Tomorrow</span>
      </div>
      {/* SVVV Architectural Campus Silhouette SVG */}
      <svg
        viewBox="0 0 240 50"
        className="w-full h-11 text-teal-400/25 fill-current"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Ground line */}
        <line x1="0" y1="48" x2="240" y2="48" stroke="currentColor" strokeWidth="1.5" />
        
        {/* Left wing building */}
        <rect x="10" y="24" width="40" height="24" />
        <rect x="15" y="28" width="5" height="7" fill="#1E293B" />
        <rect x="25" y="28" width="5" height="7" fill="#1E293B" />
        <rect x="35" y="28" width="5" height="7" fill="#1E293B" />
        <rect x="15" y="38" width="5" height="7" fill="#1E293B" />
        <rect x="25" y="38" width="5" height="7" fill="#1E293B" />
        <rect x="35" y="38" width="5" height="7" fill="#1E293B" />
        <polygon points="8,24 30,14 52,24" />

        {/* Trees left */}
        <circle cx="58" cy="36" r="8" />
        <circle cx="68" cy="40" r="6" />

        {/* Central grand heritage hall with dome and pillars */}
        <rect x="80" y="20" width="80" height="28" />
        {/* Central dome */}
        <path d="M 105 20 A 15 15 0 0 1 135 20 Z" />
        <line x1="120" y1="5" x2="120" y2="0" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="120,0 126,2 120,4" />
        {/* Pediment triangle */}
        <polygon points="98,20 120,10 142,20" />
        {/* Columns */}
        <line x1="88" y1="20" x2="88" y2="48" stroke="#1E293B" strokeWidth="3" />
        <line x1="98" y1="20" x2="98" y2="48" stroke="#1E293B" strokeWidth="3" />
        <line x1="108" y1="20" x2="108" y2="48" stroke="#1E293B" strokeWidth="3" />
        <line x1="118" y1="20" x2="118" y2="48" stroke="#1E293B" strokeWidth="3" />
        <line x1="128" y1="20" x2="128" y2="48" stroke="#1E293B" strokeWidth="3" />
        <line x1="138" y1="20" x2="138" y2="48" stroke="#1E293B" strokeWidth="3" />
        <line x1="148" y1="20" x2="148" y2="48" stroke="#1E293B" strokeWidth="3" />
        <rect x="114" y="36" width="12" height="12" rx="6" fill="#1E293B" />

        {/* Trees right */}
        <circle cx="170" cy="38" r="7" />
        <circle cx="180" cy="35" r="9" />

        {/* Right wing building */}
        <rect x="190" y="24" width="40" height="24" />
        <rect x="195" y="28" width="5" height="7" fill="#1E293B" />
        <rect x="205" y="28" width="5" height="7" fill="#1E293B" />
        <rect x="215" y="28" width="5" height="7" fill="#1E293B" />
        <rect x="195" y="38" width="5" height="7" fill="#1E293B" />
        <rect x="205" y="38" width="5" height="7" fill="#1E293B" />
        <rect x="215" y="38" width="5" height="7" fill="#1E293B" />
        <polygon points="188,24 210,14 232,24" />
      </svg>
    </div>
  );
}
