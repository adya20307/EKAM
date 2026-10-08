// src/pages/Pages.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "../language-context";
import {
  Bot,
  Mic,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Upload,
  CalendarDays,
  MapPin,
  FileText,
  Star,
  QrCode,
  ShieldAlert,
  HeartPulse,
  Download,
  BookOpen,
  ClipboardCheck,
  Trophy,
  Bell,
  Megaphone,
  BedDouble,
  Utensils,
  CreditCard,
  Receipt,
  HelpCircle,
  Sparkles,
  Phone,
  MessageSquare,
  FileCheck,
} from "lucide-react";

import "./Pages.css";

const CAMPY_API_URL = `${
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
}/api/campy/execute`;
const ATTENDANCE_API_URL = `${
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
}/api/attendance/me`;
const SOS_API_URL = `${
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
}/api/sos`;
const ASSIGNMENTS_API_URL = `${
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
}/api/assignments`;

function detectEmergencySOS(message) {
  const normalized = String(message || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (/\bhelp(?:\s+help){2}\b/.test(normalized)) {
    return "HEALTHCARE";
  }
  if (/\bsave me(?:\s+save me){2}\b/.test(normalized)) {
    return "SECURITY";
  }
  return null;
}

function requestLocationSnapshot() {
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  });
}

async function sendCampusSOS(type, message) {
  const location = await requestLocationSnapshot();
  let response;
  try {
    response = await fetch(SOS_API_URL, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, message, ...location }),
    });
  } catch {
    throw new Error("Could not reach EKAM to send the SOS. Call campus emergency services directly.");
  }
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "EKAM could not send the SOS.");
  }
  return data;
}

const getLoggedInStudent = () => {
  try {
    const savedStudent = localStorage.getItem("ekamStudent");

    if (!savedStudent) {
      return null;
    }

    return JSON.parse(savedStudent);
  } catch (error) {
    console.error(
      "Unable to load logged-in student:",
      error
    );

    return null;
  }
};

const savedStudent = getLoggedInStudent();

const student = {
  id: savedStudent?.id || "",

  name:
    savedStudent?.name ||
    "Student",

  registration:
    savedStudent?.registration_no ||
    savedStudent?.registration ||
    "Not available",

  branch:
    savedStudent?.branch ||
    savedStudent?.department ||
    "Not available",

  semester:
    savedStudent?.semester ||
    "Not available",

  mobile:
    savedStudent?.mobile ||
    "",

  email:
    savedStudent?.email ||
    "",

  department:
    savedStudent?.department ||
    "",

  role:
    savedStudent?.role ||
    "student",

  status:
    savedStudent?.status ||
    "ACTIVE",
};

const statusClass = (status = "") =>
  status
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("_", "-");
    
