import React, { useEffect, useMemo, useState } from "react";
import "./DepartmentAdmins.css";

const ADMINS_API = `${
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
}/api/admins`;

const DEPARTMENTS = [
  { name: "Academics", icon: "📚" },
  { name: "Hostel", icon: "🏠" },
  { name: "Security", icon: "🛡️" },
  { name: "Accounts", icon: "💳" },
  { name: "Maintenance", icon: "🔧" },
  { name: "Teaching Faculty", icon: "👨‍🏫" },
  { name: "Documentation", icon: "📄" },
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

export default function DepartmentAdmins() {
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    facultyId: "",
    mobile: "",
    email: "",
    department: "",
  });

  const [message, setMessage] = useState("");

  const loadAdmins = async () => {
    setLoading(true);
    setPageError("");
    try {
      const data = await requestAdminsApi(ADMINS_API);
      setAdmins(data.admins);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    requestAdminsApi(ADMINS_API)
      .then((data) => {
        if (active) setAdmins(data.admins);
      })
      .catch((error) => {
        if (active) setPageError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const text = search.toLowerCase();

      const matchesSearch =
        admin.name?.toLowerCase().includes(text) ||
        admin.facultyId?.toLowerCase().includes(text) ||
        admin.department?.toLowerCase().includes(text) ||
        admin.mobile?.includes(search);

      const matchesDepartment =
        department === "All" || admin.department === department;

      return matchesSearch && matchesDepartment;
    });
  }, [admins, search, department]);

  const openAddModal = () => {
    setEditingAdmin(null);

    setFormData({
      name: "",
      facultyId: "",
      mobile: "",
      email: "",
      department: "",
    });

    setMessage("");
    setShowModal(true);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);

    setFormData({
      name: admin.name || "",
      facultyId: admin.facultyId || "",
      mobile: admin.mobile || "",
      email: admin.email || "",
      department: admin.department || "",
    });

    setMessage("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setMessage("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.facultyId.trim() ||
      !formData.mobile.trim() ||
      !formData.department
    ) {
      setMessage("Please complete all required fields.");
      return;
    }

    if (formData.mobile.replace(/\D/g, "").length < 10) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    const duplicateId = admins.some(
      (admin) =>
        admin.facultyId?.toLowerCase() ===
          formData.facultyId.trim().toLowerCase() &&
        admin.id !== editingAdmin?.id
    );

    if (duplicateId) {
      setMessage("This Faculty/Admin ID already exists.");
      return;
    }

    setSaving(true);
    try {
      const editing = Boolean(editingAdmin);
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
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeAdmin = async (admin) => {
    const confirmed = window.confirm(
      `Remove ${admin.name} from ${admin.department} Admins?`
    );

    if (!confirmed) return;

    setPageError("");
    try {
      await requestAdminsApi(
        `${ADMINS_API}/${encodeURIComponent(admin.id)}`,
        { method: "DELETE" }
      );
      setAdmins((previous) =>
        previous.filter((item) => String(item.id) !== String(admin.id))
      );
    } catch (error) {
      setPageError(error.message);
    }
  };

  return (
    <div className="department-admins-page">

      {/* HEADER */}

      <div className="department-admins-header">

        <div>
          <div className="department-admins-eyebrow">
            SUPER ADMIN
          </div>

          <h1>Department Administrators</h1>

          <p>
            Manage all administrators assigned to EKAM campus
            departments.
          </p>
        </div>

        <button
          className="department-admins-add"
          onClick={openAddModal}
        >
          + Add Admin
        </button>

      </div>

      {/* SUMMARY */}

      <div className="department-admins-summary">

        <div>
          <span>Total Administrators</span>
          <strong>{admins.length}</strong>
        </div>

        <div>
          <span>Departments</span>
          <strong>{DEPARTMENTS.length}</strong>
        </div>

        <div>
          <span>Active Admins</span>
          <strong>
            {
              admins.filter(
                (admin) => admin.status === "ACTIVE"
              ).length
            }
          </strong>
        </div>

      </div>

      {/* ADMIN LIST */}

      <section className="department-admins-card">

        <div className="department-admins-toolbar">

          <div className="department-admin-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search by admin name, Faculty ID, department..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <select
            value={department}
            onChange={(e) =>
              setDepartment(e.target.value)
            }
          >
            <option value="All">
              All Departments
            </option>

            {DEPARTMENTS.map((item) => (
              <option
                key={item.name}
                value={item.name}
              >
                {item.name}
              </option>
            ))}
          </select>

        </div>

        <div className="department-admins-count">
          Showing{" "}
          <strong>{filteredAdmins.length}</strong>{" "}
          administrator
          {filteredAdmins.length !== 1 ? "s" : ""}
        </div>

        {pageError && (
          <div className="department-admins-form-error" role="alert">
            {pageError}
            <button type="button" onClick={loadAdmins}>Try again</button>
          </div>
        )}

        {loading ? (
          <div className="department-admins-empty">
            <h3>Loading administrators...</h3>
          </div>
        ) : filteredAdmins.length === 0 ? (

          <div className="department-admins-empty">

            <div>👤</div>

            <h3>No administrators found</h3>

            <p>
              Add a department administrator or change
              your search/filter.
            </p>

          </div>

        ) : (

          <div className="department-admin-table-wrapper">

            <table className="department-admin-table">

              <thead>
                <tr>
                  <th>ADMIN</th>
                  <th>DEPARTMENT</th>
                  <th>FACULTY ID</th>
                  <th>CONTACT</th>
                  <th>EMAIL</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>

                {filteredAdmins.map((admin) => {

                  const dept = DEPARTMENTS.find(
                    (item) =>
                      item.name === admin.department
                  );

                  return (
                    <tr key={admin.id}>

                      <td>
                        <div className="department-admin-person">

                          <div className="department-admin-avatar">
                            {admin.name
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {admin.name}
                            </strong>

                            <span>
                              {admin.id}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>

                        <div className="department-admin-department">

                          <span>
                            {dept?.icon || "🏢"}
                          </span>

                          {admin.department}

                        </div>

                      </td>

                      <td>

                        <span className="department-admin-faculty-id">
                          {admin.facultyId}
                        </span>

                      </td>

                      <td>
                        {admin.mobile || "—"}
                      </td>

                      <td>
                        {admin.email || "—"}
                      </td>

                      <td>

                        <span className="department-admin-status">
                          {admin.status || "ACTIVE"}
                        </span>

                      </td>

                      <td>

                        <div className="department-admin-actions">

                          <button
                            className="department-admin-edit"
                            onClick={() =>
                              openEditModal(admin)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="department-admin-remove"
                            onClick={() =>
                              removeAdmin(admin)
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

      {/* ADD / EDIT MODAL */}

      {showModal && (

        <div
          className="department-admin-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="department-admin-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="department-admin-modal-header">

              <div>
                <span>
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
                className="department-admin-modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            <form
              className="department-admin-form"
              onSubmit={handleSubmit}
            >

              <div className="department-admin-form-grid">

                <div className="department-admin-field">

                  <label>
                    Admin Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                  />

                </div>

                <div className="department-admin-field">

                  <label>
                    Faculty / Admin ID *
                  </label>

                  <input
                    type="text"
                    name="facultyId"
                    placeholder="e.g. ADM-001"
                    value={formData.facultyId}
                    onChange={handleChange}
                  />

                </div>

                <div className="department-admin-field">

                  <label>
                    Mobile Number *
                  </label>

                  <input
                    type="tel"
                    name="mobile"
                    placeholder="10-digit mobile number"
                    value={formData.mobile}
                    onChange={handleChange}
                  />

                </div>

                <div className="department-admin-field">

                  <label>
                    Email Address *
                  </label>

                  <input
                    type="email"
                    name="email"
                    placeholder="admin@college.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="department-admin-field full">

                  <label>
                    Department *
                  </label>

                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                  >

                    <option value="">
                      Select department
                    </option>

                    {DEPARTMENTS.map((item) => (
                      <option
                        key={item.name}
                        value={item.name}
                      >
                        {item.name}
                      </option>
                    ))}

                  </select>

                </div>

              </div>

              {message && (
                <div className="department-admin-form-error">
                  {message}
                </div>
              )}

              <div className="department-admin-modal-actions">

                <button
                  type="button"
                  className="department-admin-cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="department-admin-save"
                  disabled={saving}
                >
                  {editingAdmin
                    ? saving ? "Saving..." : "Save Changes"
                    : saving ? "Creating..." : "Create Admin"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}