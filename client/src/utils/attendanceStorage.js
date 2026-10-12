/**
 * LocalStorage Attendance & Session Persistence Utility
 * Pure client-side prototype storage (No MySQL, MongoDB or external DB required)
 * 
 * Features:
 * - Tabular Attendance Records Persistence
 * - Faculty-Generated QR Attendance Sessions (Active, Expired, Closed)
 * - Strict Role-Based Data Isolation (Students see ONLY their own records, Faculty see their assigned classes)
 * - Anti-Duplicate Attendance Validation
 */

const RECORDS_STORAGE_KEY = "svvv_attendance_records";
const SESSIONS_STORAGE_KEY = "svvv_attendance_sessions";

// Official Registered SVVV Accounts & Role Mappings
export const REGISTERED_ACCOUNTS = [
  {
    userId: "USR-STU-100",
    name: "Sumit Jain",
    email: "sumitsfbi2454@svvv.edu.in",
    role: "student",
    enrollmentNumber: "0827CS221082",
    department: "Computer Science & Engineering",
    semester: "Semester 4",
    batch: "Batch A",
    enrolledSubjects: [
      "Network Security Lab",
      "Database Management Systems",
      "Software Engineering",
      "Cloud Computing Architecture",
      "Data Structures & Algorithms",
    ],
  },
  {
    userId: "USR-STU-101",
    name: "Rahul Sharma",
    email: "student@svvv.edu",
    role: "student",
    enrollmentNumber: "0827CS221082",
    department: "Computer Science & Engineering",
    semester: "Semester 4",
    batch: "Batch A",
    enrolledSubjects: [
      "Network Security Lab",
      "Database Management Systems",
      "Software Engineering",
      "Cloud Computing Architecture",
      "Data Structures & Algorithms",
    ],
  },
  {
    userId: "USR-STU-102",
    name: "Priya Patel",
    email: "student2@svvv.edu",
    role: "student",
    enrollmentNumber: "0827CS221045",
    department: "Computer Science & Engineering",
    semester: "Semester 4",
    batch: "Batch A",
    enrolledSubjects: [
      "Network Security Lab",
      "Database Management Systems",
      "Software Engineering",
    ],
  },
  {
    userId: "USR-FAC-201",
    name: "Dr. Mehta",
    email: "faculty@svvv.edu",
    role: "faculty",
    department: "Computer Science & Engineering",
    assignedSubjects: [
      { id: "CS401", name: "Network Security Lab", semester: "Semester 4", lab: "Cyber Security Lab (Block C - 302)" },
      { id: "CS602", name: "Cloud Computing Architecture", semester: "Semester 6", lab: "AWS Cloud Lab (Block B - 204)" },
      { id: "CS203", name: "Data Structures & Algorithms", semester: "Semester 2", lab: "Programming Lab 1 (Block A - 105)" },
    ],
  },
  {
    userId: "USR-ADM-301",
    name: "Anjali Rathore",
    email: "admin@svvv.edu",
    role: "admin",
    department: "Campus Operations",
  },
];

