import { Car, Bike, Lock, ShieldCheck, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

export default function InteractiveParkingMap({
  blocks = [],
  gates = [],
  selectedBlock = "A",
  onSelectBlock,
  onSelectSlot,
  userRole = "student",
}) {
  const currentBlockData = blocks.find((b) => b.block === selectedBlock) || blocks[0] || {};
  const slots = currentBlockData.slots || [];

  return (
    <div className="space-y-4">
      {/* Map visual canvas */}
      <div className="relative rounded-2xl border border-line bg-gradient-to-b from-[#EBF5EE] to-[#E3EFE7] p-3 md:p-4 overflow-hidden shadow-inner select-none">
        <svg
          viewBox="0 0 600 380"
          className="w-full h-auto max-h-[380px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Base campus terrain */}
          <rect x="0" y="0" width="600" height="380" fill="#E8F4EC" rx="14" />

          {/* Road Network */}
          {/* North Gate Road */}
          <path d="M 300 0 L 300 90 L 120 90 L 120 180" stroke="#CBD5E1" strokeWidth="24" fill="none" />
          <path d="M 300 90 L 480 90 L 480 180" stroke="#CBD5E1" strokeWidth="24" fill="none" />

          {/* Spine Road Connecting North to South */}
          <path d="M 300 90 L 300 290" stroke="#CBD5E1" strokeWidth="28" fill="none" />
          <path d="M 300 210 L 120 210 L 120 290" stroke="#CBD5E1" strokeWidth="22" fill="none" />
          <path d="M 300 210 L 480 210 L 480 290" stroke="#CBD5E1" strokeWidth="22" fill="none" />

          {/* South Gate Road */}
          <path d="M 300 290 L 300 380" stroke="#CBD5E1" strokeWidth="28" fill="none" />

          {/* Road Centerlines */}
          <path d="M 300 0 L 300 380" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="6 6" fill="none" />
          <path d="M 120 90 L 480 90" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="6 6" fill="none" />
          <path d="M 120 210 L 480 210" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="6 6" fill="none" />

          {/* North Gate 2 (Hostel & Sports Side) Indicator */}
          <g>
            <rect x="230" y="2" width="140" height="24" rx="6" fill="#073B2C" />
            <text x="300" y="18" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
              NORTH GATE 2 (Hostel / Sports)
            </text>
          </g>

          {/* Main Gate 1 (Primary Entrance) Indicator */}
          <g>
            <rect x="225" y="354" width="150" height="24" rx="6" fill="#073B2C" />
            <text x="300" y="370" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
              MAIN GATE 1 (Primary Entrance)
            </text>
          </g>

          {/* Campus Green Landscape / Trees */}
          <ellipse cx="200" cy="150" rx="42" ry="30" fill="#C6E7D2" />
          <circle cx="185" cy="142" r="10" fill="#238B57" opacity="0.8" />
          <circle cx="215" cy="152" r="11" fill="#176B45" opacity="0.9" />
          <circle cx="200" cy="162" r="8" fill="#2E9E67" opacity="0.75" />

          <ellipse cx="400" cy="150" rx="42" ry="30" fill="#C6E7D2" />
          <circle cx="385" cy="145" r="10" fill="#238B57" opacity="0.8" />
          <circle cx="415" cy="155" r="11" fill="#176B45" opacity="0.85" />

          {/* BLOCK C: Student Parking North (Top-Left) */}
          {(() => {
            const b = blocks.find((item) => item.block === "C") || {};
            const isSelected = selectedBlock === "C";
            const isRestricted = b.isRestricted;
            return (
              <g
                className="cursor-pointer transition transform hover:scale-[1.01]"
                onClick={() => onSelectBlock("C")}
              >
                <rect
                  x="40"
                  y="40"
                  width="150"
                  height="85"
                  rx="10"
                  fill={isRestricted ? "#F1F5F9" : "#FFFFFF"}
                  stroke={isSelected ? "#238B57" : isRestricted ? "#E2E8F0" : "#CBD5E1"}
                  strokeWidth={isSelected ? "3.5" : "1.5"}
                />
                <rect x="46" y="46" width="138" height="20" rx="5" fill="#2585D8" />
                <text x="115" y="60" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                  BLOCK C · Student North
                </text>
                <text x="115" y="80" textAnchor="middle" fill="#172B23" fontSize="9" fontWeight="bold">
                  {b.availableSpaces ?? 22} free / {b.totalSpaces ?? 50} slots
                </text>
                <text x="115" y="96" textAnchor="middle" fill="#64746C" fontSize="8">
                  Gate: North Gate 2
                </text>
                {isRestricted && (
                  <g>
                    <rect x="46" y="103" width="138" height="18" rx="4" fill="#FEE2E2" />
                    <text x="115" y="115" textAnchor="middle" fill="#DC2626" fontSize="8" fontWeight="bold">
                      RESTRICTED FOR FACULTY
                    </text>
                  </g>
                )}
              </g>
            );
          })()}

          {/* BLOCK D: Student Parking South (Top-Right) */}
          {(() => {
            const b = blocks.find((item) => item.block === "D") || {};
            const isSelected = selectedBlock === "D";
            const isRestricted = b.isRestricted;
            return (
              <g
                className="cursor-pointer transition transform hover:scale-[1.01]"
                onClick={() => onSelectBlock("D")}
              >
                <rect
                  x="410"
                  y="40"
                  width="150"
                  height="85"
                  rx="10"
                  fill={isRestricted ? "#F1F5F9" : "#FFFFFF"}
                  stroke={isSelected ? "#238B57" : isRestricted ? "#E2E8F0" : "#CBD5E1"}
                  strokeWidth={isSelected ? "3.5" : "1.5"}
                />
                <rect x="416" y="46" width="138" height="20" rx="5" fill="#2585D8" />
                <text x="485" y="60" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                  BLOCK D · Student South
                </text>
                <text x="485" y="80" textAnchor="middle" fill="#172B23" fontSize="9" fontWeight="bold">
                  {b.availableSpaces ?? 28} free / {b.totalSpaces ?? 60} slots
                </text>
                <text x="485" y="96" textAnchor="middle" fill="#64746C" fontSize="8">
                  Gate: North Gate 2
                </text>
                {isRestricted && (
                  <g>
                    <rect x="416" y="103" width="138" height="18" rx="4" fill="#FEE2E2" />
                    <text x="485" y="115" textAnchor="middle" fill="#DC2626" fontSize="8" fontWeight="bold">
                      RESTRICTED FOR FACULTY
                    </text>
                  </g>
                )}
              </g>
            );
          })()}

          {/* Central Academic & Administration Complex */}
          <rect x="230" y="130" width="140" height="60" rx="8" fill="#334155" opacity="0.9" />
          <text x="300" y="156" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
            ACADEMIC COMPLEX
          </text>
          <text x="300" y="172" textAnchor="middle" fill="#94A3B8" fontSize="8">
            CS · Engg · Central Library
          </text>

          {/* BLOCK A: Faculty Parking (Bottom-Left) */}
          {(() => {
            const b = blocks.find((item) => item.block === "A") || {};
            const isSelected = selectedBlock === "A";
            const isRestricted = b.isRestricted;
            return (
              <g
                className="cursor-pointer transition transform hover:scale-[1.01]"
                onClick={() => onSelectBlock("A")}
              >
                <rect
                  x="40"
                  y="245"
                  width="150"
                  height="85"
                  rx="10"
                  fill={isRestricted ? "#F1F5F9" : "#FFFFFF"}
                  stroke={isSelected ? "#238B57" : isRestricted ? "#E2E8F0" : "#CBD5E1"}
                  strokeWidth={isSelected ? "3.5" : "1.5"}
                />
                <rect x="46" y="251" width="138" height="20" rx="5" fill="#176B45" />
                <text x="115" y="265" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                  BLOCK A · Faculty Parking
                </text>
                <text x="115" y="285" textAnchor="middle" fill="#172B23" fontSize="9" fontWeight="bold">
                  {b.availableSpaces ?? 12} free / {b.totalSpaces ?? 30} slots
                </text>
                <text x="115" y="301" textAnchor="middle" fill="#64746C" fontSize="8">
                  Gate: Main Gate 1
                </text>
                {isRestricted && (
                  <g>
                    <rect x="46" y="308" width="138" height="18" rx="4" fill="#FEE2E2" />
                    <text x="115" y="320" textAnchor="middle" fill="#DC2626" fontSize="8" fontWeight="bold">
                      RESTRICTED FOR STUDENTS
                    </text>
                  </g>
                )}
              </g>
            );
          })()}

          {/* BLOCK B: Faculty & Staff (Bottom-Center-Right) */}
          {(() => {
            const b = blocks.find((item) => item.block === "B") || {};
            const isSelected = selectedBlock === "B";
            const isRestricted = b.isRestricted;
            return (
              <g
                className="cursor-pointer transition transform hover:scale-[1.01]"
                onClick={() => onSelectBlock("B")}
              >
                <rect
                  x="225"
                  y="245"
                  width="150"
                  height="85"
                  rx="10"
                  fill={isRestricted ? "#F1F5F9" : "#FFFFFF"}
                  stroke={isSelected ? "#238B57" : isRestricted ? "#E2E8F0" : "#CBD5E1"}
                  strokeWidth={isSelected ? "3.5" : "1.5"}
                />
                <rect x="231" y="251" width="138" height="20" rx="5" fill="#176B45" />
                <text x="300" y="265" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                  BLOCK B · Faculty & Staff
                </text>
                <text x="300" y="285" textAnchor="middle" fill="#172B23" fontSize="9" fontWeight="bold">
                  {b.availableSpaces ?? 15} free / {b.totalSpaces ?? 40} slots
                </text>
                <text x="300" y="301" textAnchor="middle" fill="#64746C" fontSize="8">
                  Gate: Main Gate 1
                </text>
                {isRestricted && (
                  <g>
                    <rect x="231" y="308" width="138" height="18" rx="4" fill="#FEE2E2" />
                    <text x="300" y="320" textAnchor="middle" fill="#DC2626" fontSize="8" fontWeight="bold">
                      RESTRICTED FOR STUDENTS
                    </text>
                  </g>
                )}
              </g>
            );
          })()}

          {/* BLOCK E: General & Visitors (Bottom-Right) */}
          {(() => {
            const b = blocks.find((item) => item.block === "E") || {};
            const isSelected = selectedBlock === "E";
            return (
              <g
                className="cursor-pointer transition transform hover:scale-[1.01]"
                onClick={() => onSelectBlock("E")}
              >
                <rect
                  x="410"
                  y="245"
                  width="150"
                  height="85"
                  rx="10"
                  fill="#FFFFFF"
                  stroke={isSelected ? "#238B57" : "#CBD5E1"}
                  strokeWidth={isSelected ? "3.5" : "1.5"}
                />
                <rect x="416" y="251" width="138" height="20" rx="5" fill="#E5A11A" />
                <text x="485" y="265" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                  BLOCK E · Visitors & General
                </text>
                <text x="485" y="285" textAnchor="middle" fill="#172B23" fontSize="9" fontWeight="bold">
                  {b.availableSpaces ?? 18} free / {b.totalSpaces ?? 40} slots
                </text>
                <text x="485" y="301" textAnchor="middle" fill="#64746C" fontSize="8">
                  Gate: Main Gate 1
                </text>
                <g>
                  <rect x="416" y="308" width="138" height="18" rx="4" fill="#FEF3C7" />
                  <text x="485" y="320" textAnchor="middle" fill="#B45309" fontSize="8" fontWeight="bold">
                    OPEN FOR ALL CAMPUS USERS
                  </text>
                </g>
              </g>
            );
          })()}
        </svg>

        {/* Floating Instruction */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm backdrop-blur border border-line">
          <MapPin size={13} className="text-[#176B45]" />
          <span>Click any block (A–E) to inspect individual live slots</span>
        </div>
      </div>

      {/* Selected Block Info Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-page p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink">Selected Lot:</span>
          <span className="rounded-lg bg-mint px-2.5 py-1 font-bold text-[#176B45] border border-emerald-300">
            {currentBlockData.name || `Block ${selectedBlock}`}
          </span>
          <span className="text-muted">Nearest: {currentBlockData.nearestGate || "Main Gate 1"}</span>
        </div>

        <div className="flex items-center gap-3">
          {currentBlockData.isRestricted ? (
            <span className="flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-1 font-bold text-error border border-red-200">
              <Lock size={12} /> {currentBlockData.reason || "Restricted for your role"}
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 font-bold text-[#176B45] border border-emerald-300">
              <CheckCircle2 size={12} /> Authorized Parking Area
            </span>
          )}
        </div>
      </div>

      {/* Interactive Slot Grid for Selected Block */}
      <div className="rounded-xl border border-line bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
          <div>
            <h4 className="font-bold text-ink text-sm">
              Live Slot Grid · Block {selectedBlock} ({currentBlockData.availableSpaces || 0} Free of {currentBlockData.totalSpaces || 0})
            </h4>
            <p className="text-[11px] text-muted">
              Click any slot to inspect occupancy or update status (Estate / Admin permissions)
            </p>
          </div>

          {/* Slot Legend */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-[#238B57]" /> Free
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]" /> Occupied
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E5A11A]" /> Reserved
            </span>
          </div>
        </div>

        {/* Slot Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-56 overflow-y-auto p-1">
          {slots.length === 0 ? (
            <p className="col-span-full py-6 text-center text-xs text-muted">
              Loading slots for Block {selectedBlock}...
            </p>
          ) : (
            slots.map((slot) => {
              const isOccupied = slot.status === "occupied";
              const isReserved = slot.status === "reserved";
              const isBike = slot.vehicleType === "bike";

              return (
                <button
                  key={slot.slotNumber}
                  type="button"
                  onClick={() => onSelectSlot && onSelectSlot(slot)}
                  title={`Slot ${slot.slotNumber} · ${slot.status.toUpperCase()} (${slot.vehicleType || "car"})`}
                  className={`flex flex-col items-center justify-center rounded-xl p-2 text-xs font-bold transition shadow-xs hover:scale-105 ${
                    isOccupied
                      ? "bg-red-50 text-red-700 border border-red-300"
                      : isReserved
                        ? "bg-amber-50 text-amber-700 border border-amber-300"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {isBike ? <Bike size={13} /> : <Car size={13} />}
                    <span className="font-extrabold text-[11px]">{slot.slotNumber}</span>
                  </div>
                  <span className="text-[9px] uppercase font-semibold opacity-90">
                    {slot.status}
                  </span>
                  {isOccupied && slot.occupantRole !== "none" && (
                    <span className="text-[8px] opacity-75 font-normal capitalize">
                      {slot.occupantRole}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
