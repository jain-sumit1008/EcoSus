import { useState, useEffect } from "react";
import {
  Car,
  MapPin,
  ExternalLink,
  RefreshCw,
  Edit3,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Ticket,
  PlusCircle,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import * as parkingApi from "../../api/parking.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import HeaderBanner from "../../components/common/HeaderBanner.jsx";
import TabsBar from "../../components/common/TabsBar.jsx";
import LoadingState from "../../components/common/LoadingState.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import CircularGauge from "../../components/charts/CircularGauge.jsx";
import InteractiveParkingMap from "../../components/parking/InteractiveParkingMap.jsx";
import BlockAnalysisPanel from "../../components/parking/BlockAnalysisPanel.jsx";
import ReservationModal from "../../components/parking/ReservationModal.jsx";
import DigitalParkingPass from "../../components/parking/DigitalParkingPass.jsx";
import StaffGateScanner from "../../components/parking/StaffGateScanner.jsx";
import MyTokensPanel from "../../components/parking/MyTokensPanel.jsx";

export default function ParkingPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("map");
  const [selectedBlock, setSelectedBlock] = useState("A");
  const [blocksData, setBlocksData] = useState([]);
  const [gatesData, setGatesData] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Digital Parking Token Modals
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [reserveInitialSlot, setReserveInitialSlot] = useState(null);
  const [viewingPassToken, setViewingPassToken] = useState(null);
  const [passModalOpen, setPassModalOpen] = useState(false);

  // Slot modal state for direct admin slot status update
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotStatus, setSlotStatus] = useState("available");
  const [slotOccupantRole, setSlotOccupantRole] = useState("none");
  const [slotVehicleType, setSlotVehicleType] = useState("car");
  const [savingSlot, setSavingSlot] = useState(false);

  const canManageSlots = ["admin", "parkingManager"].includes(user?.role);

  // Fetch block list and SVVV gate info
  const fetchBlocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await parkingApi.listBlocks();
      setBlocksData(res.data.blocks || []);
      setGatesData(res.data.gates || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load parking blocks");
    } finally {
      setLoading(false);
    }
  };

  // Fetch analysis for the selected block
  const fetchAnalysis = async (blockCode) => {
    try {
      const res = await parkingApi.getBlockAnalysis(blockCode);
      setAnalysisData(res.data.analysis);
    } catch (err) {
      console.warn("Analysis load error:", err);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, [user?.role]);

  useEffect(() => {
    fetchAnalysis(selectedBlock);
  }, [selectedBlock]);

  // Aggregate totals across all blocks
  const totals = blocksData.reduce(
    (acc, b) => {
      acc.total += b.totalSpaces || 0;
      acc.available += b.availableSpaces || 0;
      acc.occupied += b.occupiedSpaces || 0;
      acc.reserved += b.reservedSpaces || 0;
      return acc;
    },
    { total: 0, available: 0, occupied: 0, reserved: 0 }
  );

  const totalOccupancyPercent =
    totals.total > 0 ? Math.round((totals.occupied / totals.total) * 100) : 0;

  // Slot click handler
  const handleSlotClicked = (slot) => {
    if (slot.status === "available") {
      // Available slot: open digital token reservation modal
      setReserveInitialSlot(slot);
      setReserveModalOpen(true);
    } else {
      // Occupied or reserved slot: open inspection/management modal
      setSelectedSlot(slot);
      setSlotStatus(slot.status);
      setSlotOccupantRole(slot.occupantRole || "none");
      setSlotVehicleType(slot.vehicleType || "car");
      setSlotModalOpen(true);
    }
  };

  const handleReservationSuccess = (token) => {
    toast.success(`Pass ${token.tokenId} issued for Slot ${token.slotNumber}!`);
    fetchBlocks();
    fetchAnalysis(selectedBlock);
    setViewingPassToken(token);
    setPassModalOpen(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSavingSlot(true);
    try {
      await parkingApi.updateSlotStatus(selectedBlock, selectedSlot.slotNumber, {
        status: slotStatus,
        occupantRole: slotOccupantRole,
        vehicleType: slotVehicleType,
      });
      toast.success(`Slot ${selectedSlot.slotNumber} updated to ${slotStatus.toUpperCase()}`);
      setSlotModalOpen(false);
      await fetchBlocks();
      await fetchAnalysis(selectedBlock);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update slot");
    } finally {
      setSavingSlot(false);
    }
  };

  const tabs = [
    { id: "map", label: "Campus Parking Map", count: blocksData.length },
    { id: "passes", label: "My Parking Passes" },
    ...(canManageSlots ? [{ id: "gate", label: "Gate Verification Desk" }] : []),
    { id: "analysis", label: "Block Analysis & Trends" },
    { id: "policy", label: "Gate & Access Rules" },
  ];

  if (loading && blocksData.length === 0) return <LoadingState />;
  if (error && blocksData.length === 0) return <ErrorState error={error} onRetry={fetchBlocks} />;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <HeaderBanner
        title="Smart Sustainable Parking"
        subtitle="SVVV Campus digital tokens, optical gate verification & real-time slot telemetry"
        taglineTitle="Less Search"
        taglineSub="More Space"
        accent="teal"
        icon={Car}
      />

      {/* Navigation Sub-Tabs & Fast Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <button
          type="button"
          onClick={() => {
            setReserveInitialSlot(null);
            setReserveModalOpen(true);
          }}
          className="btn-primary text-xs py-2 px-4 bg-forest hover:bg-forest/90 font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Ticket size={15} />
          <span>Reserve Parking Slot</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Campus Total Spaces" value={totals.total || 220} accent="teal" icon={Car} />
        <MetricCard
          label="Available Spaces"
          value={totals.available || 95}
          accent="primary"
          badge="Ready to park"
          badgeColor="emerald"
        />
        <MetricCard
          label="Occupied Spaces"
          value={totals.occupied || 115}
          accent="error"
          subtext={`${totalOccupancyPercent}% full`}
        />
        <MetricCard
          label="Reserved Tokens"
          value={totals.reserved || 10}
          accent="amber"
          hint="Active & reserved passes"
        />
      </div>

      {/* TAB 1: Campus Parking Map */}
      {activeTab === "map" && (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Left Column (65%): Map & Slot Grid */}
          <div className="card p-5 lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div>
                <h3 className="font-bold text-ink">SVVV Spatial Campus Map</h3>
                <p className="text-xs text-muted">
                  Gate 1 (Main Entrance) & Gate 2 (Hostel Side) connected to Blocks A–E
                </p>
              </div>

              {/* Block Switcher Buttons */}
              <div className="flex items-center gap-1 bg-page p-1 rounded-xl border border-line">
                {["A", "B", "C", "D", "E"].map((bCode) => (
                  <button
                    key={bCode}
                    type="button"
                    onClick={() => setSelectedBlock(bCode)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      selectedBlock === bCode
                        ? "bg-[#238B57] text-white shadow-xs"
                        : "text-ink hover:bg-mint/60"
                    }`}
                  >
                    Block {bCode}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Schematic Map with Gates and Blocks */}
            <InteractiveParkingMap
              blocks={blocksData}
              gates={gatesData}
              selectedBlock={selectedBlock}
              onSelectBlock={setSelectedBlock}
              onSelectSlot={handleSlotClicked}
              userRole={user?.role}
            />
          </div>

          {/* Right Column (35%): Summary Donut & Block Cards */}
          <div className="space-y-4 lg:col-span-4">
            {/* Campus Occupancy Gauge */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-ink">Campus Capacity</h3>
                <span className="text-[11px] font-semibold text-muted">Realtime</span>
              </div>

              <CircularGauge
                percent={totalOccupancyPercent}
                primaryColor="#0D9488"
                secondaryColor="#E2E8F0"
                centerValue={`${totalOccupancyPercent}%`}
                centerLabel="Occupancy"
                stats={[
                  { label: "Available", value: totals.available, color: "text-[#238B57]" },
                  { label: "Occupied", value: totals.occupied, color: "text-error" },
                  { label: "Reserved", value: totals.reserved, color: "text-amber-600" },
                ]}
              />
            </div>

            {/* Blocks List */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <h3 className="font-bold text-ink text-sm">Campus Blocks (A–E)</h3>
                <span className="text-xs text-muted font-medium">{blocksData.length} Lots</span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {blocksData.map((b) => {
                  const isSelected = selectedBlock === b.block;
                  return (
                    <div
                      key={b.block}
                      onClick={() => setSelectedBlock(b.block)}
                      className={`cursor-pointer rounded-xl border p-3 transition ${
                        isSelected
                          ? "border-[#238B57] bg-mint/50 shadow-xs"
                          : "border-line bg-page/50 hover:bg-mint/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-ink text-xs">{b.name}</p>
                          {b.isRestricted && (
                            <span className="rounded bg-red-100 p-0.5 text-error" title={b.reason}>
                              <Lock size={11} />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-muted uppercase">
                          {b.nearestGate}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted mt-1">
                        <span className="font-semibold text-[#238B57]">{b.availableSpaces} free</span> ·{" "}
                        {b.occupiedSpaces} occupied of {b.totalSpaces}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-line/40 text-[10px]">
                        <span className="font-semibold text-muted capitalize">Region: {b.region}</span>
                        <StatusBadge value={b.freshness || "simulated"} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: My Parking Passes */}
      {activeTab === "passes" && (
        <MyTokensPanel
          onSelectToken={(token) => {
            setViewingPassToken(token);
            setPassModalOpen(true);
          }}
          onOpenReserve={() => {
            setReserveInitialSlot(null);
            setReserveModalOpen(true);
          }}
        />
      )}

      {/* TAB 3: Gate Verification Desk (Staff & Admins) */}
      {activeTab === "gate" && canManageSlots && (
        <StaffGateScanner
          onDataUpdated={() => {
            fetchBlocks();
            fetchAnalysis(selectedBlock);
          }}
        />
      )}

      {/* TAB 4: Block Analysis & Trends */}
      {activeTab === "analysis" && (
        <BlockAnalysisPanel
          blocks={blocksData}
          selectedBlock={selectedBlock}
          analysisData={analysisData}
          onSelectBlock={setSelectedBlock}
        />
      )}

      {/* TAB 5: Gate Policies & Telemetry */}
      {activeTab === "policy" && (
        <div className="card p-6 space-y-5">
          <div>
            <h3 className="font-bold text-ink">SVVV Campus Parking Policy & Access Guidelines</h3>
            <p className="text-xs text-muted">
              Traffic management and gate accessibility rules established by Shri Vaishnav Vidyapeeth Vishwavidyalaya
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-page p-4 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="text-[#176B45]" size={18} />
                <h4 className="font-bold text-ink text-sm">Main Gate 1 (Primary Entrance)</h4>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Connects to <strong>Block A</strong> (Faculty Parking), <strong>Block B</strong> (Staff & Library), and <strong>Block E</strong> (Visitors & General).
                Two-wheelers and four-wheelers with valid faculty or visitor passes must enter through Main Gate 1.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-page p-4 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="text-[#2585D8]" size={18} />
                <h4 className="font-bold text-ink text-sm">North Gate 2 (Hostel & Sports Complex)</h4>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Connects to <strong>Block C</strong> (Student Parking North) and <strong>Block D</strong> (Student Parking South).
                Students commuting by motorcycle, scooter, or car are routed through North Gate 2 to reduce peak congestion at the main entrance.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-mint/50 p-4 text-xs text-ink space-y-1">
            <p className="font-bold text-[#176B45]">Role-Based Access Enforcement</p>
            <p className="text-muted leading-relaxed">
              Faculty members are assigned priority access to Blocks A & B. Students are assigned to Blocks C & D.
              Block E is open to all university visitors and permit holders. Permissions are checked dynamically based on your authenticated account role.
            </p>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={reserveModalOpen}
        onClose={() => setReserveModalOpen(false)}
        initialBlock={selectedBlock}
        initialSlot={reserveInitialSlot}
        blocks={blocksData}
        onSuccess={handleReservationSuccess}
      />

      {/* Digital Parking Pass Modal */}
      <DigitalParkingPass
        isOpen={passModalOpen}
        token={viewingPassToken}
        onClose={() => setPassModalOpen(false)}
        onRefresh={() => {
          fetchBlocks();
          fetchAnalysis(selectedBlock);
        }}
      />

      {/* Slot Inspection / Status Management Modal for Occupied/Reserved slots */}
      {slotModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div>
                <h4 className="font-bold text-ink">Slot Details · {selectedSlot.slotNumber}</h4>
                <p className="text-xs text-muted">Block {selectedBlock} · Real-time Status Control</p>
              </div>
              <button
                type="button"
                onClick={() => setSlotModalOpen(false)}
                className="text-muted hover:text-ink text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {!canManageSlots ? (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-page p-3 space-y-1.5">
                  <p>
                    <strong className="text-ink">Current Status:</strong>{" "}
                    <span className="capitalize font-bold text-error">{selectedSlot.status}</span>
                  </p>
                  <p>
                    <strong className="text-ink">Vehicle Type:</strong>{" "}
                    <span className="capitalize">{selectedSlot.vehicleType || "car"}</span>
                  </p>
                  <p>
                    <strong className="text-ink">Occupant:</strong>{" "}
                    <span className="capitalize">{selectedSlot.occupantRole || "none"}</span>
                  </p>
                </div>
                <p className="text-[11px] text-muted italic">
                  Note: Slot modification requires Estate Desk or Campus Administrator privileges.
                </p>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setSlotModalOpen(false)}
                    className="btn-secondary text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveSlot} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-ink mb-1">Slot Status</label>
                  <select
                    value={slotStatus}
                    onChange={(e) => setSlotStatus(e.target.value)}
                    className="w-full rounded-xl border border-line bg-page p-2 text-xs text-ink outline-none"
                  >
                    <option value="available">Available (Free)</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Vehicle Type</label>
                  <select
                    value={slotVehicleType}
                    onChange={(e) => setSlotVehicleType(e.target.value)}
                    className="w-full rounded-xl border border-line bg-page p-2 text-xs text-ink outline-none"
                  >
                    <option value="car">Four Wheeler (Car)</option>
                    <option value="bike">Two Wheeler (Bike / Scooter)</option>
                  </select>
                </div>

                {slotStatus === "occupied" && (
                  <div>
                    <label className="block font-semibold text-ink mb-1">Occupant Role</label>
                    <select
                      value={slotOccupantRole}
                      onChange={(e) => setSlotOccupantRole(e.target.value)}
                      className="w-full rounded-xl border border-line bg-page p-2 text-xs text-ink outline-none"
                    >
                      <option value="faculty">Faculty Member</option>
                      <option value="student">Student</option>
                      <option value="visitor">Campus Visitor</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setSlotModalOpen(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSlot}
                    className="btn-primary text-xs"
                  >
                    {savingSlot ? "Saving..." : "Update Slot"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
