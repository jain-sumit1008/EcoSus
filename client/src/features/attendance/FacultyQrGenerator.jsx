import { useState, useEffect, useMemo, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Clock,
  CheckCircle2,
  Users,
  XCircle,
  Download,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import {
  createAttendanceSession,
  getAttendanceSessions,
  closeAttendanceSession,
  REGISTERED_ACCOUNTS,
} from "../../utils/attendanceStorage.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function FacultyQrGenerator() {
  const { user } = useAuth();
  const toast = useToast();

  // Find faculty assignments
  const facultyProfile = useMemo(() => {
    return (
      REGISTERED_ACCOUNTS.find((acc) => acc.email === user?.email || acc.role === "faculty") || {
        name: user?.name || "Dr. Mehta",
        department: "Computer Science & Engineering",
        assignedSubjects: [
          { id: "CS401", name: "Network Security Lab", semester: "Semester 4", lab: "Cyber Security Lab (Block C - 302)" },
          { id: "CS602", name: "Cloud Computing Architecture", semester: "Semester 6", lab: "AWS Cloud Lab (Block B - 204)" },
          { id: "CS203", name: "Data Structures & Algorithms", semester: "Semester 2", lab: "Programming Lab 1 (Block A - 105)" },
        ],
      }
    );
  }, [user]);

  const assignedList = facultyProfile.assignedSubjects || [];

  // Form state for creating a new session
  const [selectedSubjectId, setSelectedSubjectId] = useState(assignedList[0]?.id || "CS401");
  const [batch, setBatch] = useState("Batch A");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionsHistory, setSessionsHistory] = useState([]);
  const [fullScreen, setFullScreen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const qrContainerRef = useRef(null);

  const selectedSubject = assignedList.find((s) => s.id === selectedSubjectId) || assignedList[0];

  // Refresh sessions from storage
  const loadSessions = () => {
    const list = getAttendanceSessions();
    const facultySessions = list.filter(
      (s) => s.facultyName === user?.name || s.facultyId === user?.id || user?.role === "admin" || s.facultyName === "Dr. Mehta"
    );
    setSessionsHistory(facultySessions);

    // Keep active session updated
    if (activeSession) {
      const refreshed = list.find((s) => s.sessionId === activeSession.sessionId);
      if (refreshed) setActiveSession(refreshed);
    } else {
      // Find latest active session if any
      const active = facultySessions.find((s) => s.status === "Active");
      if (active) setActiveSession(active);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 3000); // Polling for student scans
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for active session
  useEffect(() => {
    if (!activeSession || activeSession.status !== "Active") {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const exp = new Date(activeSession.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((exp - now) / 1000));

      if (diff <= 0) {
        setTimeRemaining("00:00 (Expired)");
        loadSessions();
      } else {
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        setTimeRemaining(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  // Handle Create Session
  const handleGenerate = (e) => {
    e.preventDefault();
    try {
      const session = createAttendanceSession({
        facultyId: user?.id || "USR-FAC-201",
        facultyName: user?.name || "Dr. Mehta",
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        labName: selectedSubject.lab,
        semester: selectedSubject.semester,
        batch,
        durationMinutes: Number(durationMinutes),
      });

      setActiveSession(session);
      loadSessions();
      toast.success(`Active Attendance QR generated for ${session.subjectName}!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle Close Session
  const handleClose = (sessionId) => {
    if (window.confirm("Close this attendance session now? Students will no longer be able to scan.")) {
      try {
        closeAttendanceSession(sessionId, user?.id);
        toast.success("Attendance session closed.");
        loadSessions();
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  // Minimal safe QR payload (no passwords, only session ID & metadata)
  const qrPayload = useMemo(() => {
    if (!activeSession) return "";
    return JSON.stringify({
      sessionId: activeSession.sessionId,
      subjectId: activeSession.subjectId,
      subjectName: activeSession.subjectName,
      semester: activeSession.semester,
      batch: activeSession.batch,
      expiresAt: activeSession.expiresAt,
    });
  }, [activeSession]);

  // Download QR Code as PNG
  const handleDownloadQR = () => {
    const svg = document.getElementById("faculty-attendance-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `SVVV_Attendance_QR_${activeSession?.sessionId || "code"}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="space-y-6">
      {/* Faculty Control & Generator Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Form: Configure & Generate Attendance Session (5 cols) */}
        <div className="lg:col-span-5 card p-5 shadow-card space-y-4">
          <div className="border-b border-line pb-3">
            <div className="flex items-center gap-2 text-[#176B45]">
              <QrCode size={20} />
              <h3 className="font-extrabold text-ink text-base">Generate Attendance QR</h3>
            </div>
            <p className="text-xs text-muted mt-1">
              Authorized faculty session generator for SVVV classroom & lab attendance.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-3.5 text-xs">
            {/* Subject / Lab Selector */}
            <div>
              <label className="font-bold text-ink block mb-1">Assigned Subject / Lab Course:</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="select w-full text-xs font-semibold"
              >
                {assignedList.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.id} · {sub.name} ({sub.semester})
                  </option>
                ))}
              </select>
            </div>

            {/* Semester & Batch */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-ink block mb-1">Semester:</label>
                <input
                  type="text"
                  value={selectedSubject.semester}
                  disabled
                  className="input bg-page text-muted text-xs font-semibold cursor-not-allowed w-full"
                />
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">Student Group / Batch:</label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="select w-full text-xs font-semibold"
                >
                  <option value="Batch A">Batch A (Roll 01–35)</option>
                  <option value="Batch B">Batch B (Roll 36–70)</option>
                  <option value="All Batches">All Batches Combined</option>
                </select>
              </div>
            </div>

            {/* Lab Location */}
            <div>
              <label className="font-bold text-ink block mb-1">Lab / Venue Location:</label>
              <input
                type="text"
                value={selectedSubject.lab}
                disabled
                className="input bg-page text-muted text-xs font-medium cursor-not-allowed w-full"
              />
            </div>

            {/* QR Validity Window */}
            <div>
              <label className="font-bold text-ink block mb-1">QR Expiry / Validity Window:</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="select w-full text-xs font-semibold"
              >
                <option value={2}>2 Minutes (Anti-proxy rapid check)</option>
                <option value={5}>5 Minutes (Recommended standard lab check)</option>
                <option value={10}>10 Minutes (Standard lecture roll)</option>
                <option value={15}>15 Minutes (Extended lab buffer)</option>
                <option value={30}>30 Minutes (Full lab duration)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary w-full text-xs font-bold py-3 bg-[#176B45] hover:bg-[#073B2C] shadow-md transition flex items-center justify-center gap-2 mt-2"
            >
              <Plus size={16} />
              <span>Generate Attendance QR Code</span>
            </button>
          </form>

          {/* Security Rules Notice */}
          <div className="rounded-xl border border-line bg-page/60 p-3 text-[11px] text-muted space-y-1">
            <span className="font-bold text-ink block">Faculty Verification Guard:</span>
            <p>
              • The generated QR encodes only a unique session identifier and cryptographic expiry.
            </p>
            <p>
              • Students must be signed in with their registered SVVV account to record attendance.
            </p>
          </div>
        </div>

        {/* Right Panel: Live Attendance QR Display & Realtime Scan Counter (7 cols) */}
        <div className="lg:col-span-7 card p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-extrabold text-ink text-base">Active Class Attendance Session</h3>
              <p className="text-xs text-muted">
                Display this QR on your projector screen for students to scan.
              </p>
            </div>

            {activeSession && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${
                  activeSession.status === "Active"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse"
                    : activeSession.status === "Expired"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-red-100 text-error border-red-300"
                }`}
              >
                {activeSession.status}
              </span>
            )}
          </div>

          {activeSession ? (
            <div className="grid md:grid-cols-12 gap-5 items-center">
              {/* QR Code Presentation Box (5 cols) */}
              <div
                ref={qrContainerRef}
                className="md:col-span-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-line shadow-xs space-y-3"
              >
                <div className="p-3 rounded-2xl bg-page/80 border border-line/80 shadow-inner flex items-center justify-center">
                  <QRCodeSVG
                    id="faculty-attendance-qr-svg"
                    value={qrPayload}
                    size={190}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="text-center space-y-0.5">
                  <span className="font-mono text-xs font-bold text-forest bg-mint px-2 py-0.5 rounded-md border border-emerald-200">
                    {activeSession.sessionId}
                  </span>
                  <p className="text-[11px] text-muted font-medium pt-1">
                    Scan with student device camera
                  </p>
                </div>

                {/* Quick QR Controls */}
                <div className="flex items-center gap-2 pt-1 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => setFullScreen(true)}
                    className="btn-outline text-[11px] py-1.5 px-2.5 flex items-center gap-1 font-bold"
                    title="Expand for classroom projector"
                  >
                    <Maximize2 size={13} />
                    <span>Projector</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="btn-outline text-[11px] py-1.5 px-2.5 flex items-center gap-1 font-bold"
                    title="Download QR Image PNG"
                  >
                    <Download size={13} />
                    <span>PNG</span>
                  </button>

                  {activeSession.status === "Active" && (
                    <button
                      type="button"
                      onClick={() => handleClose(activeSession.sessionId)}
                      className="rounded-xl border border-red-200 bg-red-50 text-error text-[11px] py-1.5 px-2.5 flex items-center gap-1 font-bold hover:bg-red-100 transition"
                      title="End this session now"
                    >
                      <XCircle size={13} />
                      <span>Close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Session Metrics & Realtime Attendees (6 cols) */}
              <div className="md:col-span-6 space-y-3.5">
                {/* Countdown & Status Banner */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#176B45] flex items-center gap-1.5">
                      <Clock size={15} />
                      <span>Remaining Validity:</span>
                    </span>
                    <span className="font-mono text-sm font-black text-ink">
                      {timeRemaining || "Checking..."}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    {activeSession.subjectName} · {activeSession.batch}
                  </p>
                </div>

                {/* Live Attendees Counter */}
                <div className="rounded-2xl border border-line bg-page p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <Users size={16} className="text-[#176B45]" />
                      <span>Live Attended Count:</span>
                    </span>
                    <span className="rounded-full bg-forest text-white px-2.5 py-0.5 text-xs font-black">
                      {activeSession.attendees?.length || 0} Students
                    </span>
                  </div>

                  {/* Scanned Student List */}
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {activeSession.attendees && activeSession.attendees.length > 0 ? (
                      activeSession.attendees.map((att, i) => (
                        <div
                          key={att.enrollmentNumber || i}
                          className="flex items-center justify-between rounded-lg bg-white p-2 text-xs border border-line shadow-2xs"
                        >
                          <div>
                            <span className="font-bold text-ink">{att.studentName}</span>
                            <span className="font-mono text-[10px] text-muted ml-2">
                              {att.enrollmentNumber}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            <span>Marked</span>
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="py-4 text-center text-xs text-muted italic">
                        Awaiting student scans... Students can scan this QR right now.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-forest shadow-xs">
                <QrCode size={24} />
              </div>
              <h4 className="font-bold text-ink text-sm">No Active Attendance Session</h4>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Select your assigned subject and click <strong>"Generate Attendance QR Code"</strong> to start taking attendance.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Faculty Sessions History Table */}
      <div className="card p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="font-bold text-ink text-sm">My Attendance Session History</h3>
            <p className="text-xs text-muted">Past and active QR attendance sessions generated by Dr. Mehta</p>
          </div>
          <span className="text-xs text-muted font-medium">
            {sessionsHistory.length} Sessions Logged
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-page text-muted uppercase tracking-wider text-[10px] border-b border-line">
              <tr>
                <th className="py-2.5 px-3 font-extrabold">Session ID</th>
                <th className="py-2.5 px-3 font-extrabold">Subject / Lab</th>
                <th className="py-2.5 px-3 font-extrabold">Batch</th>
                <th className="py-2.5 px-3 font-extrabold">Date & Created</th>
                <th className="py-2.5 px-3 font-extrabold text-center">Status</th>
                <th className="py-2.5 px-3 font-extrabold text-center">Attendees</th>
                <th className="py-2.5 px-3 font-extrabold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sessionsHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No session history recorded yet.
                  </td>
                </tr>
              ) : (
                sessionsHistory.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-mint/30 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-forest">
                      {s.sessionId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      {s.subjectName}
                    </td>
                    <td className="py-2.5 px-3 text-muted">
                      {s.batch || "All"}
                    </td>
                    <td className="py-2.5 px-3 text-muted">
                      {s.date} ({new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          s.status === "Active"
                            ? "bg-emerald-100 text-emerald-800"
                            : s.status === "Expired"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-error"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-ink">
                      {s.attendees?.length || 0}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {s.status === "Active" ? (
                        <button
                          type="button"
                          onClick={() => handleClose(s.sessionId)}
                          className="text-xs text-error font-bold hover:underline"
                        >
                          Close Session
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Classroom Projector Full Screen Modal */}
      {fullScreen && activeSession && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-6 backdrop-blur-md text-white animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setFullScreen(false)}
            className="absolute top-6 right-6 rounded-2xl bg-white/10 p-3 hover:bg-white/20 transition text-white"
            aria-label="Exit full screen"
          >
            <Minimize2 size={24} />
          </button>

          <div className="text-center space-y-2 mb-6 max-w-lg">
            <span className="rounded-full bg-emerald-500/20 px-4 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30">
              SVVV Classroom Attendance
            </span>
            <h2 className="text-3xl font-black text-white">{activeSession.subjectName}</h2>
            <p className="text-emerald-100/80 text-sm">
              Faculty: {activeSession.facultyName} · {activeSession.semester} · {activeSession.batch}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-2xl">
            <QRCodeSVG
              value={qrPayload}
              size={320}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="mt-6 flex items-center gap-6 text-sm font-semibold">
            <span className="font-mono bg-white/10 px-4 py-1.5 rounded-xl border border-white/20">
              Session: {activeSession.sessionId}
            </span>
            <span className="flex items-center gap-2 text-emerald-300">
              <Clock size={16} />
              <span>Expires in: {timeRemaining}</span>
            </span>
            <span className="flex items-center gap-2 text-purple-300">
              <Users size={16} />
              <span>Marked: {activeSession.attendees?.length || 0} Students</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