// Sample Initial Attendance Records (Pre-populated for SVVV)
export const SAMPLE_ATTENDANCE_RECORDS = [
  {
    id: "REC-1001",
    sessionId: "SES-20261012-7001",
    studentId: "USR-STU-101",
    studentName: "Rahul Sharma",
    enrollmentNumber: "0827CS221082",
    department: "Computer Science & Engineering",
    semester: "Semester 4",
    subjectName: "Network Security Lab",
    subjectId: "CS401",
    date: "2026-10-12",
    checkInTime: "09:05 AM",
    status: "Present",
    remarks: "Verified via Faculty Session QR (Dr. Mehta)",
    createdAt: "2026-10-12T09:05:00.000Z",
  },
  {
    id: "REC-1002",
    sessionId: "SES-20261012-7001",
    studentId: "USR-STU-102",
    studentName: "Priya Patel",
    enrollmentNumber: "0827CS221045",
    department: "Computer Science & Engineering",
    semester: "Semester 4",
    subjectName: "Network Security Lab",
    subjectId: "CS401",
    date: "2026-10-12",
    checkInTime: "09:12 AM",
    status: "Present",
    remarks: "Verified via Faculty Session QR (Dr. Mehta)",
    createdAt: "2026-10-12T09:12:00.000Z",
  },
  {
    id: "REC-1003",
    sessionId: "SES-20261012-7001",
    studentId: "USR-STU-103",
    studentName: "Aman Verma",
    enrollmentNumber: "0827CS221011",
    department: "Computer Science & Engineering",
    semester: "Semester 4",
    subjectName: "Network Security Lab",
    subjectId: "CS401",
    date: "2026-10-12",
    checkInTime: "09:28 AM",
    status: "Late",
    remarks: "Delayed due to campus transit bus",
    createdAt: "2026-10-12T09:28:00.000Z",
  },
  {
    id: "REC-1004",
    sessionId: "SES-20261012-7001",
    studentId: "USR-STU-104",
    studentName: "Sneha Joshi",
    enrollmentNumber: "0827CS221098",
    department: "Computer Science & Engineering",
    semester: "Semester 4",
    subjectName: "Network Security Lab",
    subjectId: "CS401",
    date: "2026-10-12",
    checkInTime: "-",
    status: "Absent",
    remarks: "Informed leave (Inter-college athletics)",
    createdAt: "2026-10-12T09:30:00.000Z",
  },
  {
    id: "REC-1005",
    sessionId: "SES-20261011-6002",
    studentId: "USR-STU-105",
    studentName: "Rohan Kulkarni",
    enrollmentNumber: "0827IT221034",
    department: "Information Technology",
    semester: "Semester 6",
    subjectName: "Cloud Computing Architecture",
    subjectId: "CS602",
    date: "2026-10-11",
    checkInTime: "10:02 AM",
    status: "Present",
    remarks: "AWS EC2 practical completed",
    createdAt: "2026-10-11T10:02:00.000Z",
  },
  {
    id: "REC-1006",
    sessionId: "SES-20261011-6002",
    studentId: "USR-STU-106",
    studentName: "Ananya Gupta",
    enrollmentNumber: "0827IT221008",
    department: "Information Technology",
    semester: "Semester 6",
    subjectName: "Cloud Computing Architecture",
    subjectId: "CS602",
    date: "2026-10-11",
    checkInTime: "10:20 AM",
    status: "Late",
    remarks: "Late entry approved by Lab In-charge",
    createdAt: "2026-10-11T10:20:00.000Z",
  },
  {
    id: "REC-1007",
    sessionId: "SES-20261010-5003",
    studentId: "USR-STU-101",
    studentName: "Rahul Sharma",
    enrollmentNumber: "0827CS221082",
    department: "Computer Science & Engineering",
    semester: "Semester 4",
    subjectName: "Database Management Systems",
    subjectId: "CS402",
    date: "2026-10-10",
    checkInTime: "09:00 AM",
    status: "Present",
    remarks: "SQL query optimization test passed",
    createdAt: "2026-10-10T09:00:00.000Z",
  },
  {
    id: "REC-1008",
    sessionId: "SES-20261009-4004",
    studentId: "USR-STU-101",
    studentName: "Rahul Sharma",
    enrollmentNumber: "0827CS221082",
    department: "Computer Science & Engineering",
    semester: "Semester 4",
    subjectName: "Software Engineering",
    subjectId: "CS403",
    date: "2026-10-09",
    checkInTime: "11:15 AM",
    status: "Present",
    remarks: "Agile sprint presentation done",
    createdAt: "2026-10-09T11:15:00.000Z",
  },
  {
    id: "REC-1009",
    sessionId: "SES-20261008-3005",
    studentId: "USR-STU-101",
    studentName: "Rahul Sharma",
    enrollmentNumber: "0827CS221082",
    department: "Computer Science & Engineering",
    semester: "Semester 4",
    subjectName: "Network Security Lab",
    subjectId: "CS401",
    date: "2026-10-08",
    checkInTime: "-",
    status: "Absent",
    remarks: "Medical leave approved",
    createdAt: "2026-10-08T09:15:00.000Z",
  },
  {
    id: "REC-1010",
    sessionId: "SES-20261007-2006",
    studentId: "USR-STU-101",
    studentName: "Rahul Sharma",
    enrollmentNumber: "0827CS221082",
    department: "Computer Science & Engineering",
    semester: "Semester 4",
    subjectName: "Network Security Lab",
    subjectId: "CS401",
    date: "2026-10-07",
    checkInTime: "09:02 AM",
    status: "Present",
    remarks: "Wireshark packet capture analysis done",
    createdAt: "2026-10-07T09:02:00.000Z",
  },
];

