import React, { useMemo, useState } from "react";
import "./MaintenanceAdmin.css";

/* =========================================================
   INITIAL DATA
========================================================= */

const INITIAL_COMPLAINTS = [
  {
    id: "MNT-1001",
    student: "Rahul Kumar",
    studentId: "STU002",
    location: "Hostel Block A - Room 204",
    category: "Plumbing",
    issue: "Water leakage from bathroom pipe",
    priority: "HIGH",
    technician: "Suresh Kumar",
    status: "ASSIGNED",
    created: "08 Oct 2026",
    age: 2,
  },
  {
    id: "MNT-1002",
    student: "Priya Das",
    studentId: "STU003",
    location: "Hostel Block B - Room 118",
    category: "Electrical",
    issue: "Ceiling fan not working",
    priority: "MEDIUM",
    technician: "Rakesh Nayak",
    status: "IN PROGRESS",
    created: "08 Oct 2026",
    age: 1,
  },
  {
    id: "MNT-1003",
    student: "Aditya Kumar",
    studentId: "STU001",
    location: "Academic Block - Lab 3",
    category: "Network",
    issue: "Wi-Fi connection unavailable",
    priority: "MEDIUM",
    technician: "Anil Das",
    status: "OPEN",
    created: "07 Oct 2026",
    age: 3,
  },
  {
    id: "MNT-1004",
    student: "Sneha Patnaik",
    studentId: "STU004",
    location: "Hostel Block C - Room 305",
    category: "Cleaning",
    issue: "Room cleaning request pending",
    priority: "LOW",
    technician: "Unassigned",
    status: "OPEN",
    created: "06 Oct 2026",
    age: 4,
  },
  {
    id: "MNT-1005",
    student: "Rohan Mishra",
    studentId: "STU005",
    location: "Hostel Block A - Room 109",
    category: "Plumbing",
    issue: "Washbasin tap damaged",
    priority: "MEDIUM",
    technician: "Suresh Kumar",
    status: "RESOLVED",
    created: "05 Oct 2026",
    age: 5,
  },
  {
    id: "MNT-1006",
    student: "Neha Singh",
    studentId: "STU006",
    location: "Academic Block - Room 212",
    category: "Furniture",
    issue: "Broken classroom chair",
    priority: "LOW",
    technician: "Unassigned",
    status: "OPEN",
    created: "04 Oct 2026",
    age: 6,
  },
];

const INITIAL_CATEGORIES = [
  {
    id: "CAT-01",
    name: "Electrical",
    complaints: 6,
    technician: "Rakesh Nayak",
    status: "ACTIVE",
  },
  {
    id: "CAT-02",
    name: "Plumbing",
    complaints: 14,
    technician: "Suresh Kumar",
    status: "ACTIVE",
  },
  {
    id: "CAT-03",
    name: "Network / Wi-Fi",
    complaints: 11,
    technician: "Anil Das",
    status: "ACTIVE",
  },
  {
    id: "CAT-04",
    name: "Cleaning",
    complaints: 9,
    technician: "Mohan Das",
    status: "ACTIVE",
  },
  {
    id: "CAT-05",
    name: "Furniture",
    complaints: 4,
    technician: "Rakesh Nayak",
    status: "ACTIVE",
  },
];

const INITIAL_TECHNICIANS = [
  {
    id: "TECH-01",
    name: "Suresh Kumar",
    specialization: "Plumbing",
    phone: "9876543210",
    assigned: 5,
    resolved: 32,
    availability: "AVAILABLE",
  },
  {
    id: "TECH-02",
    name: "Rakesh Nayak",
    specialization: "Electrical",
    phone: "9876543211",
    assigned: 3,
    resolved: 28,
    availability: "BUSY",
  },
  {
    id: "TECH-03",
    name: "Anil Das",
    specialization: "Network / Wi-Fi",
    phone: "9876543212",
    assigned: 4,
    resolved: 24,
    availability: "AVAILABLE",
  },
  {
    id: "TECH-04",
    name: "Mohan Das",
    specialization: "Cleaning",
    phone: "9876543213",
    assigned: 2,
    resolved: 41,
    availability: "AVAILABLE",
  },
];

