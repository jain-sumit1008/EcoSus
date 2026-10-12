import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Calendar,
  BookOpen,
} from "lucide-react";
import { getStudentAttendanceRecords, exportAttendanceToCSV } from "../../utils/attendanceStorage.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const STATUS_OPTIONS = ["Present", "Absent", "Late"];

export default function StudentAttendanceView() {
  const { user } = useAuth();
  const toast = useToast();

  const [records, setRecords] = useState([]);
  const [searchSubject, setSearchSubject] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const studentEnrollment = user?.studentId || user?.enrollmentNumber || "0827CS221082";
  const studentName = user?.name || "Rahul Sharma";

  // Load records strictly for this authenticated student
  const loadRecords = () => {
    const list = getStudentAttendanceRecords(studentEnrollment);
    setRecords(list);
  };

  useEffect(() => {
    loadRecords();
  }, [studentEnrollment]);

  // Unique subjects for filter
  const uniqueSubjects = useMemo(() => {
    const set = new Set();
    records.forEach((r) => {
      if (r?.subjectName) set.add(r.subjectName);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (!r) return false;
      if (searchSubject && r.subjectName !== searchSubject) return false;
      if (filterDate && r.date !== filterDate) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      return true;
    });
  }, [records, searchSubject, filterDate, filterStatus]);

  // Statistics
  const totalClasses = records.length;
  const attendedCount = records.filter((r) => r.status === "Present" || r.status === "Late").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;
  const attendanceRate = totalClasses > 0 ? Math.round((attendedCount / totalClasses) * 100) : 0;
  const isEligible = attendanceRate >= 75;

  const resetFilters = () => {
    setSearchSubject("");
    setFilterDate("");
    setFilterStatus("");
  };

  const handleExportMyCSV = () => {
    try {
      exportAttendanceToCSV(
        filteredRecords,
        `My_Attendance_${studentEnrollment}`
      );
      toast.success("Downloaded your attendance report.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Present":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300">
            <CheckCircle2 size={12} className="text-emerald-700" />
            Present
          </span>
        );
      case "Absent":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-error border border-red-300">
            <XCircle size={12} className="text-red-700" />
            Absent
          </span>
        );
      case "Late":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
            <Clock size={12} className="text-amber-700" />
            Late
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-page px-2 py-0.5 text-xs font-semibold text-muted border">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Student Profile & Privacy Guarantee Header */}
      <div className="rounded-2xl border border-line bg-gradient-to-r from-page via-white to-mint/40 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
            Personal Academic Record
          </span>
          <h3 className="text-lg font-black text-ink">{studentName}</h3>
          <p className="text-xs text-muted font-mono">
            Enrollment No: <strong className="text-ink">{studentEnrollment}</strong> · Semester 4 (CSE)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold border ${
              isEligible
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-red-100 text-error border-red-300"
            }`}
          >
            {isEligible ? "✓ Eligible for Semester Exams (≥ 75%)" : "⚠ Attendance Shortage (< 75%)"}
          </span>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        {/* Total Classes */}
        <div className="card p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1">
            Total Classes
          </span>
          <p className="text-2xl font-black text-ink">{totalClasses}</p>
          <span className="text-[10px] text-muted">Scheduled lectures & labs</span>
        </div>

        {/* Classes Attended */}
        <div className="card p-4 shadow-xs border-emerald-200 bg-emerald-50/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
            Classes Attended
          </span>
          <p className="text-2xl font-black text-[#176B45]">{attendedCount}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">Present + Late</span>
        </div>

        {/* Absences */}
        <div className="card p-4 shadow-xs border-red-200 bg-red-50/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-800 block mb-1">
            Absences
          </span>
          <p className="text-2xl font-black text-error">{absentCount}</p>
          <span className="text-[10px] text-red-700 font-semibold">Classes missed</span>
        </div>

        {/* Overall Attendance Rate */}
        <div className="card p-4 shadow-xs border-purple-200 bg-purple-50/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 block mb-1">
            Attendance Rate
          </span>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-purple-900">{attendanceRate}%</p>
            <span className="text-[10px] text-purple-700 font-bold">Req: 75%</span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isEligible ? "bg-purple-600" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, attendanceRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Student Attendance Records Table Card */}
      <div className="card p-5 shadow-card space-y-4">
        {/* Table Header & CSV Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <h4 className="font-bold text-ink text-sm">My Registered Attendance Log</h4>
            <p className="text-[11px] text-muted">
              Privacy Protected: Showing only your official attendance logs for Shri Vaishnav Vidyapeeth Vishwavidyalaya.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportMyCSV}
            className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold"
            title="Download your personal attendance log in CSV"
          >
            <Download size={13} />
            <span>Download My Records ({filteredRecords.length})</span>
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {/* Filter by Subject */}
          <div>
            <select
              value={searchSubject}
              onChange={(e) => setSearchSubject(e.target.value)}
              className="select w-full text-xs font-semibold"
            >
              <option value="">All My Subjects & Labs</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Date */}
          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input w-full text-xs font-medium"
              title="Filter by attendance date"
            />
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select w-full text-xs font-semibold"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Filters Option */}
        {(searchSubject || filterDate || filterStatus) && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-error hover:underline font-semibold"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-page text-muted uppercase tracking-wider text-[10px] border-b border-line select-none">
              <tr>
                <th className="py-2.5 px-3 font-extrabold w-12 text-center">S. No.</th>
                <th className="py-2.5 px-3 font-extrabold">Subject / Lab Name</th>
                <th className="py-2.5 px-3 font-extrabold">Attendance Date</th>
                <th className="py-2.5 px-3 font-extrabold">Check-in Time</th>
                <th className="py-2.5 px-3 font-extrabold text-center">Status</th>
                <th className="py-2.5 px-3 font-extrabold">Remarks / Session Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-mint text-forest shadow-xs">
                        <FileSpreadsheet size={20} />
                      </div>
                      <p className="font-bold text-ink text-sm">No Records Found</p>
                      <p className="text-xs text-muted">
                        No attendance entries match your active filters.
                      </p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="btn-outline text-xs px-3 py-1.5 mt-2"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, index) => (
                  <tr key={rec.id} className="hover:bg-mint/30 transition">
                    <td className="py-2.5 px-3 text-center text-muted font-mono text-[11px]">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-ink">
                      {rec.subjectName}
                    </td>
                    <td className="py-2.5 px-3 text-muted text-[11px] whitespace-nowrap">
                      {rec.date}
                    </td>
                    <td className="py-2.5 px-3 text-muted text-[11px] whitespace-nowrap font-mono">
                      {rec.checkInTime || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(rec.status)}
                    </td>
                    <td className="py-2.5 px-3 text-muted text-[11px]">
                      {rec.remarks || "Normal muster roll"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