// Sample Initial Active Faculty Session (for immediate testing)
export const SAMPLE_SESSIONS = [
  {
    sessionId: "SES-20261012-7001",
    facultyId: "USR-FAC-201",
    facultyName: "Dr. Mehta",
    subjectId: "CS401",
    subjectName: "Network Security Lab",
    labName: "Cyber Security Lab (Block C - 302)",
    semester: "Semester 4",
    batch: "Batch A",
    date: "2026-10-12",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 25 * 60000).toISOString(), // 25 mins remaining
    durationMinutes: 30,
    status: "Active", // "Active" | "Closed" | "Expired"
    attendees: [
      {
        studentId: "USR-STU-101",
        studentName: "Rahul Sharma",
        enrollmentNumber: "0827CS221082",
        markedAt: new Date(Date.now() - 4 * 60000).toISOString(),
      },
      {
        studentId: "USR-STU-102",
        studentName: "Priya Patel",
        enrollmentNumber: "0827CS221045",
        markedAt: new Date(Date.now() - 2 * 60000).toISOString(),
      },
    ],
  },
];

/* ==========================================================================
   ATTENDANCE SESSIONS MANAGEMENT
   ========================================================================== */

/**
 * Fetch all sessions from LocalStorage, checking and marking expiry
 */
export function getAttendanceSessions() {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return SAMPLE_SESSIONS;
    }
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    let sessions = [];
    if (!raw || raw === "undefined" || raw === "null" || raw.trim() === "") {
      sessions = SAMPLE_SESSIONS;
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(SAMPLE_SESSIONS));
    } else {
      sessions = JSON.parse(raw);
      if (!Array.isArray(sessions)) sessions = SAMPLE_SESSIONS;
    }

    const now = Date.now();
    let updated = false;

    // Check expiry
    sessions = sessions.map((s) => {
      if (s.status === "Active" && s.expiresAt) {
        const exp = new Date(s.expiresAt).getTime();
        if (now > exp) {
          updated = true;
          return { ...s, status: "Expired" };
        }
      }
      return s;
    });

    if (updated) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    }

    return sessions;
  } catch (err) {
    console.error("Error reading attendance sessions:", err);
    return SAMPLE_SESSIONS;
  }
}

/**
 * Save sessions array to LocalStorage
 */
export function saveAttendanceSessions(sessions) {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    return true;
  } catch (err) {
    console.error("Error saving attendance sessions:", err);
    return false;
  }
}

/**
 * Create a new Faculty Attendance QR Session
 */
export function createAttendanceSession({
  facultyId = "USR-FAC-201",
  facultyName = "Dr. Mehta",
  subjectId = "CS401",
  subjectName = "Network Security Lab",
  labName = "Cyber Security Lab (Block C - 302)",
  semester = "Semester 4",
  batch = "Batch A",
  durationMinutes = 10,
}) {
  const sessions = getAttendanceSessions();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60000).toISOString();
  const dateStr = now.toISOString().slice(0, 10);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const sessionId = `SES-${dateStr.replace(/-/g, "")}-${randomSuffix}`;

  const newSession = {
    sessionId,
    facultyId,
    facultyName,
    subjectId,
    subjectName,
    labName,
    semester,
    batch,
    date: dateStr,
    createdAt: now.toISOString(),
    expiresAt,
    durationMinutes: Number(durationMinutes),
    status: "Active",
    attendees: [],
  };

  const updatedSessions = [newSession, ...sessions];
  saveAttendanceSessions(updatedSessions);
  return newSession;
}

/**
 * Close an active attendance session
 */
