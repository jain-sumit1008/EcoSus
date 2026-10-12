import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Car,
  Bike,
  ShieldCheck,
  CreditCard,
  QrCode,
  ArrowRight,
  RefreshCw,
  LogOut,
  LogIn,
} from "lucide-react";
import * as parkingApi from "../../api/parking.api.js";

const GATES = ["Main Gate 1", "North Gate 2"];

export default function StaffGateScanner({ onDataUpdated }) {
  const [mode, setMode] = useState("entry"); // "entry" or "exit"
  const [selectedGate, setSelectedGate] = useState("Main Gate 1");
  const [tokenInput, setTokenInput] = useState("");
  const [scannedToken, setScannedToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [confirmedPlate, setConfirmedPlate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CAMPUS_UPI");
  const [gateStats, setGateStats] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const html5QrCodeRef = useRef(null);

  // Fetch live gate operations metrics
  const fetchStats = async () => {
    try {
      const res = await parkingApi.getGateDashboard();
      setGateStats(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup camera scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .catch(() => {})
          .then(() => {
            html5QrCodeRef.current?.clear();
          });
      }
    };
  }, []);

  const startScanner = async () => {
    setError(null);
    try {
      setCameraActive(true);
      const scanner = new Html5Qrcode("reader");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setError("Unable to access camera. Please allow camera permissions or enter token ID manually.");
      setCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {
        // ignore
      }
    }
    setCameraActive(false);
  };

  const handleScanSuccess = async (text) => {
    stopScanner();
    let idToLookup = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.tokenId) idToLookup = parsed.tokenId;
    } catch {
      // plaintext token id
    }
    setTokenInput(idToLookup);
    lookupToken(idToLookup);
  };

  const lookupToken = async (id) => {
    if (!id || !id.trim()) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await parkingApi.getTokenById(id.trim().toUpperCase());
      const tok = res.data?.token;
      setScannedToken(tok);
      setConfirmedPlate(tok.vehicleNumber || "");
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Token '${id}' not found.`);
      setScannedToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEntry = async () => {
    if (!scannedToken) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await parkingApi.verifyGateEntry({
        tokenId: scannedToken.tokenId,
        gateId: selectedGate,
        confirmedVehicleNumber: confirmedPlate,
      });
      setSuccessMsg(`Gate Entry Verified: Vehicle ${res.data?.token?.vehicleNumber} checked in successfully at ${selectedGate}!`);
      setScannedToken(res.data?.token);
      fetchStats();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Entry verification failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyExit = async () => {
    if (!scannedToken) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await parkingApi.verifyGateExit({
        tokenId: scannedToken.tokenId,
        gateId: selectedGate,
        paymentMethod,
      });
      const receipt = res.data?.receipt;
      setSuccessMsg(
        `Exit Cleared: ₹${receipt?.finalAmount || 0} collected via ${paymentMethod}. Slot ${receipt?.slotNumber} is now available!`
      );
      setScannedToken(res.data?.token);
      fetchStats();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Exit verification failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setScannedToken(null);
    setTokenInput("");
    setError(null);
    setSuccessMsg(null);
    setConfirmedPlate("");
  };

  return (
    <div className="space-y-4">
      {/* Live Gate Operations Stats Banner */}
      {gateStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-3 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-muted">Currently Parked</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-ink">{gateStats.overview?.occupiedSpaces ?? 0}</span>
              <span className="text-xs text-muted">/ {gateStats.overview?.totalCapacity ?? 0} slots</span>
            </div>
            <span className="text-[10px] text-muted">
              {gateStats.overview?.occupancyRate ?? 0}% occupancy
            </span>
          </div>

          <div className="card p-3 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-muted">Available Slots</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-forest">
                {gateStats.overview?.availableSpaces ?? 0}
              </span>
              <span className="text-xs text-muted">Free across Blocks A–E</span>
            </div>
            <span className="text-[10px] text-forest font-semibold">Ready for entry</span>
          </div>

          <div className="card p-3 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-muted">Today's Traffic</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-ink">{gateStats.activity?.todayEntries ?? 0}</span>
              <span className="text-xs text-muted">in / {gateStats.activity?.todayExits ?? 0} out</span>
            </div>
            <span className="text-[10px] text-muted">{gateStats.activity?.activeTokens ?? 0} active passes</span>
          </div>

          <div className="card p-3 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-muted">Gate Revenue</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-ink">₹{gateStats.activity?.todayRevenue ?? 0}</span>
            </div>
            <span className="text-[10px] text-forest font-semibold">Collected today</span>
          </div>
        </div>
      )}

      {/* Verification Desk Card */}
      <div className="card p-5 shadow-card space-y-4">
        {/* Controls: Mode Switcher & Gate Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <h3 className="font-bold text-ink text-base">Campus Gate Verification Desk</h3>
            <p className="text-[11px] text-muted">
              Real-time optical QR pass scanner, vehicle plate matching, and contactless checkout
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-page p-1 border border-line">
              <button
                type="button"
                onClick={() => {
                  setMode("entry");
                  resetForm();
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  mode === "entry"
                    ? "bg-forest text-white shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                <LogIn size={14} />
                <span>Entry Gate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("exit");
                  resetForm();
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  mode === "exit"
                    ? "bg-forest text-white shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                <LogOut size={14} />
                <span>Exit Gate</span>
              </button>
            </div>

            {/* Gate selector */}
            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value)}
              className="select text-xs font-bold py-1.5 px-3 border-line"
            >
              {GATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Bar: Camera Scanner Button & Manual Token Lookup */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <div className="md:col-span-8 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && lookupToken(tokenInput)}
                placeholder="Enter Token ID (e.g. TK-SVVV-2026-7842) or Booking Ref..."
                className="input text-xs font-mono font-bold tracking-wider pl-9"
              />
              <Search size={16} className="absolute left-3 top-3 text-muted pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => lookupToken(tokenInput)}
              disabled={loading || !tokenInput.trim()}
              className="btn-primary text-xs px-4 bg-forest hover:bg-forest/90 shrink-0"
            >
              {loading ? "Searching..." : "Lookup Pass"}
            </button>
          </div>

          <div className="md:col-span-4 flex gap-2">
            {!cameraActive ? (
              <button
                type="button"
                onClick={startScanner}
                className="btn-outline w-full text-xs py-2 flex items-center justify-center gap-2 border-forest text-forest hover:bg-mint/40 font-bold"
              >
                <Camera size={16} />
                <span>Scan Pass QR Camera</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopScanner}
                className="btn-outline w-full text-xs py-2 flex items-center justify-center gap-2 border-red-300 text-error hover:bg-red-50 font-bold"
              >
                <XCircle size={16} />
                <span>Stop Camera Scanner</span>
              </button>
            )}
          </div>
        </div>

        {/* Camera Scanner Viewport */}
        {cameraActive && (
          <div className="rounded-2xl border-2 border-dashed border-emerald-400 bg-black/5 p-4 flex flex-col items-center justify-center">
            <div id="reader" className="w-full max-w-sm rounded-xl overflow-hidden shadow-md" />
            <p className="mt-2 text-xs font-semibold text-muted text-center">
              Align user's digital pass QR code inside the camera box
            </p>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-error border border-red-200">
            <XCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-forest border border-emerald-200">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scanned Pass Verification Card */}
        {scannedToken && (
          <div className="rounded-2xl border border-line bg-page/70 p-4 space-y-4 animate-in fade-in duration-100">
            {/* Pass Status Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-ink">{scannedToken.tokenId}</span>
                <span className="text-xs text-muted">({scannedToken.bookingReference})</span>
              </div>

              <div>
                {scannedToken.status === "RESERVED" && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-forest border border-emerald-300">
                    VALID RESERVATION · Ready for Entry
                  </span>
                )}
                {scannedToken.status === "CHECKED_IN" && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-300">
                    VEHICLE PARKED · Checked In
                  </span>
                )}
                {scannedToken.status === "COMPLETED" && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 border border-gray-300">
                    COMPLETED · Exited
                  </span>
                )}
              </div>
            </div>

            {/* Token Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="card p-2.5">
                <span className="text-[10px] text-muted uppercase font-bold">Assigned Slot</span>
                <p className="text-base font-black text-forest">{scannedToken.slotNumber}</p>
                <span className="text-[10px] text-muted">Block {scannedToken.block}</span>
              </div>

              <div className="card p-2.5">
                <span className="text-[10px] text-muted uppercase font-bold">Vehicle Plate</span>
                <p className="text-sm font-black text-ink font-mono">{scannedToken.vehicleNumber}</p>
                <span className="text-[10px] text-muted capitalize">{scannedToken.vehicleType}</span>
              </div>

              <div className="card p-2.5">
                <span className="text-[10px] text-muted uppercase font-bold">Pass Holder</span>
                <p className="text-xs font-bold text-ink truncate">{scannedToken.userName}</p>
                <span className="text-[10px] text-muted capitalize">{scannedToken.userRole}</span>
              </div>

              <div className="card p-2.5">
                <span className="text-[10px] text-muted uppercase font-bold">Billing Status</span>
                <p className="text-xs font-bold text-ink">
                  ₹{scannedToken.pricing?.finalAmount ?? scannedToken.pricing?.estimatedTotal ?? 0}
                </p>
                <span className="text-[10px] text-forest font-semibold">
                  {scannedToken.pricing?.paymentStatus || "PENDING"}
                </span>
              </div>
            </div>

            {/* Mode-Specific Gate Actions */}
            {mode === "entry" ? (
              <div className="card p-3 border-emerald-200 bg-white space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink">Entry Gate Verification Checklist:</span>
                  <span className="text-muted text-[11px]">Gate: {selectedGate}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-muted block mb-1">
                      Confirm Physical Vehicle Plate Match
                    </label>
                    <input
                      type="text"
                      value={confirmedPlate}
                      onChange={(e) => setConfirmedPlate(e.target.value.toUpperCase())}
                      placeholder={scannedToken.vehicleNumber}
                      className="input text-xs font-mono font-bold tracking-wider uppercase"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyEntry}
                    disabled={actionLoading || scannedToken.status !== "RESERVED"}
                    className="btn-primary mt-5 text-xs px-5 py-2.5 bg-forest hover:bg-forest/90 font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{actionLoading ? "Verifying..." : "Confirm Vehicle Entry"}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="card p-3 border-blue-200 bg-white space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink">Exit Clearance & Fee Settlement:</span>
                  <span className="text-muted text-[11px]">Gate: {selectedGate}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">
                      Select Payment Settlement Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="select text-xs font-bold py-1.5 px-3 border-line w-full"
                    >
                      <option value="CAMPUS_UPI">Campus UPI QR (PhonePe / GPay / Paytm)</option>
                      <option value="STUDENT_WALLET">Student / Faculty SVVV Smart Card</option>
                      <option value="DEBIT_CREDIT_CARD">Debit / Credit Card POS</option>
                      <option value="UNIVERSITY_PERMIT">University Permit (Authorized Waiver)</option>
                      <option value="CASH">Cash at Gate Desk</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleVerifyExit}
                      disabled={actionLoading || scannedToken.status === "COMPLETED"}
                      className="btn-primary w-full text-xs py-2.5 bg-[#2585D8] hover:bg-[#1E70B8] font-bold flex items-center justify-center gap-1.5 shadow-sm text-white"
                    >
                      <span>{actionLoading ? "Settling..." : "Process Payment & Release Slot"}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