function PageShell({
  title,
  subtitle,
  children,
}) {
  const { t } = useLanguage();
  return (
    <div className="ekam-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">
            EKAM
          </span>

          <h1>{t(title)}</h1>

          <p>{t(subtitle)}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

function Field({
  label,
  type = "text",
  value = "",
  onChange,
  placeholder,
  readOnly = false,
}) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        onChange={
          onChange
            ? (event) => onChange(event.target.value)
            : undefined
        }
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value = "",
  onChange,
  placeholder,
}) {
  return (
    <label>
      {label}
      <textarea
        value={value}
        onChange={
          onChange
            ? (event) => onChange(event.target.value)
            : undefined
        }
        placeholder={placeholder}
      />
    </label>
  );
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

export function DashboardPage({
  notifications = [],
  onNavigate,
  onToast,
  onRegisterCampyWake,
}) {
  const [sosStatus, setSosStatus] = useState({});
  const [attendance, setAttendance] = useState(null);
  const [attendanceError, setAttendanceError] = useState("");
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(ATTENDANCE_API_URL, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load attendance.");
        }
        return data;
      })
      .then((data) => {
        if (active) setAttendance(data);
      })
      .catch((error) => {
        if (active) setAttendanceError(error.message);
      })
      .finally(() => {
        if (active) setAttendanceLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const sendSOS = async (type) => {
    setSosStatus((previous) => ({ ...previous, [type]: "sending" }));
    try {
      const data = await sendCampusSOS(
        type === "healthcare" ? "HEALTHCARE" : "SECURITY",
        type === "healthcare"
          ? "Healthcare assistance requested from the student dashboard."
          : "Emergency assistance requested from the student dashboard."
      );
      setSosStatus((previous) => ({ ...previous, [type]: "sent" }));
      onToast?.(
        data.delivery.location === "included"
          ? `${data.message} Current location was included.`
          : `${data.message} Location was unavailable.`
      );
    } catch (error) {
      setSosStatus((previous) => ({ ...previous, [type]: "error" }));
      onToast?.(error.message);
    }
  };

  return (
    <div className="ekam-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">
            STUDENT DASHBOARD
          </span>

          <h1>
            Good afternoon,{" "}
            {student.name.split(" ")[0]} 👋
          </h1>

          <p>
            Everything you need for your campus life,
            in one place.
          </p>
        </div>

        <div className="student-mini-card">
          <div className="avatar">
            {student.name.charAt(0)}
          </div>

          <div>
            <strong>{student.name}</strong>
            <span>
              {student.registration} ·{" "}
              {student.branch}
            </span>
          </div>
        </div>
      </div>

      <div className="ai-banner">
        <div className="ai-banner-icon">
          <Bot size={25} />
        </div>

        <div className="ai-banner-content">
          <span className="ai-label">
            CAMPY AI ASSISTANT
          </span>

          <h2>Ask CAMPY anything</h2>

          <p>
            Your smart campus assistant for academics,
            services, hostel, safety and everyday
            campus help.
          </p>
        </div>

        <VoiceHelpdeskPage
          wakeWordOnly
          onWakeReady={onRegisterCampyWake}
        />
      </div>

      <div className="sos-grid">
        <button
          className="sos-card healthcare"
          onClick={() => sendSOS("healthcare")}
          disabled={sosStatus.healthcare === "sending"}
          aria-live="polite"
        >
          <div className="sos-icon">
            <HeartPulse size={27} />
          </div>

          <div>
            <span>SAFETY</span>
            <h3>
              {sosStatus.healthcare === "sending"
                ? "Sending Healthcare SOS..."
                : sosStatus.healthcare === "sent"
                ? "Healthcare SOS Sent"
                : "Healthcare SOS"}
            </h3>
            <p>
              {sosStatus.healthcare === "sent"
                ? "Your healthcare alert has been activated."
                : sosStatus.healthcare === "error"
                ? "The alert could not be sent. Please retry or call campus support."
                : "Send an immediate healthcare alert."}
            </p>
          </div>

          <Send size={20} />
        </button>

        <button
          className="sos-card emergency"
          onClick={() => sendSOS("emergency")}
          disabled={sosStatus.emergency === "sending"}
          aria-live="polite"
        >
          <div className="sos-icon">
            <ShieldAlert size={27} />
          </div>

          <div>
            <span>SAFETY</span>
            <h3>
              {sosStatus.emergency === "sending"
                ? "Sending Emergency SOS..."
                : sosStatus.emergency === "sent"
                ? "Emergency SOS Sent"
                : "Emergency SOS"}
            </h3>
            <p>
              {sosStatus.emergency === "sent"
                ? "Your emergency alert has been activated."
                : sosStatus.emergency === "error"
                ? "The alert could not be sent. Please retry or call campus support."
                : "Send an immediate emergency alert."}
            </p>
          </div>

          <Send size={20} />
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Attendance"
          value={
            attendanceLoading
              ? "…"
              : attendance?.totals.percentage == null
              ? "—"
              : `${attendance.totals.percentage}%`
          }
          sub={
            attendanceError
              ? "Attendance unavailable"
              : `${attendance?.totals.totalClasses || 0} recorded classes`
          }
          icon={<ClipboardCheck size={21} />}
          type="blue"
        />

        <StatCard
          title="Today's Classes"
          value="5"
          sub="2 completed"
          icon={<CalendarDays size={21} />}
          type="purple"
        />

        <StatCard
          title="Assignments"
          value="3"
          sub="Pending submission"
          icon={<FileText size={21} />}
          type="orange"
        />

        <StatCard
          title="Notifications"
          value={notifications.length}
          sub="Campus updates"
          icon={<Bell size={21} />}
          type="green"
        />
      </div>

      <div className="ekam-card dashboard-attendance-card">
        <div className="card-heading">
          <div>
            <h3>Attendance by Subject</h3>
            <p>Live records entered by Teaching Faculty.</p>
          </div>
          <button
            className="text-btn"
            onClick={() => onNavigate?.("attendance")}
          >
            View attendance
          </button>
        </div>
        {attendanceError ? (
          <EmptyState text={attendanceError} />
        ) : attendanceLoading ? (
          <EmptyState text="Loading attendance…" />
        ) : attendance?.subjects.length ? (
          <div className="attendance-list">
            {attendance.subjects.slice(0, 4).map((subject) => (
              <div className="attendance-row" key={subject.subject}>
                <div className="attendance-name">
                  <strong>{subject.subject}</strong>
                  <span>
                    {subject.attendedClasses} of {subject.totalClasses} attended
                  </span>
                </div>
                <div
                  className="progress"
                  role="img"
                  aria-label={`${subject.subject}: ${subject.percentage}% attendance`}
                >
                  <span style={{ width: `${subject.percentage}%` }} />
                </div>
                <strong
                  className={
                    subject.percentage < 75
                      ? "danger-text"
                      : "success-text"
                  }
                >
                  {subject.percentage}%
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="No attendance recorded yet. Your subject chart will appear when faculty records your classes." />
        )}
      </div>

      <div className="dashboard-grid">
        <div className="ekam-card">
          <div className="card-heading">
            <div>
              <h3>Notifications</h3>
              <p>Latest campus alerts</p>
            </div>

            <Bell size={20} />
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <EmptyState text="No new notifications." />
            ) : (
              notifications
                .slice(0, 5)
                .map((notification) => (
                  <div
                    className="notification-item"
                    key={notification.id}
                  >
                    <div
                      className={`notification-dot ${
                        notification.type || "info"
                      }`}
                    />

                    <div>
                      <strong>
                        {notification.title}
                      </strong>

                      <p>
                        {notification.text}
                      </p>

                      <small>
                        {notification.time ||
                          "Just now"}
                      </small>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="ekam-card">
          <div className="card-heading">
            <div>
              <h3>Today's Timetable</h3>
              <p>Next classes</p>
            </div>

            <button
              className="text-btn"
              onClick={() =>
                onNavigate("timetable")
              }
            >
              View all
            </button>
          </div>

          <div className="mini-timetable">
            {[
              [
                "09:00 AM",
                "Data Structures",
                "A-204",
                "completed",
              ],
              [
                "11:00 AM",
                "Database Management",
                "B-101",
                "suspended",
              ],
              [
                "01:30 PM",
                "Operating Systems",
                "A-305",
                "upcoming",
              ],
              [
                "03:00 PM",
                "Computer Networks",
                "Lab-2",
                "upcoming",
              ],
            ].map(
              ([
                time,
                subject,
                room,
                status,
              ]) => (
                <div
                  className="mini-time-row"
                  key={subject}
                >
                  <span>{time}</span>

                  <div>
                    <strong>{subject}</strong>
                    <small>{room}</small>
                  </div>

                  <span
                    className={`status-chip ${status}`}
                  >
                    {status === "suspended"
                      ? "Suspended"
                      : status}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
  type,
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${type}`}>
        {icon}
      </div>

      <span>{title}</span>

      <strong>{value}</strong>

      <small>{sub}</small>
    </div>
  );
}

export function AttendancePage() {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(ATTENDANCE_API_URL, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load attendance.");
        }
        return data;
      })
      .then((data) => {
        if (active) setAttendance(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <PageShell
      title="Attendance"
      subtitle="Track your semester attendance subject-wise."
    >
      <div className="stats-grid compact">
        <div className="stat-card">
          <span>Overall Attendance</span>
          <strong>
            {loading
              ? "…"
              : attendance?.totals.percentage == null
              ? "—"
              : `${attendance.totals.percentage}%`}
          </strong>
          <small>
            {attendance?.totals.percentage == null
              ? "Based on recorded classes"
              : attendance.totals.percentage < 75
              ? "Below the 75% requirement"
              : "Good standing"}
          </small>
        </div>

        <div className="stat-card">
          <span>Total Classes</span>
          <strong>{loading ? "…" : attendance?.totals.totalClasses || 0}</strong>
          <small>Recorded in the database</small>
        </div>

        <div className="stat-card">
          <span>Attended</span>
          <strong>{loading ? "…" : attendance?.totals.attendedClasses || 0}</strong>
          <small>Present or late</small>
        </div>
      </div>

      <div className="ekam-card">
        <div className="card-heading">
          <div>
            <h3>Subject-wise Attendance</h3>
            <p>Minimum required: 75% · Updated from faculty attendance records</p>
          </div>
        </div>

        {error ? (
          <EmptyState text={error} />
        ) : loading ? (
          <EmptyState text="Loading attendance…" />
        ) : attendance?.subjects.length ? (
          <div className="attendance-list">
            {attendance.subjects.map((subject) => (
              <div
                className="attendance-row"
                key={subject.subject}
              >
                <div className="attendance-name">
                  <strong>{subject.subject}</strong>
                  <span>
                    {subject.attendedClasses} / {subject.totalClasses} attended
                    {" · "}
                    {subject.absentClasses} absent
                  </span>
                </div>

                <div
                  className="progress"
                  role="img"
                  aria-label={`${subject.subject}: ${subject.percentage}% attendance`}
                >
                  <span
                    style={{
                      width: `${subject.percentage}%`,
                    }}
                  />
                </div>

                <strong
                  className={
                    subject.percentage < 75
                      ? "danger-text"
                      : "success-text"
                  }
                >
                  {subject.percentage}%
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="No attendance records yet. This chart will populate automatically after your faculty records attendance." />
        )}
      </div>
    </PageShell>
  );
}

export function TimetablePage({
  onSuspension,
}) {
  const [day, setDay] = useState("today");

  const [data, setData] = useState({
    yesterday: [
      [
        "09:00 AM - 10:00 AM",
        "Computer Networks",
        "Dr. Mishra",
        "A-301",
        "completed",
      ],
      [
        "10:00 AM - 11:00 AM",
        "Software Engineering",
        "Prof. Das",
        "B-202",
        "completed",
      ],
      [
        "01:30 PM - 02:30 PM",
        "Operating Systems",
        "Dr. Rao",
        "A-305",
        "completed",
      ],
    ],

    today: [
      [
        "09:00 AM - 10:00 AM",
        "Data Structures",
        "Dr. Sharma",
        "A-204",
        "completed",
      ],
      [
        "11:00 AM - 12:00 PM",
        "Database Management",
        "Prof. Das",
        "B-101",
        "suspended",
      ],
      [
        "01:30 PM - 02:30 PM",
        "Operating Systems",
        "Dr. Rao",
        "A-305",
        "upcoming",
      ],
      [
        "03:00 PM - 04:00 PM",
        "Computer Networks",
        "Dr. Mishra",
        "Lab-2",
        "upcoming",
      ],
      [
        "04:00 PM - 05:00 PM",
        "Software Engineering",
        "Prof. Nayak",
        "B-202",
        "upcoming",
      ],
    ],

    tomorrow: [
      [
        "09:00 AM - 10:00 AM",
        "Software Engineering",
        "Prof. Nayak",
        "B-202",
        "upcoming",
      ],
      [
        "11:00 AM - 12:00 PM",
        "Data Structures",
        "Dr. Sharma",
        "A-204",
        "upcoming",
      ],
      [
        "01:30 PM - 02:30 PM",
        "Database Management",
        "Prof. Das",
        "B-101",
        "upcoming",
      ],
    ],
  });

  const suspendClass = (index) => {
    const current = data[day][index];

    if (current[4] === "suspended") {
      return;
    }

    const updated = {
      ...data,
      [day]: data[day].map(
        (row, rowIndex) =>
          rowIndex === index
            ? [
                row[0],
                row[1],
                row[2],
                row[3],
                "suspended",
              ]
            : row
      ),
    };

    setData(updated);

    onSuspension?.({
      title: "Class Suspended",
      text: `${current[1]} at ${
        current[0].split(" - ")[0]
      } in ${current[3]} has been suspended.`,
    });
  };

  return (
    <PageShell
      title="Timetable"
      subtitle="View your classes and live class status."
    >
      <div className="tabs">
        {[
          "yesterday",
          "today",
          "tomorrow",
        ].map((item) => (
          <button
            key={item}
            className={
              day === item ? "active" : ""
            }
            onClick={() => setDay(item)}
          >
            {item.charAt(0).toUpperCase() +
              item.slice(1)}
          </button>
        ))}
      </div>

      <div className="ekam-card">
        <div className="table-head timetable-head">
          <span>TIME</span>
          <span>SUBJECT</span>
          <span>FACULTY</span>
          <span>ROOM</span>
          <span>STATUS</span>
          <span>ACTION</span>
        </div>

        {data[day].map((row, index) => (
          <div
            className="timetable-row"
            key={`${row[1]}-${index}`}
          >
            <span className="time-cell">
              <Clock3 size={15} />
              {row[0]}
            </span>

            <strong>{row[1]}</strong>

            <span>{row[2]}</span>

            <span>{row[3]}</span>

            <span
              className={`status-chip ${statusClass(
                row[4]
              )}`}
            >
              {row[4] === "suspended"
                ? "Suspended"
                : row[4]
                    .charAt(0)
                    .toUpperCase() +
                  row[4].slice(1)}
            </span>

            {row[4] === "suspended" ? (
              <span className="suspended-label">
                <AlertCircle size={15} />
                Suspended
              </span>
            ) : (
              <button
                className="small-btn danger"
                onClick={() =>
                  suspendClass(index)
                }
              >
                Mark Suspended
              </button>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(ASSIGNMENTS_API_URL, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load assignments.");
        }
        return data;
      })
      .then((data) => {
        if (active) setAssignments(data.assignments);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const formatDueDate = (value) => {
    if (!value) return "Not available";
    const [year, month, day] = value.slice(0, 10).split("-");
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    ).toLocaleDateString();
  };

  return (
    <PageShell
      title="Assignments"
      subtitle="View and track your academic submissions."
    >
      <div className="ekam-card">
        <div className="table-head assignment-head">
          <span>SUBJECT</span>
          <span>ASSIGNMENT</span>
          <span>DUE DATE</span>
          <span>STATUS</span>
          <span />
        </div>

        {error ? (
          <EmptyState text={error} />
        ) : loading ? (
          <EmptyState text="Loading assignments..." />
        ) : assignments.length === 0 ? (
          <EmptyState text="No assignments have been published for your branch and semester." />
        ) : assignments.map((assignment) => (
          <div
            className="table-row"
            key={assignment.id}
          >
            <strong>{assignment.subject}</strong>
            <span>{assignment.title}</span>
            <span>{formatDueDate(assignment.due)}</span>

            <span
              className="status-chip pending"
            >
              Pending
            </span>

            <span>{assignment.description}</span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function MaterialsPage({
  semester,
}) {
  const subjects = [
    "Data Structures",
    "Database Management",
    "Operating Systems",
    "Computer Networks",
    "Software Engineering",
  ];

  return (
    <PageShell
      title={`${semester} Semester — Study Materials & PYQs`}
      subtitle="Access subject-wise study materials, notes and previous year questions."
    >
      <div className="material-grid">
        {subjects.map((subject) => (
          <div
            className="material-card"
            key={subject}
          >
            <div className="material-icon">
              <BookOpen size={22} />
            </div>

            <h3>{subject}</h3>

            <p>
              Notes, syllabus, important questions
              and PYQs.
            </p>

            <div className="material-actions">
              <button>
                <Download size={15} />
                Notes
              </button>

              <button>
                <FileText size={15} />
                PYQs
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function ResultsPage() {
  return (
    <PageShell
      title="Results"
      subtitle="Semester results and academic performance."
    >
      <div className="result-hero">
        <div>
          <span>5TH SEMESTER</span>
          <h2>8.42 CGPA</h2>
          <p>
            Latest published semester performance
          </p>
        </div>

        <Trophy size={50} />
      </div>

      <div className="ekam-card">
        <div className="card-heading">
          <h3>Subject Results</h3>
        </div>

        {[
          ["Data Structures", "A", "9"],
          ["Database Management", "A+", "10"],
          ["Operating Systems", "B+", "8"],
          ["Computer Networks", "A", "9"],
          ["Software Engineering", "A+", "10"],
        ].map((result) => (
          <div
            className="result-row"
            key={result[0]}
          >
            <strong>{result[0]}</strong>
            <span>{result[1]}</span>
            <b>{result[2]}</b>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function NoticesPage() {
  const notices = [
    [
      "Mid-Semester Examination Schedule Released",
      "Examination Cell",
      "02 Oct 2026",
      "notice",
    ],
    [
      "BPUT Hackathon 2026 Registration",
      "Innovation Cell",
      "01 Oct 2026",
      "event",
    ],
    [
      "Campus maintenance update",
      "Administration",
      "30 Sep 2026",
      "update",
    ],
    [
      "Library timing extended during exams",
      "Library",
      "29 Sep 2026",
      "notice",
    ],
  ];

  return (
    <PageShell
      title="Notices & Announcements"
      subtitle="Stay updated with official campus information."
    >
      <div className="notice-grid">
        {notices.map((notice) => (
          <div
            className="notice-card"
            key={notice[0]}
          >
            <div className="notice-top">
              <div className="notice-icon">
                <Megaphone size={19} />
              </div>

              <span>{notice[3]}</span>
            </div>

            <h3>{notice[0]}</h3>

            <p>
              {notice[1]} · {notice[2]}
            </p>

            <button className="text-btn">
              Read more →
            </button>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function EventsPage() {
  const events = [
    [
      "BPUT Hackathon 2026",
      "08 Oct 2026",
      "Innovation Lab",
      "Hackathon",
    ],
    [
      "Tech Symposium",
      "15 Oct 2026",
      "Main Auditorium",
      "Technical",
    ],
    [
      "Annual Sports Meet",
      "20 Oct 2026",
      "College Ground",
      "Sports",
    ],
  ];

  return (
    <PageShell
      title="Events"
      subtitle="Upcoming activities and campus events."
    >
      <div className="event-grid">
        {events.map((event) => (
          <div
            className="event-card"
            key={event[0]}
          >
            <div className="event-date">
              <CalendarDays size={21} />
              <strong>{event[1]}</strong>
            </div>

            <h3>{event[0]}</h3>

            <p>
              <MapPin size={15} />
              {event[2]}
            </p>

            <span className="soft-chip">
              {event[3]}
            </span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function CampusUpdatesPage() {
  const updates = [
    "Wi-Fi maintenance completed in Block A.",
    "New drinking water station installed near library.",
    "Parking area B will remain closed on Saturday.",
    "Student helpdesk timings: 9:00 AM – 5:00 PM.",
  ];

  return (
    <PageShell
      title="Campus Updates"
      subtitle="General campus-wide updates and information."
    >
      <div className="ekam-card update-feed">
        {updates.map((update, index) => (
          <div className="feed-row" key={update}>
            <div className="feed-number">
              {index + 1}
            </div>

            <div>
              <strong>{update}</strong>
              <small>
                Campus Administration ·{" "}
                {index + 1} day ago
              </small>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function HostelDashboardPage() {
  return (
    <PageShell
      title="Hostel Dashboard"
      subtitle="Your hostel information at a glance."
    >
      <div className="stats-grid compact">
        <div className="stat-card">
          <span>Hostel</span>
          <strong>Block B</strong>
          <small>Girls' Hostel</small>
        </div>

        <div className="stat-card">
          <span>Room</span>
          <strong>B-204</strong>
          <small>4-seater</small>
        </div>

        <div className="stat-card">
          <span>Gate Passes</span>
          <strong>2</strong>
          <small>This month</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="ekam-card">
          <div className="card-heading">
            <h3>Hostel Information</h3>
            <BedDouble size={20} />
          </div>

          <div className="detail-grid">
            <Detail
              label="Hostel"
              value="Block B Girls' Hostel"
            />
            <Detail
              label="Room"
              value="B-204"
            />
            <Detail
              label="Bed"
              value="03"
            />
            <Detail
              label="Warden"
              value="Ms. Priya Das"
            />
            <Detail
              label="Contact"
              value="+91 98765 43210"
            />
          </div>
        </div>

        <div className="ekam-card">
          <div className="card-heading">
            <h3>Hostel Rules</h3>
            <ShieldAlert size={20} />
          </div>

          <ul className="simple-list">
            <li>Gate closes at 9:30 PM.</li>
            <li>
              Carry your student ID outside hostel.
            </li>
            <li>
              Submit gate pass before leaving campus.
            </li>
            <li>
              Report maintenance issues through EKAM.
            </li>
          </ul>
        </div>
      </div>
    </PageShell>
  );
}

export function HostelComplaintsPage({
  onToast,
}) {
  const [complaint, setComplaint] =
    useState("");

  const [complaints, setComplaints] =
    useState([
      [
        "Water leakage in bathroom",
        "UNDER_REVIEW",
        "Yesterday",
      ],
    ]);

  const submitComplaint = (event) => {
    event.preventDefault();

    if (!complaint.trim()) {
      return;
    }

    setComplaints([
      [
        complaint,
        "SUBMITTED",
        "Just now",
      ],
      ...complaints,
    ]);

    setComplaint("");

    onToast?.(
      "Hostel complaint submitted."
    );
  };

  return (
    <PageShell
      title="Complaints & Tracking"
      subtitle="Report and track hostel issues."
    >
      <div className="dashboard-grid">
        <form
          className="ekam-card form-card"
          onSubmit={submitComplaint}
        >
          <div className="card-heading">
            <h3>New Complaint</h3>
            <MessageSquare size={20} />
          </div>

          <label>
            Complaint details

            <textarea
              value={complaint}
              onChange={(event) =>
                setComplaint(event.target.value)
              }
              placeholder="Describe the issue..."
            />
          </label>

          <button
            className="ekam-btn primary"
            type="submit"
          >
            Submit Complaint
          </button>
        </form>

        <div className="ekam-card">
          <div className="card-heading">
            <h3>My Complaints</h3>
            <span>{complaints.length}</span>
          </div>

          {complaints.map((complaint) => (
            <div
              className="tracking-item"
              key={complaint[0]}
            >
              <div>
                <strong>{complaint[0]}</strong>
                <small>{complaint[2]}</small>
              </div>

              <span
                className={`status-chip ${statusClass(
                  complaint[1]
                )}`}
              >
                {complaint[1]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function RoomDetailsPage() {
  return (
    <PageShell
      title="Room Details"
      subtitle="View your current hostel room allocation."
    >
      <div className="room-card">
        <div className="room-icon">
          <BedDouble size={36} />
        </div>

        <div>
          <span>
            BLOCK B · GIRLS HOSTEL
          </span>

          <h2>Room B-204</h2>

          <p>
            4-seater room · Floor 2
          </p>
        </div>
      </div>

      <div className="ekam-card">
        <div className="card-heading">
          <h3>Roommates</h3>
        </div>

        {[
          "Ananya Rout",
          "Priyanka Sahu",
          "Sneha Das",
        ].map((name, index) => (
          <div
            className="roommate"
            key={name}
          >
            <div className="avatar">
              {name[0]}
            </div>

            <div>
              <strong>{name}</strong>
              <small>
                Bed {index + 1}
              </small>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

const meals = [
  [
    "Breakfast",
    "07:30 AM",
    "09:00 AM",
    "Poha, Idli, Sambar, Tea / Coffee",
  ],
  [
    "Lunch",
    "12:30 PM",
    "02:00 PM",
    "Rice, Dal, Mixed Vegetable, Paneer Curry, Salad",
  ],
  [
    "Evening Snacks",
    "04:30 PM",
    "05:30 PM",
    "Samosa, Tea / Coffee, Fruit",
  ],
  [
    "Dinner",
    "07:30 PM",
    "09:00 PM",
    "Roti, Rice, Dal, Vegetable Curry, Curd",
  ],
];

export function TodayMenuPage() {
  const now = new Date();

  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const toMinutes = (time) => {
    const [clock, period] =
      time.split(" ");

    let [hours, minutes] =
      clock.split(":").map(Number);

    if (
      period === "PM" &&
      hours !== 12
    ) {
      hours += 12;
    }

    if (
      period === "AM" &&
      hours === 12
    ) {
      hours = 0;
    }

    return hours * 60 + minutes;
  };

  return (
    <PageShell
      title="Today's Menu"
      subtitle="Today's mess menu with serving timings."
    >
      <div className="meal-grid">
        {meals.map((meal) => {
          const serving =
            currentMinutes >=
              toMinutes(meal[1]) &&
            currentMinutes <=
              toMinutes(meal[2]);

          return (
            <div
              className={`meal-card ${
                serving ? "serving" : ""
              }`}
              key={meal[0]}
            >
              <div className="meal-top">
                <div className="meal-icon">
                  <Utensils size={20} />
                </div>

                {serving ? (
                  <span className="serving-badge">
                    Serving Now
                  </span>
                ) : (
                  <span className="meal-time">
                    {meal[1]} – {meal[2]}
                  </span>
                )}
              </div>

              <h3>{meal[0]}</h3>

              <strong>
                {meal[1]} – {meal[2]}
              </strong>

              <p>{meal[3]}</p>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}

export function WeeklyMenuPage() {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <PageShell
      title="Weekly Menu"
      subtitle="Plan your meals for the week."
    >
      <div className="ekam-card menu-table">
        <div className="table-head">
          <span>DAY</span>
          <span>BREAKFAST</span>
          <span>LUNCH</span>
          <span>SNACKS</span>
          <span>DINNER</span>
        </div>

        {days.map((day) => (
          <div
            className="table-row"
            key={day}
          >
            <strong>{day}</strong>
            <span>Poha / Idli</span>
            <span>Rice + Dal + Veg</span>
            <span>Tea + Snack</span>
            <span>Roti + Curry</span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function MessFeedbackPage({
  onToast,
}) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] =
    useState("");

  return (
    <PageShell
      title="Feedback & Ratings"
      subtitle="Share your feedback about mess services."
    >
      <div className="ekam-card form-card narrow">
        <h3>Rate Today's Mess</h3>

        <div className="stars">
          {[1, 2, 3, 4, 5].map(
            (value) => (
              <button
                key={value}
                onClick={() =>
                  setRating(value)
                }
                className={
                  value <= rating
                    ? "selected"
                    : ""
                }
              >
                <Star size={31} />
              </button>
            )
          )}
        </div>

        <label>
          Feedback

          <textarea
            value={feedback}
            onChange={(event) =>
              setFeedback(event.target.value)
            }
            placeholder="Tell us what you liked or what can improve..."
          />
        </label>

        <button
          className="ekam-btn primary"
          onClick={() =>
            onToast?.(
              "Mess feedback submitted."
            )
          }
        >
          Submit Feedback
        </button>
      </div>
    </PageShell>
  );
}

export function GatePassPage({
  onToast,
}) {
  const { t } = useLanguage();
  const initialForm = {
    destination: "",
    departureDate: "",
    departureTime: "",
    arrivalDate: "",
    arrivalTime: "",
    purpose: "",
    emergency: false,
  };

  const [form, setForm] =
    useState(initialForm);

  const [requests, setRequests] =
    useState([]);

  const submit = (event) => {
    event.preventDefault();

    if (
      !form.destination ||
      !form.departureDate ||
      !form.departureTime ||
      !form.arrivalDate ||
      !form.arrivalTime ||
      !form.purpose
    ) {
      onToast?.(
        "Please fill all required gate-pass fields."
      );
      return;
    }

    const requestId = crypto.randomUUID();
    const request = {
      ...form,
      id: requestId,
      qrValue: form.emergency
        ? `EKAM-GATE-PASS-REQUEST:${requestId}`
        : null,
      status: "PENDING_REVIEW",
      created: "Just now",
    };

    setRequests([
      request,
      ...requests,
    ]);

    setForm(initialForm);

    onToast?.(
      form.emergency
        ? "Emergency gate pass submitted."
        : "Gate pass submitted."
    );
  };

  return (
    <PageShell
      title="QR Gate Pass"
      subtitle="Create and track your campus gate pass requests."
    >
      <div className="dashboard-grid">
        <form
          className="ekam-card form-card"
          onSubmit={submit}
        >
          <div className="card-heading">
            <div>
              <h3>New Gate Pass</h3>
              <p>
                Submit a regular or emergency
                pass.
              </p>
            </div>

            <QrCode size={22} />
          </div>

          <div className="form-grid">
            <Field
              label="Destination"
              value={form.destination}
              onChange={(value) =>
                setForm({
                  ...form,
                  destination: value,
                })
              }
              placeholder="Where are you going?"
            />

            <Field
              label="Purpose"
              value={form.purpose}
              onChange={(value) =>
                setForm({
                  ...form,
                  purpose: value,
                })
              }
              placeholder="Reason for leaving"
            />

            <Field
              label="Departure Date"
              type="date"
              value={form.departureDate}
              onChange={(value) =>
                setForm({
                  ...form,
                  departureDate: value,
                })
              }
            />

            <Field
              label="Departure Time"
              type="time"
              value={form.departureTime}
              onChange={(value) =>
                setForm({
                  ...form,
                  departureTime: value,
                })
              }
            />

            <Field
              label="Arrival Date"
              type="date"
              value={form.arrivalDate}
              onChange={(value) =>
                setForm({
                  ...form,
                  arrivalDate: value,
                })
              }
            />

            <Field
              label="Arrival Time"
              type="time"
              value={form.arrivalTime}
              onChange={(value) =>
                setForm({
                  ...form,
                  arrivalTime: value,
                })
              }
            />
          </div>

          <label className="emergency-toggle">
            <input
              type="checkbox"
              checked={form.emergency}
              onChange={(event) =>
                setForm({
                  ...form,
                  emergency:
                    event.target.checked,
                })
              }
            />

            <span>
              <strong>
                Emergency Pass
              </strong>

              <small>
                Use this for urgent situations
                requiring priority review.
              </small>
            </span>
          </label>

          <button
            className="ekam-btn primary"
            type="submit"
          >
            <Send size={17} />
            Submit Request
          </button>
        </form>

        <div className="ekam-card">
          <div className="card-heading">
            <div>
              <h3>My Gate Passes</h3>
              <p>Status workflow</p>
            </div>
          </div>

          {requests.length === 0 ? (
            <EmptyState text="No gate pass requests yet." />
          ) : (
            requests.map((request) => (
              <div
                className="request-card"
                key={request.id}
              >
                <div>
                  <strong>
                    {request.destination}
                  </strong>

                  <small>
                    {request.departureDate}{" "}
                    {request.departureTime} →
                    {" "}
                    {request.arrivalDate}{" "}
                    {request.arrivalTime}
                  </small>

                  {request.emergency && (
                    <span className="emergency-label">
                      EMERGENCY
                    </span>
                  )}
                </div>

                <span
                  className={`status-chip ${statusClass(
                    request.status
                  )}`}
                >
                  {request.status.replaceAll(
                    "_",
                    " "
                  )}
                </span>

                <div className="workflow">
                  <span className="done">
                    DRAFT
                  </span>

                  <span className="done">
                    SUBMITTED
                  </span>

                  <span className="active">
                    PENDING REVIEW
                  </span>

                  <span>
                    APPROVED / REJECTED
                  </span>
                </div>

                {request.emergency || request.status === "APPROVED" ? (
                  <div className="gate-pass-qr">
                    <QRCodeSVG
                      value={
                        request.qrValue ||
                        `EKAM-GATE-PASS-REQUEST:${request.id}`
                      }
                      size={112}
                      level="M"
                      title={t("Gate-pass request QR code")}
                      aria-label={t(
                        request.emergency
                          ? "Emergency gate-pass QR code generated immediately."
                          : "Approved gate-pass QR code."
                      )}
                    />
                    <div>
                      <strong>
                        {t(
                          request.emergency
                            ? "Emergency QR generated immediately"
                            : "Approved gate-pass QR code"
                        )}
                      </strong>
                      {request.emergency && (
                        <small>{t("Emergency gate passes generate a QR immediately.")}</small>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="gate-pass-qr-pending">
                    {t("A QR code will be generated after this request is approved.")}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}

const applicationTypes = {
  leave: {
    title: "Leave Application",
    recipient: "The Head of Department",
    subject: "Leave Application",
  },

  medical: {
    title: "Medical Leave",
    recipient: "The Head of Department",
    subject: "Medical Leave Application",
  },

  hostel: {
    title: "Hostel Leave",
    recipient: "Hostel Warden",
    subject: "Hostel Leave Application",
  },

  bonafide: {
    title: "Bonafide Certificate",
    recipient: "The Head of Department",
    subject:
      "Request for Bonafide Certificate",
  },

  permission: {
    title: "Permission Application",
    recipient: "The Head of Department",
    subject: "Permission Application",
  },

  other: {
    title: "Other Application",
    recipient: "The Head of Department",
    subject: "Application",
  },
};

export function ApplicationsPage({
  onToast,
}) {
  const [type, setType] = useState("leave");

  const [form, setForm] = useState({
    from: "",
    to: "",
    reason: "",
    purpose: "",
    date: "",
    time: "",
    destination: "",
    subject: "",
    details: "",
    attachment: "",
  });

  const [applications, setApplications] =
    useState([]);

  const selected =
    applicationTypes[type];

  const submit = (event) => {
    event.preventDefault();

    setApplications([
      {
        id: Date.now(),
        type: selected.title,
        subject: selected.subject,
        status: "PENDING_REVIEW",
        date: "Just now",
      },
      ...applications,
    ]);

    onToast?.(
      "Application submitted for review."
    );
  };

  return (
    <PageShell
      title="Applications"
      subtitle="Submit structured academic and campus applications."
    >
      <div className="application-layout">
        <div className="ekam-card type-card">
          <h3>Application Type</h3>

          {Object.entries(
            applicationTypes
          ).map(([key, value]) => (
            <button
              key={key}
              className={
                type === key
                  ? "selected"
                  : ""
              }
              onClick={() => setType(key)}
            >
              <FileCheck size={17} />
              {value.title}
            </button>
          ))}
        </div>

        <form
          className="ekam-card application-form"
          onSubmit={submit}
        >
          <div className="letter-preview">
            <span>To,</span>
            <strong>
              {selected.recipient}
            </strong>

            <span>
              <b>Subject:</b>{" "}
              {selected.subject}
            </span>
          </div>

          <h3>{selected.title}</h3>

          <div className="form-grid auto">
            <Field
              label="Student Name"
              value={student.name}
              readOnly
            />

            <Field
              label="Registration No."
              value={student.registration}
              readOnly
            />

            <Field
              label="Branch"
              value={student.branch}
              readOnly
            />

            <Field
              label="Semester"
              value={student.semester}
              readOnly
            />

            {(type === "leave" ||
              type === "medical") && (
              <>
                <Field
                  label="Leave From"
                  type="date"
                  value={form.from}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      from: value,
                    })
                  }
                />

                <Field
                  label="Leave To"
                  type="date"
                  value={form.to}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      to: value,
                    })
                  }
                />

                <TextAreaField
                  label="Reason"
                  value={form.reason}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      reason: value,
                    })
                  }
                />
              </>
            )}

            {type === "hostel" && (
              <>
                <Field
                  label="Leave Date"
                  type="date"
                  value={form.date}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      date: value,
                    })
                  }
                />

                <Field
                  label="Destination"
                  value={form.destination}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      destination: value,
                    })
                  }
                />

                <TextAreaField
                  label="Reason"
                  value={form.reason}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      reason: value,
                    })
                  }
                />
              </>
            )}

            {type === "bonafide" && (
              <TextAreaField
                label="Purpose"
                value={form.purpose}
                onChange={(value) =>
                  setForm({
                    ...form,
                    purpose: value,
                  })
                }
              />
            )}

            {type === "permission" && (
              <>
                <Field
                  label="Date"
                  type="date"
                  value={form.date}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      date: value,
                    })
                  }
                />

                <Field
                  label="Time"
                  type="time"
                  value={form.time}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      time: value,
                    })
                  }
                />

                <TextAreaField
                  label="Reason / Event Details"
                  value={form.reason}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      reason: value,
                    })
                  }
                />
              </>
            )}

            {type === "other" && (
              <>
                <Field
                  label="Subject"
                  value={form.subject}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      subject: value,
                    })
                  }
                />

                <TextAreaField
                  label="Details"
                  value={form.details}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      details: value,
                    })
                  }
                />
              </>
            )}

            {(type === "leave" ||
              type === "medical") && (
              <label>
                Supporting Document

                <input
                  type="file"
                  onChange={(event) =>
                    setForm({
                      ...form,
                      attachment:
                        event.target.files?.[0]
                          ?.name || "",
                    })
                  }
                />

                {form.attachment && (
                  <small>
                    {form.attachment}
                  </small>
                )}
              </label>
            )}
          </div>

          <div className="declaration">
            I hereby declare that the information
            provided above is correct.
          </div>

          <button
            className="ekam-btn primary"
            type="submit"
          >
            Submit Application
          </button>
        </form>
      </div>

      <div className="ekam-card">
        <div className="card-heading">
          <h3>My Applications</h3>
          <span>
            {applications.length}
          </span>
        </div>

        {applications.length === 0 ? (
          <EmptyState text="No applications submitted yet." />
        ) : (
          applications.map((application) => (
            <div
              className="tracking-item"
              key={application.id}
            >
              <div>
                <strong>
                  {application.type}
                </strong>

                <small>
                  {application.subject} ·{" "}
                  {application.date}
                </small>
              </div>

              <span className="status-chip pending-review">
                PENDING REVIEW
              </span>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}

export function CertificateRequestsPage({
  onToast,
}) {
  const [type, setType] = useState(
    "Bonafide Certificate"
  );

  const [purpose, setPurpose] =
    useState("");

  const [requests, setRequests] =
    useState([]);

  const submit = () => {
    setRequests([
      {
        type,
        purpose,
        status: "PENDING_REVIEW",
      },
      ...requests,
    ]);

    setPurpose("");

    onToast?.(
      "Certificate request submitted."
    );
  };

  return (
    <PageShell
      title="Certificate Requests"
      subtitle="Request official student certificates."
    >
      <div className="ekam-card form-card narrow">
        <label>
          Certificate Type

          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value)
            }
          >
            <option>
              Bonafide Certificate
            </option>
            <option>
              Character Certificate
            </option>
            <option>
              Course Completion Certificate
            </option>
            <option>
              Migration Certificate
            </option>
          </select>
        </label>

        <label>
          Purpose

          <textarea
            value={purpose}
            onChange={(event) =>
              setPurpose(event.target.value)
            }
            placeholder="Purpose of certificate"
          />
        </label>

        <button
          className="ekam-btn primary"
          onClick={submit}
        >
          Submit Request
        </button>
      </div>

      <div className="ekam-card">
        <h3>My Certificate Requests</h3>

        {requests.length === 0 ? (
          <EmptyState text="No certificate requests yet." />
        ) : (
          requests.map((request, index) => (
            <div
              className="tracking-item"
              key={index}
            >
              <div>
                <strong>
                  {request.type}
                </strong>

                <small>
                  {request.purpose ||
                    "No purpose entered"}
                </small>
              </div>

              <span className="status-chip pending-review">
                {request.status}
              </span>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}

export function FeeStatusPage() {
  return (
    <PageShell
      title="Fee Status"
      subtitle="View your current fee payment information."
    >
      <div className="fee-summary">
        <div>
          <span>Outstanding Amount</span>
          <h2>₹12,500</h2>
          <p>Due: 15 Oct 2026</p>
        </div>

        <CreditCard size={42} />
      </div>

      <div className="ekam-card">
        <div className="card-heading">
          <h3>Fee Details</h3>
          <Receipt size={20} />
        </div>

        {[
          [
            "Tuition Fee",
            "₹10,000",
            "Pending",
          ],
          [
            "Hostel Fee",
            "₹2,500",
            "Pending",
          ],
          [
            "Examination Fee",
            "₹3,000",
            "Paid",
          ],
        ].map((fee) => (
          <div
            className="fee-row"
            key={fee[0]}
          >
            <strong>{fee[0]}</strong>
            <span>{fee[1]}</span>

            <span
              className={`status-chip ${fee[2].toLowerCase()}`}
            >
              {fee[2]}
            </span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function SOSPage({
  type,
  onToast,
}) {
  const healthcare =
    type === "healthcare";

  const [sent, setSent] =
    useState(false);
  const [sentMessage, setSentMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  return (
    <PageShell
      title={
        healthcare
          ? "Healthcare SOS"
          : "Emergency SOS"
      }
      subtitle={
        healthcare
          ? "Send an immediate alert to campus healthcare support."
          : "Send an immediate emergency alert to campus safety support."
      }
    >
      <div
        className={`sos-large ${
          healthcare
            ? "healthcare"
            : "emergency"
        }`}
      >
        <div className="sos-large-icon">
          {healthcare ? (
            <HeartPulse size={48} />
          ) : (
            <ShieldAlert size={48} />
          )}
        </div>

        <span>
          {healthcare
            ? "HEALTHCARE SOS"
            : "EMERGENCY SOS"}
        </span>

        <h2>
          {healthcare
            ? "Need medical assistance?"
            : "Need immediate emergency assistance?"}
        </h2>

        <p>
          Your alert will be sent immediately
          with your student identity and
          campus profile.
        </p>

        <button
          className="ekam-btn sos-send"
          disabled={sending}
          onClick={async () => {
            setSending(true);
            setError("");
            try {
              const response = await sendCampusSOS(
                healthcare ? "HEALTHCARE" : "SECURITY",
                healthcare
                  ? "Healthcare assistance requested from the SOS page."
                  : "Emergency assistance requested from the SOS page."
              );
              setSent(true);
              setSentMessage(
                `${response.message} ${
                  response.delivery.location === "included"
                    ? "Current location was included."
                    : "Location was unavailable."
                }`
              );
              onToast?.(
                response.delivery.location === "included"
                  ? `${response.message} Current location was included.`
                  : `${response.message} Location was unavailable.`
              );
            } catch (requestError) {
              setError(requestError.message);
              onToast?.(requestError.message);
            } finally {
              setSending(false);
            }
          }}
        >
          <Send size={20} />

          {sending
            ? "SENDING SOS..."
            : sent
            ? "SOS SENT"
            : "SEND SOS NOW"}
        </button>

        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}

        {sent && (
          <div className="success-box">
            <CheckCircle2 size={18} />
            {sentMessage}
          </div>
        )}
      </div>

      <div className="contact-grid">
        <div>
          <Phone size={20} />
          <strong>Campus Security</strong>
          <span>+91 98765 11111</span>
        </div>

        <div>
          <HeartPulse size={20} />
          <strong>Health Centre</strong>
          <span>SMS delivery needs a configured SMS provider.</span>
        </div>
      </div>
    </PageShell>
  );
}


export function VoiceHelpdeskPage({
  wakeWordOnly = false,
  onWakeReady,
}) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState(
    wakeWordOnly
      ? "Enable the microphone, then say “Hi CAMPY”."
      : "Click Start CAMPY to begin"
  );
  const [lastCommand, setLastCommand] = useState("");
  const [messages, setMessages] = useState([]);
  const [wakeEnabled, setWakeEnabled] = useState(false);
  const speakingRef = useRef(false);
  const startCampyRef = useRef(null);
  const processVoiceCommandRef = useRef(null);

  const voiceModeRef = useRef("command");
  const recognitionRef = useRef(null);
  const resumeListeningRef = useRef(null);
  const shouldContinueRef = useRef(false);
  const processingRef = useRef(false);
  const pendingWakeCommandRef = useRef("");
  const [textCommand, setTextCommand] = useState("");
const [textSending, setTextSending] = useState(false);

  const speak = (message, afterSpeech) => {
    if (!message) {
      afterSpeech?.();
      return;
    }

    if (!window.speechSynthesis) {
      console.error("❌ Speech synthesis is not supported.");
      afterSpeech?.();
      return;
    }

    const synth = window.speechSynthesis;

    // Stop anything already speaking
    synth.cancel();

    const speakNow = () => {
      const voices = synth.getVoices();

      console.log(
        "🔊 CAMPY available voices:",
        voices.map((voice) => `${voice.name} - ${voice.lang}`)
      );

      const speech = new SpeechSynthesisUtterance(message);

      speech.lang = "en-IN";
      speech.rate = 0.95;
      speech.pitch = 1;
      speech.volume = 1;

      // Prefer Indian English voice
      const indianVoice = voices.find(
        (voice) =>
          voice.lang &&
          voice.lang.toLowerCase() === "en-in"
      );

      // Otherwise use any English voice
      const englishVoice = voices.find(
        (voice) =>
          voice.lang &&
          voice.lang.toLowerCase().startsWith("en")
      );

      if (indianVoice) {
        speech.voice = indianVoice;
        console.log(
          "🇮🇳 CAMPY voice selected:",
          indianVoice.name
        );
      } else if (englishVoice) {
        speech.voice = englishVoice;
        console.log(
          "🇬🇧 CAMPY fallback voice selected:",
          englishVoice.name
        );
      } else {
        console.warn(
          "⚠️ No English voice found. Using browser default."
        );
      }

      speech.onstart = () => {
        console.log(
          "🔊 CAMPY SPEECH STARTED:",
          message
        );
      };

      speech.onend = () => {
        console.log("✅ CAMPY SPEECH FINISHED");

        afterSpeech?.();
      };

      speech.onerror = (event) => {
        console.error(
          "❌ CAMPY SPEECH ERROR:",
          event.error
        );

        afterSpeech?.();
      };

      // Resume speech engine if Chrome has paused it
      try {
        synth.resume();
      } catch (error) {
        console.log(
          "Speech resume error:",
          error
        );
      }

      synth.speak(speech);

      console.log(
        "🎙️ CAMPY speech queued:",
        message
      );
    };

    // Voices can load asynchronously in Chrome
    const voices = synth.getVoices();

    if (voices.length > 0) {
      speakNow();
    } else {
      console.log(
        "⏳ Waiting for CAMPY voices..."
      );

      const handleVoicesChanged = () => {
        synth.removeEventListener(
          "voiceschanged",
          handleVoicesChanged
        );

        speakNow();
      };

      synth.addEventListener(
        "voiceschanged",
        handleVoicesChanged
      );

      // Fallback in case voiceschanged doesn't fire
      setTimeout(() => {
        synth.removeEventListener(
          "voiceschanged",
          handleVoicesChanged
        );

        if (!synth.speaking) {
          speakNow();
        }
      }, 1000);
    }
  };

  const speakWithListening = (message, continueListening = true) => {
    resumeListeningRef.current = startListening;
    speakingRef.current = true;
    setSpeaking(true);
    setStatus("CAMPY is speaking...");

    speak(message, () => {
      speakingRef.current = false;
      setSpeaking(false);

      if (continueListening && shouldContinueRef.current) {
        setTimeout(() => {
          console.log("🔊 CAMPY finished speaking.");
          voiceModeRef.current = "command";
          const pendingCommand = pendingWakeCommandRef.current;
          pendingWakeCommandRef.current = "";
          if (pendingCommand) {
            processVoiceCommandRef.current?.(pendingCommand);
          } else {
            resumeListeningRef.current?.();
          }
        }, 300);
      }
    });
  };

  const stopCampy = () => {
    shouldContinueRef.current = false;
    processingRef.current = false;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    window.speechSynthesis.cancel();

    setListening(false);
    setSpeaking(false);
    speakingRef.current = false;
    setActive(false);
    setWakeEnabled(false);
    voiceModeRef.current = "command";
    setStatus("CAMPY stopped");
  };

  const startListening = () => {
    if (!shouldContinueRef.current) return;
    if (speakingRef.current) return;
    if (processingRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("Speech recognition is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setStatus(
        voiceModeRef.current === "wake" && !active
          ? "Listening for “Hi CAMPY”..."
          : "Listening..."
      );
    };

    recognition.onresult = async (event) => {
      const command = event.results[0][0].transcript.trim();

      if (voiceModeRef.current === "wake") {
        if (detectEmergencySOS(command)) {
          voiceModeRef.current = "command";
          setWakeEnabled(false);
          setActive(true);
          processVoiceCommand(command);
          return;
        }

        const normalized = command
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s]/gu, " ")
          .replace(/\s+/g, " ")
          .trim();
        const wakeWordMatch = normalized.match(
          /\b(?:hi|hey|hello)\s+campy\b/
        );

        if (!wakeWordMatch) {
          setListening(false);
          setStatus("Listening for “Hi CAMPY”...");
          return;
        }

        const remainder = normalized
          .slice(wakeWordMatch.index + wakeWordMatch[0].length)
          .trim();
        voiceModeRef.current = "command";
        setWakeEnabled(false);
        setActive(true);
        setMessages((previous) => [
          ...previous,
          { type: "user", text: command },
        ]);
        pendingWakeCommandRef.current = remainder;
        speakWithListening("Hi! How can I help you?", true);
        return;
      }

      if (!command) {
        startListening();
        return;
      }

      setListening(false);
      setLastCommand(command);

      await processVoiceCommand(command);
    };

    recognition.onerror = (event) => {
      setListening(false);

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        shouldContinueRef.current = false;
        setActive(false);
        setWakeEnabled(false);
        setStatus("Microphone permission is required.");
        return;
      }

      if (shouldContinueRef.current && !speakingRef.current) {
        setTimeout(() => {
          startListening();
        }, 700);
      }
    };

    recognition.onend = () => {
      setListening(false);

      if (
        shouldContinueRef.current &&
        !speakingRef.current &&
        !processingRef.current
      ) {
        setTimeout(() => {
          startListening();
        }, 400);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error("CAMPY speech recognition could not start:", error);
      setListening(false);
      setStatus(
        "Microphone could not start. Check browser permission and try again."
      );
      setTimeout(() => {
        if (shouldContinueRef.current) {
          startListening();
        }
      }, 500);
    }
  };

  const startCampy = () => {
    if (active) return;

    shouldContinueRef.current = true;
    processingRef.current = false;
    voiceModeRef.current = "command";

    setActive(true);
    setStatus("CAMPY activated");

    speakWithListening("Hi! How can I help you?", true);
  };

  useEffect(() => {
    startCampyRef.current = startCampy;
  });

  useEffect(() => {
    if (!wakeWordOnly) return undefined;

    const startFromWakeButton = () => startCampyRef.current?.();
    onWakeReady?.(startFromWakeButton);
    return () => onWakeReady?.(null);
  }, [wakeWordOnly, onWakeReady]);

  const enableWakeWord = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus(
        "Wake-word listening is not supported in this browser. Try Chrome."
      );
      return;
    }

    shouldContinueRef.current = true;
    processingRef.current = false;
    voiceModeRef.current = "wake";
    setActive(false);
    setWakeEnabled(true);
    setStatus("Listening for “Hi CAMPY”...");
    startListening();
  };

  const executeCampy = async (command) => {
    try {
      const response = await fetch(
        CAMPY_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            message: command,
          }),
        }
      );

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("CAMPY returned an invalid response. Please try again.");
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || data.message || "CAMPY could not complete the request."
        );
      }

      return data;
    } catch (error) {
      console.error("CAMPY Error:", error);
      throw error;
    }
  };

  async function processVoiceCommand(command, { speakReply = true } = {}) {
    const lower = command.toLowerCase();
    const emergencyType = detectEmergencySOS(command);

    if (emergencyType) {
      processingRef.current = true;
      setLastCommand(command);
      setStatus("Sending emergency alert...");
      setMessages((previous) => [
        ...previous,
        { type: "user", text: command },
      ]);
      try {
        const result = await sendCampusSOS(
          emergencyType,
          command
        );
        const recipientsMessage =
          result.delivery.dashboard === "sent"
            ? "EKAM admins and Super Admins were notified."
            : "The alert was saved, but no active admin accounts were available.";
        const locationMessage =
          result.delivery.location === "included"
            ? "Your current location was included."
            : "Location was unavailable, so it was not included.";
        const reply = [
          result.message || recipientsMessage,
          locationMessage,
          "If you are in immediate danger, call local emergency services now.",
        ]
          .join(" ");
        setMessages((previous) => [
          ...previous,
          { type: "campy", text: reply },
        ]);
        setStatus("Emergency alert processed.");
        if (speakReply) speakWithListening(reply, true);
      } catch (error) {
        setMessages((previous) => [
          ...previous,
          { type: "campy", text: error.message },
        ]);
        setStatus("Emergency alert could not be sent.");
        if (speakReply) speakWithListening(error.message, true);
      } finally {
        processingRef.current = false;
      }
      return;
    }

    if (
      lower.includes("bye campy") ||
      lower.includes("goodbye campy") ||
      lower.includes("stop listening") ||
      lower.includes("stop campy") ||
      lower === "bye" ||
      lower === "goodbye"
    ) {
      stopCampy();
      const reply = "Okay. I'll be here whenever you need me.";
      setMessages((previous) => [
        ...previous,
        { type: "user", text: command },
        { type: "campy", text: reply },
      ]);
      if (speakReply) {
        speakWithListening(reply, false);
      }
      return;
    }

    if (
      lower === "hi" ||
      lower === "hello" ||
      lower === "hey" ||
      lower.includes("hi campy") ||
      lower.includes("hello campy") ||
      lower.includes("hey campy")
    ) {
      const reply = "Hi! I'm CAMPY. How can I help you?";
      setLastCommand(command);
      setMessages((previous) => [
        ...previous,
        { type: "user", text: command },
        { type: "campy", text: reply },
      ]);
      if (speakReply) {
        speakWithListening(reply, true);
      }
      return;
    }

    setLastCommand(command);
    processingRef.current = true;
    setStatus("CAMPY is thinking...");

    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: command,
      },
    ]);

    try {
      const data = await executeCampy(command);

      const reply =
        data?.campy?.reply ||
        data?.reply ||
        data?.message ||
        "I've processed your request.";
      const replyDetails = [];

      if (data.ticket?.id) {
        replyDetails.push(`Your complaint reference is ${data.ticket.id}.`);
        if (data.ticket.category) {
          replyDetails.push(`I categorized it as ${data.ticket.category}.`);
        }
      }

      if (data.data?.status === "DEMO_DATA" && data.data.message) {
        replyDetails.push(data.data.message);
      }

      const completeReply = [reply, ...replyDetails].join(" ");

      setMessages((prev) => [
        ...prev,
        {
          type: "campy",
          text: completeReply,
        },
      ]);

      processingRef.current = false;

      setStatus("Ready");
      if (speakReply) {
        speakWithListening(completeReply, true);
      }
    } catch (error) {
      processingRef.current = false;

      const errorMessage = error.message;

      setMessages((prev) => [
        ...prev,
        {
          type: "campy",
          text: errorMessage,
        },
      ]);

      setStatus("CAMPY couldn't complete that request.");
      if (speakReply) {
        speakWithListening(errorMessage, true);
      }
    }
  }

  const handleTextCommand = async (event) => {
    event.preventDefault();
    const command = textCommand.trim();

    if (!command || textSending) return;

    setTextSending(true);
    setTextCommand("");

    try {
      await processVoiceCommand(command, { speakReply: false });
    } finally {
      setTextSending(false);
    }
  };
  useEffect(() => {
    processVoiceCommandRef.current = processVoiceCommand;
  });

  useEffect(() => {
    return () => {
      shouldContinueRef.current = false;
      speakingRef.current = false;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      window.speechSynthesis.cancel();
    };
  }, []);

  if (wakeWordOnly) {
    return (
      <div className="campy-wake-control">
        <button
          className="ekam-btn primary"
          onClick={wakeEnabled || active ? stopCampy : enableWakeWord}
          type="button"
        >
          <Mic size={18} />
          {active
            ? "Stop CAMPY"
            : wakeEnabled
              ? "Turn off wake word"
              : "Enable “Hi CAMPY”"}
        </button>
        <span className="campy-wake-status" aria-live="polite">
          {status}
        </span>
      </div>
    );
  }

  return (
    <PageShell
      title="CAMPY AI"
      subtitle="Your intelligent campus assistant"
    >
      <div className="campy-page">
        <div className={`campy-orb ${active ? "active" : ""}`}>
          <div className="campy-orb-inner">
            <span>🎙️</span>
          </div>
        </div>

        <h2>CAMPY</h2>

        <p className="campy-status">
          {status}
        </p>

        {lastCommand && (
          <div className="campy-last-command">
            <strong>You:</strong> {lastCommand}
          </div>
        )}

        <div className="campy-controls">
          {!active ? (
            <button
              className="campy-start-btn"
              onClick={startCampy}
            >
              🎤 Start CAMPY
            </button>
          ) : (
            <button
              className="campy-stop-btn"
              onClick={stopCampy}
            >
              ⏹ Stop CAMPY
            </button>
          )}
        </div>
        <form className="campy-text-input" onSubmit={handleTextCommand}>
          <input
            type="text"
            value={textCommand}
            onChange={(event) => setTextCommand(event.target.value)}
            placeholder="Type a command for CAMPY..."
            disabled={textSending}
            aria-label="Message CAMPY"
          />

          <button
            type="submit"
            disabled={!textCommand.trim() || textSending}
          >
            {textSending ? "Sending..." : "Send"}
          </button>
        </form>

        {listening && (
          <div className="campy-listening">
            🎤 Listening...
          </div>
        )}

        {speaking && (
          <div className="campy-speaking">
            🔊 CAMPY is speaking...
          </div>
        )}

        <div className="campy-conversation">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`campy-message ${message.type}`}
            >
              <strong>
                {message.type === "user" ? "You" : "CAMPY"}
              </strong>
              <span>{message.text}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function FAQPage() {
  const [open, setOpen] =
    useState(null);

  const faqs = [
    [
      "How do I submit a gate pass?",
      "Open Services → QR Gate Pass, enter destination and travel details, then submit the request.",
    ],
    [
      "How do I apply for leave?",
      "Open Services → Applications, select Leave Application, fill the structured form and submit.",
    ],
    [
      "Where can I find study materials?",
      "Open Academics → Study Materials & PYQs and select your semester.",
    ],
    [
      "How can I report a hostel complaint?",
      "Open Hostel → Complaints & Tracking and submit the issue details.",
    ],
    [
      "How do I contact CAMPY?",
      "Use the floating CAMPY button or open AI → Voice & Smart Helpdesk.",
    ],
  ];

  return (
    <PageShell
      title="FAQ Chatbot"
      subtitle="Find quick answers to common campus questions."
    >
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div
            className="faq-item"
            key={faq[0]}
          >
            <button
              onClick={() =>
                setOpen(
                  open === index
                    ? null
                    : index
                )
              }
            >
              <HelpCircle size={20} />

              <strong>{faq[0]}</strong>

              <span>
                {open === index ? "−" : "+"}
              </span>
            </button>

            {open === index && (
              <p>{faq[1]}</p>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function ProfilePage({ user = student }) {
  const { t } = useLanguage();
  const profileItems = [
    [
      t(user.role === "student" ? "Student ID" : "Account ID"),
      user.id || "Not available",
    ],
    [
      t(user.role === "student" ? "Registration ID" : "Faculty ID"),
      user.registration_no ||
        user.registration ||
        user.facultyId ||
        "Not available",
    ],
    [
      "Branch",
      user.branch || "Not available",
    ],
    [
      "Department",
      user.department || "Not available",
    ],
    [
      "Semester",
      user.semester || "Not available",
    ],
    [
      "Phone",
      user.mobile || "Not available",
    ],
    [
      "Email",
      user.email || "Not available",
    ],
    [
      t("Status"),
      user.status ? t(user.status) : t("ACTIVE"),
    ],
  ];

  return (
    <PageShell
      title="My Profile"
      subtitle="Review your account identity and campus details."
    >
      <div
        style={{
          display: "grid",
          gap: "20px",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <div
          className="ekam-card"
          style={{
            padding: "24px",
          }}
        >

          {/* AVATAR */}

          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background:
                "linear-gradient(135deg, #5b6cff, #7c92ff)",
              color: "white",
              fontSize: "30px",
              fontWeight: 700,
              marginBottom: "16px",
            }}
          >
            {user.name
              ?.charAt(0)
              ?.toUpperCase() || "U"}
          </div>


          {/* NAME */}

          <h3
            style={{
              margin: "0 0 6px",
            }}
          >
            {user.name || "EKAM User"}
          </h3>


          <div
            style={{
              color: "#556",
              marginBottom: "18px",
            }}
          >
            {user.role === "student"
              ? "Student"
              : user.role || "User"}{" "}
            • EKAM Portal
          </div>


          {/* PROFILE DETAILS */}

          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            {profileItems.map(
              ([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: "12px",
                    padding:
                      "10px 12px",
                    background:
                      "#f5f7ff",
                    borderRadius:
                      "10px",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#2d3748",
                    }}
                  >
                    {t(label)}
                  </strong>

                  <span
                    style={{
                      color:
                        "#4a5568",
                      textAlign:
                        "right",
                    }}
                  >
                    {value}
                  </span>
                </div>
              )
            )}
          </div>

        </div>
      </div>
    </PageShell>
  );
}

export function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <PageShell
      title="Language & Preferences"
      subtitle="Choose the language used across the EKAM interface."
    >
      <div className="ekam-card" style={{ maxWidth: "640px", padding: "24px" }}>
        <label
          htmlFor="ekam-language"
          style={{
            display: "block",
            marginBottom: "10px",
            fontWeight: 700,
            color: "#1f2937",
          }}
        >
          {t("Language")}
        </label>
        <select
          id="ekam-language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          style={{
            width: "100%",
            minHeight: "48px",
            padding: "10px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            background: "#fff",
            color: "#1f2937",
            font: "inherit",
          }}
        >
          <option value="en">English</option>
          <option value="or">ଓଡ଼ିଆ</option>
          <option value="hi">हिन्दी</option>
        </select>
        <p style={{ margin: "12px 0 0", color: "#64748b" }}>
          {t("Choose the language used across the EKAM interface.")}
        </p>
        <p role="status" style={{ margin: "12px 0 0", color: "#16803c" }}>
          {t("Language preference saved on this device.")}
        </p>
      </div>
    </PageShell>
  );
}