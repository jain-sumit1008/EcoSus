import { useState } from "react";
import { Trees, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

export default function CampusGreeneryMap({ blocks = [] }) {
  const [selectedBlock, setSelectedBlock] = useState("C");

  const blockData = {
    A: { name: "Block 1 (A)", coverage: 85, trees: 340, status: "High Greenery", color: "#238B57" },
    B: { name: "Block 2 (B)", coverage: 76, trees: 290, status: "High Greenery", color: "#238B57" },
    C: { name: "Block 3 (C)", coverage: 48, trees: 110, status: "Low Greenery", color: "#DC2626" },
    D: { name: "Block 4 (D)", coverage: 54, trees: 160, status: "Medium Greenery", color: "#E5A11A" },
    E: { name: "Block 5 (E)", coverage: 62, trees: 215, status: "Medium Greenery", color: "#E5A11A" },
  };

  // Merge with backend data if available
  blocks.forEach((b) => {
    if (blockData[b.block]) {
      blockData[b.block].coverage = b.coveragePercent ?? blockData[b.block].coverage;
      if (blockData[b.block].coverage >= 70) {
        blockData[b.block].status = "High Greenery";
        blockData[b.block].color = "#238B57";
      } else if (blockData[b.block].coverage >= 50) {
        blockData[b.block].status = "Medium Greenery";
        blockData[b.block].color = "#E5A11A";
      } else {
        blockData[b.block].status = "Low Greenery";
        blockData[b.block].color = "#DC2626";
      }
    }
  });

  const active = blockData[selectedBlock] || blockData.C;

  return (
    <div className="space-y-3">
      {/* Map Schematic Container */}
      <div className="relative rounded-2xl border border-line bg-gradient-to-br from-[#1C2C24] to-[#0A1A12] p-4 text-white overflow-hidden shadow-inner min-h-[220px]">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* SVG Aerial Schematic */}
        <svg viewBox="0 0 460 220" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Main Pathways */}
          <path d="M 230 10 L 230 210" stroke="#ffffff25" strokeWidth="6" strokeDasharray="4 4" />
          <path d="M 20 110 L 440 110" stroke="#ffffff25" strokeWidth="6" strokeDasharray="4 4" />

          {/* Block 1 (A) - High (Green) */}
          <g
            className="cursor-pointer transition hover:opacity-90"
            onClick={() => setSelectedBlock("A")}
          >
            <rect
              x="50"
              y="30"
              width="100"
              height="60"
              rx="8"
              fill="#238B5733"
              stroke="#238B57"
              strokeWidth={selectedBlock === "A" ? "3" : "1.8"}
            />
            <text x="100" y="60" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">
              Block 1
            </text>
            <text x="100" y="75" textAnchor="middle" fill="#86EFAC" fontSize="10" fontWeight="600">
              {blockData.A.coverage}% Cover
            </text>
          </g>

          {/* Block 2 (B) - High (Green) */}
          <g
            className="cursor-pointer transition hover:opacity-90"
            onClick={() => setSelectedBlock("B")}
          >
            <rect
              x="300"
              y="30"
              width="100"
              height="60"
              rx="8"
              fill="#238B5733"
              stroke="#238B57"
              strokeWidth={selectedBlock === "B" ? "3" : "1.8"}
            />
            <text x="350" y="60" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">
              Block 2
            </text>
            <text x="350" y="75" textAnchor="middle" fill="#86EFAC" fontSize="10" fontWeight="600">
              {blockData.B.coverage}% Cover
            </text>
          </g>

          {/* Central Fountain Lawn */}
          <circle cx="230" cy="110" r="18" fill="#176B4588" stroke="#34D399" strokeWidth="1.5" />
          <text x="230" y="113" textAnchor="middle" fill="#A7F3D0" fontSize="7" fontWeight="bold">
            CENTRAL LAWN
          </text>

          {/* Block 3 (C) - Low (Red) */}
          <g
            className="cursor-pointer transition hover:opacity-90"
            onClick={() => setSelectedBlock("C")}
          >
            <rect
              x="50"
              y="130"
              width="100"
              height="60"
              rx="8"
              fill="#DC262633"
              stroke="#DC2626"
              strokeWidth={selectedBlock === "C" ? "3" : "1.8"}
            />
            <text x="100" y="160" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">
              Block 3
            </text>
            <text x="100" y="175" textAnchor="middle" fill="#FCA5A5" fontSize="10" fontWeight="bold">
              {blockData.C.coverage}% (Low)
            </text>
          </g>

          {/* Block 4 (D) - Medium (Orange) */}
          <g
            className="cursor-pointer transition hover:opacity-90"
            onClick={() => setSelectedBlock("D")}
          >
            <rect
              x="180"
              y="130"
              width="95"
              height="60"
              rx="8"
              fill="#E5A11A33"
              stroke="#E5A11A"
              strokeWidth={selectedBlock === "D" ? "3" : "1.8"}
            />
            <text x="227" y="160" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">
              Block 4
            </text>
            <text x="227" y="175" textAnchor="middle" fill="#FDE68A" fontSize="10" fontWeight="600">
              {blockData.D.coverage}% Cover
            </text>
          </g>

          {/* Block 5 (E) - Medium (Orange) */}
          <g
            className="cursor-pointer transition hover:opacity-90"
            onClick={() => setSelectedBlock("E")}
          >
            <rect
              x="305"
              y="130"
              width="95"
              height="60"
              rx="8"
              fill="#E5A11A33"
              stroke="#E5A11A"
              strokeWidth={selectedBlock === "E" ? "3" : "1.8"}
            />
            <text x="352" y="160" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">
              Block 5
            </text>
            <text x="352" y="175" textAnchor="middle" fill="#FDE68A" fontSize="10" fontWeight="600">
              {blockData.E.coverage}% Cover
            </text>
          </g>
        </svg>

        {/* Selected Block Info overlay */}
        <div className="absolute top-2 right-2 rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur text-[11px] flex items-center gap-1.5 border border-white/10">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active.color }} />
          <span className="font-bold">{active.name}:</span>
          <span>{active.coverage}% ({active.status})</span>
        </div>
      </div>

      {/* Map Legend */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#238B57]" />
            <span className="text-ink font-semibold">High (≥70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E5A11A]" />
            <span className="text-ink font-semibold">Medium (50–69%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]" />
            <span className="text-ink font-semibold">Low (&lt;50%)</span>
          </div>
        </div>
        <span className="text-[11px] text-muted">Click any block to inspect</span>
      </div>
    </div>
  );
}
