import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  RotateCcw,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  getAttendanceRecords,
  getFacultyAttendanceRecords,
  addAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  clearAttendanceRecords,
  resetToDemoRecords,
  exportAttendanceToCSV,
} from "../../utils/attendanceStorage.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
];

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
];

const STATUS_OPTIONS = ["Present", "Absent", "Late"];

export default function AttendanceRecordsTable({ isAdmin = true }) {
  const { user } = useAuth();
  const toast = useToast();
  const isFaculty = user?.role === "faculty";
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Sorting
  const [sortField, setSortField] = useState("date"); // "date", "studentName", "enrollmentNumber"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc", "desc"

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    studentName: "",
    enrollmentNumber: "",
    department: "Computer Science & Engineering",
    semester: "Semester 4",
    subjectName: "",
    date: new Date().toISOString().slice(0, 10),
    checkInTime: "09:00 AM",
    status: "Present",
    remarks: "",
  });
  const [formError, setFormError] = useState(null);

  // Load records from LocalStorage
  const loadRecords = () => {
    let data = getAttendanceRecords();
    if (isFaculty) {
      const assigned = [
        "Network Security Lab",
        "Cloud Computing Architecture",
        "Data Structures & Algorithms",
      ];
      data = getFacultyAttendanceRecords(assigned);
    }
    setRecords(data);
  };

  useEffect(() => {
    loadRecords();
  }, [user]);

  // Compute unique subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const set = new Set();
    const list = Array.isArray(records) ? records : [];
    list.forEach((r) => {
      if (r && r.subjectName) set.add(r.subjectName);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    const list = Array.isArray(records) ? records : [];
    return list.filter((r) => {
      if (!r) return false;
      // Search by student name or enrollment number
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = (r.studentName || "").toLowerCase().includes(query);
        const enrollMatch = (r.enrollmentNumber || "").toLowerCase().includes(query);
        if (!nameMatch && !enrollMatch) return false;
      }

      // Filter by date
      if (filterDate && r.date !== filterDate) return false;

      // Filter by semester
      if (filterSemester && r.semester !== filterSemester) return false;

      // Filter by subject
      if (filterSubject && r.subjectName !== filterSubject) return false;

      // Filter by status
      if (filterStatus && r.status !== filterStatus) return false;

      return true;
    });
  }, [records, searchQuery, filterDate, filterSemester, filterSubject, filterStatus]);

  // Sort records
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];
    list.sort((a, b) => {
      if (!a) return 1;
      if (!b) return -1;
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (sortField === "date") {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      const comp = valA.toString().localeCompare(valB.toString());
      return sortOrder === "asc" ? comp : -comp;
    });
    return list;
  }, [filteredRecords, sortField, sortOrder]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  // Statistics
  const safeRecords = Array.isArray(records) ? records.filter(Boolean) : [];
  const totalCount = safeRecords.length;
  const presentCount = safeRecords.filter((r) => r.status === "Present").length;
  const absentCount = safeRecords.filter((r) => r.status === "Absent").length;
  const lateCount = safeRecords.filter((r) => r.status === "Late").length;
  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterDate("");
    setFilterSemester("");
    setFilterSubject("");
    setFilterStatus("");
    setCurrentPage(1);
  };

  // Add Record
  const handleOpenAdd = () => {
    setFormData({
      studentName: "",
      enrollmentNumber: "",
      department: "Computer Science & Engineering",
      semester: "Semester 4",
      subjectName: uniqueSubjects[0] || "Network Security Lab",
      date: new Date().toISOString().slice(0, 10),
      checkInTime: "09:15 AM",
      status: "Present",
      remarks: "On time, practical completed",
    });
    setFormError(null);
    setAddModalOpen(true);
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      addAttendanceRecord(formData);
      toast.success(`Attendance recorded for ${formData.studentName}`);
      setAddModalOpen(false);
      loadRecords();
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Edit Record
  const handleOpenEdit = (rec) => {
    setActiveRecord(rec);
    setFormData({
      studentName: rec.studentName,
      enrollmentNumber: rec.enrollmentNumber,
      department: rec.department,
      semester: rec.semester,
      subjectName: rec.subjectName,
      date: rec.date,
      checkInTime: rec.checkInTime,
      status: rec.status,
      remarks: rec.remarks,
    });
    setFormError(null);
    setEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      updateAttendanceRecord(activeRecord.id, formData);
      toast.success(`Attendance record updated successfully`);
      setEditModalOpen(false);
      loadRecords();
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Delete Record
  const handleDelete = (rec) => {
    if (
      window.confirm(
        `Are you sure you want to delete attendance record for ${rec.studentName} (${rec.enrollmentNumber})?`
      )
    ) {
      try {
        deleteAttendanceRecord(rec.id);
        toast.success("Attendance record deleted");
        loadRecords();
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  // View Record
  const handleOpenView = (rec) => {
    setActiveRecord(rec);
    setViewModalOpen(true);
  };

  // Export CSV
  const handleExport = () => {
    try {
      exportAttendanceToCSV(filteredRecords, "svvv_attendance_records");
      toast.success(`Exported ${filteredRecords.length} records to CSV`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Clear demo records
  const handleClearDemo = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all attendance records? LocalStorage data will be emptied."
      )
    ) {
      clearAttendanceRecords();
      toast.success("All attendance records cleared.");
      loadRecords();
    }
  };

  // Reset to demo records
  const handleResetDemo = () => {
    if (window.confirm("Reset attendance table to default SVVV demo records?")) {
      resetToDemoRecords();
      toast.success("Reset to sample attendance records.");
      loadRecords();
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
      {/* Top Attendance KPI Metric Cards */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-5">
        <div className="card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Records</span>
            <Users size={16} className="text-[#176B45]" />
          </div>
          <p className="text-2xl font-black text-ink">{totalCount}</p>
          <span className="text-[10px] text-muted">Stored in LocalStorage</span>
        </div>

        <div className="card p-4 shadow-xs border-emerald-200 bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Present Count</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#176B45]">{presentCount}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">Attended classes</span>
        </div>

        <div className="card p-4 shadow-xs border-red-200 bg-red-50/20">
          <div className="flex items-center justify-between text-red-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Absent Count</span>
            <XCircle size={16} className="text-red-600" />
          </div>
          <p className="text-2xl font-black text-error">{absentCount}</p>
          <span className="text-[10px] text-red-700 font-semibold">Absence recorded</span>
        </div>

        <div className="card p-4 shadow-xs border-amber-200 bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Late Count</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700">{lateCount}</p>
          <span className="text-[10px] text-amber-700 font-semibold">Late arrivals</span>
        </div>

        <div className="card p-4 shadow-xs border-purple-200 bg-purple-50/20">
          <div className="flex items-center justify-between text-purple-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Attendance Rate</span>
            <Sparkles size={16} className="text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-purple-900">{attendanceRate}%</p>
            <span className="text-[11px] font-bold text-purple-700">Present + Late</span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card p-5 shadow-card space-y-4">
        {/* Card Header & Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <h3 className="font-bold text-ink text-base">Campus Attendance Records</h3>
            <p className="text-[11px] text-muted">
              Authoritative tabular attendance logs persisted via browser LocalStorage
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="btn-primary text-xs py-2 px-3.5 bg-forest hover:bg-forest/90 font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={15} />
                <span>Add Record</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExport}
              className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5 font-bold hover:bg-page"
              title="Export filtered records to CSV"
            >
              <Download size={14} />
              <span>Export CSV ({filteredRecords.length})</span>
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="rounded-xl border border-line bg-page px-2.5 py-2 text-xs font-semibold text-ink hover:bg-mint/40 transition"
                  title="Reset to default SVVV demo records"
                >
                  Reset Demo
                </button>
                <button
                  type="button"
                  onClick={handleClearDemo}
                  className="rounded-xl border border-red-200 bg-red-50/60 px-2.5 py-2 text-xs font-semibold text-error hover:bg-red-100 transition"
                  title="Clear all records"
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name or enrollment number..."
              className="input pl-8 text-xs font-medium w-full"
            />
            <Search size={14} className="absolute left-2.5 top-3 text-muted pointer-events-none" />
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
              className="input text-xs font-medium w-full"
              title="Filter by date"
            />
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={filterSemester}
              onChange={(e) => {
                setFilterSemester(e.target.value);
                setCurrentPage(1);
              }}
              className="select text-xs font-medium w-full"
            >
              <option value="">All Semesters</option>
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="select text-xs font-medium w-full"
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

        {/* Secondary Filter Row (Subject & Reset) */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <select
              value={filterSubject}
              onChange={(e) => {
                setFilterSubject(e.target.value);
                setCurrentPage(1);
              }}
              className="select text-xs font-medium w-full"
            >
              <option value="">All Subjects & Labs</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {(searchQuery || filterDate || filterSemester || filterSubject || filterStatus) && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-error hover:underline font-semibold"
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
            <span className="text-[11px] text-muted">
              Showing <strong>{sortedRecords.length}</strong> of {totalCount} records
            </span>
          </div>
        </div>

        {/* Professional Attendance Table */}
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-page text-muted uppercase tracking-wider text-[10px] select-none">
              <tr>
                <th className="py-3 px-3 font-extrabold w-12 text-center">S. No.</th>
                <th
                  onClick={() => handleSort("studentName")}
                  className="py-3 px-3 font-extrabold cursor-pointer hover:text-ink transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Student Name</span>
                    <ArrowUpDown size={12} className={sortField === "studentName" ? "text-forest" : "opacity-40"} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("enrollmentNumber")}
                  className="py-3 px-3 font-extrabold cursor-pointer hover:text-ink transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Enrollment No.</span>
                    <ArrowUpDown size={12} className={sortField === "enrollmentNumber" ? "text-forest" : "opacity-40"} />
                  </div>
                </th>
                <th className="py-3 px-3 font-extrabold">Branch / Department</th>
                <th className="py-3 px-2 font-extrabold">Semester</th>
                <th className="py-3 px-3 font-extrabold">Subject / Lab Name</th>
                <th
                  onClick={() => handleSort("date")}
                  className="py-3 px-3 font-extrabold cursor-pointer hover:text-ink transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown size={12} className={sortField === "date" ? "text-forest" : "opacity-40"} />
                  </div>
                </th>
                <th className="py-3 px-2.5 font-extrabold">Check-in</th>
                <th className="py-3 px-3 font-extrabold text-center">Status</th>
                <th className="py-3 px-3 font-extrabold">Remarks</th>
                {isAdmin && <th className="py-3 px-3 font-extrabold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 11 : 10} className="py-12 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-mint text-forest shadow-xs">
                        <FileSpreadsheet size={20} />
                      </div>
                      <p className="font-bold text-ink text-sm">No Attendance Records Found</p>
                      <p className="text-xs text-muted">
                        No records match your active search or filters. Try adjusting your search query or reset filters.
                      </p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="btn-outline text-xs px-3 py-1.5 mt-2"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec, idx) => {
                  const sNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={rec.id} className="hover:bg-mint/30 transition">
                      <td className="py-2.5 px-3 text-center text-muted font-mono text-[11px]">
                        {sNo}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-ink">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[140px]">{rec.studentName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted text-[11px] font-semibold">
                        {rec.enrollmentNumber}
                      </td>
                      <td className="py-2.5 px-3 text-ink text-[11px] truncate max-w-[150px]" title={rec.department}>
                        {rec.department}
                      </td>
                      <td className="py-2.5 px-2 text-muted text-[11px]">
                        {rec.semester}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-ink truncate max-w-[170px]" title={rec.subjectName}>
                        {rec.subjectName}
                      </td>
                      <td className="py-2.5 px-3 text-muted text-[11px] whitespace-nowrap">
                        {rec.date}
                      </td>
                      <td className="py-2.5 px-2.5 text-muted text-[11px] whitespace-nowrap font-mono">
                        {rec.checkInTime || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(rec.status)}
                      </td>
                      <td className="py-2.5 px-3 text-muted text-[11px] truncate max-w-[160px]" title={rec.remarks}>
                        {rec.remarks || "-"}
                      </td>
                      {isAdmin && (
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenView(rec)}
                              title="View Record Details"
                              className="rounded-lg p-1 text-muted hover:text-forest hover:bg-mint transition"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(rec)}
                              title="Edit Record"
                              className="rounded-lg p-1 text-muted hover:text-blue-700 hover:bg-blue-50 transition"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(rec)}
                              title="Delete Record"
                              className="rounded-lg p-1 text-muted hover:text-error hover:bg-red-50 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="select text-xs font-semibold py-1 px-2 border-line"
            >
              {[5, 10, 25, 50].map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>
              Page <strong>{currentPage}</strong> of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-line p-1.5 text-ink disabled:opacity-40 hover:bg-page transition"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-line p-1.5 text-ink disabled:opacity-40 hover:bg-page transition"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD ATTENDANCE RECORD */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-line overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-line bg-page px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest text-white">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Add Attendance Record</h3>
                  <p className="text-[11px] text-muted">Create a new student attendance entry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-error border border-red-200">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink block mb-1">Student Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="input text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Enrollment Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0827CS221082"
                    value={formData.enrollmentNumber}
                    onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value.toUpperCase() })}
                    className="input text-xs font-mono font-bold tracking-wider"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink block mb-1">Branch / Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="select text-xs font-medium"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="select text-xs font-medium"
                  >
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">Subject / Lab Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Network Security Lab"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  className="input text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-ink block mb-1">Attendance Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Check-in Time</label>
                  <input
                    type="text"
                    placeholder="09:15 AM"
                    value={formData.checkInTime}
                    disabled={formData.status === "Absent"}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    className="input text-xs font-mono disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="select text-xs font-bold"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Practical completed, Medical leave, Late entry..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="input text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="btn-outline text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-5 py-2 bg-forest hover:bg-forest/90 font-bold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ATTENDANCE RECORD */}
      {editModalOpen && activeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-line overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-line bg-page px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Edit2 size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Edit Attendance Record</h3>
                  <p className="text-[11px] text-muted">ID: {activeRecord.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-error border border-red-200">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink block mb-1">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="input text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Enrollment Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.enrollmentNumber}
                    onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value.toUpperCase() })}
                    className="input text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink block mb-1">Branch / Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="select text-xs font-medium"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="select text-xs font-medium"
                  >
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">Subject / Lab Name *</label>
                <input
                  type="text"
                  required
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  className="input text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-ink block mb-1">Attendance Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Check-in Time</label>
                  <input
                    type="text"
                    value={formData.checkInTime}
                    disabled={formData.status === "Absent"}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    className="input text-xs font-mono disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="select text-xs font-bold"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">Remarks</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="input text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn-outline text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-5 py-2 bg-blue-600 hover:bg-blue-700 font-bold text-white"
                >
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ATTENDANCE DETAILS */}
      {viewModalOpen && activeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-line overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-page px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest text-white">
                  <Eye size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Attendance Record Details</h3>
                  <p className="text-[11px] text-muted font-mono">{activeRecord.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <div>
                  <p className="text-sm font-bold text-ink">{activeRecord.studentName}</p>
                  <p className="font-mono text-muted text-[11px] font-semibold">{activeRecord.enrollmentNumber}</p>
                </div>
                <div>{getStatusBadge(activeRecord.status)}</div>
              </div>

              <div className="rounded-xl bg-page p-3 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Branch / Dept:</span>
                  <span className="font-semibold text-ink">{activeRecord.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Semester:</span>
                  <span className="font-semibold text-ink">{activeRecord.semester}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Subject / Lab:</span>
                  <span className="font-semibold text-ink">{activeRecord.subjectName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Attendance Date:</span>
                  <span className="font-semibold text-ink">{activeRecord.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Check-in Time:</span>
                  <span className="font-mono font-semibold text-ink">{activeRecord.checkInTime || "-"}</span>
                </div>
              </div>

              <div>
                <span className="text-muted text-[11px] block mb-1">Remarks & Observations:</span>
                <p className="rounded-xl border border-line bg-page/40 p-2.5 text-ink font-medium">
                  {activeRecord.remarks || "No remarks logged."}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="btn-primary text-xs px-4 py-2 bg-forest hover:bg-forest/90 font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
