import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { markAttendanceViaSession, getSessionById } from "../../utils/attendanceStorage.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function StudentQrScanner({ onAttendanceRecorded }) {
  const { user } = useAuth();
  const toast = useToast();

  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [successRecord, setSuccessRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const html5QrCodeRef = useRef(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().catch(() => {});
        } catch {}
      }
    };
  }, []);

  // Process a Scanned QR String or Manual Code
  const processSessionCode = async (rawString) => {
    if (!rawString || submitting) return;

    let targetSessionId = rawString.trim();

    // Check if it's a JSON payload
    try {
      if (rawString.startsWith("{") && rawString.endsWith("}")) {
        const parsed = JSON.parse(rawString);
        if (parsed.sessionId) {
          targetSessionId = parsed.sessionId;
        }
      }
    } catch {
      // not json, use raw string as sessionId
    }

    setSubmitting(true);
    setError(null);

    try {
      // Call authenticated attendance marking
      const result = markAttendanceViaSession({
        sessionId: targetSessionId,
        studentUser: {
          id: user?.id || user?._id || "USR-STU-101",
          name: user?.name || "Rahul Sharma",
          enrollmentNumber: user?.studentId || user?.enrollmentNumber || "0827CS221082",
          department: user?.department || "Computer Science & Engineering",
        },
      });

      // Stop camera on success
      if (html5QrCodeRef.current && scanning) {
        try {
          await html5QrCodeRef.current.stop();
          setScanning(false);
        } catch {}
      }

      setSuccessRecord(result.record);
      toast.success(`Attendance marked for ${result.record.subjectName}!`);
      if (onAttendanceRecorded) onAttendanceRecorded(result.record);
    } catch (err) {
      const msg = err.message || "Failed to mark attendance.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Start HTML5 Camera Scanner
  const startCameraScanner = async () => {
    setError(null);
    setCameraError(null);
    setSuccessRecord(null);

    try {
      const scanner = new Html5Qrcode("student-attendance-qr-reader");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          processSessionCode(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );

      setScanning(true);
    } catch (err) {
      console.warn("Camera start error:", err);
      setCameraError(
        "Camera access could not be initialized. Ensure you have granted camera permissions in your browser or use the manual session code option below."
      );
      setScanning(false);
    }
  };

  // Stop Camera Scanner
  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {}
      setScanning(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setError("Please enter a valid attendance session code.");
      return;
    }
    processSessionCode(manualCode.trim());
  };

  return (
    <div className="card p-6 shadow-card max-w-xl mx-auto space-y-5 border border-line">
      {/* Header */}
      <div className="border-b border-line pb-3">
        <div className="flex items-center gap-2 text-[#176B45]">
          <Camera size={22} />
          <h3 className="font-extrabold text-ink text-lg">Scan Attendance QR</h3>
        </div>
        <p className="text-xs text-muted mt-1">
          Scan the active QR displayed by your faculty during class to record your attendance.
        </p>
      </div>

      {/* Verified Student Authenticated Identity Badge */}
      <div className="flex items-center justify-between rounded-xl bg-mint/50 px-3.5 py-2.5 border border-emerald-200 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-forest shrink-0" />
          <div>
            <span className="font-bold text-ink">{user?.name || "Rahul Sharma"}</span>
            <span className="font-mono text-muted text-[11px] ml-2">
              ({user?.studentId || user?.enrollmentNumber || "0827CS221082"})
            </span>
          </div>
        </div>
        <span className="rounded-full bg-forest text-white px-2 py-0.5 text-[10px] font-bold">
          Verified Student
        </span>
      </div>

      {/* Success Confirmation Card */}
      {successRecord && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 space-y-3 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-extrabold text-ink text-sm">Attendance Marked Successfully!</h4>
              <p className="text-[11px] text-emerald-700">Official record saved in campus register.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs rounded-xl bg-white p-3 border border-emerald-200">
            <div>
              <span className="text-muted text-[10px] block">Subject / Lab:</span>
              <span className="font-bold text-ink">{successRecord.subjectName}</span>
            </div>
            <div>
              <span className="text-muted text-[10px] block">Date & Check-in:</span>
              <span className="font-bold text-ink">
                {successRecord.date} · {successRecord.checkInTime}
              </span>
            </div>
            <div>
              <span className="text-muted text-[10px] block">Status:</span>
              <span className="font-bold text-emerald-700">{successRecord.status}</span>
            </div>
            <div>
              <span className="text-muted text-[10px] block">Session ID:</span>
              <span className="font-mono text-[11px] font-bold text-forest">{successRecord.sessionId}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSuccessRecord(null)}
            className="btn-outline w-full text-xs py-2 text-[#176B45] font-bold"
          >
            Scan Another Session
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-error font-medium flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Camera View Box */}
      <div className="space-y-3">
        <div
          id="student-attendance-qr-reader"
          className="w-full overflow-hidden rounded-2xl bg-black/5 border border-line aspect-4/3 flex items-center justify-center relative"
        >
          {!scanning && (
            <div className="text-center p-6 space-y-2">
              <QrCode size={40} className="mx-auto text-muted/60" />
              <p className="text-xs text-muted font-medium">Camera is currently idle</p>
              <button
                type="button"
                onClick={startCameraScanner}
                disabled={submitting}
                className="btn-primary text-xs font-bold py-2.5 px-4 bg-forest hover:bg-forest/90 shadow-sm flex items-center gap-1.5 mx-auto"
              >
                <Camera size={14} />
                <span>Start Camera Scanner</span>
              </button>
            </div>
          )}
        </div>

        {scanning && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted flex items-center gap-1.5 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Scanning for Faculty QR Code...</span>
            </span>
            <button
              type="button"
              onClick={stopCameraScanner}
              className="text-xs text-error font-bold hover:underline"
            >
              Stop Camera
            </button>
          </div>
        )}

        {cameraError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
            <span className="font-bold block">Camera Notice:</span>
            <p className="text-[11px]">{cameraError}</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-line w-full" />
        <span className="bg-card px-2.5 text-[10px] font-bold text-muted uppercase tracking-wider shrink-0">
          Or Enter Session Code Manually
        </span>
        <div className="border-t border-line w-full" />
      </div>

      {/* Manual Code Form */}
      <form onSubmit={handleManualSubmit} className="space-y-2">
        <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
          8-Digit Session Identifier (Displayed below QR):
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="e.g. SES-20261012-7001"
            className="input font-mono text-xs flex-1 uppercase"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !manualCode.trim()}
            className="btn-primary text-xs px-4 py-2 bg-forest hover:bg-forest/90 font-bold shrink-0 disabled:opacity-60 flex items-center gap-1.5"
          >
            {submitting ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
            <span>Mark Attendance</span>
          </button>
        </div>
      </form>

      {/* Anti-Proxy Security Policy */}
      <div className="rounded-xl border border-line bg-page/60 p-3 text-[11px] text-muted space-y-1">
        <span className="font-bold text-ink block">SVVV Academic Integrity Rule:</span>
        <p>
          Attendance is stamped with your authenticated institutional account ({user?.email}).
          Marking attendance on behalf of another student is strictly prohibited.
        </p>
      </div>
    </div>
  );
}
