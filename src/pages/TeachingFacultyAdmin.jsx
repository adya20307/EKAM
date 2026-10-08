import React, { useEffect, useMemo, useState } from "react";
import "./TeachingFacultyAdmin.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ATTENDANCE_STUDENTS_API = `${API_BASE_URL}/api/attendance/students`;
const ATTENDANCE_API = `${API_BASE_URL}/api/attendance`;
const getLocalDate = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

const INITIAL_CLASSES = [
  {
    id: "CLS001",
    subject: "Operating Systems",
    faculty: "Dr. S. Mohanty",
    section: "CSE-A",
    time: "10:45 AM",
    room: "Room 301",
    total: 42,
    present: 38,
  },
  {
    id: "CLS002",
    subject: "Computer Networks",
    faculty: "Prof. R. Das",
    section: "CSE-A",
    time: "12:00 PM",
    room: "Lab 2",
    total: 42,
    present: 36,
  },
  {
    id: "CLS003",
    subject: "Artificial Intelligence",
    faculty: "Dr. P. Nayak",
    section: "CSE-A",
    time: "2:00 PM",
    room: "Room 204",
    total: 42,
    present: 40,
  },
];

const INITIAL_CORRECTIONS = [
  {
    id: "COR-001",
    student: "Rahul Kumar",
    studentId: "STU002",
    subject: "Operating Systems",
    date: "07 Oct 2026",
    from: "Absent",
    to: "Present",
    reason: "Medical appointment",
    status: "PENDING",
  },
  {
    id: "COR-002",
    student: "Sneha Patnaik",
    studentId: "STU004",
    subject: "Computer Networks",
    date: "06 Oct 2026",
    from: "Absent",
    to: "Present",
    reason: "Faculty marking error",
    status: "PENDING",
  },
];

const FACULTY_SCHEDULE = [
  {
    day: "Monday",
    time: "10:45 AM",
    subject: "Operating Systems",
    section: "CSE-A",
    room: "301",
  },
  {
    day: "Monday",
    time: "12:00 PM",
    subject: "Computer Networks",
    section: "CSE-A",
    room: "Lab 2",
  },
  {
    day: "Tuesday",
    time: "2:00 PM",
    subject: "Artificial Intelligence",
    section: "CSE-A",
    room: "204",
  },
  {
    day: "Wednesday",
    time: "11:30 AM",
    subject: "Database Management",
    section: "CSE-B",
    room: "305",
  },
];

const statusClass = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