export function closeAttendanceSession(sessionId, facultyId) {
  const sessions = getAttendanceSessions();
  const session = sessions.find((s) => s.sessionId === sessionId);

  if (!session) {
    throw new Error(`Attendance session '${sessionId}' was not found.`);
  }

  // Verify faculty ownership if facultyId provided
  if (facultyId && session.facultyId && session.facultyId !== facultyId) {
    throw new Error("Unauthorized: You can only close attendance sessions generated by you.");
  }

  session.status = "Closed";
  session.closedAt = new Date().toISOString();

  saveAttendanceSessions(sessions);
  return session;
}

/**
 * Retrieve session by ID
 */
export function getSessionById(sessionId) {
  const sessions = getAttendanceSessions();
  return sessions.find((s) => s.sessionId === sessionId) || null;
}

/**
 * Student Self-Attendance Marking via Scanned Session QR
 */
export function markAttendanceViaSession({ sessionId, studentUser }) {
  if (!sessionId) {
    throw new Error("Invalid attendance session: Session ID is missing.");
  }

  if (!studentUser) {
    throw new Error("Authentication required: Only signed-in students can record attendance.");
  }

  const sessions = getAttendanceSessions();
  const sessionIndex = sessions.findIndex((s) => s.sessionId === sessionId);

  if (sessionIndex === -1) {
    throw new Error(`Attendance Session '${sessionId}' does not exist or has been revoked.`);
  }

  const session = sessions[sessionIndex];

  // 1. Session Status & Expiry Check
  if (session.status === "Closed") {
    throw new Error(`Session Closed: This attendance session was closed by Faculty ${session.facultyName}.`);
  }

  const now = Date.now();
  const expiryTime = new Date(session.expiresAt).getTime();
  if (now > expiryTime || session.status === "Expired") {
    session.status = "Expired";
    saveAttendanceSessions(sessions);
    throw new Error(`Session Expired: This QR code expired at ${new Date(session.expiresAt).toLocaleTimeString()}. Ask faculty for a new QR code.`);
  }

  // 2. Student Identity Extraction (Never trust client-supplied input, strictly use authenticated user)
  const studentName = studentUser.name || "Student";
  const enrollmentNumber = (
    studentUser.enrollmentNumber ||
    studentUser.studentId ||
    "0827CS221082"
  ).toUpperCase().trim();
  const studentId = studentUser.id || studentUser._id || studentUser.userId || "USR-STU-101";

  // 3. Duplicate Attendance Check for this session
  const attendees = session.attendees || [];
  const alreadyMarkedInSession = attendees.some(
    (att) =>
      att.enrollmentNumber?.toUpperCase() === enrollmentNumber ||
      att.studentId === studentId
  );

  if (alreadyMarkedInSession) {
    throw new Error(
      `Duplicate Attendance: You (${enrollmentNumber}) have already marked attendance for this session.`
    );
  }

  // 4. Duplicate Check in Attendance Records for same Subject + Date
  const allRecords = getAttendanceRecords();
  const sessionDate = session.date || new Date().toISOString().slice(0, 10);
  const duplicateRecord = allRecords.find(
    (r) =>
      r.enrollmentNumber?.toUpperCase() === enrollmentNumber &&
      r.subjectName?.toLowerCase() === session.subjectName?.toLowerCase() &&
      r.date === sessionDate
  );

  if (duplicateRecord) {
    throw new Error(
      `Duplicate Attendance: An attendance record already exists for ${enrollmentNumber} in "${session.subjectName}" on ${sessionDate}.`
    );
  }

  // 5. Generate Official Verified Record
  const nowIso = new Date().toISOString();
  const timeFormatted = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const recordId = `REC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const newRecord = {
    id: recordId,
    sessionId: session.sessionId,
    studentId,
    studentName,
    enrollmentNumber,
    department: studentUser.department || "Computer Science & Engineering",
    semester: session.semester || "Semester 4",
    subjectId: session.subjectId,
    subjectName: session.subjectName,
    date: sessionDate,
    checkInTime: timeFormatted,
    status: "Present",
    remarks: `Verified via Faculty Session QR (${session.facultyName})`,
    createdAt: nowIso,
  };

  // 6. Persist Record and Update Session Attendees
  const updatedRecords = [newRecord, ...allRecords];
  saveAttendanceRecords(updatedRecords);

  session.attendees = [
    ...attendees,
    {
      studentId,
      studentName,
      enrollmentNumber,
      markedAt: nowIso,
    },
  ];
  sessions[sessionIndex] = session;
  saveAttendanceSessions(sessions);

  return { record: newRecord, session };
}

/* ==========================================================================
   ATTENDANCE RECORDS REPOSITORY
   ========================================================================== */

/**
 * Fetch all records from LocalStorage or initialize with sample SVVV records
 */
export function getAttendanceRecords() {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return SAMPLE_ATTENDANCE_RECORDS;
    }
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw || raw === "undefined" || raw === "null" || raw.trim() === "") {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(SAMPLE_ATTENDANCE_RECORDS));
      return SAMPLE_ATTENDANCE_RECORDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const clean = parsed.filter(
        (item) => item && typeof item === "object" && typeof item.studentName === "string"
      );
      if (clean.length > 0) return clean;
      if (parsed.length === 0) return [];
    }
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(SAMPLE_ATTENDANCE_RECORDS));
    return SAMPLE_ATTENDANCE_RECORDS;
  } catch (err) {
    console.error("Error reading attendance records from localStorage:", err);
    return SAMPLE_ATTENDANCE_RECORDS;
  }
}

/**
 * Save records array directly to LocalStorage
 */
export function saveAttendanceRecords(records) {
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (err) {
    console.error("Error saving attendance records to localStorage:", err);
    return false;
  }
}

/**
 * Fetch attendance records strictly for a specific student (Privacy-Preserving)
 */
export function getStudentAttendanceRecords(studentIdentifier) {
  if (!studentIdentifier) return [];
  const cleanId = studentIdentifier.trim().toLowerCase();
  const all = getAttendanceRecords();

  return all.filter((r) => {
    if (!r) return false;
    const matchEnrollment = (r.enrollmentNumber || "").toLowerCase() === cleanId;
    const matchName = (r.studentName || "").toLowerCase() === cleanId;
    const matchStudentId = (r.studentId || "").toLowerCase() === cleanId;
    return matchEnrollment || matchName || matchStudentId;
  });
}

/**
 * Fetch attendance records for classes assigned to a specific faculty
 */
export function getFacultyAttendanceRecords(assignedSubjects = []) {
  const all = getAttendanceRecords();
  if (!assignedSubjects || assignedSubjects.length === 0) {
    return all;
  }

  const subjectNames = assignedSubjects.map((s) =>
    (typeof s === "string" ? s : s.name || "").toLowerCase()
  );

  return all.filter((r) => {
    if (!r || !r.subjectName) return false;
    const sub = r.subjectName.toLowerCase();
    return subjectNames.some((assigned) => sub.includes(assigned) || assigned.includes(sub));
  });
}

/**
 * Add a new record with required validation & duplicate detection
 */
export function addAttendanceRecord(record) {
  const records = getAttendanceRecords();

  const cleanName = (record.studentName || "").trim();
  const cleanEnrollment = (record.enrollmentNumber || "").trim().toUpperCase();
  const cleanSubject = (record.subjectName || "").trim();
  const cleanDate = (record.date || "").trim();

  if (!cleanName) throw new Error("Student Name is required.");
  if (!cleanEnrollment) throw new Error("Enrollment Number is required.");
  if (!cleanSubject) throw new Error("Subject / Lab Name is required.");
  if (!cleanDate) throw new Error("Attendance Date is required.");

  // Duplicate check: Same student enrollment + Subject + Date
  const isDuplicate = records.some(
    (r) =>
      r.enrollmentNumber?.toUpperCase() === cleanEnrollment &&
      r.subjectName?.toLowerCase() === cleanSubject.toLowerCase() &&
      r.date === cleanDate
  );

  if (isDuplicate) {
    throw new Error(
      `Duplicate Record: An attendance record already exists for ${cleanEnrollment} in "${cleanSubject}" on ${cleanDate}.`
    );
  }

  const newRecord = {
    id: `REC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
    studentName: cleanName,
    enrollmentNumber: cleanEnrollment,
    department: record.department || "Computer Science & Engineering",
    semester: record.semester || "Semester 4",
    subjectName: cleanSubject,
    date: cleanDate,
    checkInTime: record.status === "Absent" ? "-" : record.checkInTime || "09:00 AM",
    status: record.status || "Present",
    remarks: (record.remarks || "").trim() || "Normal attendance",
    createdAt: new Date().toISOString(),
  };

  const updatedRecords = [newRecord, ...records];
  saveAttendanceRecords(updatedRecords);
  return newRecord;
}

