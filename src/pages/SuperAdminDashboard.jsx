import React, { useEffect, useMemo, useState } from "react";
import "./SuperAdminDashboard.css";

const ADMINS_API = `${
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
}/api/admins`;
const ATTENDANCE_OVERVIEW_API = `${
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
}/api/attendance/overview`;

const DEPARTMENTS = [
  {
    name: "Academics",
    icon: "📚",
    color: "blue",
  },
  {
    name: "Hostel",
    icon: "🏠",
    color: "purple",
  },
  {
    name: "Security",
    icon: "🛡️",
    color: "red",
  },
  {
    name: "Accounts",
    icon: "💳",
    color: "green",
  },
  {
    name: "Maintenance",
    icon: "🔧",
    color: "orange",
  },
  {
    name: "Teaching Faculty",
    icon: "👨‍🏫",
    color: "cyan",
  },
  {
    name: "Documentation",
    icon: "📄",
    color: "pink",
  },
];

const DEFAULT_ISSUES = [
  {
    id: 1,
    title: "Food Quality",
    count: 21,
    period: "4 days",
    priority: "HIGH",
  },
  {
    id: 2,
    title: "Water Leakage",
    count: 14,
    period: "6 days",
    priority: "HIGH",
  },
  {
    id: 3,
    title: "Wi-Fi Failure",
    count: 11,
    period: "3 days",
    priority: "MEDIUM",
  },
  {
    id: 4,
    title: "Room Cleaning",
    count: 9,
    period: "5 days",
    priority: "MEDIUM",
  },
];

async function requestAdminsApi(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Unable to connect to the EKAM backend.");
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Administrator request failed.");
  }
  return data;
}

