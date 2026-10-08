import React, { useEffect, useState } from "react";
import "./AcademicsAdmin.css";

const ASSIGNMENTS_ADMIN_API = `${
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
}/api/admin/assignments`;

/* =========================================================
   INITIAL DATA
========================================================= */

const INITIAL_TIMETABLE = [
  {
    id: 1,
    time: "10:45 AM – 11:45 AM",
    subject: "Database Management",
    faculty: "Dr. S. Mohanty",
    room: "Room 204",
    branch: "CSE 5A",
    semester: "5th",
    status: "ONGOING",
  },
  {
    id: 2,
    time: "12:00 PM – 1:00 PM",
    subject: "Operating Systems",
    faculty: "Prof. R. Das",
    room: "Room 301",
    branch: "CSE 5B",
    semester: "5th",
    status: "UPCOMING",
  },
  {
    id: 3,
    time: "2:15 PM – 3:15 PM",
    subject: "Computer Networks",
    faculty: "Dr. P. Mishra",
    room: "Lab 2",
    branch: "CSE 5A",
    semester: "5th",
    status: "UPCOMING",
  },
  {
    id: 4,
    time: "3:30 PM – 4:30 PM",
    subject: "Artificial Intelligence",
    faculty: "Prof. A. Dash",
    room: "Room 205",
    branch: "CSE 5B",
    semester: "5th",
    status: "UPCOMING",
  },
];

const INITIAL_MATERIALS = [
  {
    id: 1,
    subject: "Database Management",
    type: "Lecture Notes",
    count: 24,
    updated: "Today",
    semester: "5th",
    branch: "CSE",
  },
  {
    id: 2,
    subject: "Operating Systems",
    type: "Study Materials",
    count: 31,
    updated: "Yesterday",
    semester: "5th",
    branch: "CSE",
  },
  {
    id: 3,
    subject: "Computer Networks",
    type: "PYQs",
    count: 28,
    updated: "2 days ago",
    semester: "5th",
    branch: "CSE",
  },
  {
    id: 4,
    subject: "Artificial Intelligence",
    type: "Lecture Notes",
    count: 19,
    updated: "3 days ago",
    semester: "5th",
    branch: "CSE",
  },
];

const INITIAL_RESULTS = [
  {
    id: 1,
    exam: "Internal Assessment - I",
    branch: "CSE",
    semester: "5th",
    students: 96,
    published: "08 Oct 2026",
    status: "PUBLISHED",
  },
  {
    id: 2,
    exam: "Mid Semester Examination",
    branch: "CSE",
    semester: "3rd",
    students: 84,
    published: "06 Oct 2026",
    status: "PUBLISHED",
  },
  {
    id: 3,
    exam: "Internal Assessment - II",
    branch: "ECE",
    semester: "3rd",
    students: 72,
    published: "Pending",
    status: "PROCESSING",
  },
];

const INITIAL_ALERTS = [
  {
    id: 1,
    title: "Timetable Change",
    message:
      "Computer Networks class moved from Room 204 to Lab 2.",
    type: "SCHEDULE",
    time: "15 min ago",
  },
  {
    id: 2,
    title: "Assignment Deadline",
    message:
      "DBMS assignment deadline is approaching.",
    type: "ACADEMIC",
    time: "1 hour ago",
  },
  {
    id: 3,
    title: "Result Publication",
    message:
      "Internal Assessment-I results have been published.",
    type: "RESULT",
    time: "2 hours ago",
  },
];

const INITIAL_NOTICES = [
  {
    id: 1,
    title: "Internal Assessment Schedule",
    message:
      "IA-II examination schedule published for CSE students.",
    target: "All Branches",
    semester: "All",
    time: "Today",
  },
  {
    id: 2,
    title: "Result Publication Notice",
    message:
      "Internal Assessment-I results are now available.",
    target: "CSE",
    semester: "5th",
    time: "Yesterday",
  },
  {
    id: 3,
    title: "Timetable Update",
    message:
      "Computer Networks class schedule has been updated.",
    target: "CSE",
    semester: "5th",
    time: "2 days ago",
  },
];

/* =========================================================
   SMALL REUSABLE MODAL
========================================================= */