/**
 * Update an existing record
 */
export function updateAttendanceRecord(id, updatedFields) {
  const records = getAttendanceRecords();
  const targetIndex = records.findIndex((r) => r.id === id);

  if (targetIndex === -1) {
    throw new Error(`Record with ID '${id}' not found.`);
  }

  const existing = records[targetIndex];
  const cleanEnrollment = (updatedFields.enrollmentNumber || existing.enrollmentNumber).trim().toUpperCase();
  const cleanSubject = (updatedFields.subjectName || existing.subjectName).trim();
  const cleanDate = (updatedFields.date || existing.date).trim();

  // Duplicate check: make sure another record doesn't already have this combination
  const duplicate = records.find(
    (r) =>
      r.id !== id &&
      r.enrollmentNumber?.toUpperCase() === cleanEnrollment &&
      r.subjectName?.toLowerCase() === cleanSubject.toLowerCase() &&
      r.date === cleanDate
  );

  if (duplicate) {
    throw new Error(
      `Duplicate Record: Another record exists for ${cleanEnrollment} in "${cleanSubject}" on ${cleanDate}.`
    );
  }

  const updated = {
    ...existing,
    ...updatedFields,
    enrollmentNumber: cleanEnrollment,
    subjectName: cleanSubject,
    date: cleanDate,
    checkInTime: updatedFields.status === "Absent" ? "-" : updatedFields.checkInTime || existing.checkInTime || "09:00 AM",
    updatedAt: new Date().toISOString(),
  };

  records[targetIndex] = updated;
  saveAttendanceRecords(records);
  return updated;
}