export default function SuperAdminDashboardPage() {
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [attendanceOverview, setAttendanceOverview] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState("");

  const [showAddAdmin, setShowAddAdmin] = useState(false);

  const [editingAdmin, setEditingAdmin] = useState(null);

  const [search, setSearch] = useState("");

  const [departmentFilter, setDepartmentFilter] = useState("All");

  const [toast, setToast] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    facultyId: "",
    mobile: "",
    email: "",
    department: "",
  });

  const showMessage = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2500);
  };

  useEffect(() => {
    let active = true;

    requestAdminsApi(ADMINS_API)
      .then((data) => {
        if (active) setAdmins(data.admins);
      })
      .catch((error) => {
        if (active) showMessage(error.message);
      })
      .finally(() => {
        if (active) setLoadingAdmins(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    requestAdminsApi(ATTENDANCE_OVERVIEW_API)
      .then((data) => {
        if (active) setAttendanceOverview(data);
      })
      .catch((error) => {
        if (active) setAttendanceError(error.message);
      })
      .finally(() => {
        if (active) setLoadingAttendance(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      facultyId: "",
      mobile: "",
      email: "",
      department: "",
    });

    setEditingAdmin(null);
  };

  const openAddAdmin = (department = "") => {
    resetForm();

    setFormData((prev) => ({
      ...prev,
      department,
    }));

    setShowAddAdmin(true);
  };

  const openEditAdmin = (admin) => {
    setEditingAdmin(admin);

    setFormData({
      name: admin.name,
      facultyId: admin.facultyId,
      mobile: admin.mobile,
      email: admin.email || "",
      department: admin.department,
    });

    setShowAddAdmin(true);
  };

  const closeModal = () => {
    setShowAddAdmin(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.facultyId.trim() ||
      !formData.mobile.trim() ||
      !formData.department
    ) {
      showMessage("Please complete all required fields.");
      return;
    }

    if (formData.mobile.replace(/\D/g, "").length < 10) {
      showMessage("Please enter a valid mobile number.");
      return;
    }

    const duplicateId = admins.some(
      (admin) =>
        admin.facultyId.toLowerCase() ===
          formData.facultyId.trim().toLowerCase() &&
        admin.id !== editingAdmin?.id
    );

    if (duplicateId) {
      showMessage("This Faculty/Admin ID already exists.");
      return;
    }

    const editing = Boolean(editingAdmin);
    try {
      const data = await requestAdminsApi(
        editing
          ? `${ADMINS_API}/${encodeURIComponent(editingAdmin.id)}`
          : ADMINS_API,
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify({
            ...formData,
            name: formData.name.trim(),
            facultyId: formData.facultyId.trim(),
            mobile: formData.mobile.replace(/\D/g, "").slice(-10),
            email: formData.email.trim(),
            status: editingAdmin?.status || "ACTIVE",
          }),
        }
      );
      setAdmins((previous) =>
        editing
          ? previous.map((admin) =>
              String(admin.id) === String(data.admin.id)
                ? data.admin
                : admin
            )
          : [...previous, data.admin]
      );
      closeModal();
      showMessage(
        editing
          ? "Department admin updated successfully."
          : `${data.admin.name} added as ${data.admin.department} Admin.`
      );
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleDelete = async (admin) => {
    const confirmed = window.confirm(
      `Remove ${admin.name} from ${admin.department} Admins?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await requestAdminsApi(
        `${ADMINS_API}/${encodeURIComponent(admin.id)}`,
        { method: "DELETE" }
      );
      setAdmins((previous) =>
        previous.filter((item) => String(item.id) !== String(admin.id))
      );
      showMessage("Department admin removed.");
    } catch (error) {
      showMessage(error.message);
    }
  };

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesSearch =
        admin.name?.toLowerCase().includes(search.toLowerCase()) ||
        admin.facultyId?.toLowerCase().includes(search.toLowerCase()) ||
        admin.department?.toLowerCase().includes(search.toLowerCase());

      const matchesDepartment =
        departmentFilter === "All" ||
        admin.department === departmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [admins, search, departmentFilter]);

  const getDepartmentAdmin = (departmentName) => {
    return admins.find(
      (admin) => admin.department === departmentName
    );
  };

  const assignedCount = admins.length;
  const attendanceChartDays = [
    ...Array(Math.max(0, 7 - (attendanceOverview?.days.length || 0))).fill(null),
    ...(attendanceOverview?.days || []).slice(-7),
  ];
  const attendanceChartMax = attendanceChartDays.reduce(
    (maximum, day) => Math.max(maximum, day?.attendedClasses || 0),
    0
  );

  const unassignedCount =
    DEPARTMENTS.length - assignedCount > 0
      ? DEPARTMENTS.length - assignedCount
      : 0;

  return (
    <div className="super-admin-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="super-admin-header">

        <div className="super-admin-title">

          <div className="super-admin-title-icon">
            ⚡
          </div>

          <div>

            <div className="super-admin-eyebrow">
              SUPER ADMIN
            </div>

            <h1>
              Super Admin Control Center
            </h1>

            <p>
              Campus-wide operations, intelligence & governance
            </p>

          </div>

        </div>


        {/* QUICK ACCESS */}

        <button
          className="super-add-admin-btn"
          onClick={() => openAddAdmin()}
        >
          <span className="super-add-icon">+</span>

          Add Department Admin
        </button>

      </div>


      {/* =====================================================
          CAMPUS STATUS
      ===================================================== */}

      <div className="super-campus-status">

        <div className="campus-status-left">

          <span className="status-dot"></span>

          <div>

            <strong>
              Campus System Operational
            </strong>

            <span>
              All major campus services are running normally
            </span>

          </div>

        </div>

        <div className="campus-status-right">
          EKAM System • Live
        </div>

      </div>


      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="super-admin-stats">

        <div className="super-stat-card">

          <div className="super-stat-icon">
            🏢
          </div>

          <div>
            <span>Total Departments</span>
            <strong>{DEPARTMENTS.length}</strong>
          </div>

        </div>


        <div className="super-stat-card">

          <div className="super-stat-icon">
            👤
          </div>

          <div>
            <span>Department Admins</span>
            <strong>{loadingAdmins ? "…" : assignedCount}</strong>
          </div>

        </div>


        <div className="super-stat-card">

          <div className="super-stat-icon">
            ⚠️
          </div>

          <div>
            <span>Recurring Issues</span>
            <strong>{DEFAULT_ISSUES.length}</strong>
          </div>

        </div>


        <div className="super-stat-card">

          <div className="super-stat-icon">
            📊
          </div>

          <div>
            <span>Attendance Rate</span>
            <strong>
              {loadingAttendance
                ? "…"
                : attendanceOverview?.totals.totalClasses
                ? `${Math.round(
                    (attendanceOverview.totals.attendedClasses /
                      attendanceOverview.totals.totalClasses) *
                      100
                  )}%`
                : "—"}
            </strong>
          </div>

        </div>

      </div>

      <section className="super-admin-panel attendance-overview-panel">
        <div className="super-panel-header">
          <div>
            <h2>Campus Attendance</h2>
            <p>Live attendance records shared with student and faculty dashboards.</p>
          </div>
          {attendanceOverview?.totals && (
            <span className="panel-badge">
              {attendanceOverview.totals.totalClasses
                ? `${Math.round(
                    (attendanceOverview.totals.attendedClasses /
                      attendanceOverview.totals.totalClasses) *
                      100
                  )}% attendance`
                : "No records yet"}
            </span>
          )}
        </div>

        {attendanceError ? (
          <p className="attendance-overview-message">{attendanceError}</p>
        ) : loadingAttendance ? (
          <p className="attendance-overview-message">Loading attendance data...</p>
        ) : (
          <>
            <div className="attendance-overview-summary">
              <div>
                <span>Students recorded</span>
                <strong>{attendanceOverview.totals.students}</strong>
              </div>
              <div>
                <span>Classes recorded</span>
                <strong>{attendanceOverview.totals.totalClasses}</strong>
              </div>
              <div>
                <span>Absent entries</span>
                <strong>{attendanceOverview.totals.absentClasses}</strong>
              </div>
            </div>
            <div
              className="attendance-overview-chart"
              role="img"
              aria-label="Daily campus attendance for the last seven days"
            >
              {attendanceChartDays.map((day, index) => {
                const dateLabel = day
                  ? String(day.date).slice(5, 10)
                  : "—";
                const count = day?.attendedClasses || 0;
                return (
                  <div
                    className="attendance-overview-day"
                    key={day ? String(day.date).slice(0, 10) : `empty-${index}`}
                  >
                    <span>{count}</span>
                    <div className="attendance-overview-bar-track">
                      <span
                        style={{
                          height: `${attendanceChartMax ? Math.max(4, (count / attendanceChartMax) * 100) : 4}%`,
                        }}
                      />
                    </div>
                    <small>{dateLabel}</small>
                  </div>
                );
              })}
            </div>
            {attendanceOverview.totals.totalClasses === 0 && (
              <p className="attendance-overview-message">
                The chart is ready; it will show real daily attendance as faculty enters records.
              </p>
            )}
          </>
        )}
      </section>


      {/* =====================================================
          MAIN GRID
      ===================================================== */}

      <div className="super-admin-grid">

        {/* DEPARTMENT OVERVIEW */}

        <section className="super-admin-panel">

          <div className="super-panel-header">

            <div>
              <h2>Department Overview</h2>

              <p>
                Current status of all campus departments
              </p>
            </div>

            <span className="panel-badge">
              {DEPARTMENTS.length} Departments
            </span>

          </div>


          <div className="department-health-list">

            {DEPARTMENTS.map((department) => {

              const admin = getDepartmentAdmin(
                department.name
              );

              return (
                <div
                  className="department-health-row"
                  key={department.name}
                >

                  <div
                    className={`department-icon ${department.color}`}
                  >
                    {department.icon}
                  </div>


                  <div className="department-info">

                    <strong>
                      {department.name}
                    </strong>

                    <span>
                      {admin
                        ? `Admin: ${admin.name}`
                        : "Admin: Not Assigned"}
                    </span>

                  </div>


                  <span
                    className={
                      admin
                        ? "department-status active"
                        : "department-status"
                    }
                  >
                    {admin ? "ACTIVE" : "NEEDS ADMIN"}
                  </span>

                </div>
              );
            })}

          </div>

        </section>


        {/* RECURRING ISSUES */}

        <section className="super-admin-panel">

          <div className="super-panel-header">

            <div>
              <h2>Recurring Issues</h2>

              <p>
                Problems detected across campus
              </p>
            </div>

            <span className="warning-badge">
              AI DETECTED
            </span>

          </div>


          <div className="recurring-issues-list">

            {DEFAULT_ISSUES.map((issue) => (
              <div
                className="recurring-issue"
                key={issue.id}
              >

                <div className="issue-number">
                  {issue.count}
                </div>


                <div className="issue-info">

                  <strong>
                    {issue.title}
                  </strong>

                  <span>
                    {issue.count} complaints in{" "}
                    {issue.period}
                  </span>

                </div>


                <span
                  className={`issue-priority ${issue.priority.toLowerCase()}`}
                >
                  {issue.priority}
                </span>

              </div>
            ))}

          </div>


          <div className="recurring-footer">
            <strong>EKAM Intelligence:</strong>{" "}
            repeated problems are automatically surfaced
            for Super Admin review.

          </div>

        </section>

      </div>


      {/* =====================================================
          ADMIN MANAGEMENT
      ===================================================== */}

      <section className="super-admin-panel department-admin-section">

        <div className="super-panel-header">

          <div>

            <h2>
              Department Admin Management
            </h2>

            <p>
              Assign and manage administrators for every
              campus department.
            </p>

          </div>


          <button
            className="small-add-admin-btn"
            onClick={() => openAddAdmin()}
          >
            + Add Admin
          </button>

        </div>


        {/* SEARCH + FILTER */}

        <div className="admin-toolbar">

          <div className="admin-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search admin, ID or department..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>


          <select
            className="department-filter"
            value={departmentFilter}
            onChange={(e) =>
              setDepartmentFilter(e.target.value)
            }
          >

            <option value="All">
              All Departments
            </option>

            {DEPARTMENTS.map((department) => (
              <option
                key={department.name}
                value={department.name}
              >
                {department.name}
              </option>
            ))}

          </select>

        </div>


        {/* ADMIN LIST */}

        {loadingAdmins ? (
          <div className="empty-admin-state">
            <h3>Loading department administrators...</h3>
          </div>
        ) : filteredAdmins.length === 0 ? (

          <div className="empty-admin-state">

            <div className="empty-admin-icon">
              👤
            </div>

            <h3>
              {admins.length === 0
                ? "No Department Admins Yet"
                : "No Matching Admins"}
            </h3>

            <p>
              {admins.length === 0
                ? "Assign administrators to manage campus departments."
                : "Try changing your search or department filter."}
            </p>

            {admins.length === 0 && (
              <button
                className="empty-add-btn"
                onClick={() => openAddAdmin()}
              >
                + Add First Department Admin
              </button>
            )}

          </div>

        ) : (

          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>

                <tr>

                  <th>ADMIN</th>

                  <th>DEPARTMENT</th>

                  <th>FACULTY ID</th>

                  <th>CONTACT</th>

                  <th>STATUS</th>

                  <th>ACTION</th>

                </tr>

              </thead>


              <tbody>

                {filteredAdmins.map((admin) => {

                  const department =
                    DEPARTMENTS.find(
                      (item) =>
                        item.name === admin.department
                    );

                  return (
                    <tr key={admin.id}>

                      <td>

                        <div className="admin-person">

                          <div className="admin-avatar">
                            {admin.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <strong>
                              {admin.name}
                            </strong>

                            <span>
                              {admin.email ||
                                "No email added"}
                            </span>

                          </div>

                        </div>

                      </td>


                      <td>

                        <div className="admin-department">

                          <span
                            className={`department-icon small ${department?.color || "blue"}`}
                          >
                            {department?.icon || "🏢"}
                          </span>

                          {admin.department}

                        </div>

                      </td>


                      <td>
                        <span className="faculty-id">
                          {admin.facultyId}
                        </span>
                      </td>


                      <td>
                        {admin.mobile}
                      </td>


                      <td>

                        <span className="admin-status-active">
                          ACTIVE
                        </span>

                      </td>


                      <td>

                        <div className="admin-actions">

                          <button
                            className="edit-admin-btn"
                            onClick={() =>
                              openEditAdmin(admin)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-admin-btn"
                            onClick={() =>
                              handleDelete(admin)
                            }
                          >
                            Remove
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* =====================================================
          DEPARTMENT CARDS
      ===================================================== */}

      <section className="super-admin-panel">

        <div className="super-panel-header">

          <div>
            <h2>Department Administration</h2>

            <p>
              Quickly assign or manage department ownership.
            </p>
          </div>

        </div>


        <div className="department-admin-grid">

          {DEPARTMENTS.map((department) => {

            const admin = getDepartmentAdmin(
              department.name
            );

            return (
              <div
                className="department-admin-card"
                key={department.name}
              >

                <div className="admin-card-top">

                  <div
                    className={`department-icon ${department.color}`}
                  >
                    {department.icon}
                  </div>

                  <span
                    className={
                      admin
                        ? "admin-assigned"
                        : "admin-unassigned"
                    }
                  >
                    {admin ? "ACTIVE" : "UNASSIGNED"}
                  </span>

                </div>


                <h3>
                  {department.name}
                </h3>


                <p>
                  {admin
                    ? `${admin.name} • ${admin.facultyId}`
                    : "No department administrator assigned."}
                </p>


                <button
                  className="assign-admin-btn"
                  onClick={() =>
                    admin
                      ? openEditAdmin(admin)
                      : openAddAdmin(department.name)
                  }
                >
                  {admin
                    ? "Manage Admin"
                    : "Assign Admin"}
                </button>

              </div>
            );
          })}

        </div>

      </section>


      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className="super-admin-panel">

        <div className="super-panel-header">

          <div>
            <h2>Quick Actions</h2>

            <p>
              Frequently used Super Admin controls
            </p>
          </div>

        </div>


        <div className="super-quick-actions">

          <button
            className="super-quick-action"
            onClick={() => openAddAdmin()}
          >

            <span>👤</span>

            <div>
              <strong>
                Add Department Admin
              </strong>

              <small>
                Assign an administrator
              </small>
            </div>

          </button>


          <button
            className="super-quick-action"
            onClick={() =>
              showMessage(
                "Notice management module is ready to connect."
              )
            }
          >

            <span>📢</span>

            <div>
              <strong>
                Publish Campus Notice
              </strong>

              <small>
                Send campus announcements
              </small>
            </div>

          </button>


          <button
            className="super-quick-action"
            onClick={() =>
              showMessage(
                "Campus analytics module opened."
              )
            }
          >

            <span>📊</span>

            <div>
              <strong>
                Campus Analytics
              </strong>

              <small>
                Review campus performance
              </small>
            </div>

          </button>


          <button
            className="super-quick-action"
            onClick={() =>
              showMessage(
                "System settings module opened."
              )
            }
          >

            <span>⚙️</span>

            <div>
              <strong>
                System Settings
              </strong>

              <small>
                Manage EKAM configuration
              </small>
            </div>

          </button>

        </div>

      </section>


      {/* =====================================================
          ADD / EDIT ADMIN MODAL
      ===================================================== */}

      {showAddAdmin && (

        <div
          className="super-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="super-admin-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="super-modal-header">

              <div>

                <span className="super-modal-eyebrow">
                  SUPER ADMIN
                </span>

                <h2>
                  {editingAdmin
                    ? "Edit Department Admin"
                    : "Add Department Admin"}
                </h2>

                <p>
                  {editingAdmin
                    ? "Update administrator information."
                    : "Assign an administrator to a campus department."}
                </p>

              </div>


              <button
                className="super-modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>


            <form
              className="super-admin-form"
              onSubmit={handleSubmit}
            >

              {/* NAME */}

              <div className="form-field">

                <label>
                  Admin Name <span>*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleChange}
                />

              </div>


              {/* FACULTY ID */}

              <div className="form-field">

                <label>
                  Faculty / Admin ID <span>*</span>
                </label>

                <input
                  type="text"
                  name="facultyId"
                  placeholder="e.g. EKAM-ADM-001"
                  value={formData.facultyId}
                  onChange={handleChange}
                />

              </div>


              {/* MOBILE */}

              <div className="form-field">

                <label>
                  Mobile Number <span>*</span>
                </label>

                <input
                  type="tel"
                  name="mobile"
                  placeholder="Enter 10-digit mobile number"
                  value={formData.mobile}
                  onChange={handleChange}
                />

              </div>


              {/* EMAIL */}

              <div className="form-field">

                <label>
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="admin@college.edu"
                  value={formData.email}
                  onChange={handleChange}
                />

              </div>


              {/* DEPARTMENT */}

              <div className="form-field">

                <label>
                  Department <span>*</span>
                </label>

                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                >

                  <option value="">
                    Select department
                  </option>

                  {DEPARTMENTS.map(
                    (department) => (
                      <option
                        key={department.name}
                        value={department.name}
                      >
                        {department.name}
                      </option>
                    )
                  )}

                </select>

              </div>


              {/* ACTIONS */}

              <div className="super-modal-actions">

                <button
                  type="button"
                  className="super-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="super-submit-btn"
                >
                  {editingAdmin
                    ? "Save Changes"
                    : "Create Department Admin"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          TOAST
      ===================================================== */}

      {toast && (

        <div className="super-toast">
          <span>✓</span>
          {toast}
        </div>

      )}

    </div>
  );
}