function FormModal({
  open,
  title,
  subtitle,
  children,
  onClose,
  onSubmit,
  submitText = "Save",
}) {
  if (!open) return null;

  return (
    <div
      className="academics-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="academics-modal">

        <div className="academics-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <button
            type="button"
            className="academics-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form
          className="academics-modal-form"
          onSubmit={onSubmit}
        >
          {children}

          <div className="academics-modal-actions">
            <button
              type="button"
              className="academics-secondary-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="academics-primary-btn"
            >
              {submitText}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AcademicsAdmin({
  module = "dashboard",
  onSuspension,
}) {
  const [activeModule, setActiveModule] = useState(module);

  const [timetable, setTimetable] =
    useState(INITIAL_TIMETABLE);

  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState("");

  const [materials, setMaterials] =
    useState(INITIAL_MATERIALS);

  const [results, setResults] =
    useState(INITIAL_RESULTS);

  const [alerts, setAlerts] =
    useState(INITIAL_ALERTS);

  const [notices, setNotices] =
    useState(INITIAL_NOTICES);

  const [modal, setModal] = useState(null);

  /* =========================================================
     FORM STATES
  ========================================================= */

  const [classForm, setClassForm] = useState({
    subject: "",
    faculty: "",
    room: "",
    branch: "CSE",
    semester: "5th",
    startTime: "",
    endTime: "",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    subject: "",
    branch: "CSE",
    semester: "5th",
    due: "",
    description: "",
  });

  const [materialForm, setMaterialForm] = useState({
    title: "",
    subject: "",
    branch: "CSE",
    semester: "5th",
    type: "Lecture Notes",
    description: "",
    file: null,
  });

  const [resultForm, setResultForm] = useState({
    exam: "",
    branch: "CSE",
    semester: "5th",
    students: "",
    file: null,
  });

  const [alertForm, setAlertForm] = useState({
    title: "",
    message: "",
    type: "ACADEMIC",
  });

  const [noticeForm, setNoticeForm] = useState({
    title: "",
    message: "",
    target: "All Branches",
    branch: "CSE",
    semester: "All",
  });

  useEffect(() => {
    setActiveModule(module);
  }, [module]);

  useEffect(() => {
    let active = true;
    fetch(ASSIGNMENTS_ADMIN_API, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load assignments.");
        }
        return data.assignments;
      })
      .then((data) => {
        if (active) {
          setAssignments(data);
          setAssignmentsError("");
        }
      })
      .catch((error) => {
        if (active) setAssignmentsError(error.message);
      })
      .finally(() => {
        if (active) setAssignmentsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  const closeModal = () => {
    setModal(null);
  };

  const openModal = (type) => {
    setModal(type);
  };

  const resetClassForm = () => {
    setClassForm({
      subject: "",
      faculty: "",
      room: "",
      branch: "CSE",
      semester: "5th",
      startTime: "",
      endTime: "",
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      title: "",
      subject: "",
      branch: "CSE",
      semester: "5th",
      due: "",
      description: "",
    });
  };

  const resetMaterialForm = () => {
    setMaterialForm({
      title: "",
      subject: "",
      branch: "CSE",
      semester: "5th",
      type: "Lecture Notes",
      description: "",
      file: null,
    });
  };

  const resetResultForm = () => {
    setResultForm({
      exam: "",
      branch: "CSE",
      semester: "5th",
      students: "",
      file: null,
    });
  };

  const resetAlertForm = () => {
    setAlertForm({
      title: "",
      message: "",
      type: "ACADEMIC",
    });
  };

  const resetNoticeForm = () => {
    setNoticeForm({
      title: "",
      message: "",
      target: "All Branches",
      branch: "CSE",
      semester: "All",
    });
  };

  /* =========================================================
     ADD CLASS
  ========================================================= */

  const handleAddClass = (e) => {
    e.preventDefault();

    if (
      !classForm.subject.trim() ||
      !classForm.faculty.trim() ||
      !classForm.room.trim() ||
      !classForm.startTime ||
      !classForm.endTime
    ) {
      alert("Please fill all required class details.");
      return;
    }

    const newClass = {
      id: Date.now(),
      time: `${classForm.startTime} – ${classForm.endTime}`,
      subject: classForm.subject.trim(),
      faculty: classForm.faculty.trim(),
      room: classForm.room.trim(),
      branch: classForm.branch,
      semester: classForm.semester,
      status: "UPCOMING",
    };

    setTimetable((previous) => [
      ...previous,
      newClass,
    ]);

    closeModal();
    resetClassForm();
  };

  /* =========================================================
     SUSPEND CLASS
  ========================================================= */

  const handleSuspendClass = (item) => {
    const confirmed = window.confirm(
      `Suspend ${item.subject} class?\n\n${item.time}\n${item.branch}`
    );

    if (!confirmed) return;

    setTimetable((previous) =>
      previous.map((classItem) =>
        classItem.id === item.id
          ? {
              ...classItem,
              status: "SUSPENDED",
            }
          : classItem
      )
    );

    onSuspension?.({
      title: `${item.subject} Class Suspended`,
      text: `${item.subject} (${item.branch}) scheduled at ${item.time} has been suspended.`,
    });
  };

  /* =========================================================
     CREATE ASSIGNMENT
  ========================================================= */

  const handleCreateAssignment = async (e) => {
    e.preventDefault();

    if (
      !assignmentForm.title.trim() ||
      !assignmentForm.subject.trim() ||
      !assignmentForm.due
    ) {
      alert(
        "Please enter assignment title, subject and due date."
      );
      return;
    }

    try {
      const response = await fetch(ASSIGNMENTS_ADMIN_API, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...assignmentForm,
          title: assignmentForm.title.trim(),
          subject: assignmentForm.subject.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create assignment.");
      }
      setAssignments((previous) => [data.assignment, ...previous]);
      closeModal();
      resetAssignmentForm();
    } catch (error) {
      alert(error.message);
    }
  };

  /* =========================================================
     UPLOAD MATERIAL
  ========================================================= */

  const handleUploadMaterial = (e) => {
    e.preventDefault();

    if (
      !materialForm.title.trim() ||
      !materialForm.subject.trim()
    ) {
      alert("Please enter material title and subject.");
      return;
    }

    const newMaterial = {
      id: Date.now(),
      subject: materialForm.subject.trim(),
      type: materialForm.type,
      count: 1,
      updated: "Just now",
      semester: materialForm.semester,
      branch: materialForm.branch,
      title: materialForm.title.trim(),
      fileName: materialForm.file?.name || "No file selected",
    };

    setMaterials((previous) => [
      newMaterial,
      ...previous,
    ]);

    closeModal();
    resetMaterialForm();
  };

  /* =========================================================
     UPLOAD RESULTS
  ========================================================= */

  const handleUploadResults = (e) => {
    e.preventDefault();

    if (
      !resultForm.exam.trim() ||
      !resultForm.students
    ) {
      alert(
        "Please enter examination name and student count."
      );
      return;
    }

    const newResult = {
      id: Date.now(),
      exam: resultForm.exam.trim(),
      branch: resultForm.branch,
      semester: resultForm.semester,
      students: Number(resultForm.students),
      published: "Just now",
      status: "PUBLISHED",
    };

    setResults((previous) => [
      newResult,
      ...previous,
    ]);

    closeModal();
    resetResultForm();
  };

  /* =========================================================
     CREATE ALERT
  ========================================================= */

  const handleCreateAlert = (e) => {
    e.preventDefault();

    if (
      !alertForm.title.trim() ||
      !alertForm.message.trim()
    ) {
      alert("Please enter alert title and message.");
      return;
    }

    const newAlert = {
      id: Date.now(),
      title: alertForm.title.trim(),
      message: alertForm.message.trim(),
      type: alertForm.type,
      time: "Just now",
    };

    setAlerts((previous) => [
      newAlert,
      ...previous,
    ]);

    closeModal();
    resetAlertForm();
  };

  /* =========================================================
     CREATE NOTICE
  ========================================================= */

  const handleCreateNotice = (e) => {
    e.preventDefault();

    if (
      !noticeForm.title.trim() ||
      !noticeForm.message.trim()
    ) {
      alert("Please enter notice title and message.");
      return;
    }

    const target =
      noticeForm.target === "All Branches"
        ? "All Branches"
        : noticeForm.branch;

    const newNotice = {
      id: Date.now(),
      title: noticeForm.title.trim(),
      message: noticeForm.message.trim(),
      target,
      semester: noticeForm.semester,
      time: "Just now",
    };

    setNotices((previous) => [
      newNotice,
      ...previous,
    ]);

    closeModal();
    resetNoticeForm();
  };

  /* =========================================================
     DASHBOARD
  ========================================================= */

  const renderDashboard = () => (
    <>
      <div className="academics-admin-header">
        <div>
          <span className="academics-admin-eyebrow">
            ACADEMICS ADMIN
          </span>

          <h1>Academics Management</h1>

          <p>
            Manage academic schedules, assignments, study
            materials and student results.
          </p>
        </div>

        <div className="academics-admin-status">
          <span></span>
          Academic System Active
        </div>
      </div>

      <div className="academics-admin-stats">

        <div className="academics-stat-card">
          <span>Today's Classes</span>
          <strong>{timetable.length}</strong>
          <small>Across all departments</small>
        </div>

        <div className="academics-stat-card">
          <span>Pending Assignments</span>
          <strong>{assignments.length}</strong>
          <small>Currently active</small>
        </div>

        <div className="academics-stat-card">
          <span>Study Materials</span>
          <strong>
            {materials.reduce(
              (sum, item) => sum + Number(item.count || 0),
              0
            )}
          </strong>
          <small>Available resources</small>
        </div>

        <div className="academics-stat-card">
          <span>Schedule Changes</span>
          <strong>
            {
              timetable.filter(
                (item) => item.status === "SUSPENDED"
              ).length
            }
          </strong>
          <small>Requires attention</small>
        </div>

      </div>

      <div className="academics-module-grid">

        <button
          className="academics-module-card"
          onClick={() => setActiveModule("timetable")}
        >
          <span className="academics-module-icon blue">
            📅
          </span>

          <div>
            <strong>Timetable Management</strong>
            <p>
              Manage class schedules, rooms and faculty
              assignments.
            </p>
          </div>

          <span className="academics-module-arrow">
            →
          </span>
        </button>

        <button
          className="academics-module-card"
          onClick={() => setActiveModule("assignments")}
        >
          <span className="academics-module-icon purple">
            📝
          </span>

          <div>
            <strong>Assignments</strong>
            <p>
              Track assignments, deadlines and student
              submissions.
            </p>
          </div>

          <span className="academics-module-arrow">
            →
          </span>
        </button>

        <button
          className="academics-module-card"
          onClick={() => setActiveModule("materials")}
        >
          <span className="academics-module-icon green">
            📚
          </span>

          <div>
            <strong>Study Materials & PYQs</strong>
            <p>
              Manage notes, study materials and previous
              year questions.
            </p>
          </div>

          <span className="academics-module-arrow">
            →
          </span>
        </button>

        <button
          className="academics-module-card"
          onClick={() => setActiveModule("results")}
        >
          <span className="academics-module-icon orange">
            🎓
          </span>

          <div>
            <strong>Results</strong>
            <p>
              Manage examination results and publication
              status.
            </p>
          </div>

          <span className="academics-module-arrow">
            →
          </span>
        </button>

      </div>

      <section className="academics-admin-card">

        <div className="academics-card-header">
          <div>
            <h2>Academic Alerts</h2>
            <p>
              Important academic events requiring attention.
            </p>
          </div>

          <button
            onClick={() => setActiveModule("alerts")}
          >
            View All →
          </button>
        </div>

        <div className="academics-alert-list">

          {alerts.map((alert) => (
            <div key={alert.id}>

              <span className="academics-alert-icon">
                {alert.type === "SCHEDULE"
                  ? "📅"
                  : alert.type === "RESULT"
                  ? "🎓"
                  : "📝"}
              </span>

              <div>
                <strong>{alert.title}</strong>
                <small>{alert.message}</small>
              </div>

              <span className="academics-alert-time">
                {alert.time}
              </span>

            </div>
          ))}

        </div>

      </section>
    </>
  );

  /* =========================================================
     TIMETABLE
  ========================================================= */

  const renderTimetable = () => (
    <div className="academics-module-page">

      <div className="academics-page-header">

        <div>
          <span>ACADEMICS / TIMETABLE</span>

          <h1>Timetable Management</h1>

          <p>
            Manage today's classes, rooms, faculty and
            schedule changes.
          </p>
        </div>

        <button
          className="academics-primary-btn"
          onClick={() => openModal("class")}
        >
          + Add Class
        </button>

      </div>

      <div className="academics-filter-row">

        <select>
          <option>Today</option>
          <option>Tomorrow</option>
          <option>This Week</option>
        </select>

        <select>
          <option>All Branches</option>
          <option>CSE</option>
          <option>ECE</option>
          <option>EEE</option>
        </select>

        <select>
          <option>All Semesters</option>
          <option>3rd Semester</option>
          <option>5th Semester</option>
        </select>

      </div>

      <section className="academics-admin-card">

        <div className="academics-card-header">

          <div>
            <h2>Today's Schedule</h2>
            <p>Current academic timetable.</p>
          </div>

          <span className="academics-live-badge">
            LIVE
          </span>

        </div>

        <div className="academics-timetable-list">

          {timetable.map((item) => (
            <div
              className="academics-timetable-row"
              key={item.id}
            >

              <div className="academics-time">
                {item.time}
              </div>

              <div className="academics-subject">
                <strong>{item.subject}</strong>

                <small>
                  {item.branch} • {item.faculty}
                </small>
              </div>

              <div className="academics-room">
                {item.room}
              </div>

              <span
                className={
                  item.status === "ONGOING"
                    ? "academics-status-live"
                    : item.status === "SUSPENDED"
                    ? "academics-status-suspended"
                    : "academics-status-upcoming"
                }
              >
                {item.status}
              </span>

              {item.status !== "SUSPENDED" ? (
                <button
                  className="academics-suspend-btn"
                  onClick={() =>
                    handleSuspendClass(item)
                  }
                >
                  Suspend Class
                </button>
              ) : (
                <span className="academics-suspended-label">
                  Class Suspended
                </span>
              )}

            </div>
          ))}

        </div>

      </section>

      <section className="academics-admin-card">

        <div className="academics-card-header">

          <div>
            <h2>Schedule Changes</h2>
            <p>
              Recent timetable modifications.
            </p>
          </div>

        </div>

        <div className="academics-change-list">

          <div>
            <strong>Computer Networks</strong>

            <small>
              Room 204 → Lab 2 • CSE 5A
            </small>

            <span>Today</span>
          </div>

          <div>
            <strong>Operating Systems</strong>

            <small>
              Class postponed to 3:30 PM • CSE 5B
            </small>

            <span>Today</span>
          </div>

        </div>

      </section>

    </div>
  );

  /* =========================================================
     ASSIGNMENTS
  ========================================================= */

  const renderAssignments = () => (
    <div className="academics-module-page">

      <div className="academics-page-header">

        <div>
          <span>ACADEMICS / ASSIGNMENTS</span>

          <h1>Assignment Management</h1>

          <p>
            Create, monitor and manage academic assignments.
          </p>
        </div>

        <button
          className="academics-primary-btn"
          onClick={() => openModal("assignment")}
        >
          + Create Assignment
        </button>

      </div>

      <div className="academics-admin-stats">

        <div className="academics-stat-card">
          <span>Active Assignments</span>
          <strong>{assignments.length}</strong>
          <small>Currently running</small>
        </div>

        <div className="academics-stat-card">
          <span>Submissions</span>
          <strong>89%</strong>
          <small>Average submission rate</small>
        </div>

        <div className="academics-stat-card">
          <span>Due This Week</span>
          <strong>6</strong>
          <small>Upcoming deadlines</small>
        </div>

        <div className="academics-stat-card">
          <span>Overdue</span>
          <strong>3</strong>
          <small>Require attention</small>
        </div>

      </div>

      <section className="academics-admin-card">

        <div className="academics-card-header">
          <div>
            <h2>Active Assignments</h2>
            <p>
              Current assignments across academic departments.
            </p>
          </div>
        </div>

        <div className="academics-assignment-list">
          {assignmentsError ? (
            <p role="alert">{assignmentsError}</p>
          ) : assignmentsLoading ? (
            <p>Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p>No assignments have been published.</p>
          ) : assignments.map((assignment) => (
            <div key={assignment.id}>

              <div>
                <strong>{assignment.title}</strong>

                <small>
                  {assignment.subject} •{" "}
                  {assignment.branch} •{" "}
                  {assignment.semester}
                </small>
              </div>

              <span>
                Due {assignment.due}
              </span>

              <span>
                Reminders scheduled
              </span>

              <b>ACTIVE</b>

            </div>
          ))}

        </div>

      </section>

    </div>
  );

  /* =========================================================
     STUDY MATERIALS + PYQs
  ========================================================= */

  const renderMaterials = () => (
    <div className="academics-module-page">

      <div className="academics-page-header">

        <div>
          <span>
            ACADEMICS / STUDY MATERIALS
          </span>

          <h1>Study Materials & PYQs</h1>

          <p>
            Organize academic resources semester-wise,
            subject-wise and material-wise.
          </p>
        </div>

        <button
          className="academics-primary-btn"
          onClick={() => openModal("material")}
        >
          + Upload Material
        </button>

      </div>

      <div className="academics-material-grid">

        {materials.map((material) => (
          <div
            className="academics-material-card"
            key={material.id}
          >

            <span>
              {material.type === "PYQs"
                ? "📝"
                : material.type === "Question Bank"
                ? "📑"
                : material.type === "Syllabus / Academic Document"
                ? "📄"
                : "📚"}
            </span>

            <h3>{material.subject}</h3>

            <p>{material.type}</p>

            <strong>
              {material.count} resources
            </strong>

            <small>
              {material.semester} Semester •{" "}
              {material.branch}
            </small>

            <small>
              Updated {material.updated}
            </small>

            <button
              onClick={() =>
                alert(
                  `${material.type} resources for ${material.subject}`
                )
              }
            >
              Manage →
            </button>

          </div>
        ))}

      </div>

    </div>
  );

  /* =========================================================
     RESULTS
  ========================================================= */

  const renderResults = () => (
    <div className="academics-module-page">

      <div className="academics-page-header">

        <div>
          <span>ACADEMICS / RESULTS</span>

          <h1>Results Management</h1>

          <p>
            Review examination results and publication status.
          </p>
        </div>

        <button
          className="academics-primary-btn"
          onClick={() => openModal("result")}
        >
          + Upload Results
        </button>

      </div>

      <section className="academics-admin-card">

        <div className="academics-card-header">

          <div>
            <h2>Examination Results</h2>

            <p>
              Current result publication records.
            </p>
          </div>

        </div>

        <div className="academics-result-list">

          {results.map((result) => (
            <div key={result.id}>

              <div>
                <strong>{result.exam}</strong>

                <small>
                  {result.branch} •{" "}
                  {result.semester}
                </small>
              </div>

              <span>
                {result.students} students
              </span>

              <span>
                {result.published}
              </span>

              <b
                className={
                  result.status === "PUBLISHED"
                    ? "academics-result-published"
                    : "academics-result-processing"
                }
              >
                {result.status}
              </b>

            </div>
          ))}

        </div>

      </section>

    </div>
  );

  /* =========================================================
     ACADEMIC ALERTS
  ========================================================= */

  const renderAlerts = () => (
    <div className="academics-module-page">

      <div className="academics-page-header">

        <div>
          <span>ACADEMICS / ALERTS</span>

          <h1>Academic Alerts</h1>

          <p>
            Monitor academic events and actions requiring
            attention.
          </p>
        </div>

        <button
          className="academics-primary-btn"
          onClick={() => openModal("alert")}
        >
          + Create Alert
        </button>

      </div>

      <section className="academics-admin-card">

        <div className="academics-alert-list academics-alert-page-list">

          {alerts.map((alert) => (
            <div key={alert.id}>

              <span className="academics-alert-icon">
                {alert.type === "SCHEDULE"
                  ? "📅"
                  : alert.type === "RESULT"
                  ? "🎓"
                  : "📝"}
              </span>

              <div>
                <strong>{alert.title}</strong>

                <small>
                  {alert.message}
                </small>
              </div>

              <span className="academics-alert-time">
                {alert.time}
              </span>

              <button
                className="academics-view-btn"
                onClick={() =>
                  alert &&
                  window.alert(
                    `${alert.title}\n\n${alert.message}`
                  )
                }
              >
                Review
              </button>

            </div>
          ))}

        </div>

      </section>

    </div>
  );

  /* =========================================================
     NOTICES
  ========================================================= */

  const renderNotices = () => (
    <div className="academics-module-page">

      <div className="academics-page-header">

        <div>
          <span>ACADEMICS / NOTICES</span>

          <h1>Notices & Announcements</h1>

          <p>
            Publish academic announcements to the right
            students.
          </p>
        </div>

        <button
          className="academics-primary-btn"
          onClick={() => openModal("notice")}
        >
          + Create Notice
        </button>

      </div>

      <div className="academics-admin-stats">

        <div className="academics-stat-card">
          <span>Published Notices</span>
          <strong>{notices.length}</strong>
          <small>This academic system</small>
        </div>

        <div className="academics-stat-card">
          <span>All Branches</span>
          <strong>
            {
              notices.filter(
                (notice) =>
                  notice.target === "All Branches"
              ).length
            }
          </strong>
          <small>Campus-wide notices</small>
        </div>

        <div className="academics-stat-card">
          <span>Semester Wise</span>
          <strong>
            {
              notices.filter(
                (notice) =>
                  notice.semester !== "All"
              ).length
            }
          </strong>
          <small>Targeted notices</small>
        </div>

        <div className="academics-stat-card">
          <span>Recent</span>
          <strong>
            {Math.min(notices.length, 5)}
          </strong>
          <small>Recent announcements</small>
        </div>

      </div>

      <section className="academics-admin-card">

        <div className="academics-card-header">

          <div>
            <h2>Recent Notices</h2>

            <p>
              Recently published academic announcements.
            </p>
          </div>

        </div>

        <div className="academics-alert-list">

          {notices.map((notice) => (
            <div key={notice.id}>

              <span className="academics-alert-icon">
                📢
              </span>

              <div>
                <strong>{notice.title}</strong>

                <small>
                  {notice.message}
                </small>

                <small>
                  Target: {notice.target}
                  {notice.semester !== "All"
                    ? ` • ${notice.semester} Semester`
                    : ""}
                </small>
              </div>

              <span className="academics-alert-time">
                {notice.time}
              </span>

            </div>
          ))}

        </div>

      </section>

    </div>
  );

  /* =========================================================
     CONTENT ROUTER
  ========================================================= */

  const renderContent = () => {
    switch (activeModule) {
      case "timetable":
        return renderTimetable();

      case "assignments":
        return renderAssignments();

      case "materials":
        return renderMaterials();

      case "results":
        return renderResults();

      case "alerts":
        return renderAlerts();

      case "notices":
        return renderNotices();

      default:
        return renderDashboard();
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="academics-admin-container">

      {renderContent()}

      {/* =====================================================
          ADD CLASS MODAL
      ===================================================== */}

      <FormModal
        open={modal === "class"}
        title="Add New Class"
        subtitle="Create a new timetable entry."
        onClose={closeModal}
        onSubmit={handleAddClass}
        submitText="Add Class"
      >

        <div className="academics-form-grid">

          <label>
            Subject *
            <input
              value={classForm.subject}
              onChange={(e) =>
                setClassForm({
                  ...classForm,
                  subject: e.target.value,
                })
              }
              placeholder="e.g. Data Structures"
            />
          </label>

          <label>
            Faculty *
            <input
              value={classForm.faculty}
              onChange={(e) =>
                setClassForm({
                  ...classForm,
                  faculty: e.target.value,
                })
              }
              placeholder="Faculty name"
            />
          </label>

          <label>
            Room *
            <input
              value={classForm.room}
              onChange={(e) =>
                setClassForm({
                  ...classForm,
                  room: e.target.value,
                })
              }
              placeholder="Room 204 / Lab 2"
            />
          </label>

          <label>
            Branch
            <select
              value={classForm.branch}
              onChange={(e) =>
                setClassForm({
                  ...classForm,
                  branch: e.target.value,
                })
              }
            >
              <option>CSE</option>
              <option>ECE</option>
              <option>EEE</option>
              <option>ME</option>
              <option>Civil</option>
            </select>
          </label>

          <label>
            Semester
            <select
              value={classForm.semester}
              onChange={(e) =>
                setClassForm({
                  ...classForm,
                  semester: e.target.value,
                })
              }
            >
              <option>1st</option>
              <option>2nd</option>
              <option>3rd</option>
              <option>4th</option>
              <option>5th</option>
              <option>6th</option>
              <option>7th</option>
              <option>8th</option>
            </select>
          </label>

          <label>
            Start Time *
            <input
              type="time"
              value={classForm.startTime}
              onChange={(e) =>
                setClassForm({
                  ...classForm,
                  startTime: e.target.value,
                })
              }
            />
          </label>

          <label>
            End Time *
            <input
              type="time"
              value={classForm.endTime}
              onChange={(e) =>
                setClassForm({
                  ...classForm,
                  endTime: e.target.value,
                })
              }
            />
          </label>

        </div>

      </FormModal>

      {/* =====================================================
          CREATE ASSIGNMENT MODAL
      ===================================================== */}

      <FormModal
        open={modal === "assignment"}
        title="Create Assignment"
        subtitle="Publish a new academic assignment."
        onClose={closeModal}
        onSubmit={handleCreateAssignment}
        submitText="Create Assignment"
      >

        <div className="academics-form-grid">

          <label>
            Assignment Title *
            <input
              value={assignmentForm.title}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  title: e.target.value,
                })
              }
              placeholder="e.g. Process Synchronization"
            />
          </label>

          <label>
            Subject *
            <input
              value={assignmentForm.subject}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  subject: e.target.value,
                })
              }
              placeholder="Subject"
            />
          </label>

          <label>
            Branch
            <select
              value={assignmentForm.branch}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  branch: e.target.value,
                })
              }
            >
              <option>CSE</option>
              <option>ECE</option>
              <option>EEE</option>
              <option>ME</option>
              <option>Civil</option>
            </select>
          </label>

          <label>
            Semester
            <select
              value={assignmentForm.semester}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  semester: e.target.value,
                })
              }
            >
              <option>1st</option>
              <option>2nd</option>
              <option>3rd</option>
              <option>4th</option>
              <option>5th</option>
              <option>6th</option>
              <option>7th</option>
              <option>8th</option>
            </select>
          </label>

          <label>
            Due Date *
            <input
              type="date"
              value={assignmentForm.due}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  due: e.target.value,
                })
              }
            />
          </label>

          <label className="academics-form-full">
            Description
            <textarea
              value={assignmentForm.description}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  description: e.target.value,
                })
              }
              placeholder="Assignment instructions..."
              rows="4"
            />
          </label>

        </div>

      </FormModal>

      {/* =====================================================
          UPLOAD MATERIAL MODAL
      ===================================================== */}

      <FormModal
        open={modal === "material"}
        title="Upload Study Material"
        subtitle="Add notes, study material, PYQs or academic documents."
        onClose={closeModal}
        onSubmit={handleUploadMaterial}
        submitText="Upload Material"
      >

        <div className="academics-form-grid">

          <label>
            Material Title *
            <input
              value={materialForm.title}
              onChange={(e) =>
                setMaterialForm({
                  ...materialForm,
                  title: e.target.value,
                })
              }
              placeholder="e.g. DBMS Unit 1 Notes"
            />
          </label>

          <label>
            Subject *
            <input
              value={materialForm.subject}
              onChange={(e) =>
                setMaterialForm({
                  ...materialForm,
                  subject: e.target.value,
                })
              }
              placeholder="Subject"
            />
          </label>

          <label>
            Material Type *
            <select
              value={materialForm.type}
              onChange={(e) =>
                setMaterialForm({
                  ...materialForm,
                  type: e.target.value,
                })
              }
            >
              <option>Lecture Notes</option>
              <option>Study Material</option>
              <option>PYQs</option>
              <option>Question Bank</option>
              <option>Syllabus / Academic Document</option>
            </select>
          </label>

          <label>
            Branch
            <select
              value={materialForm.branch}
              onChange={(e) =>
                setMaterialForm({
                  ...materialForm,
                  branch: e.target.value,
                })
              }
            >
              <option>CSE</option>
              <option>ECE</option>
              <option>EEE</option>
              <option>ME</option>
              <option>Civil</option>
            </select>
          </label>

          <label>
            Semester
            <select
              value={materialForm.semester}
              onChange={(e) =>
                setMaterialForm({
                  ...materialForm,
                  semester: e.target.value,
                })
              }
            >
              <option>1st</option>
              <option>2nd</option>
              <option>3rd</option>
              <option>4th</option>
              <option>5th</option>
              <option>6th</option>
              <option>7th</option>
              <option>8th</option>
            </select>
          </label>

          <label>
            File
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              onChange={(e) =>
                setMaterialForm({
                  ...materialForm,
                  file: e.target.files?.[0] || null,
                })
              }
            />
          </label>

          <label className="academics-form-full">
            Description
            <textarea
              value={materialForm.description}
              onChange={(e) =>
                setMaterialForm({
                  ...materialForm,
                  description: e.target.value,
                })
              }
              placeholder="Describe this resource..."
              rows="4"
            />
          </label>

        </div>

      </FormModal>

      {/* =====================================================
          UPLOAD RESULTS MODAL
      ===================================================== */}

      <FormModal
        open={modal === "result"}
        title="Upload Results"
        subtitle="Publish examination results."
        onClose={closeModal}
        onSubmit={handleUploadResults}
        submitText="Publish Results"
      >

        <div className="academics-form-grid">

          <label>
            Examination Name *
            <input
              value={resultForm.exam}
              onChange={(e) =>
                setResultForm({
                  ...resultForm,
                  exam: e.target.value,
                })
              }
              placeholder="e.g. End Semester Examination"
            />
          </label>

          <label>
            Branch
            <select
              value={resultForm.branch}
              onChange={(e) =>
                setResultForm({
                  ...resultForm,
                  branch: e.target.value,
                })
              }
            >
              <option>CSE</option>
              <option>ECE</option>
              <option>EEE</option>
              <option>ME</option>
              <option>Civil</option>
            </select>
          </label>

          <label>
            Semester
            <select
              value={resultForm.semester}
              onChange={(e) =>
                setResultForm({
                  ...resultForm,
                  semester: e.target.value,
                })
              }
            >
              <option>1st</option>
              <option>2nd</option>
              <option>3rd</option>
              <option>4th</option>
              <option>5th</option>
              <option>6th</option>
              <option>7th</option>
              <option>8th</option>
            </select>
          </label>

          <label>
            Number of Students *
            <input
              type="number"
              min="1"
              value={resultForm.students}
              onChange={(e) =>
                setResultForm({
                  ...resultForm,
                  students: e.target.value,
                })
              }
              placeholder="96"
            />
          </label>

          <label className="academics-form-full">
            Result File
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={(e) =>
                setResultForm({
                  ...resultForm,
                  file: e.target.files?.[0] || null,
                })
              }
            />
          </label>

        </div>

      </FormModal>

      {/* =====================================================
          CREATE ALERT MODAL
      ===================================================== */}

      <FormModal
        open={modal === "alert"}
        title="Create Academic Alert"
        subtitle="Notify students about an important academic event."
        onClose={closeModal}
        onSubmit={handleCreateAlert}
        submitText="Create Alert"
      >

        <div className="academics-form-grid">

          <label>
            Alert Title *
            <input
              value={alertForm.title}
              onChange={(e) =>
                setAlertForm({
                  ...alertForm,
                  title: e.target.value,
                })
              }
              placeholder="e.g. Exam Schedule Updated"
            />
          </label>

          <label>
            Alert Type
            <select
              value={alertForm.type}
              onChange={(e) =>
                setAlertForm({
                  ...alertForm,
                  type: e.target.value,
                })
              }
            >
              <option value="ACADEMIC">
                Academic
              </option>
              <option value="SCHEDULE">
                Schedule
              </option>
              <option value="RESULT">
                Result
              </option>
              <option value="IMPORTANT">
                Important
              </option>
            </select>
          </label>

          <label className="academics-form-full">
            Message *
            <textarea
              value={alertForm.message}
              onChange={(e) =>
                setAlertForm({
                  ...alertForm,
                  message: e.target.value,
                })
              }
              placeholder="Write the alert message..."
              rows="5"
            />
          </label>

        </div>

      </FormModal>

      {/* =====================================================
          CREATE NOTICE MODAL
      ===================================================== */}

      <FormModal
        open={modal === "notice"}
        title="Create Notice"
        subtitle="Publish an announcement to selected students."
        onClose={closeModal}
        onSubmit={handleCreateNotice}
        submitText="Publish Notice"
      >

        <div className="academics-form-grid">

          <label>
            Notice Title *
            <input
              value={noticeForm.title}
              onChange={(e) =>
                setNoticeForm({
                  ...noticeForm,
                  title: e.target.value,
                })
              }
              placeholder="e.g. Semester Examination Notice"
            />
          </label>

          <label>
            Audience
            <select
              value={noticeForm.target}
              onChange={(e) =>
                setNoticeForm({
                  ...noticeForm,
                  target: e.target.value,
                })
              }
            >
              <option>All Branches</option>
              <option>Dedicated Branch</option>
            </select>
          </label>

          <label>
            Branch
            <select
              value={noticeForm.branch}
              disabled={
                noticeForm.target === "All Branches"
              }
              onChange={(e) =>
                setNoticeForm({
                  ...noticeForm,
                  branch: e.target.value,
                })
              }
            >
              <option>CSE</option>
              <option>ECE</option>
              <option>EEE</option>
              <option>ME</option>
              <option>Civil</option>
            </select>
          </label>

          <label>
            Semester
            <select
              value={noticeForm.semester}
              onChange={(e) =>
                setNoticeForm({
                  ...noticeForm,
                  semester: e.target.value,
                })
              }
            >
              <option>All</option>
              <option>1st</option>
              <option>2nd</option>
              <option>3rd</option>
              <option>4th</option>
              <option>5th</option>
              <option>6th</option>
              <option>7th</option>
              <option>8th</option>
            </select>
          </label>

          <label className="academics-form-full">
            Notice Message *
            <textarea
              value={noticeForm.message}
              onChange={(e) =>
                setNoticeForm({
                  ...noticeForm,
                  message: e.target.value,
                })
              }
              placeholder="Write the complete announcement..."
              rows="6"
            />
          </label>

        </div>

      </FormModal>

    </div>
  );
}