import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import "./StudentsAdmin.css";

const STUDENTS_API = `${
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
}/api/students`;

const EMPTY_FORM = {
  name: "",
  registrationNo: "",
  mobile: "",
  email: "",
  branch: "",
  semester: "",
  department: "",
  isHosteller: false,
  status: "ACTIVE",
};

async function requestStudentsApi(url, options = {}) {
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
    throw new Error(
      "Unable to connect to EKAM server. Make sure the backend is running."
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "The student request could not be completed.");
  }

  return data;
}

function normalizeStudent(student) {
  return {
    ...student,
    registrationNo: student.registrationNo ?? student.registration_no ?? "",
    isHosteller: Boolean(student.isHosteller ?? student.is_hosteller),
  };
}

export default function StudentsAdmin() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadStudents = useCallback(async () => {
    try {
      const data = await requestStudentsApi(STUDENTS_API);
      setStudents(data.students.map(normalizeStudent));
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const retryLoad = () => {
    setLoading(true);
    setPageError("");
    loadStudents();
  };

  useEffect(() => {
    let active = true;

    requestStudentsApi(STUDENTS_API)
      .then((data) => {
        if (active) {
          setStudents(data.students.map(normalizeStudent));
        }
      })
      .catch((error) => {
        if (active) {
          setPageError(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;

    return students.filter((student) =>
      [
        student.name,
        student.registrationNo,
        student.mobile,
        student.email,
        student.branch,
        student.semester,
        student.department,
        student.isHosteller ? "Hosteller" : "Non-hosteller",
        student.status,
      ].some((value) => String(value ?? "").toLowerCase().includes(query))
    );
  }, [students, search]);

  const activeCount = students.filter(
    (student) => student.status?.toUpperCase() === "ACTIVE"
  ).length;
  const departmentCount = new Set(
    students.map((student) => student.department).filter(Boolean)
  ).size;

  const openAddForm = () => {
    setEditingStudent(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || "",
      registrationNo: student.registrationNo || "",
      mobile: student.mobile || "",
      email: student.email || "",
      branch: student.branch || "",
      semester: student.semester || "",
      department: student.department || "",
      isHosteller: student.isHosteller,
      status: student.status?.toUpperCase() || "ACTIVE",
    });
    setFormError("");
    setViewingStudent(null);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditingStudent(null);
    setFormError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (
      !formData.name.trim() ||
      !formData.registrationNo.trim() ||
      !/^\d{10}$/.test(formData.mobile.trim()) ||
      !formData.branch.trim() ||
      !formData.semester ||
      !formData.department.trim()
    ) {
      setFormError(
        "Complete the required fields and enter a valid 10-digit mobile number."
      );
      return;
    }

    setSaving(true);
    try {
      const editing = Boolean(editingStudent);
      const url = editing
        ? `${STUDENTS_API}/${encodeURIComponent(editingStudent.id)}`
        : STUDENTS_API;
      const data = await requestStudentsApi(url, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          registrationNo: formData.registrationNo.trim(),
          mobile: formData.mobile.trim(),
          email: formData.email.trim(),
          branch: formData.branch.trim(),
          department: formData.department.trim(),
        }),
      });
      const savedStudent = normalizeStudent(data.student);

      setStudents((previous) =>
        editing
          ? previous.map((student) =>
              String(student.id) === String(savedStudent.id)
                ? savedStudent
                : student
            )
          : [...previous, savedStudent]
      );
      setShowForm(false);
      setEditingStudent(null);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = async (student) => {
    if (!window.confirm(`Delete ${student.name}'s student record?`)) return;

    setDeletingId(student.id);
    setPageError("");
    try {
      await requestStudentsApi(
        `${STUDENTS_API}/${encodeURIComponent(student.id)}`,
        { method: "DELETE" }
      );
      setStudents((previous) =>
        previous.filter((item) => String(item.id) !== String(student.id))
      );
    } catch (error) {
      setPageError(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="students-page">
      <header className="students-header">
        <div>
          <div className="students-eyebrow">SUPER ADMIN</div>
          <h1>Students</h1>
          <p>View and manage student records across all departments.</p>
        </div>
        <button className="students-add-button" onClick={openAddForm}>
          <Plus size={18} />
          Add Student
        </button>
      </header>

      <section className="students-summary" aria-label="Student summary">
        <div className="students-summary-card">
          <span>Total Students</span>
          <strong>{students.length}</strong>
          <Users size={20} aria-hidden="true" />
        </div>
        <div className="students-summary-card">
          <span>Active Students</span>
          <strong>{activeCount}</strong>
          <GraduationCap size={20} aria-hidden="true" />
        </div>
        <div className="students-summary-card">
          <span>Departments</span>
          <strong>{departmentCount}</strong>
          <GraduationCap size={20} aria-hidden="true" />
        </div>
      </section>

      <section className="students-card">
        <div className="students-toolbar">
          <label className="students-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search students by name, registration no., mobile..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search students"
            />
          </label>
          <span className="students-count">
            Showing <strong>{filteredStudents.length}</strong> of{" "}
            <strong>{students.length}</strong> students
          </span>
        </div>

        {pageError && (
          <div className="students-page-error" role="alert">
            <span>{pageError}</span>
            <button onClick={retryLoad}>Try again</button>
          </div>
        )}

        {loading ? (
          <div className="students-empty">Loading students...</div>
        ) : pageError && students.length === 0 ? null : filteredStudents.length === 0 ? (
          <div className="students-empty">
            <Users size={30} aria-hidden="true" />
            <h2>{students.length ? "No matching students" : "No students yet"}</h2>
            <p>
              {students.length
                ? "Try another search term."
                : "Add a student to start building the student directory."}
            </p>
          </div>
        ) : (
          <div className="students-table-scroll">
            <table className="students-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>REGISTRATION NO.</th>
                  <th>MOBILE</th>
                  <th>EMAIL</th>
                  <th>BRANCH</th>
                  <th>SEMESTER</th>
                  <th>DEPARTMENT</th>
                  <th>RESIDENCE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="students-person">
                        <span className="students-avatar">
                          {student.name?.charAt(0).toUpperCase() || "S"}
                        </span>
                        <strong>{student.name}</strong>
                      </div>
                    </td>
                    <td className="students-registration">
                      {student.registrationNo || "—"}
                    </td>
                    <td>{student.mobile || "—"}</td>
                    <td>{student.email || "—"}</td>
                    <td>{student.branch || "—"}</td>
                    <td>{student.semester || "—"}</td>
                    <td>{student.department || "—"}</td>
                    <td>{student.isHosteller ? "Hosteller" : "Non-hosteller"}</td>
                    <td>
                      <span
                        className={`students-status status-${(
                          student.status || "inactive"
                        ).toLowerCase()}`}
                      >
                        {student.status || "INACTIVE"}
                      </span>
                    </td>
                    <td>
                      <div className="students-actions">
                        <button
                          className="students-view-action"
                          onClick={() => setViewingStudent(student)}
                        >
                          View
                        </button>
                        <button
                          className="students-edit-action"
                          onClick={() => openEditForm(student)}
                          aria-label={`Edit ${student.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="students-delete-action"
                          onClick={() => deleteStudent(student)}
                          disabled={deletingId === student.id}
                          aria-label={`Delete ${student.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(showForm || viewingStudent) && (
        <div
          className="students-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              if (showForm) closeForm();
              setViewingStudent(null);
            }
          }}
        >
          {showForm ? (
            <section
              className="students-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="student-form-title"
            >
              <div className="students-modal-header">
                <div>
                  <span>SUPER ADMIN</span>
                  <h2 id="student-form-title">
                    {editingStudent ? "Edit Student" : "Add Student"}
                  </h2>
                  <p>
                    {editingStudent
                      ? "Update this student's record."
                      : "Enter the student's details to create a record."}
                  </p>
                </div>
                <button
                  className="students-close-button"
                  onClick={closeForm}
                  aria-label="Close form"
                  disabled={saving}
                >
                  <X size={20} />
                </button>
              </div>

              <form className="students-form" onSubmit={handleSubmit}>
                <div className="students-form-grid">
                  <label>
                    Name *
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      autoComplete="name"
                      required
                    />
                  </label>
                  <label>
                    Registration No. *
                    <input
                      name="registrationNo"
                      value={formData.registrationNo}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    Mobile *
                    <input
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      maxLength="10"
                      value={formData.mobile}
                      onChange={handleChange}
                      autoComplete="tel"
                      required
                    />
                  </label>
                  <label>
                    Email *
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      required
                    />
                  </label>
                  <label>
                    Branch *
                    <input
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    Semester *
                    <input
                      name="semester"
                      type="number"
                      min="1"
                      max="12"
                      step="1"
                      value={formData.semester}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    Department *
                    <input
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    Residence Type *
                    <select
                      name="isHosteller"
                      value={formData.isHosteller ? "true" : "false"}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          isHosteller: event.target.value === "true",
                        }))
                      }
                    >
                      <option value="true">Hosteller</option>
                      <option value="false">Non-hosteller</option>
                    </select>
                  </label>
                  <label>
                    Status *
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </label>
                </div>

                {formError && (
                  <div className="students-form-error" role="alert">
                    {formError}
                  </div>
                )}

                <div className="students-modal-actions">
                  <button
                    type="button"
                    className="students-cancel-button"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="students-save-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingStudent
                        ? "Save Changes"
                        : "Create Student"}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <section
              className="students-modal students-details-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="student-details-title"
            >
              <div className="students-modal-header">
                <div>
                  <span>STUDENT DETAILS</span>
                  <h2 id="student-details-title">
                    {viewingStudent.name}
                  </h2>
                  <p>{viewingStudent.registrationNo || "No registration number"}</p>
                </div>
                <button
                  className="students-close-button"
                  onClick={() => setViewingStudent(null)}
                  aria-label="Close details"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="students-details-grid">
                <div>
                  <Phone size={16} />
                  <span>Mobile</span>
                  <strong>{viewingStudent.mobile || "—"}</strong>
                </div>
                <div>
                  <Mail size={16} />
                  <span>Email</span>
                  <strong>{viewingStudent.email || "—"}</strong>
                </div>
                <div>
                  <GraduationCap size={16} />
                  <span>Branch</span>
                  <strong>{viewingStudent.branch || "—"}</strong>
                </div>
                <div>
                  <GraduationCap size={16} />
                  <span>Semester</span>
                  <strong>{viewingStudent.semester || "—"}</strong>
                </div>
                <div>
                  <GraduationCap size={16} />
                  <span>Department</span>
                  <strong>{viewingStudent.department || "—"}</strong>
                </div>
                <div>
                  <Users size={16} />
                  <span>Residence Type</span>
                  <strong>
                    {viewingStudent.isHosteller
                      ? "Hosteller"
                      : "Non-hosteller"}
                  </strong>
                </div>
                <div>
                  <Users size={16} />
                  <span>Status</span>
                  <strong>{viewingStudent.status || "INACTIVE"}</strong>
                </div>
              </div>
              <div className="students-modal-actions">
                <button
                  className="students-cancel-button"
                  onClick={() => setViewingStudent(null)}
                >
                  Close
                </button>
                <button
                  className="students-save-button"
                  onClick={() => openEditForm(viewingStudent)}
                >
                  Edit Student
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