export default function TeachingFacultyAdmin({
  module = "dashboard",
  onNavigate,
}) {
  const [students, setStudents] =
    useState([]);

  const [classes] = useState(INITIAL_CLASSES);

  const [corrections, setCorrections] = useState(
    INITIAL_CORRECTIONS
  );

  const [search, setSearch] = useState("");

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  const [selectedClass, setSelectedClass] =
    useState(null);

  const [toast, setToast] = useState("");

  const [attendanceDate, setAttendanceDate] = useState(getLocalDate);
  const [attendanceSubject, setAttendanceSubject] =
    useState("Operating Systems");
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState("");
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceRefresh, setAttendanceRefresh] = useState(0);

  const [attendanceRecords, setAttendanceRecords] =
    useState({});

  const [showStudentModal, setShowStudentModal] =
    useState(false);

  const showMessage = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  useEffect(() => {
    let active = true;
    const loadAttendanceStudents = async () => {
      try {
        const params = new URLSearchParams({
          subject: attendanceSubject,
          date: attendanceDate,
        });
        const response = await fetch(
          `${ATTENDANCE_STUDENTS_API}?${params.toString()}`,
          { credentials: "include" }
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load attendance students."
          );
        }

        if (active) {
          setStudents(
            data.students.map((record) => {
              const attendance = Number(record.attendance) || 0;
              return {
                ...record,
                branch: record.branch || "Not assigned",
                classes: Number(record.totalClasses) || 0,
                present: Number(record.attendedClasses) || 0,
                attendance,
                status:
                  attendance < 65
                    ? "CRITICAL"
                    : attendance < 75
                    ? "WARNING"
                    : "GOOD",
              };
            })
          );
          setAttendanceError("");
          setAttendanceRecords(
            Object.fromEntries(
              data.students
                .filter((record) => record.todayStatus)
                .map((record) => [
                  record.id,
                  record.todayStatus,
                ])
            )
          );
        }
      } catch (error) {
        if (active) setAttendanceError(error.message);
      } finally {
        if (active) setAttendanceLoading(false);
      }
    };

    loadAttendanceStudents();
    return () => {
      active = false;
    };
  }, [attendanceDate, attendanceRefresh, attendanceSubject]);

  const goTo = (target) => {
    if (onNavigate) {
      onNavigate(target);
    }
  };

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return students;
    }

    return students.filter(
      (student) =>
        student.name
          .toLowerCase()
          .includes(query) ||
        student.id
          .toString()
          .toLowerCase()
          .includes(query) ||
        student.branch
          .toLowerCase()
          .includes(query)
    );
  }, [students, search]);

  /* =====================================================
     ATTENDANCE COUNTS
  ===================================================== */

  const averageAttendance =
    students.length > 0
      ? Math.round(
          students.reduce(
            (sum, student) =>
              sum + student.attendance,
            0
          ) / students.length
        )
      : 0;

  const lowAttendanceStudents =
    students.filter(
      (student) => student.attendance < 75
    );

  const criticalStudents =
    students.filter(
      (student) => student.attendance < 65
    );

  /* =====================================================
     MARK ATTENDANCE
  ===================================================== */

  const toggleAttendance = (
    studentId,
    value
  ) => {
    setAttendanceRecords((previous) => ({
      ...previous,
      [studentId]: value,
    }));
  };

  const saveAttendance = async () => {
    const records = Object.entries(attendanceRecords).map(
      ([studentId, status]) => ({ studentId, status })
    );
    const markedCount = records.length;

    if (!markedCount) {
      showMessage(
        "Please mark attendance before saving."
      );
      return;
    }

    setSavingAttendance(true);
    try {
      const response = await fetch(ATTENDANCE_API, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: attendanceSubject,
          date: attendanceDate,
          records,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save attendance.");
      }
      setAttendanceRefresh((previous) => previous + 1);
      showMessage(data.message);
    } catch (error) {
      showMessage(error.message);
    } finally {
      setSavingAttendance(false);
    }
  };

  /* =====================================================
     CORRECTIONS
  ===================================================== */

  const approveCorrection = (id) => {
    const correction = corrections.find(
      (item) => item.id === id
    );

    if (!correction) return;

    setCorrections((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "APPROVED",
            }
          : item
      )
    );

    setStudents((previous) =>
      previous.map((student) => {
        if (student.id !== correction.studentId) {
          return student;
        }

        const wasAbsent =
          correction.from === "Absent";

        const newPresent = wasAbsent
          ? student.present + 1
          : student.present;

        const newAttendance = Math.round(
          (newPresent / student.classes) *
            100
        );

        return {
          ...student,
          present: newPresent,
          attendance: newAttendance,
          status:
            newAttendance < 65
              ? "CRITICAL"
              : newAttendance < 75
              ? "WARNING"
              : "GOOD",
        };
      })
    );

    showMessage(
      `${correction.student} attendance correction approved.`
    );
  };

  const rejectCorrection = (id) => {
    setCorrections((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "REJECTED",
            }
          : item
      )
    );

    showMessage("Attendance correction rejected.");
  };

  /* =====================================================
     DASHBOARD
  ===================================================== */

  const renderDashboard = () => (
    <>
      <div className="faculty-header">
        <div>
          <span className="faculty-eyebrow">
            TEACHING FACULTY ADMIN
          </span>

          <h1>Teaching Faculty Management</h1>

          <p>
            Manage student attendance, faculty
            schedules, low-attendance cases and
            attendance corrections.
          </p>
        </div>

        <div className="faculty-system-status">
          <span />
          Academic Attendance System Active
        </div>
      </div>

      <div className="faculty-stats">
        <div className="faculty-stat-card">
          <span>Total Students</span>
          <strong>{students.length}</strong>
          <small>Active students</small>
        </div>

        <div className="faculty-stat-card">
          <span>Average Attendance</span>
          <strong>{averageAttendance}%</strong>
          <small>Across current class</small>
        </div>

        <div className="faculty-stat-card warning">
          <span>Low Attendance</span>
          <strong>
            {lowAttendanceStudents.length}
          </strong>
          <small>Below 75%</small>
        </div>

        <div className="faculty-stat-card danger">
          <span>Critical</span>
          <strong>
            {criticalStudents.length}
          </strong>
          <small>Below 65%</small>
        </div>
      </div>

      <div className="faculty-quick-grid">
        <button
          onClick={() =>
            goTo("admin-teaching-attendance")
          }
        >
          <span>📋</span>
          <strong>Mark Attendance</strong>
          <small>
            Record today's student attendance.
          </small>
        </button>

        <button
          onClick={() =>
            goTo("admin-teaching-students")
          }
        >
          <span>👨‍🎓</span>
          <strong>Student Directory</strong>
          <small>
            View student attendance details.
          </small>
        </button>

        <button
          onClick={() =>
            goTo(
              "admin-teaching-low-attendance"
            )
          }
        >
          <span>⚠️</span>
          <strong>Low Attendance</strong>
          <small>
            Identify students below the threshold.
          </small>
        </button>

        <button
          onClick={() =>
            goTo(
              "admin-teaching-corrections"
            )
          }
        >
          <span>✏️</span>
          <strong>Corrections</strong>
          <small>
            Review attendance correction requests.
          </small>
        </button>
      </div>

      <div className="faculty-two-column">
        <section className="faculty-panel">
          <div className="faculty-panel-header">
            <div>
              <h2>Today's Classes</h2>
              <p>
                Faculty classes scheduled for today.
              </p>
            </div>

            <button
              onClick={() =>
                goTo(
                  "admin-teaching-schedule"
                )
              }
            >
              View Schedule
            </button>
          </div>

          <div className="faculty-class-list">
            {classes.map((item) => (
              <button
                className="faculty-class-item"
                key={item.id}
                onClick={() =>
                  setSelectedClass(item)
                }
              >
                <div className="faculty-class-time">
                  {item.time}
                </div>

                <div>
                  <strong>
                    {item.subject}
                  </strong>

                  <small>
                    {item.section} •{" "}
                    {item.room}
                  </small>
                </div>

                <span>
                  {item.present}/{item.total}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="faculty-panel">
          <div className="faculty-panel-header">
            <div>
              <h2>Low Attendance</h2>
              <p>
                Students requiring attention.
              </p>
            </div>

            <button
              onClick={() =>
                goTo(
                  "admin-teaching-low-attendance"
                )
              }
            >
              View All
            </button>
          </div>

          <div className="faculty-low-list">
            {lowAttendanceStudents
              .slice(0, 4)
              .map((student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedStudent(
                      student
                    );
                    setShowStudentModal(true);
                  }}
                >
                  <div>
                    <strong>
                      {student.name}
                    </strong>

                    <small>
                      {student.id} •{" "}
                      {student.branch}
                    </small>
                  </div>

                  <span
                    className={`faculty-attendance-value ${statusClass(
                      student.status
                    )}`}
                  >
                    {student.attendance}%
                  </span>
                </button>
              ))}
          </div>
        </section>
      </div>
    </>
  );

  /* =====================================================
     STUDENT DIRECTORY
  ===================================================== */

  const renderStudents = () => (
    <>
      <div className="faculty-header">
        <div>
          <span className="faculty-eyebrow">
            TEACHING FACULTY / STUDENTS
          </span>

          <h1>Student Directory</h1>

          <p>
            Search students and view their complete
            attendance information.
          </p>
        </div>
      </div>

      <section className="faculty-panel">
        <div className="faculty-toolbar">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search student name, ID or branch..."
          />

          <span>
            {filteredStudents.length} students
          </span>
        </div>

        <div className="faculty-table-wrap">
          <table className="faculty-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>BRANCH</th>
                <th>SEMESTER</th>
                <th>CLASSES</th>
                <th>PRESENT</th>
                <th>ATTENDANCE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map(
                (student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>
                        {student.name}
                      </strong>
                      <small>
                        {student.id}
                      </small>
                    </td>

                    <td>
                      {student.branch}
                    </td>

                    <td>
                      {student.semester}
                    </td>

                    <td>
                      {student.classes}
                    </td>

                    <td>
                      {student.present}
                    </td>

                    <td>
                      <strong>
                        {student.attendance}%
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`faculty-status ${statusClass(
                          student.status
                        )}`}
                      >
                        {student.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="faculty-small-btn"
                        onClick={() => {
                          setSelectedStudent(
                            student
                          );
                          setShowStudentModal(
                            true
                          );
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  /* =====================================================
     ATTENDANCE
  ===================================================== */

  const renderAttendance = () => (
    <>
      <div className="faculty-header">
        <div>
          <span className="faculty-eyebrow">
            TEACHING FACULTY / ATTENDANCE
          </span>

          <h1>Attendance Management</h1>

          <p>
            Mark and save attendance for the selected
            class and date.
          </p>
        </div>

        <button
          className="faculty-primary-btn"
          onClick={saveAttendance}
          disabled={savingAttendance || attendanceLoading}
        >
          {savingAttendance ? "Saving..." : "Save Attendance"}
        </button>
      </div>

      <section className="faculty-panel">
        <div className="attendance-controls">
          <label>
            Subject
            <input
              type="text"
              value={attendanceSubject}
              maxLength={150}
              onChange={(event) => {
                setAttendanceLoading(true);
                setAttendanceSubject(event.target.value);
              }}
            />
          </label>

          <label>
            Date
            <input
              type="date"
              value={attendanceDate}
              onChange={(event) => {
                setAttendanceLoading(true);
                setAttendanceDate(
                  event.target.value
                );
              }}
            />
          </label>
        </div>

        <div className="attendance-info">
          <span>
            {Object.keys(attendanceRecords).length}{" "}
            students marked
          </span>

          <span>
            Date: {attendanceDate}
          </span>
        </div>

        <div className="faculty-table-wrap">
          <table className="faculty-table attendance-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>ATTENDANCE</th>
                <th>TODAY</th>
              </tr>
            </thead>

            <tbody>
              {attendanceError ? (
                <tr>
                  <td colSpan="3">{attendanceError}</td>
                </tr>
              ) : attendanceLoading ? (
                <tr>
                  <td colSpan="3">Loading students...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="3">No students are registered yet.</td>
                </tr>
              ) : students.map((student) => {
                const value =
                  attendanceRecords[
                    student.id
                  ];

                return (
                  <tr key={student.id}>
                    <td>
                      <strong>
                        {student.name}
                      </strong>

                      <small>
                        {student.id}
                      </small>
                    </td>

                    <td>
                      {student.attendance}%
                    </td>

                    <td>
                      <div className="attendance-buttons">
                        <button
                          className={
                            value ===
                            "PRESENT"
                              ? "selected present"
                              : ""
                          }
                          onClick={() =>
                            toggleAttendance(
                              student.id,
                              "PRESENT"
                            )
                          }
                        >
                          Present
                        </button>

                        <button
                          className={
                            value === "ABSENT"
                              ? "selected absent"
                              : ""
                          }
                          onClick={() =>
                            toggleAttendance(
                              student.id,
                              "ABSENT"
                            )
                          }
                        >
                          Absent
                        </button>

                        <button
                          className={
                            value === "LATE"
                              ? "selected present"
                              : ""
                          }
                          onClick={() =>
                            toggleAttendance(student.id, "LATE")
                          }
                        >
                          Late
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  /* =====================================================
     REPORTS
  ===================================================== */

  const renderReports = () => (
    <>
      <div className="faculty-header">
        <div>
          <span className="faculty-eyebrow">
            TEACHING FACULTY / REPORTS
          </span>

          <h1>Attendance Reports</h1>

          <p>
            Review attendance performance across
            students and classes.
          </p>
        </div>

        <button
          className="faculty-primary-btn"
          onClick={() =>
            showMessage(
              "Attendance report generated successfully."
            )
          }
        >
          Generate Report
        </button>
      </div>

      <div className="faculty-report-grid">
        <div>
          <span>Average Attendance</span>
          <strong>
            {averageAttendance}%
          </strong>
        </div>

        <div>
          <span>Students Above 75%</span>
          <strong>
            {
              students.filter(
                (item) =>
                  item.attendance >= 75
              ).length
            }
          </strong>
        </div>

        <div>
          <span>Below 75%</span>
          <strong>
            {lowAttendanceStudents.length}
          </strong>
        </div>

        <div>
          <span>Critical</span>
          <strong>
            {criticalStudents.length}
          </strong>
        </div>
      </div>

      <section className="faculty-panel">
        <div className="faculty-panel-header">
          <div>
            <h2>Attendance Overview</h2>
            <p>
              Student-wise attendance performance.
            </p>
          </div>
        </div>

        <div className="faculty-table-wrap">
          <table className="faculty-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>CLASSES</th>
                <th>PRESENT</th>
                <th>ATTENDANCE</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>
                    <strong>
                      {student.name}
                    </strong>

                    <small>
                      {student.id}
                    </small>
                  </td>

                  <td>{student.classes}</td>

                  <td>{student.present}</td>

                  <td>
                    {student.attendance}%
                  </td>

                  <td>
                    <span
                      className={`faculty-status ${statusClass(
                        student.status
                      )}`}
                    >
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  /* =====================================================
     LOW ATTENDANCE
  ===================================================== */

  const renderLowAttendance = () => (
    <>
      <div className="faculty-header">
        <div>
          <span className="faculty-eyebrow">
            TEACHING FACULTY / LOW ATTENDANCE
          </span>

          <h1>Low Attendance Students</h1>

          <p>
            Students below the 75% attendance
            requirement.
          </p>
        </div>

        <button
          className="faculty-primary-btn"
          onClick={() =>
            showMessage(
              "Attendance warning notifications prepared."
            )
          }
        >
          Notify Students
        </button>
      </div>

      <section className="faculty-panel">
        <div className="faculty-warning-banner">
          <strong>
            {lowAttendanceStudents.length} students
            require attention
          </strong>

          <span>
            Students below 65% are marked critical.
          </span>
        </div>

        <div className="faculty-table-wrap">
          <table className="faculty-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>BRANCH</th>
                <th>CLASSES</th>
                <th>PRESENT</th>
                <th>ATTENDANCE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {lowAttendanceStudents.map(
                (student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>
                        {student.name}
                      </strong>

                      <small>
                        {student.id}
                      </small>
                    </td>

                    <td>{student.branch}</td>

                    <td>{student.classes}</td>

                    <td>{student.present}</td>

                    <td>
                      <strong>
                        {student.attendance}%
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`faculty-status ${statusClass(
                          student.status
                        )}`}
                      >
                        {student.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="faculty-small-btn"
                        onClick={() => {
                          setSelectedStudent(
                            student
                          );
                          setShowStudentModal(
                            true
                          );
                        }}
                      >
                        View Student
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  /* =====================================================
     FACULTY SCHEDULE
  ===================================================== */

  const renderSchedule = () => (
    <>
      <div className="faculty-header">
        <div>
          <span className="faculty-eyebrow">
            TEACHING FACULTY / SCHEDULE
          </span>

          <h1>Faculty Schedule</h1>

          <p>
            View teaching schedules, rooms and assigned
            sections.
          </p>
        </div>

        <button
          className="faculty-primary-btn"
          onClick={() =>
            showMessage(
              "Schedule sync completed."
            )
          }
        >
          Sync Schedule
        </button>
      </div>

      <section className="faculty-panel">
        <div className="faculty-schedule-list">
          {FACULTY_SCHEDULE.map((item, index) => (
            <div
              className="faculty-schedule-item"
              key={index}
            >
              <div className="schedule-day">
                {item.day}
              </div>

              <div className="schedule-time">
                {item.time}
              </div>

              <div className="schedule-subject">
                <strong>
                  {item.subject}
                </strong>

                <small>
                  {item.section}
                </small>
              </div>

              <div className="schedule-room">
                Room {item.room}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  /* =====================================================
     CORRECTIONS
  ===================================================== */

  const renderCorrections = () => (
    <>
      <div className="faculty-header">
        <div>
          <span className="faculty-eyebrow">
            TEACHING FACULTY / CORRECTIONS
          </span>

          <h1>Attendance Corrections</h1>

          <p>
            Review and approve student attendance
            correction requests.
          </p>
        </div>
      </div>

      <section className="faculty-panel">
        {corrections.length === 0 ? (
          <div className="faculty-empty">
            <span>✓</span>
            <h3>No correction requests</h3>
            <p>
              There are no pending attendance
              corrections.
            </p>
          </div>
        ) : (
          <div className="correction-list">
            {corrections.map((item) => (
              <div
                className="correction-card"
                key={item.id}
              >
                <div>
                  <span className="correction-id">
                    {item.id}
                  </span>

                  <h3>{item.student}</h3>

                  <p>
                    {item.studentId} •{" "}
                    {item.subject} •{" "}
                    {item.date}
                  </p>

                  <div className="correction-change">
                    <span>{item.from}</span>
                    <b>→</b>
                    <strong>{item.to}</strong>
                  </div>

                  <small>
                    Reason: {item.reason}
                  </small>
                </div>

                <div className="correction-actions">
                  <span
                    className={`faculty-status ${statusClass(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>

                  {item.status ===
                    "PENDING" && (
                    <>
                      <button
                        className="faculty-approve-btn"
                        onClick={() =>
                          approveCorrection(
                            item.id
                          )
                        }
                      >
                        Approve
                      </button>

                      <button
                        className="faculty-reject-btn"
                        onClick={() =>
                          rejectCorrection(
                            item.id
                          )
                        }
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );

  /* =====================================================
     MODULE ROUTER
  ===================================================== */

  const renderModule = () => {
    switch (module) {
      case "students":
        return renderStudents();

      case "attendance":
        return renderAttendance();

      case "reports":
        return renderReports();

      case "low-attendance":
        return renderLowAttendance();

      case "schedule":
        return renderSchedule();

      case "corrections":
        return renderCorrections();

      case "dashboard":
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="teaching-faculty-page">
      {renderModule()}

      {/* =================================================
          STUDENT DETAILS
      ================================================= */}

      {showStudentModal &&
        selectedStudent && (
          <div
            className="faculty-modal-overlay"
            onClick={() =>
              setShowStudentModal(false)
            }
          >
            <div
              className="faculty-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="faculty-modal-header">
                <div>
                  <span>
                    STUDENT ATTENDANCE PROFILE
                  </span>

                  <h2>
                    {selectedStudent.name}
                  </h2>

                  <p>
                    {selectedStudent.id} •{" "}
                    {selectedStudent.branch}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowStudentModal(false)
                  }
                >
                  ×
                </button>
              </div>

              <div className="student-detail-grid">
                <div>
                  <span>Student ID</span>
                  <strong>
                    {selectedStudent.id}
                  </strong>
                </div>

                <div>
                  <span>Branch</span>
                  <strong>
                    {selectedStudent.branch}
                  </strong>
                </div>

                <div>
                  <span>Semester</span>
                  <strong>
                    {selectedStudent.semester}
                  </strong>
                </div>

                <div>
                  <span>Total Classes</span>
                  <strong>
                    {selectedStudent.classes}
                  </strong>
                </div>

                <div>
                  <span>Present</span>
                  <strong>
                    {selectedStudent.present}
                  </strong>
                </div>

                <div>
                  <span>Attendance</span>
                  <strong>
                    {selectedStudent.attendance}%
                  </strong>
                </div>
              </div>

              <div className="student-attendance-meter">
                <div>
                  <span>
                    Attendance Percentage
                  </span>

                  <strong>
                    {selectedStudent.attendance}%
                  </strong>
                </div>

                <div className="meter-track">
                  <div
                    style={{
                      width: `${Math.min(
                        selectedStudent.attendance,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <button
                className="faculty-primary-btn full"
                onClick={() => {
                  setShowStudentModal(false);
                  goTo(
                    "admin-teaching-attendance"
                  );
                }}
              >
                Open Attendance
              </button>
            </div>
          </div>
        )}

      {/* =================================================
          CLASS DETAILS
      ================================================= */}

      {selectedClass && (
        <div
          className="faculty-modal-overlay"
          onClick={() =>
            setSelectedClass(null)
          }
        >
          <div
            className="faculty-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="faculty-modal-header">
              <div>
                <span>CLASS DETAILS</span>

                <h2>
                  {selectedClass.subject}
                </h2>

                <p>
                  {selectedClass.section} •{" "}
                  {selectedClass.room}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedClass(null)
                }
              >
                ×
              </button>
            </div>

            <div className="student-detail-grid">
              <div>
                <span>Faculty</span>
                <strong>
                  {selectedClass.faculty}
                </strong>
              </div>

              <div>
                <span>Time</span>
                <strong>
                  {selectedClass.time}
                </strong>
              </div>

              <div>
                <span>Room</span>
                <strong>
                  {selectedClass.room}
                </strong>
              </div>

              <div>
                <span>Total Students</span>
                <strong>
                  {selectedClass.total}
                </strong>
              </div>

              <div>
                <span>Present</span>
                <strong>
                  {selectedClass.present}
                </strong>
              </div>

              <div>
                <span>Attendance</span>
                <strong>
                  {Math.round(
                    (selectedClass.present /
                      selectedClass.total) *
                      100
                  )}
                  %
                </strong>
              </div>
            </div>

            <button
              className="faculty-primary-btn full"
              onClick={() => {
                setSelectedClass(null);
                goTo(
                  "admin-teaching-attendance"
                );
              }}
            >
              Mark Attendance
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="faculty-toast">
          <span>✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}