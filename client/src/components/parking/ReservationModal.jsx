import { useState, useEffect } from "react";
import { X, Car, Bike, Clock, Calendar, ShieldCheck, MapPin, AlertCircle, ArrowRight } from "lucide-react";
import * as parkingApi from "../../api/parking.api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const DURATION_OPTIONS = [
  { hours: 1, label: "1 Hour" },
  { hours: 2, label: "2 Hours (Standard)" },
  { hours: 4, label: "4 Hours (Half Day)" },
  { hours: 8, label: "8 Hours (Full Day)" },
];

export default function ReservationModal({
  isOpen,
  onClose,
  initialBlock = "A",
  initialSlot = null,
  blocks = [],
  onSuccess,
}) {
  const { user } = useAuth();
  const [selectedBlock, setSelectedBlock] = useState(initialBlock);
  const [selectedSlot, setSelectedSlot] = useState(initialSlot?.slotNumber || "");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState(initialSlot?.vehicleType || "car");
  const [durationHours, setDurationHours] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Sync props when modal opens or initial selection changes
  useEffect(() => {
    if (initialBlock) setSelectedBlock(initialBlock);
    if (initialSlot?.slotNumber) {
      setSelectedSlot(initialSlot.slotNumber);
      if (initialSlot.vehicleType) setVehicleType(initialSlot.vehicleType);
    }
  }, [initialBlock, initialSlot, isOpen]);

  if (!isOpen) return null;

  const currentBlockData = blocks.find((b) => b.block === selectedBlock) || blocks[0] || {};
  const availableSlots = (currentBlockData.slots || []).filter(
    (s) => s.status === "available" && (!vehicleType || s.vehicleType === vehicleType || true)
  );

  // Pricing calculations
  const baseRate = vehicleType === "bike" ? 10 : 20;
  const rawTotal = baseRate * durationHours;
  const isPermit = user?.role === "admin";
  const estimatedTotal = isPermit ? 0 : Math.min(rawTotal, 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedSlot) {
      setError("Please select an available parking slot.");
      return;
    }

    if (!vehicleNumber.trim()) {
      setError("Please enter your vehicle registration number (e.g. MP09-AB-1234).");
      return;
    }

    try {
      setSubmitting(true);
      const res = await parkingApi.reserveSlot({
        block: selectedBlock,
        slotNumber: selectedSlot,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleType,
        durationHours: Number(durationHours),
        startTime: new Date().toISOString(),
      });

      const token = res.data?.token;
      if (onSuccess) {
        onSuccess(token);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to reserve slot.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-line overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line bg-page px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-white shadow-xs">
              <Car size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Reserve Smart Parking Slot</h3>
              <p className="text-[11px] text-muted">Generate instant verified digital pass for SVVV Campus</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-black/5 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-error border border-red-200">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Block Selector */}
          <div>
            <label className="text-xs font-bold text-ink mb-1.5 block">
              1. Select Parking Facility / Block
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {["A", "B", "C", "D", "E"].map((blk) => {
                const bData = blocks.find((b) => b.block === blk) || {};
                const isSelected = selectedBlock === blk;
                return (
                  <button
                    key={blk}
                    type="button"
                    onClick={() => {
                      setSelectedBlock(blk);
                      setSelectedSlot("");
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 border text-center transition ${
                      isSelected
                        ? "bg-forest text-white border-forest shadow-xs font-bold"
                        : "bg-page text-ink border-line hover:bg-mint/40 font-medium"
                    }`}
                  >
                    <span className="text-xs font-extrabold">Block {blk}</span>
                    <span className={`text-[10px] ${isSelected ? "text-emerald-100" : "text-muted"}`}>
                      {bData.availableSpaces ?? 0} free
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
              <span>{currentBlockData.name || `Block ${selectedBlock}`}</span>
              <span>Gate: {currentBlockData.nearestGate || "Main Gate 1"}</span>
            </div>
          </div>

          {/* Vehicle Type Toggle */}
          <div>
            <label className="text-xs font-bold text-ink mb-1.5 block">
              2. Vehicle Type & Charges
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVehicleType("car")}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                  vehicleType === "car"
                    ? "bg-forest/10 border-forest text-forest font-bold"
                    : "bg-page border-line text-muted hover:text-ink font-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Car size={16} />
                  <span>Four-Wheeler / Car</span>
                </div>
                <span className="font-extrabold text-[11px]">₹20/hr</span>
              </button>

              <button
                type="button"
                onClick={() => setVehicleType("bike")}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                  vehicleType === "bike"
                    ? "bg-forest/10 border-forest text-forest font-bold"
                    : "bg-page border-line text-muted hover:text-ink font-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bike size={16} />
                  <span>Two-Wheeler / Bike</span>
                </div>
                <span className="font-extrabold text-[11px]">₹10/hr</span>
              </button>
            </div>
          </div>

          {/* Vehicle Registration Number */}
          <div>
            <label className="text-xs font-bold text-ink mb-1.5 block" htmlFor="vNum">
              3. Vehicle Registration Number
            </label>
            <div className="relative">
              <input
                id="vNum"
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g. MP09-AB-1234"
                className="input text-xs font-bold tracking-wider uppercase pl-3"
                required
              />
            </div>
            <p className="mt-1 text-[10px] text-muted">
              Must match the vehicle presented at the gate camera scanner for automatic check-in.
            </p>
          </div>

          {/* Available Slot Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-ink">
                4. Select Slot in Block {selectedBlock}
              </label>
              <span className="text-[11px] text-forest font-semibold">
                {availableSlots.length} available slots
              </span>
            </div>

            {availableSlots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line p-3 text-center text-xs text-muted">
                No slots currently available in Block {selectedBlock}. Please select another block.
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1 border border-line rounded-xl bg-page/50">
                {availableSlots.map((s) => {
                  const isSelected = selectedSlot === s.slotNumber;
                  return (
                    <button
                      key={s.slotNumber}
                      type="button"
                      onClick={() => setSelectedSlot(s.slotNumber)}
                      className={`rounded-lg py-1.5 px-1 text-center text-xs font-bold transition border ${
                        isSelected
                          ? "bg-forest text-white border-forest shadow-xs"
                          : "bg-white text-ink border-line hover:border-emerald-300"
                      }`}
                    >
                      {s.slotNumber}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Duration Selector */}
          <div>
            <label className="text-xs font-bold text-ink mb-1.5 block">
              5. Expected Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setDurationHours(opt.hours)}
                  className={`rounded-lg py-2 px-1 text-xs text-center border transition ${
                    durationHours === opt.hours
                      ? "bg-forest text-white border-forest font-bold shadow-xs"
                      : "bg-page text-ink border-line hover:bg-mint/40 font-medium"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cost Preview Card */}
          <div className="rounded-xl bg-mint/50 p-3.5 border border-emerald-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-muted">
              <span>Rate ({vehicleType === "bike" ? "Two-Wheeler" : "Four-Wheeler"}):</span>
              <span className="font-semibold text-ink">₹{baseRate} / hour</span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>Duration:</span>
              <span className="font-semibold text-ink">{durationHours} Hours</span>
            </div>
            {isPermit && (
              <div className="flex items-center justify-between text-forest font-semibold">
                <span>University Admin Permit:</span>
                <span>-100% (Waiver)</span>
              </div>
            )}
            <div className="border-t border-emerald-200 pt-1.5 flex items-center justify-between text-sm font-bold text-ink">
              <span>Estimated Payable:</span>
              <span className="text-forest text-base">₹{estimatedTotal}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline text-xs px-4 py-2.5"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5 bg-forest hover:bg-forest/90"
            >
              <span>{submitting ? "Booking..." : "Confirm & Generate Pass"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