const INITIAL_RECURRING = [
  {
    id: "REC-01",
    title: "Water Leakage",
    category: "Plumbing",
    complaints: 14,
    period: "6 days",
    priority: "HIGH",
    location: "Hostel Block A",
    action: "Inspect main pipeline",
  },
  {
    id: "REC-02",
    title: "Wi-Fi Failure",
    category: "Network",
    complaints: 11,
    period: "3 days",
    priority: "MEDIUM",
    location: "Academic Block",
    action: "Inspect access points",
  },
  {
    id: "REC-03",
    title: "Room Cleaning",
    category: "Cleaning",
    complaints: 9,
    period: "5 days",
    priority: "MEDIUM",
    location: "Hostel Block B",
    action: "Increase cleaning frequency",
  },
  {
    id: "REC-04",
    title: "Food Area Maintenance",
    category: "Civil",
    complaints: 7,
    period: "7 days",
    priority: "LOW",
    location: "Mess Block",
    action: "Schedule inspection",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const statusClass = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

const priorityClass = (value) =>
  String(value || "").toLowerCase();

const todayText = () =>
  new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* =========================================================
   COMPONENT
========================================================= */

export default function MaintenanceAdmin({
  module = "dashboard",
  onNavigate,
}) {
  const [complaints, setComplaints] = useState(
    INITIAL_COMPLAINTS
  );

  const [categories, setCategories] = useState(
    INITIAL_CATEGORIES
  );

  const [technicians, setTechnicians] = useState(
    INITIAL_TECHNICIANS
  );

  const [recurringIssues] = useState(
    INITIAL_RECURRING
  );

  const [search, setSearch] = useState("");

  const [toast, setToast] = useState("");

  const [selectedComplaint, setSelectedComplaint] =
    useState(null);

  const [selectedTechnician, setSelectedTechnician] =
    useState(null);

  const [showComplaintModal, setShowComplaintModal] =
    useState(false);

  const [showCategoryModal, setShowCategoryModal] =
    useState(false);

  const [showTechnicianModal, setShowTechnicianModal] =
    useState(false);

  const [complaintForm, setComplaintForm] = useState({
    student: "",
    studentId: "",
    location: "",
    category: "Electrical",
    issue: "",
    priority: "MEDIUM",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    technician: "",
  });

  const [technicianForm, setTechnicianForm] = useState({
    name: "",
    specialization: "Electrical",
    phone: "",
  });

  /* =======================================================
     TOAST
  ======================================================= */

  const showMessage = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const goTo = (target) => {
    if (onNavigate) {
      onNavigate(target);
      return;
    }

    window.history.pushState({}, "", `/admin/maintenance/${target}`);
  };

  /* =======================================================
     COUNTS
  ======================================================= */

  const openComplaints = complaints.filter(
    (item) =>
      item.status === "OPEN" ||
      item.status === "ASSIGNED" ||
      item.status === "IN PROGRESS"
  ).length;

  const assignedComplaints = complaints.filter(
    (item) =>
      item.status === "ASSIGNED" ||
      item.status === "IN PROGRESS"
  ).length;

  const resolvedComplaints = complaints.filter(
    (item) => item.status === "RESOLVED"
  ).length;

  const overdueComplaints = complaints.filter(
    (item) => item.age >= 5 && item.status !== "RESOLVED"
  ).length;

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredComplaints = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return complaints;
    }

    return complaints.filter(
      (item) =>
        item.id.toLowerCase().includes(query) ||
        item.student.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.issue.toLowerCase().includes(query)
    );
  }, [complaints, search]);

  /* =======================================================
     ADD COMPLAINT
  ======================================================= */

  const handleAddComplaint = (event) => {
    event.preventDefault();

    if (
      !complaintForm.student.trim() ||
      !complaintForm.studentId.trim() ||
      !complaintForm.location.trim() ||
      !complaintForm.issue.trim()
    ) {
      showMessage("Please complete all complaint details.");
      return;
    }

    const newComplaint = {
      id: `MNT-${Date.now().toString().slice(-5)}`,
      student: complaintForm.student.trim(),
      studentId: complaintForm.studentId.trim(),
      location: complaintForm.location.trim(),
      category: complaintForm.category,
      issue: complaintForm.issue.trim(),
      priority: complaintForm.priority,
      technician: "Unassigned",
      status: "OPEN",
      created: todayText(),
      age: 0,
    };

    setComplaints((previous) => [
      newComplaint,
      ...previous,
    ]);

    setComplaintForm({
      student: "",
      studentId: "",
      location: "",
      category: "Electrical",
      issue: "",
      priority: "MEDIUM",
    });

    setShowComplaintModal(false);

    showMessage("Maintenance complaint created successfully.");
  };

  /* =======================================================
     ADD CATEGORY
  ======================================================= */

  const handleAddCategory = (event) => {
    event.preventDefault();

    if (!categoryForm.name.trim()) {
      showMessage("Please enter a category name.");
      return;
    }

    const newCategory = {
      id: `CAT-${Date.now().toString().slice(-4)}`,
      name: categoryForm.name.trim(),
      complaints: 0,
      technician:
        categoryForm.technician || "Unassigned",
      status: "ACTIVE",
    };

    setCategories((previous) => [
      ...previous,
      newCategory,
    ]);

    setCategoryForm({
      name: "",
      technician: "",
    });

    setShowCategoryModal(false);

    showMessage("Maintenance category created.");
  };

  /* =======================================================
     ADD TECHNICIAN
  ======================================================= */

  const handleAddTechnician = (event) => {
    event.preventDefault();

    if (
      !technicianForm.name.trim() ||
      !technicianForm.phone.trim()
    ) {
      showMessage("Please enter technician details.");
      return;
    }

    const newTechnician = {
      id: `TECH-${Date.now().toString().slice(-4)}`,
      name: technicianForm.name.trim(),
      specialization: technicianForm.specialization,
      phone: technicianForm.phone.trim(),
      assigned: 0,
      resolved: 0,
      availability: "AVAILABLE",
    };

    setTechnicians((previous) => [
      ...previous,
      newTechnician,
    ]);

    setTechnicianForm({
      name: "",
      specialization: "Electrical",
      phone: "",
    });

    setShowTechnicianModal(false);

    showMessage("Technician added successfully.");
  };

  /* =======================================================
     ASSIGN TECHNICIAN
  ======================================================= */

  const assignTechnician = (
    complaint,
    technicianName
  ) => {
    if (!technicianName) {
      return;
    }

    setComplaints((previous) =>
      previous.map((item) =>
        item.id === complaint.id
          ? {
              ...item,
              technician: technicianName,
              status: "ASSIGNED",
            }
          : item
      )
    );

    setTechnicians((previous) =>
      previous.map((tech) =>
        tech.name === technicianName
          ? {
              ...tech,
              assigned: tech.assigned + 1,
            }
          : tech
      )
    );

    setSelectedComplaint(null);

    showMessage(
      `${technicianName} assigned to ${complaint.id}.`
    );
  };

  /* =======================================================
     START WORK
  ======================================================= */

  const startWork = (complaint) => {
    setComplaints((previous) =>
      previous.map((item) =>
        item.id === complaint.id
          ? {
              ...item,
              status: "IN PROGRESS",
            }
          : item
      )
    );

    showMessage(
      `${complaint.id} marked as in progress.`
    );
  };

  /* =======================================================
     RESOLVE
  ======================================================= */

  const resolveComplaint = (complaint) => {
    setComplaints((previous) =>
      previous.map((item) =>
        item.id === complaint.id
          ? {
              ...item,
              status: "RESOLVED",
            }
          : item
      )
    );

    if (complaint.technician !== "Unassigned") {
      setTechnicians((previous) =>
        previous.map((tech) =>
          tech.name === complaint.technician
            ? {
                ...tech,
                assigned: Math.max(
                  0,
                  tech.assigned - 1
                ),
                resolved: tech.resolved + 1,
              }
            : tech
        )
      );
    }

    setSelectedComplaint(null);

    showMessage(
      `${complaint.id} marked as resolved.`
    );
  };

  /* =======================================================
     REOPEN
  ======================================================= */

  const reopenComplaint = (complaint) => {
    setComplaints((previous) =>
      previous.map((item) =>
        item.id === complaint.id
          ? {
              ...item,
              status: "OPEN",
            }
          : item
      )
    );

    showMessage(`${complaint.id} reopened.`);
  };

  /* =======================================================
     DASHBOARD
  ======================================================= */

  const renderDashboard = () => {
    return (
      <>
        <div className="maintenance-header">
          <div>
            <span className="maintenance-eyebrow">
              MAINTENANCE ADMIN
            </span>

            <h1>Maintenance Management</h1>

            <p>
              Manage campus complaints, technicians,
              assignments and recurring maintenance
              problems.
            </p>
          </div>

          <div className="maintenance-system-status">
            <span />
            Maintenance System Active
          </div>
        </div>

        <div className="maintenance-stats">
          <div className="maintenance-stat-card">
            <span>Open Complaints</span>
            <strong>{openComplaints}</strong>
            <small>Needs attention</small>
          </div>

          <div className="maintenance-stat-card">
            <span>Assigned</span>
            <strong>{assignedComplaints}</strong>
            <small>Technicians working</small>
          </div>

          <div className="maintenance-stat-card">
            <span>Resolved</span>
            <strong>{resolvedComplaints}</strong>
            <small>Successfully completed</small>
          </div>

          <div className="maintenance-stat-card danger">
            <span>Overdue</span>
            <strong>{overdueComplaints}</strong>
            <small>Requires escalation</small>
          </div>
        </div>

        <div className="maintenance-quick-grid">
          <button
            onClick={() => goTo("admin-maintenance-complaints")}
          >
            <span>🛠️</span>
            <strong>All Complaints</strong>
            <small>
              Review and resolve maintenance complaints.
            </small>
          </button>

          <button
            onClick={() =>
              goTo("admin-maintenance-technicians")
            }
          >
            <span>👷</span>
            <strong>Technicians</strong>
            <small>
              Manage technicians and workload.
            </small>
          </button>

          <button
            onClick={() =>
              goTo("admin-maintenance-assignments")
            }
          >
            <span>📋</span>
            <strong>Assignments</strong>
            <small>
              Assign complaints to technicians.
            </small>
          </button>

          <button
            onClick={() =>
              goTo("admin-maintenance-recurring")
            }
          >
            <span>🔄</span>
            <strong>Recurring Issues</strong>
            <small>
              Detect repeated campus problems.
            </small>
          </button>
        </div>

        <div className="maintenance-two-column">
          <section className="maintenance-panel">
            <div className="maintenance-panel-header">
              <div>
                <h2>Priority Complaints</h2>
                <p>
                  Issues requiring immediate attention.
                </p>
              </div>

              <button
                className="maintenance-link-btn"
                onClick={() =>
                  goTo("admin-maintenance-complaints")
                }
              >
                View All
              </button>
            </div>

            <div className="maintenance-list">
              {complaints
                .filter(
                  (item) =>
                    item.priority === "HIGH" &&
                    item.status !== "RESOLVED"
                )
                .map((item) => (
                  <button
                    className="maintenance-list-item"
                    key={item.id}
                    onClick={() =>
                      setSelectedComplaint(item)
                    }
                  >
                    <div>
                      <strong>{item.issue}</strong>
                      <small>
                        {item.location} • {item.id}
                      </small>
                    </div>

                    <span
                      className={`maintenance-badge ${priorityClass(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </button>
                ))}
            </div>
          </section>

          <section className="maintenance-panel">
            <div className="maintenance-panel-header">
              <div>
                <h2>Recurring Problems</h2>
                <p>
                  Automatically detected campus patterns.
                </p>
              </div>

              <button
                className="maintenance-link-btn"
                onClick={() =>
                  goTo("admin-maintenance-recurring")
                }
              >
                Analyze
              </button>
            </div>

            <div className="recurring-mini-list">
              {recurringIssues.slice(0, 4).map((item) => (
                <div
                  className="recurring-mini-item"
                  key={item.id}
                >
                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      {item.complaints} complaints /{" "}
                      {item.period}
                    </small>
                  </div>

                  <span
                    className={`maintenance-badge ${priorityClass(
                      item.priority
                    )}`}
                  >
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </>
    );
  };

  /* =======================================================
     COMPLAINTS
  ======================================================= */

  const renderComplaints = () => {
    return (
      <>
        <div className="maintenance-header">
          <div>
            <span className="maintenance-eyebrow">
              MAINTENANCE / COMPLAINTS
            </span>

            <h1>Maintenance Complaints</h1>

            <p>
              Track, assign and resolve all maintenance
              complaints.
            </p>
          </div>

          <button
            className="maintenance-primary-btn"
            onClick={() => setShowComplaintModal(true)}
          >
            + New Complaint
          </button>
        </div>

        <section className="maintenance-panel">
          <div className="maintenance-toolbar">
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search complaint, student, location or category..."
            />

            <div className="maintenance-toolbar-info">
              {filteredComplaints.length} complaints
            </div>
          </div>

          <div className="maintenance-table-wrap">
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>STUDENT</th>
                  <th>ISSUE</th>
                  <th>CATEGORY</th>
                  <th>PRIORITY</th>
                  <th>TECHNICIAN</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredComplaints.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.id}</strong>
                      <small>{item.created}</small>
                    </td>

                    <td>
                      <strong>{item.student}</strong>
                      <small>{item.studentId}</small>
                    </td>

                    <td>
                      <strong>{item.issue}</strong>
                      <small>{item.location}</small>
                    </td>

                    <td>{item.category}</td>

                    <td>
                      <span
                        className={`maintenance-badge ${priorityClass(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                    </td>

                    <td>
                      {item.technician}
                    </td>

                    <td>
                      <span
                        className={`maintenance-status ${statusClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="maintenance-small-btn"
                        onClick={() =>
                          setSelectedComplaint(item)
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  };

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const renderCategories = () => {
    return (
      <>
        <div className="maintenance-header">
          <div>
            <span className="maintenance-eyebrow">
              MAINTENANCE / CATEGORIES
            </span>

            <h1>Complaint Categories</h1>

            <p>
              Configure maintenance categories and default
              technicians.
            </p>
          </div>

          <button
            className="maintenance-primary-btn"
            onClick={() => setShowCategoryModal(true)}
          >
            + Add Category
          </button>
        </div>

        <section className="maintenance-panel">
          <div className="maintenance-category-grid">
            {categories.map((category) => (
              <div
                className="maintenance-category-card"
                key={category.id}
              >
                <div className="category-icon">
                  🛠️
                </div>

                <div>
                  <strong>{category.name}</strong>

                  <small>
                    {category.complaints} complaints
                  </small>

                  <small>
                    Default: {category.technician}
                  </small>
                </div>

                <span className="maintenance-status active">
                  {category.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  };

  /* =======================================================
     TECHNICIANS
  ======================================================= */

  const renderTechnicians = () => {
    return (
      <>
        <div className="maintenance-header">
          <div>
            <span className="maintenance-eyebrow">
              MAINTENANCE / TECHNICIANS
            </span>

            <h1>Technician Management</h1>

            <p>
              Manage technician availability,
              specialization and workload.
            </p>
          </div>

          <button
            className="maintenance-primary-btn"
            onClick={() => setShowTechnicianModal(true)}
          >
            + Add Technician
          </button>
        </div>

        <section className="maintenance-panel">
          <div className="maintenance-technician-grid">
            {technicians.map((technician) => (
              <div
                className="technician-card"
                key={technician.id}
              >
                <div className="technician-card-top">
                  <div className="technician-avatar">
                    {technician.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <span
                    className={`technician-availability ${statusClass(
                      technician.availability
                    )}`}
                  >
                    {technician.availability}
                  </span>
                </div>

                <h3>{technician.name}</h3>

                <p>
                  {technician.specialization}
                </p>

                <div className="technician-stats">
                  <div>
                    <strong>
                      {technician.assigned}
                    </strong>
                    <small>Assigned</small>
                  </div>

                  <div>
                    <strong>
                      {technician.resolved}
                    </strong>
                    <small>Resolved</small>
                  </div>
                </div>

                <button
                  className="maintenance-small-btn full"
                  onClick={() =>
                    setSelectedTechnician(technician)
                  }
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  };

  /* =======================================================
     ASSIGNMENTS
  ======================================================= */

  const renderAssignments = () => {
    const pendingAssignments = complaints.filter(
      (item) =>
        item.status === "OPEN" ||
        item.technician === "Unassigned"
    );

    return (
      <>
        <div className="maintenance-header">
          <div>
            <span className="maintenance-eyebrow">
              MAINTENANCE / ASSIGNMENTS
            </span>

            <h1>Technician Assignments</h1>

            <p>
              Assign open complaints to the appropriate
              technician.
            </p>
          </div>
        </div>

        <section className="maintenance-panel">
          {pendingAssignments.length === 0 ? (
            <div className="maintenance-empty">
              <span>✓</span>
              <h3>All complaints are assigned</h3>
              <p>
                There are currently no unassigned
                maintenance complaints.
              </p>
            </div>
          ) : (
            <div className="assignment-list">
              {pendingAssignments.map((complaint) => (
                <div
                  className="assignment-card"
                  key={complaint.id}
                >
                  <div className="assignment-main">
                    <span className="assignment-id">
                      {complaint.id}
                    </span>

                    <h3>{complaint.issue}</h3>

                    <p>
                      {complaint.student} •{" "}
                      {complaint.location}
                    </p>

                    <span
                      className={`maintenance-badge ${priorityClass(
                        complaint.priority
                      )}`}
                    >
                      {complaint.priority}
                    </span>
                  </div>

                  <div className="assignment-control">
                    <label>
                      Assign Technician

                      <select
                        defaultValue=""
                        onChange={(event) =>
                          assignTechnician(
                            complaint,
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          Select technician
                        </option>

                        {technicians.map((tech) => (
                          <option
                            key={tech.id}
                            value={tech.name}
                          >
                            {tech.name} —{" "}
                            {tech.specialization}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  };

  /* =======================================================
     RECURRING
  ======================================================= */

  const renderRecurring = () => {
    return (
      <>
        <div className="maintenance-header">
          <div>
            <span className="maintenance-eyebrow">
              MAINTENANCE / RECURRING ISSUES
            </span>

            <h1>Recurring Issues</h1>

            <p>
              Identify repeated complaints before they
              become larger campus problems.
            </p>
          </div>

          <button
            className="maintenance-primary-btn"
            onClick={() =>
              showMessage(
                "Recurring issue analysis completed."
              )
            }
          >
            Analyze Patterns
          </button>
        </div>

        <div className="recurring-summary">
          <div>
            <span>Patterns Detected</span>
            <strong>{recurringIssues.length}</strong>
          </div>

          <div>
            <span>High Priority</span>
            <strong>
              {
                recurringIssues.filter(
                  (item) => item.priority === "HIGH"
                ).length
              }
            </strong>
          </div>

          <div>
            <span>Total Complaints</span>
            <strong>
              {recurringIssues.reduce(
                (sum, item) => sum + item.complaints,
                0
              )}
            </strong>
          </div>
        </div>

        <section className="maintenance-panel">
          <div className="recurring-table-wrap">
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th>ISSUE</th>
                  <th>CATEGORY</th>
                  <th>COMPLAINTS</th>
                  <th>PERIOD</th>
                  <th>LOCATION</th>
                  <th>PRIORITY</th>
                  <th>RECOMMENDED ACTION</th>
                </tr>
              </thead>

              <tbody>
                {recurringIssues.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                    </td>

                    <td>{item.category}</td>

                    <td>
                      <strong>{item.complaints}</strong>
                    </td>

                    <td>{item.period}</td>

                    <td>{item.location}</td>

                    <td>
                      <span
                        className={`maintenance-badge ${priorityClass(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                    </td>

                    <td>{item.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  };

  /* =======================================================
     REPORTS
  ======================================================= */

  const renderReports = () => {
    const resolutionRate =
      complaints.length > 0
        ? Math.round(
            (resolvedComplaints /
              complaints.length) *
              100
          )
        : 0;

    return (
      <>
        <div className="maintenance-header">
          <div>
            <span className="maintenance-eyebrow">
              MAINTENANCE / REPORTS
            </span>

            <h1>Resolution Reports</h1>

            <p>
              Monitor maintenance performance and
              resolution efficiency.
            </p>
          </div>

          <button
            className="maintenance-primary-btn"
            onClick={() =>
              showMessage(
                "Maintenance report generated successfully."
              )
            }
          >
            Generate Report
          </button>
        </div>

        <div className="maintenance-report-grid">
          <div>
            <span>Total Complaints</span>
            <strong>{complaints.length}</strong>
          </div>

          <div>
            <span>Resolved</span>
            <strong>{resolvedComplaints}</strong>
          </div>

          <div>
            <span>Resolution Rate</span>
            <strong>{resolutionRate}%</strong>
          </div>

          <div>
            <span>Overdue</span>
            <strong>{overdueComplaints}</strong>
          </div>
        </div>

        <section className="maintenance-panel">
          <div className="maintenance-panel-header">
            <div>
              <h2>Technician Performance</h2>
              <p>
                Current workload and resolution data.
              </p>
            </div>
          </div>

          <div className="maintenance-table-wrap">
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th>TECHNICIAN</th>
                  <th>SPECIALIZATION</th>
                  <th>ASSIGNED</th>
                  <th>RESOLVED</th>
                  <th>AVAILABILITY</th>
                </tr>
              </thead>

              <tbody>
                {technicians.map((tech) => (
                  <tr key={tech.id}>
                    <td>
                      <strong>{tech.name}</strong>
                    </td>

                    <td>{tech.specialization}</td>

                    <td>{tech.assigned}</td>

                    <td>{tech.resolved}</td>

                    <td>
                      <span
                        className={`technician-availability ${statusClass(
                          tech.availability
                        )}`}
                      >
                        {tech.availability}
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
  };

  /* =======================================================
     MODULE ROUTER
  ======================================================= */

  const renderModule = () => {
    switch (module) {
      case "complaints":
        return renderComplaints();

      case "categories":
        return renderCategories();

      case "technicians":
        return renderTechnicians();

      case "assignments":
        return renderAssignments();

      case "recurring":
        return renderRecurring();

      case "reports":
        return renderReports();

      case "dashboard":
      default:
        return renderDashboard();
    }
  };

  /* =======================================================
     MAIN RETURN
  ======================================================= */

  return (
    <div className="maintenance-admin-page">

      {renderModule()}

      {/* =====================================================
          COMPLAINT MODAL
      ===================================================== */}

      {showComplaintModal && (
        <div
          className="maintenance-modal-overlay"
          onClick={() =>
            setShowComplaintModal(false)
          }
        >
          <div
            className="maintenance-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="maintenance-modal-header">
              <div>
                <span>MAINTENANCE</span>
                <h2>New Complaint</h2>
              </div>

              <button
                onClick={() =>
                  setShowComplaintModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddComplaint}>
              <label>
                Student Name
                <input
                  value={complaintForm.student}
                  onChange={(event) =>
                    setComplaintForm((previous) => ({
                      ...previous,
                      student: event.target.value,
                    }))
                  }
                  placeholder="Enter student name"
                />
              </label>

              <label>
                Student ID
                <input
                  value={complaintForm.studentId}
                  onChange={(event) =>
                    setComplaintForm((previous) => ({
                      ...previous,
                      studentId: event.target.value,
                    }))
                  }
                  placeholder="Example: STU007"
                />
              </label>

              <label>
                Location
                <input
                  value={complaintForm.location}
                  onChange={(event) =>
                    setComplaintForm((previous) => ({
                      ...previous,
                      location: event.target.value,
                    }))
                  }
                  placeholder="Example: Hostel Block A - Room 204"
                />
              </label>

              <label>
                Category
                <select
                  value={complaintForm.category}
                  onChange={(event) =>
                    setComplaintForm((previous) => ({
                      ...previous,
                      category: event.target.value,
                    }))
                  }
                >
                  <option>Electrical</option>
                  <option>Plumbing</option>
                  <option>Network</option>
                  <option>Cleaning</option>
                  <option>Furniture</option>
                  <option>Civil</option>
                </select>
              </label>

              <label>
                Issue
                <textarea
                  rows="4"
                  value={complaintForm.issue}
                  onChange={(event) =>
                    setComplaintForm((previous) => ({
                      ...previous,
                      issue: event.target.value,
                    }))
                  }
                  placeholder="Describe the maintenance problem..."
                />
              </label>

              <label>
                Priority
                <select
                  value={complaintForm.priority}
                  onChange={(event) =>
                    setComplaintForm((previous) => ({
                      ...previous,
                      priority: event.target.value,
                    }))
                  }
                >
                  <option>LOW</option>
                  <option>MEDIUM</option>
                  <option>HIGH</option>
                </select>
              </label>

              <button
                type="submit"
                className="maintenance-primary-btn full"
              >
                Create Complaint
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          CATEGORY MODAL
      ===================================================== */}

      {showCategoryModal && (
        <div
          className="maintenance-modal-overlay"
          onClick={() =>
            setShowCategoryModal(false)
          }
        >
          <div
            className="maintenance-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="maintenance-modal-header">
              <div>
                <span>MAINTENANCE</span>
                <h2>Add Category</h2>
              </div>

              <button
                onClick={() =>
                  setShowCategoryModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddCategory}>
              <label>
                Category Name
                <input
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Example: Air Conditioning"
                />
              </label>

              <label>
                Default Technician
                <select
                  value={categoryForm.technician}
                  onChange={(event) =>
                    setCategoryForm((previous) => ({
                      ...previous,
                      technician: event.target.value,
                    }))
                  }
                >
                  <option value="">
                    Select technician
                  </option>

                  {technicians.map((tech) => (
                    <option
                      key={tech.id}
                      value={tech.name}
                    >
                      {tech.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="maintenance-primary-btn full"
              >
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          TECHNICIAN MODAL
      ===================================================== */}

      {showTechnicianModal && (
        <div
          className="maintenance-modal-overlay"
          onClick={() =>
            setShowTechnicianModal(false)
          }
        >
          <div
            className="maintenance-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="maintenance-modal-header">
              <div>
                <span>MAINTENANCE</span>
                <h2>Add Technician</h2>
              </div>

              <button
                onClick={() =>
                  setShowTechnicianModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddTechnician}>
              <label>
                Technician Name
                <input
                  value={technicianForm.name}
                  onChange={(event) =>
                    setTechnicianForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Enter technician name"
                />
              </label>

              <label>
                Specialization
                <select
                  value={
                    technicianForm.specialization
                  }
                  onChange={(event) =>
                    setTechnicianForm((previous) => ({
                      ...previous,
                      specialization:
                        event.target.value,
                    }))
                  }
                >
                  <option>Electrical</option>
                  <option>Plumbing</option>
                  <option>Network / Wi-Fi</option>
                  <option>Cleaning</option>
                  <option>Furniture</option>
                  <option>Civil</option>
                </select>
              </label>

              <label>
                Phone Number
                <input
                  value={technicianForm.phone}
                  onChange={(event) =>
                    setTechnicianForm((previous) => ({
                      ...previous,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="Enter mobile number"
                />
              </label>

              <button
                type="submit"
                className="maintenance-primary-btn full"
              >
                Add Technician
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          COMPLAINT DETAILS MODAL
      ===================================================== */}

      {selectedComplaint && (
        <div
          className="maintenance-modal-overlay"
          onClick={() =>
            setSelectedComplaint(null)
          }
        >
          <div
            className="maintenance-modal large"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="maintenance-modal-header">
              <div>
                <span>
                  COMPLAINT {selectedComplaint.id}
                </span>

                <h2>
                  {selectedComplaint.issue}
                </h2>

                <p>
                  {selectedComplaint.location}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedComplaint(null)
                }
              >
                ×
              </button>
            </div>

            <div className="complaint-detail-grid">
              <div>
                <span>Student</span>
                <strong>
                  {selectedComplaint.student}
                </strong>
              </div>

              <div>
                <span>Student ID</span>
                <strong>
                  {selectedComplaint.studentId}
                </strong>
              </div>

              <div>
                <span>Category</span>
                <strong>
                  {selectedComplaint.category}
                </strong>
              </div>

              <div>
                <span>Priority</span>
                <strong>
                  {selectedComplaint.priority}
                </strong>
              </div>

              <div>
                <span>Technician</span>
                <strong>
                  {selectedComplaint.technician}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {selectedComplaint.status}
                </strong>
              </div>
            </div>

            <div className="complaint-action-section">
              <h3>Complaint Actions</h3>

              <div className="complaint-action-grid">
                <label>
                  Assign Technician

                  <select
                    value={
                      selectedComplaint.technician ===
                      "Unassigned"
                        ? ""
                        : selectedComplaint.technician
                    }
                    onChange={(event) =>
                      assignTechnician(
                        selectedComplaint,
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select technician
                    </option>

                    {technicians.map((tech) => (
                      <option
                        key={tech.id}
                        value={tech.name}
                      >
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedComplaint.status ===
                  "ASSIGNED" && (
                  <button
                    className="maintenance-primary-btn"
                    onClick={() =>
                      startWork(selectedComplaint)
                    }
                  >
                    Start Work
                  </button>
                )}

                {(selectedComplaint.status ===
                  "IN PROGRESS" ||
                  selectedComplaint.status ===
                    "ASSIGNED") && (
                  <button
                    className="maintenance-success-btn"
                    onClick={() =>
                      resolveComplaint(
                        selectedComplaint
                      )
                    }
                  >
                    Mark Resolved
                  </button>
                )}

                {selectedComplaint.status ===
                  "RESOLVED" && (
                  <button
                    className="maintenance-warning-btn"
                    onClick={() =>
                      reopenComplaint(
                        selectedComplaint
                      )
                    }
                  >
                    Reopen Complaint
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          TECHNICIAN DETAILS MODAL
      ===================================================== */}

      {selectedTechnician && (
        <div
          className="maintenance-modal-overlay"
          onClick={() =>
            setSelectedTechnician(null)
          }
        >
          <div
            className="maintenance-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="maintenance-modal-header">
              <div>
                <span>TECHNICIAN PROFILE</span>

                <h2>
                  {selectedTechnician.name}
                </h2>

                <p>
                  {selectedTechnician.specialization}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedTechnician(null)
                }
              >
                ×
              </button>
            </div>

            <div className="complaint-detail-grid">
              <div>
                <span>Technician ID</span>
                <strong>
                  {selectedTechnician.id}
                </strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>
                  {selectedTechnician.phone}
                </strong>
              </div>

              <div>
                <span>Assigned</span>
                <strong>
                  {selectedTechnician.assigned}
                </strong>
              </div>

              <div>
                <span>Resolved</span>
                <strong>
                  {selectedTechnician.resolved}
                </strong>
              </div>

              <div>
                <span>Availability</span>
                <strong>
                  {selectedTechnician.availability}
                </strong>
              </div>
            </div>

            <button
              className="maintenance-primary-btn full"
              onClick={() => {
                setSelectedTechnician(null);
                goTo(
                  "admin-maintenance-assignments"
                );
              }}
            >
              View Assignments
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          TOAST
      ===================================================== */}

      {toast && (
        <div className="maintenance-toast">
          <span>✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}