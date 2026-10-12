import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  Printer,
  Download,
  Car,
  Bike,
  ShieldCheck,
  Clock,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import * as parkingApi from "../../api/parking.api.js";

export default function DigitalParkingPass({ token, isOpen, onClose, onRefresh }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  if (!isOpen || !token) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this parking reservation? The slot will be released.")) {
      return;
    }
    try {
      setCancelling(true);
      setCancelError(null);
      await parkingApi.cancelToken(token.tokenId, "User requested cancellation");
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      setCancelError(err.response?.data?.message || err.message || "Failed to cancel reservation.");
    } finally {
      setCancelling(false);
    }
  };

  const isBike = token.vehicleType === "bike";
  const isReserved = token.status === "RESERVED";
  const isCheckedIn = token.status === "CHECKED_IN" || token.status === "ACTIVE";
  const isCompleted = token.status === "COMPLETED";
  const isCancelled = token.status === "CANCELLED";

  const statusBadge = () => {
    if (isReserved) {
      return (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
          RESERVED · Awaiting Gate Entry
        </span>
      );
    }
    if (isCheckedIn) {
      return (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-300">
          ACTIVE · Currently Parked
        </span>
      );
    }
    if (isCompleted) {
      return (
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 border border-gray-300">
          COMPLETED · Exited
        </span>
      );
    }
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-error border border-red-300">
        {token.status}
      </span>
    );
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " (" + d.toLocaleDateString() + ")";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-line overflow-hidden flex flex-col max-h-[92vh]">
        {/* Printable Pass Header */}
        <div className="bg-gradient-to-r from-[#073B2C] via-[#176B45] to-[#238B57] p-5 text-white text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition print:hidden"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-200">
            Shri Vaishnav Vidyapeeth Vishwavidyalaya
          </p>
          <h2 className="text-xl font-black tracking-tight mt-0.5">EcoPulse Digital Parking Pass</h2>
          <p className="text-[10px] text-white/80 mt-1">Smart Campus Contactless Gate Verification</p>

          <div className="mt-3 inline-block">{statusBadge()}</div>
        </div>

        {/* Pass Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {cancelError && (
            <div className="rounded-xl bg-red-50 p-2.5 text-xs text-error border border-red-200">
              {cancelError}
            </div>
          )}

          {/* QR Code Presentation Box */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-page p-4 border border-line shadow-inner">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-line/80">
              <QRCodeSVG
                value={token.qrPayload || token.tokenId}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="mt-3 text-center">
              <p className="text-base font-black tracking-wider text-ink font-mono">{token.tokenId}</p>
              <p className="text-[10px] text-muted">
                Scan with Campus Gate Optical Scanner upon arrival
              </p>
            </div>
          </div>

          {/* Pass Details Grid */}
          <div className="rounded-2xl border border-line bg-white divide-y divide-line text-xs">
            <div className="grid grid-cols-2 p-3 gap-2">
              <div>
                <span className="text-[10px] text-muted uppercase font-semibold block">Assigned Slot</span>
                <span className="text-base font-extrabold text-forest">{token.slotNumber}</span>
                <span className="text-[10px] text-muted block">Block {token.block}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted uppercase font-semibold block">Vehicle Number</span>
                <span className="text-sm font-extrabold text-ink font-mono">{token.vehicleNumber}</span>
                <div className="flex items-center justify-end gap-1 text-[10px] text-muted capitalize">
                  {isBike ? <Bike size={12} /> : <Car size={12} />}
                  <span>{token.vehicleType}</span>
                </div>
              </div>
            </div>

            <div className="p-3 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[10px] text-muted uppercase font-semibold block">Booking Reference</span>
                <span className="font-bold text-ink font-mono">{token.bookingReference}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted uppercase font-semibold block">Nearest Gate</span>
                <span className="font-semibold text-ink">{token.nearestGate || "Main Gate 1"}</span>
              </div>
            </div>

            <div className="p-3 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted">Pass Holder:</span>
                <span className="font-bold text-ink">{token.userName} ({token.userRole})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Start Time:</span>
                <span className="font-medium text-ink">{formatDateTime(token.startTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Valid Until:</span>
                <span className="font-semibold text-forest">{formatDateTime(token.endTime)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-line/60 pt-1.5">
                <span className="text-muted">Billing Amount:</span>
                <span className="font-extrabold text-ink">
                  ₹{token.pricing?.finalAmount ?? token.pricing?.estimatedTotal ?? 0}{" "}
                  <span className="text-[10px] font-normal text-muted">
                    ({token.pricing?.paymentStatus || "PENDING"})
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-outline flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
            >
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>

            {isReserved && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="rounded-xl border border-red-200 bg-red-50 text-error hover:bg-red-100 text-xs px-3 py-2.5 font-bold transition"
              >
                {cancelling ? "Cancelling..." : "Cancel Booking"}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn-primary flex-1 text-xs py-2.5 bg-forest hover:bg-forest/90"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