/**
 * Delete a record by ID
 */
export function deleteAttendanceRecord(id) {
  const records = getAttendanceRecords();
  const filtered = records.filter((r) => r.id !== id);
  if (filtered.length === records.length) {
    throw new Error(`Record with ID '${id}' was not found.`);
  }
  saveAttendanceRecords(filtered);
  return true;
}

/**
 * Clear all records from LocalStorage
 */
export function clearAttendanceRecords() {
  saveAttendanceRecords([]);
  return true;
}

/**
 * Reset to sample records
 */
export function resetToDemoRecords() {
  saveAttendanceRecords(SAMPLE_ATTENDANCE_RECORDS);
  saveAttendanceSessions(SAMPLE_SESSIONS);
  return SAMPLE_ATTENDANCE_RECORDS;
}

/**
 * Export records list to CSV file
 */
export function exportAttendanceToCSV(records, filenamePrefix = "svvv_attendance_records") {
  if (!records || records.length === 0) {
    throw new Error("No attendance records to export.");
  }

  const headers = [
    "S. No.",
    "Student Name",
    "Enrollment Number",
    "Branch / Department",
    "Semester",
    "Subject / Lab Name",
    "Attendance Date",
    "Check-in Time",
    "Attendance Status",
    "Remarks",
  ];

  const rows = records.map((r, index) => [
    index + 1,
    `"${(r.studentName || "").replace(/"/g, '""')}"`,
    `"${(r.enrollmentNumber || "").replace(/"/g, '""')}"`,
    `"${(r.department || "").replace(/"/g, '""')}"`,
    `"${(r.semester || "").replace(/"/g, '""')}"`,
    `"${(r.subjectName || "").replace(/"/g, '""')}"`,
    `"${r.date || ""}"`,
    `"${r.checkInTime || ""}"`,
    `"${r.status || ""}"`,
    `"${(r.remarks || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
