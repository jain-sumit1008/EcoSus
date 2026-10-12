import { useState, useEffect } from "react";
import {
  Car,
  Bike,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import * as parkingApi from "../../api/parking.api.js";

export default function MyTokensPanel({ onSelectToken, onOpenReserve }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all", "active", "completed"

  const fetchMyTokens = async () => {
    setLoading(true);
    try {
      const res = await parkingApi.getMyTokens({});
      setTokens(res.data?.tokens || []);
    } catch {
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTokens();
  }, []);

  const filteredTokens = tokens.filter((t) => {
    if (filter === "active") return t.status === "RESERVED" || t.status === "CHECKED_IN" || t.status === "ACTIVE";
    if (filter === "completed") return t.status === "COMPLETED";
    if (filter === "cancelled") return t.status === "CANCELLED";
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "RESERVED":
        return (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
            RESERVED
          </span>
        );
      case "CHECKED_IN":
      case "ACTIVE":
        return (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-300">
            PARKED · ACTIVE
          </span>
        );
      case "COMPLETED":
        return (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-700 border border-gray-300">
            COMPLETED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-error border border-red-300">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-page px-2 py-0.5 text-[10px] font-bold text-muted border">
            {status}
          </span>
        );
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " (" + d.toLocaleDateString() + ")";
  };

  return (
    <div className="card p-5 shadow-card space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <h3 className="font-bold text-ink text-base">My Campus Parking Passes</h3>
          <p className="text-[11px] text-muted">
            Track active parking sessions, view digital passes, and QR verification codes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex rounded-xl bg-page p-1 border border-line">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active & Reserved" },
              { id: "completed", label: "History" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  filter === f.id
                    ? "bg-white text-forest shadow-xs font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchMyTokens}
            title="Refresh Passes"
            className="rounded-xl border border-line p-2 text-muted hover:text-ink hover:bg-page transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          {onOpenReserve && (
            <button
              type="button"
              onClick={onOpenReserve}
              className="btn-primary text-xs py-1.5 px-3 bg-forest hover:bg-forest/90 flex items-center gap-1.5 font-bold shadow-xs"
            >
              <PlusCircle size={14} />
              <span>Reserve Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* Passes List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-muted">Loading your parking passes...</div>
      ) : filteredTokens.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-forest shadow-xs">
            <Car size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink">No Parking Passes Found</h4>
            <p className="text-xs text-muted max-w-sm mx-auto mt-0.5">
              {filter === "all"
                ? "You have not reserved any parking slots yet. Reserve a slot from the campus map to get an instant digital pass!"
                : `No passes found matching filter '${filter}'.`}
            </p>
          </div>
          {onOpenReserve && (
            <button
              type="button"
              onClick={onOpenReserve}
              className="btn-primary text-xs px-4 py-2 bg-forest hover:bg-forest/90 font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle size={14} />
              <span>Reserve Slot Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTokens.map((token) => {
            const isBike = token.vehicleType === "bike";
            return (
              <div
                key={token._id}
                className="rounded-2xl border border-line bg-page/60 p-4 transition hover:border-emerald-300 hover:shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-ink">{token.tokenId}</span>
                    <span className="text-[10px] text-muted font-mono">({token.bookingReference})</span>
                  </div>
                  <div>{getStatusBadge(token.status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="card p-2">
                    <span className="text-[10px] text-muted uppercase font-bold">Assigned Slot</span>
                    <p className="text-sm font-black text-forest">{token.slotNumber}</p>
                    <span className="text-[10px] text-muted">Block {token.block}</span>
                  </div>

                  <div className="card p-2">
                    <span className="text-[10px] text-muted uppercase font-bold">Vehicle Plate</span>
                    <p className="text-xs font-black text-ink font-mono">{token.vehicleNumber}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted capitalize">
                      {isBike ? <Bike size={12} /> : <Car size={12} />}
                      <span>{token.vehicleType}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-muted border-t border-line/60 pt-2">
                  <div className="flex items-center justify-between">
                    <span>Valid Window:</span>
                    <span className="font-medium text-ink">{formatTime(token.endTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gate Entrance:</span>
                    <span className="font-semibold text-ink">{token.nearestGate || "Main Gate 1"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Charges:</span>
                    <span className="font-bold text-forest">
                      ₹{token.pricing?.finalAmount ?? token.pricing?.estimatedTotal ?? 0}{" "}
                      <span className="text-[9px] font-normal text-muted">
                        ({token.pricing?.paymentStatus || "PENDING"})
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-line/60">
                  <button
                    type="button"
                    onClick={() => onSelectToken && onSelectToken(token)}
                    className="btn-primary w-full text-xs py-2 bg-forest hover:bg-forest/90 font-bold flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <QrCode size={14} />
                    <span>View Digital Pass & QR</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
