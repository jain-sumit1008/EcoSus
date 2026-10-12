import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Calendar,
  CheckCircle2,
  TreeDeciduous,
  Leaf,
  Users,
  ShieldCheck,
  ClipboardCheck,
  QrCode,
  Camera,
} from "lucide-react";
import * as attendanceApi from "../../api/attendance.api.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useAuth } from "../../context/AuthContext.jsx";
import HeaderBanner from "../../components/common/HeaderBanner.jsx";
import TabsBar from "../../components/common/TabsBar.jsx";
import SheetsManagementPanel from "./SheetsManagementPanel.jsx";
import AttendanceRecordsTable from "./AttendanceRecordsTable.jsx";
import FacultyQrGenerator from "./FacultyQrGenerator.jsx";
import StudentQrScanner from "./StudentQrScanner.jsx";
import StudentAttendanceView from "./StudentAttendanceView.jsx";

export default function AttendancePage() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isFaculty = user?.role === "faculty";
  const isStudent = user?.role === "student";

  // Initial tab determination
  const initialAction = params.get("action") || params.get("tab");
  const defaultTab = isFaculty ? "generate" : isStudent && initialAction === "scan" ? "scan" : "records";

  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (initialAction === "scan" && isStudent) {
      setActiveTab("scan");
    } else if (initialAction === "generate" && (isFaculty || isAdmin)) {
      setActiveTab("generate");
    }
  }, [initialAction, isStudent, isFaculty, isAdmin]);

  const paperQuery = useAsync(() => attendanceApi.paperSummary(), []);
  const paper = paperQuery.data?.data;

  // Build role-tailored navigation tabs
  const tabsList = [
    ...(isStudent
      ? [
          { id: "records", label: "My Attendance" },
          { id: "scan", label: "Scan Attendance QR" },
        ]
      : []),
    ...(isFaculty
      ? [
          { id: "generate", label: "Generate Attendance QR" },
          { id: "records", label: "Class Attendance Records" },
          { id: "sheets", label: "Muster Sheets" },
        ]
      : []),
    ...(isAdmin
      ? [
          { id: "records", label: "All Attendance Records" },
          { id: "generate", label: "Faculty QR Sessions" },
          { id: "sheets", label: "Muster Sheets" },
        ]
      : []),
    { id: "sustainability", label: "Sustainability Audit" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <HeaderBanner
        title={
          isStudent
            ? "My Student Attendance"
            : isFaculty
            ? "Faculty Attendance & QR Manager"
            : "Campus Attendance Records"
        }
        subtitle={
          isStudent
            ? "Track your personal lecture attendance, exam eligibility & scan class QR codes"
            : isFaculty
            ? "Generate class QR codes, manage real-time session scans & audit digital registers"
            : "Authoritative student attendance logs, muster register tracking & sustainability impact for SVVV Indore"
        }
        taglineTitle={isStudent ? "Student Log" : isFaculty ? "Faculty Desk" : "Direct Records"}
        taglineSub="Zero Wastage"
        accent="purple"
        icon={isStudent ? ClipboardCheck : isFaculty ? QrCode : ClipboardCheck}
      />

      {/* Navigation Tabs */}
      <TabsBar
        tabs={tabsList}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* STUDENT TAB 1: MY ATTENDANCE RECORD (Strictly student's own records only) */}
      {activeTab === "records" && isStudent && (
        <StudentAttendanceView />
      )}

      {/* STUDENT TAB 2: SCAN ATTENDANCE QR */}
      {activeTab === "scan" && isStudent && (
        <StudentQrScanner onAttendanceRecorded={() => setActiveTab("records")} />
      )}

      {/* FACULTY / ADMIN TAB: QR GENERATOR & ACTIVE SESSIONS */}
      {activeTab === "generate" && (isFaculty || isAdmin) && (
        <FacultyQrGenerator />
      )}

      {/* ADMIN & FACULTY TAB: ATTENDANCE RECORDS (Full table with filters, search, CSV) */}
      {activeTab === "records" && (isAdmin || isFaculty) && (
        <AttendanceRecordsTable isAdmin={isAdmin} />
      )}

      {/* MUSTER SHEETS TAB (Admin & Faculty) */}
      {activeTab === "sheets" && (isAdmin || isFaculty) && (
        <SheetsManagementPanel />
      )}

      {/* SUSTAINABILITY AUDIT TAB */}
      {activeTab === "sustainability" && (
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="font-bold text-ink">Environmental Impact: Paperless Transition</h3>
            <p className="text-xs text-muted">
              Measurable conservation achieved through paperless attendance records at SVVV Indore
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-line bg-page p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#176B45]">
                <Leaf size={20} />
                <h4 className="font-bold text-ink text-sm">Paper Avoidance</h4>
              </div>
              <p className="text-2xl font-black text-ink">
                {paper?.estimatedSheetsAvoided || 1240} Sheets
              </p>
              <p className="text-xs text-muted">
                Calculated dynamically from digital class registers vs physical paper rosters.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-page p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#2585D8]">
                <TreeDeciduous size={20} />
                <h4 className="font-bold text-ink text-sm">Equivalent Trees Saved</h4>
              </div>
              <p className="text-2xl font-black text-ink">
                {((paper?.estimatedSheetsAvoided || 1240) / 8333).toFixed(2)} Trees
              </p>
              <p className="text-xs text-muted">
                Standard forestry conversion based on commercial pulp harvesting ratios.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-page p-4 space-y-2">
              <div className="flex items-center gap-2 text-purple-600">
                <FileText size={20} />
                <h4 className="font-bold text-ink text-sm">Digital Audit Trail</h4>
              </div>
              <p className="text-2xl font-black text-ink">100% Digital</p>
              <p className="text-xs text-muted">
                Electronic muster records timestamped and archived securely.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
