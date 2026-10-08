import React, { useEffect, useState } from "react";
import "./HostelAdmin.css";

/* =========================================================
   INITIAL DATA
========================================================= */

const INITIAL_ROOMS = [
  {
    id: 1,
    room: "A-101",
    block: "Block A",
    capacity: 3,
    occupied: 3,
    students: ["Adya Dash", "Priya Das", "Riya Mohanty"],
    status: "FULL",
  },
  {
    id: 2,
    room: "A-102",
    block: "Block A",
    capacity: 3,
    occupied: 2,
    students: ["Ananya Patnaik", "Sneha Sahu"],
    status: "AVAILABLE",
  },
  {
    id: 3,
    room: "B-201",
    block: "Block B",
    capacity: 2,
    occupied: 2,
    students: ["Rahul Kumar", "Amit Das"],
    status: "FULL",
  },
  {
    id: 4,
    room: "B-202",
    block: "Block B",
    capacity: 3,
    occupied: 1,
    students: ["Neha Singh"],
    status: "AVAILABLE",
  },
  {
    id: 5,
    room: "C-301",
    block: "Block C",
    capacity: 3,
    occupied: 0,
    students: [],
    status: "VACANT",
  },
];

const INITIAL_COMPLAINTS = [
  {
    id: 1,
    student: "Adya Dash",
    room: "A-101",
    category: "Water & Plumbing",
    complaint: "Bathroom tap leakage",
    priority: "HIGH",
    status: "OPEN",
    created: "Today",
  },
  {
    id: 2,
    student: "Priya Das",
    room: "A-102",
    category: "Cleaning",
    complaint: "Room cleaning required",
    priority: "MEDIUM",
    status: "IN PROGRESS",
    created: "Today",
  },
  {
    id: 3,
    student: "Rahul Kumar",
    room: "B-201",
    category: "Electrical",
    complaint: "Ceiling fan not working",
    priority: "HIGH",
    status: "OPEN",
    created: "Yesterday",
  },
  {
    id: 4,
    student: "Neha Singh",
    room: "B-202",
    category: "Maintenance",
    complaint: "Window lock damaged",
    priority: "MEDIUM",
    status: "RESOLVED",
    created: "Yesterday",
  },
];

const INITIAL_GATE_PASSES = [
  {
    id: 1,
    student: "Adya Dash",
    room: "A-101",
    destination: "Home",
    departure: "08 Oct 2026, 5:00 PM",
    arrival: "09 Oct 2026, 8:00 PM",
    reason: "Family visit",
    type: "NORMAL",
    status: "PENDING",
  },
  {
    id: 2,
    student: "Rahul Kumar",
    room: "B-201",
    destination: "Bhubaneswar",
    departure: "08 Oct 2026, 6:00 PM",
    arrival: "08 Oct 2026, 9:00 PM",
    reason: "Personal work",
    type: "NORMAL",
    status: "PENDING",
  },
  {
    id: 3,
    student: "Priya Das",
    room: "A-102",
    destination: "Hospital",
    departure: "08 Oct 2026, 2:00 PM",
    arrival: "08 Oct 2026, 6:00 PM",
    reason: "Medical emergency",
    type: "EMERGENCY",
    status: "PENDING",
  },
  {
    id: 4,
    student: "Neha Singh",
    room: "B-202",
    destination: "Home",
    departure: "08 Oct 2026, 10:00 AM",
    arrival: "08 Oct 2026, 7:00 PM",
    reason: "Personal work",
    type: "NORMAL",
    status: "APPROVED",
  },
];

const INITIAL_MENU = {
  breakfast: "Poha, Bread, Banana & Tea",
  lunch: "Rice, Dal, Mix Veg, Paneer Curry & Salad",
  snacks: "Samosa & Tea",
  dinner: "Roti, Rice, Dal, Chicken Curry & Mixed Vegetables",
};

const INITIAL_FEEDBACK = [
  {
    id: 1,
    student: "Adya Dash",
    rating: 2,
    category: "Food Quality",
    message: "Lunch was too oily today.",
    time: "Today",
  },
  {
    id: 2,
    student: "Priya Das",
    rating: 4,
    category: "Taste",
    message: "Dinner was good.",
    time: "Today",
  },
  {
    id: 3,
    student: "Rahul Kumar",
    rating: 2,
    category: "Food Quality",
    message: "Food quality needs improvement.",
    time: "Yesterday",
  },
];

const INITIAL_NOTICES = [
  {
    id: 1,
    title: "Hostel Inspection",
    message:
      "Monthly hostel inspection will be conducted tomorrow.",
    target: "All Hostelers",
    time: "Today",
  },
  {
    id: 2,
    title: "Mess Timing Update",
    message:
      "Dinner timing has been extended by 15 minutes.",
    target: "All Hostelers",
    time: "Yesterday",
  },
];

/* =========================================================
   MODAL
========================================================= */

function HostelModal({
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
      className="hostel-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="hostel-modal">

        <div className="hostel-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <button
            type="button"
            className="hostel-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form
          className="hostel-modal-form"
          onSubmit={onSubmit}
        >
          {children}

          <div className="hostel-modal-actions">
            <button
              type="button"
              className="hostel-secondary-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="hostel-primary-btn"
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

export default function HostelAdmin({ module = "dashboard" }) {
 const [activeModule, setActiveModule] =
  useState(module);

useEffect(() => {
  setActiveModule(module);
}, [module]);

  const [rooms, setRooms] =
    useState(INITIAL_ROOMS);

  const [complaints, setComplaints] =
    useState(INITIAL_COMPLAINTS);

  const [gatePasses, setGatePasses] =
    useState(INITIAL_GATE_PASSES);

  const [menu, setMenu] =
    useState(INITIAL_MENU);

  const [feedback, setFeedback] =
    useState(INITIAL_FEEDBACK);

  const [notices, setNotices] =
    useState(INITIAL_NOTICES);

  const [modal, setModal] =
    useState(null);

  /* =========================================================
     FORM STATES
  ========================================================= */

  const [roomForm, setRoomForm] = useState({
    room: "",
    block: "Block A",
    capacity: "3",
  });

  const [complaintForm, setComplaintForm] =
    useState({
      student: "",
      room: "",
      category: "Water & Plumbing",
      complaint: "",
      priority: "MEDIUM",
    });

  const [passForm, setPassForm] =
    useState({
      student: "",
      room: "",
      destination: "",
      departure: "",
      arrival: "",
      reason: "",
      type: "NORMAL",
    });

  const [menuForm, setMenuForm] =
    useState(INITIAL_MENU);

  const [noticeForm, setNoticeForm] =
    useState({
      title: "",
      message: "",
      target: "All Hostelers",
    });

  /* =========================================================
     HELPERS
  ========================================================= */

  const closeModal = () => {
    setModal(null);
  };

  /* =========================================================
     ROOM
  ========================================================= */

  const handleAddRoom = (e) => {
    e.preventDefault();

    if (!roomForm.room.trim()) {
      alert("Please enter a room number.");
      return;
    }

    const capacity = Number(roomForm.capacity);

    const newRoom = {
      id: Date.now(),
      room: roomForm.room.trim(),
      block: roomForm.block,
      capacity,
      occupied: 0,
      students: [],
      status: "VACANT",
    };

    setRooms((previous) => [
      ...previous,
      newRoom,
    ]);

    setRoomForm({
      room: "",
      block: "Block A",
      capacity: "3",
    });

    closeModal();
  };

  /* =========================================================
     COMPLAINT
  ========================================================= */

  const handleAddComplaint = (e) => {
    e.preventDefault();

    if (
      !complaintForm.student.trim() ||
      !complaintForm.room.trim() ||
      !complaintForm.complaint.trim()
    ) {
      alert("Please fill all complaint details.");
      return;
    }

    const newComplaint = {
      id: Date.now(),
      student: complaintForm.student.trim(),
      room: complaintForm.room.trim(),
      category: complaintForm.category,
      complaint: complaintForm.complaint.trim(),
      priority: complaintForm.priority,
      status: "OPEN",
      created: "Just now",
    };

    setComplaints((previous) => [
      newComplaint,
      ...previous,
    ]);

    setComplaintForm({
      student: "",
      room: "",
      category: "Water & Plumbing",
      complaint: "",
      priority: "MEDIUM",
    });

    closeModal();
  };

  const updateComplaintStatus = (id, status) => {
    setComplaints((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, status }
          : item
      )
    );
  };

  /* =========================================================
     GATE PASS
  ========================================================= */

  const handleCreateGatePass = (e) => {
    e.preventDefault();

    if (
      !passForm.student.trim() ||
      !passForm.room.trim() ||
      !passForm.destination.trim() ||
      !passForm.departure ||
      !passForm.arrival ||
      !passForm.reason.trim()
    ) {
      alert("Please complete the gate pass form.");
      return;
    }

    const newPass = {
      id: Date.now(),
      student: passForm.student.trim(),
      room: passForm.room.trim(),
      destination: passForm.destination.trim(),
      departure: passForm.departure,
      arrival: passForm.arrival,
      reason: passForm.reason.trim(),
      type: passForm.type,
      status: "PENDING",
    };

    setGatePasses((previous) => [
      newPass,
      ...previous,
    ]);

    setPassForm({
      student: "",
      room: "",
      destination: "",
      departure: "",
      arrival: "",
      reason: "",
      type: "NORMAL",
    });

    closeModal();
  };

  const updateGatePass = (id, status) => {
    setGatePasses((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, status }
          : item
      )
    );
  };

  /* =========================================================
     MENU
  ========================================================= */

  const handleUpdateMenu = (e) => {
    e.preventDefault();

    setMenu(menuForm);
    closeModal();

    alert("Today's mess menu updated successfully.");
  };

  /* =========================================================
     NOTICE
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

    const newNotice = {
      id: Date.now(),
      title: noticeForm.title.trim(),
      message: noticeForm.message.trim(),
      target: noticeForm.target,
      time: "Just now",
    };

    setNotices((previous) => [
      newNotice,
      ...previous,
    ]);

    setNoticeForm({
      title: "",
      message: "",
      target: "All Hostelers",
    });

    closeModal();
  };

  /* =========================================================
     DASHBOARD
  ========================================================= */

  const renderDashboard = () => {
    const occupiedRooms = rooms.filter(
      (room) => room.occupied > 0
    ).length;

    const openComplaints = complaints.filter(
      (item) =>
        item.status === "OPEN" ||
        item.status === "IN PROGRESS"
    ).length;

    const pendingPasses = gatePasses.filter(
      (item) => item.status === "PENDING"
    ).length;

    const emergencyPasses = gatePasses.filter(
      (item) =>
        item.type === "EMERGENCY" &&
        item.status === "PENDING"
    ).length;

    return (
      <div className="hostel-admin-page">

        <div className="hostel-admin-header">

          <div>
            <span className="hostel-admin-eyebrow">
              HOSTEL ADMIN
            </span>

            <h1>Hostel Management</h1>

            <p>
              Manage rooms, residents, complaints, mess
              operations and hostel gate passes from one
              place.
            </p>
          </div>

          <div className="hostel-admin-status">
            <span></span>
            Hostel System Active
          </div>

        </div>

        <div className="hostel-admin-stats">

          <div className="hostel-stat-card">
            <span>Total Rooms</span>
            <strong>{rooms.length}</strong>
            <small>Across all hostels</small>
          </div>

          <div className="hostel-stat-card">
            <span>Occupied Rooms</span>
            <strong>{occupiedRooms}</strong>
            <small>
              {rooms.length
                ? Math.round(
                    (occupiedRooms / rooms.length) * 100
                  )
                : 0}
              % occupancy
            </small>
          </div>

          <div className="hostel-stat-card">
            <span>Open Complaints</span>
            <strong>{openComplaints}</strong>
            <small>Needs attention</small>
          </div>

          <div className="hostel-stat-card">
            <span>Gate Pass Requests</span>
            <strong>{pendingPasses}</strong>
            <small>Pending approval</small>
          </div>

        </div>

        <div className="hostel-admin-grid">

          {/* ROOM */}

          <section className="hostel-admin-card">

            <div className="hostel-card-header">
              <div>
                <h2>Room Management</h2>
                <p>
                  Monitor hostel rooms and occupancy.
                </p>
              </div>

              <button
                onClick={() =>
                  setActiveModule("rooms")
                }
              >
                Manage →
              </button>
            </div>

            <div className="hostel-list">

              <div>
                <span className="hostel-list-icon">
                  🛏️
                </span>

                <div>
                  <strong>Room Allocation</strong>
                  <small>
                    Manage student room assignments
                  </small>
                </div>
              </div>

              <div>
                <span className="hostel-list-icon">
                  🏢
                </span>

                <div>
                  <strong>Hostel Blocks</strong>
                  <small>
                    8 hostel blocks currently active
                  </small>
                </div>
              </div>

              <div>
                <span className="hostel-list-icon">
                  👥
                </span>

                <div>
                  <strong>Resident Directory</strong>
                  <small>
                    View hostel residents and room details
                  </small>
                </div>
              </div>

            </div>

          </section>

          {/* COMPLAINTS */}

          <section className="hostel-admin-card">

            <div className="hostel-card-header">
              <div>
                <h2>Hostel Complaints</h2>
                <p>
                  Track hostel-related complaints.
                </p>
              </div>

              <button
                onClick={() =>
                  setActiveModule("complaints")
                }
              >
                Manage →
              </button>
            </div>

            <div className="hostel-list">

              <div>
                <span className="hostel-list-icon">
                  🔧
                </span>

                <div>
                  <strong>Open Complaints</strong>
                  <small>
                    {openComplaints} complaints currently open
                  </small>
                </div>
              </div>

              <div>
                <span className="hostel-list-icon">
                  💧
                </span>

                <div>
                  <strong>Water & Plumbing</strong>
                  <small>
                    {
                      complaints.filter(
                        (item) =>
                          item.category ===
                          "Water & Plumbing"
                      ).length
                    }{" "}
                    complaints
                  </small>
                </div>
              </div>

              <div>
                <span className="hostel-list-icon">
                  🧹
                </span>

                <div>
                  <strong>Cleaning Issues</strong>
                  <small>
                    {
                      complaints.filter(
                        (item) =>
                          item.category === "Cleaning"
                      ).length
                    }{" "}
                    complaints
                  </small>
                </div>
              </div>

            </div>

          </section>

          {/* MESS */}

          <section className="hostel-admin-card">

            <div className="hostel-card-header">
              <div>
                <h2>Mess Management</h2>
                <p>
                  Manage menus and student feedback.
                </p>
              </div>

              <button
                onClick={() =>
                  setActiveModule("mess")
                }
              >
                Manage →
              </button>
            </div>

            <div className="hostel-mess-box">

              <div className="hostel-mess-item">
                <span>🍳</span>

                <div>
                  <strong>Today's Menu</strong>
                  <small>
                    Breakfast • Lunch • Snacks • Dinner
                  </small>
                </div>
              </div>

              <div className="hostel-mess-item">
                <span>⭐</span>

                <div>
                  <strong>Mess Feedback</strong>
                  <small>
                    4.1 / 5 average rating this week
                  </small>
                </div>
              </div>

              <div className="hostel-mess-item">
                <span>📊</span>

                <div>
                  <strong>Food Quality</strong>
                  <small>
                    21 complaints detected in 4 days
                  </small>
                </div>

                <span className="hostel-warning">
                  HIGH
                </span>
              </div>

            </div>

          </section>

          {/* GATE PASS */}

          <section className="hostel-admin-card">

            <div className="hostel-card-header">
              <div>
                <h2>Gate Pass Management</h2>
                <p>
                  Review hostel resident movement requests.
                </p>
              </div>

              <button
                onClick={() =>
                  setActiveModule("gatepass")
                }
              >
                Manage →
              </button>
            </div>

            <div className="hostel-pass-summary">

              <div>
                <strong>{pendingPasses}</strong>
                <span>Pending</span>
              </div>

              <div>
                <strong>
                  {
                    gatePasses.filter(
                      (item) =>
                        item.status === "APPROVED"
                    ).length
                  }
                </strong>
                <span>Approved</span>
              </div>

              <div>
                <strong>{emergencyPasses}</strong>
                <span>Emergency</span>
              </div>

            </div>

            <div className="hostel-pass-note">
              🚪 Emergency gate passes can be prioritized
              for Security Admin review.
            </div>

          </section>

        </div>

        <section className="hostel-admin-card hostel-alert-card">

          <div className="hostel-card-header">
            <div>
              <h2>Hostel Alerts</h2>
              <p>
                Issues requiring administrator attention.
              </p>
            </div>
          </div>

          <div className="hostel-alerts">

            <div>
              <span>⚠️</span>

              <div>
                <strong>
                  Water leakage pattern detected
                </strong>

                <small>
                  Multiple complaints reported across
                  hostel blocks. Super Admin has been
                  notified.
                </small>
              </div>
            </div>

            <div>
              <span>🍽️</span>

              <div>
                <strong>
                  Food quality complaints increasing
                </strong>

                <small>
                  21 complaints have been recorded within
                  the last 4 days.
                </small>
              </div>
            </div>

            <div>
              <span>🚪</span>

              <div>
                <strong>
                  {pendingPasses} gate passes awaiting review
                </strong>

                <small>
                  Review resident movement requests.
                </small>
              </div>
            </div>

          </div>

        </section>

      </div>
    );
  };

  /* =========================================================
     ROOMS
  ========================================================= */

  const renderRooms = () => (
    <div className="hostel-admin-page">

      <div className="hostel-admin-header">

        <div>
          <span className="hostel-admin-eyebrow">
            HOSTEL / ROOMS
          </span>

          <h1>Rooms & Allotment</h1>

          <p>
            Manage rooms, occupancy and resident
            assignments.
          </p>
        </div>

        <button
          className="hostel-primary-btn"
          onClick={() => setModal("room")}
        >
          + Add Room
        </button>

      </div>

      <section className="hostel-admin-card">

        <div className="hostel-card-header">
          <div>
            <h2>Room Directory</h2>
            <p>
              Current hostel room occupancy.
            </p>
          </div>
        </div>

        <div className="hostel-room-grid">

          {rooms.map((room) => (
            <div
              className="hostel-room-card"
              key={room.id}
            >

              <div className="hostel-room-top">
                <div>
                  <strong>{room.room}</strong>
                  <small>{room.block}</small>
                </div>

                <span
                  className={
                    room.status === "FULL"
                      ? "hostel-room-full"
                      : room.status === "VACANT"
                      ? "hostel-room-vacant"
                      : "hostel-room-available"
                  }
                >
                  {room.status}
                </span>
              </div>

              <div className="hostel-room-occupancy">
                <strong>
                  {room.occupied} / {room.capacity}
                </strong>

                <span>
                  residents
                </span>
              </div>

              <div className="hostel-room-students">

                {room.students.length > 0 ? (
                  room.students.map((student) => (
                    <span key={student}>
                      {student}
                    </span>
                  ))
                ) : (
                  <span>
                    No resident assigned
                  </span>
                )}

              </div>

              <button
                onClick={() =>
                  alert(
                    `${room.room}\n${room.students.join(
                      ", "
                    ) || "No residents"}`
                  )
                }
              >
                View Details
              </button>

            </div>
          ))}

        </div>

      </section>

    </div>
  );

  /* =========================================================
     COMPLAINTS
  ========================================================= */

  const renderComplaints = () => (
    <div className="hostel-admin-page">

      <div className="hostel-admin-header">

        <div>
          <span className="hostel-admin-eyebrow">
            HOSTEL / COMPLAINTS
          </span>

          <h1>Hostel Complaints</h1>

          <p>
            Track, prioritize and resolve resident
            complaints.
          </p>
        </div>

        <button
          className="hostel-primary-btn"
          onClick={() => setModal("complaint")}
        >
          + Add Complaint
        </button>

      </div>

      <section className="hostel-admin-card">

        <div className="hostel-card-header">
          <div>
            <h2>Complaint Directory</h2>
            <p>
              Current hostel service requests.
            </p>
          </div>
        </div>

        <div className="hostel-complaint-list">

          {complaints.map((item) => (
            <div
              className="hostel-complaint-row"
              key={item.id}
            >

              <div>
                <strong>{item.complaint}</strong>

                <small>
                  {item.student} • {item.room}
                </small>

                <small>
                  {item.category} • {item.created}
                </small>
              </div>

              <span
                className={
                  item.priority === "HIGH"
                    ? "hostel-priority-high"
                    : "hostel-priority-medium"
                }
              >
                {item.priority}
              </span>

              <span className="hostel-complaint-status">
                {item.status}
              </span>

              <select
                value={item.status}
                onChange={(e) =>
                  updateComplaintStatus(
                    item.id,
                    e.target.value
                  )
                }
              >
                <option>OPEN</option>
                <option>IN PROGRESS</option>
                <option>RESOLVED</option>
              </select>

            </div>
          ))}

        </div>

      </section>

    </div>
  );

  /* =========================================================
     MESS
  ========================================================= */

  const renderMess = () => (
    <div className="hostel-admin-page">

      <div className="hostel-admin-header">

        <div>
          <span className="hostel-admin-eyebrow">
            HOSTEL / MESS
          </span>

          <h1>Mess Management</h1>

          <p>
            Manage today's menu and monitor student
            feedback.
          </p>
        </div>

        <button
          className="hostel-primary-btn"
          onClick={() => {
            setMenuForm(menu);
            setModal("menu");
          }}
        >
          + Update Menu
        </button>

      </div>

      <section className="hostel-admin-card">

        <div className="hostel-card-header">
          <div>
            <h2>Today's Menu</h2>
            <p>
              Current hostel mess menu.
            </p>
          </div>
        </div>

        <div className="hostel-menu-grid">

          <div>
            <span>🌅</span>
            <strong>Breakfast</strong>
            <p>{menu.breakfast}</p>
          </div>

          <div>
            <span>🍛</span>
            <strong>Lunch</strong>
            <p>{menu.lunch}</p>
          </div>

          <div>
            <span>☕</span>
            <strong>Snacks</strong>
            <p>{menu.snacks}</p>
          </div>

          <div>
            <span>🌙</span>
            <strong>Dinner</strong>
            <p>{menu.dinner}</p>
          </div>

        </div>

      </section>

      <section className="hostel-admin-card">

        <div className="hostel-card-header">
          <div>
            <h2>Mess Feedback</h2>
            <p>
              Recent student feedback.
            </p>
          </div>

          <strong>
            ⭐ 4.1 / 5
          </strong>
        </div>

        <div className="hostel-feedback-list">

          {feedback.map((item) => (
            <div key={item.id}>

              <div>
                <strong>{item.student}</strong>

                <small>
                  {item.category} • {item.time}
                </small>
              </div>

              <span>
                {"⭐".repeat(item.rating)}
              </span>

              <p>
                {item.message}
              </p>

            </div>
          ))}

        </div>

      </section>

    </div>
  );

  /* =========================================================
     GATE PASS
  ========================================================= */

  const renderGatePass = () => (
    <div className="hostel-admin-page">

      <div className="hostel-admin-header">

        <div>
          <span className="hostel-admin-eyebrow">
            HOSTEL / GATE PASS
          </span>

          <h1>Gate Pass Management</h1>

          <p>
            Review and approve resident movement requests.
          </p>
        </div>

        <button
          className="hostel-primary-btn"
          onClick={() => setModal("gatepass")}
        >
          + Create Gate Pass
        </button>

      </div>

      <section className="hostel-admin-card">

        <div className="hostel-pass-summary">

          <div>
            <strong>
              {
                gatePasses.filter(
                  (item) => item.status === "PENDING"
                ).length
              }
            </strong>
            <span>Pending</span>
          </div>

          <div>
            <strong>
              {
                gatePasses.filter(
                  (item) => item.status === "APPROVED"
                ).length
              }
            </strong>
            <span>Approved</span>
          </div>

          <div>
            <strong>
              {
                gatePasses.filter(
                  (item) =>
                    item.type === "EMERGENCY"
                ).length
              }
            </strong>
            <span>Emergency</span>
          </div>

        </div>

      </section>

      <section className="hostel-admin-card">

        <div className="hostel-card-header">
          <div>
            <h2>Movement Requests</h2>
            <p>
              Review student gate pass requests.
            </p>
          </div>
        </div>

        <div className="hostel-gate-list">

          {gatePasses.map((item) => (
            <div
              className={
                item.type === "EMERGENCY"
                  ? "hostel-gate-row emergency"
                  : "hostel-gate-row"
              }
              key={item.id}
            >

              <div>
                <strong>{item.student}</strong>

                <small>
                  {item.room} • {item.destination}
                </small>

                <small>
                  Departure: {item.departure}
                </small>

                <small>
                  Arrival: {item.arrival}
                </small>

                <small>
                  Reason: {item.reason}
                </small>
              </div>

              <span
                className={
                  item.type === "EMERGENCY"
                    ? "hostel-emergency-badge"
                    : "hostel-normal-badge"
                }
              >
                {item.type}
              </span>

              <span className="hostel-pass-status">
                {item.status}
              </span>

              {item.status === "PENDING" && (
                <div className="hostel-pass-actions">

                  <button
                    className="hostel-approve-btn"
                    onClick={() =>
                      updateGatePass(
                        item.id,
                        "APPROVED"
                      )
                    }
                  >
                    Approve
                  </button>

                  <button
                    className="hostel-reject-btn"
                    onClick={() =>
                      updateGatePass(
                        item.id,
                        "REJECTED"
                      )
                    }
                  >
                    Reject
                  </button>

                </div>
              )}

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
    <div className="hostel-admin-page">

      <div className="hostel-admin-header">

        <div>
          <span className="hostel-admin-eyebrow">
            HOSTEL / NOTICES
          </span>

          <h1>Hostel Notices</h1>

          <p>
            Publish important announcements for hostel
            residents.
          </p>
        </div>

        <button
          className="hostel-primary-btn"
          onClick={() => setModal("notice")}
        >
          + Create Notice
        </button>

      </div>

      <section className="hostel-admin-card">

        <div className="hostel-card-header">
          <div>
            <h2>Notice History</h2>
            <p>
              Recent hostel announcements.
            </p>
          </div>
        </div>

        <div className="hostel-alerts">

          {notices.map((notice) => (
            <div key={notice.id}>

              <span>📢</span>

              <div>
                <strong>{notice.title}</strong>

                <small>
                  {notice.message}
                </small>

                <small>
                  Target: {notice.target} • {notice.time}
                </small>
              </div>

            </div>
          ))}

        </div>

      </section>

    </div>
  );

  /* =========================================================
     ROUTER
  ========================================================= */

  const renderContent = () => {
    switch (activeModule) {
      case "rooms":
        return renderRooms();

      case "complaints":
        return renderComplaints();

      case "mess":
        return renderMess();

      case "gatepass":
        return renderGatePass();

      case "notices":
        return renderNotices();

      default:
        return renderDashboard();
    }
  };

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <>

      {renderContent()}

      {/* =====================================================
          ADD ROOM
      ===================================================== */}

      <HostelModal
        open={modal === "room"}
        title="Add Hostel Room"
        subtitle="Create a new room in the hostel directory."
        onClose={closeModal}
        onSubmit={handleAddRoom}
        submitText="Add Room"
      >

        <div className="hostel-form-grid">

          <label>
            Room Number *
            <input
              value={roomForm.room}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  room: e.target.value,
                })
              }
              placeholder="A-103"
            />
          </label>

          <label>
            Hostel Block
            <select
              value={roomForm.block}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  block: e.target.value,
                })
              }
            >
              <option>Block A</option>
              <option>Block B</option>
              <option>Block C</option>
              <option>Block D</option>
              <option>Block E</option>
              <option>Block F</option>
              <option>Block G</option>
              <option>Block H</option>
            </select>
          </label>

          <label>
            Capacity
            <select
              value={roomForm.capacity}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  capacity: e.target.value,
                })
              }
            >
              <option value="1">1 Student</option>
              <option value="2">2 Students</option>
              <option value="3">3 Students</option>
              <option value="4">4 Students</option>
            </select>
          </label>

        </div>

      </HostelModal>

      {/* =====================================================
          ADD COMPLAINT
      ===================================================== */}

      <HostelModal
        open={modal === "complaint"}
        title="Add Hostel Complaint"
        subtitle="Register a hostel maintenance request."
        onClose={closeModal}
        onSubmit={handleAddComplaint}
        submitText="Create Complaint"
      >

        <div className="hostel-form-grid">

          <label>
            Student *
            <input
              value={complaintForm.student}
              onChange={(e) =>
                setComplaintForm({
                  ...complaintForm,
                  student: e.target.value,
                })
              }
              placeholder="Student name"
            />
          </label>

          <label>
            Room *
            <input
              value={complaintForm.room}
              onChange={(e) =>
                setComplaintForm({
                  ...complaintForm,
                  room: e.target.value,
                })
              }
              placeholder="A-101"
            />
          </label>

          <label>
            Category
            <select
              value={complaintForm.category}
              onChange={(e) =>
                setComplaintForm({
                  ...complaintForm,
                  category: e.target.value,
                })
              }
            >
              <option>Water & Plumbing</option>
              <option>Cleaning</option>
              <option>Electrical</option>
              <option>Maintenance</option>
              <option>Furniture</option>
              <option>Internet / Wi-Fi</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Priority
            <select
              value={complaintForm.priority}
              onChange={(e) =>
                setComplaintForm({
                  ...complaintForm,
                  priority: e.target.value,
                })
              }
            >
              <option>LOW</option>
              <option>MEDIUM</option>
              <option>HIGH</option>
              <option>CRITICAL</option>
            </select>
          </label>

          <label className="hostel-form-full">
            Complaint *
            <textarea
              rows="5"
              value={complaintForm.complaint}
              onChange={(e) =>
                setComplaintForm({
                  ...complaintForm,
                  complaint: e.target.value,
                })
              }
              placeholder="Describe the issue..."
            />
          </label>

        </div>

      </HostelModal>

      {/* =====================================================
          MENU
      ===================================================== */}

      <HostelModal
        open={modal === "menu"}
        title="Update Today's Menu"
        subtitle="Update breakfast, lunch, snacks and dinner."
        onClose={closeModal}
        onSubmit={handleUpdateMenu}
        submitText="Update Menu"
      >

        <div className="hostel-form-grid">

          <label className="hostel-form-full">
            🍳 Breakfast
            <input
              value={menuForm.breakfast}
              onChange={(e) =>
                setMenuForm({
                  ...menuForm,
                  breakfast: e.target.value,
                })
              }
            />
          </label>

          <label className="hostel-form-full">
            🍛 Lunch
            <input
              value={menuForm.lunch}
              onChange={(e) =>
                setMenuForm({
                  ...menuForm,
                  lunch: e.target.value,
                })
              }
            />
          </label>

          <label className="hostel-form-full">
            ☕ Snacks
            <input
              value={menuForm.snacks}
              onChange={(e) =>
                setMenuForm({
                  ...menuForm,
                  snacks: e.target.value,
                })
              }
            />
          </label>

          <label className="hostel-form-full">
            🌙 Dinner
            <input
              value={menuForm.dinner}
              onChange={(e) =>
                setMenuForm({
                  ...menuForm,
                  dinner: e.target.value,
                })
              }
            />
          </label>

        </div>

      </HostelModal>

      {/* =====================================================
          GATE PASS
      ===================================================== */}

      <HostelModal
        open={modal === "gatepass"}
        title="Create Gate Pass"
        subtitle="Register a resident movement request."
        onClose={closeModal}
        onSubmit={handleCreateGatePass}
        submitText="Create Gate Pass"
      >

        <div className="hostel-form-grid">

          <label>
            Student *
            <input
              value={passForm.student}
              onChange={(e) =>
                setPassForm({
                  ...passForm,
                  student: e.target.value,
                })
              }
              placeholder="Student name"
            />
          </label>

          <label>
            Room *
            <input
              value={passForm.room}
              onChange={(e) =>
                setPassForm({
                  ...passForm,
                  room: e.target.value,
                })
              }
              placeholder="A-101"
            />
          </label>

          <label>
            Destination *
            <input
              value={passForm.destination}
              onChange={(e) =>
                setPassForm({
                  ...passForm,
                  destination: e.target.value,
                })
              }
              placeholder="Home / Hospital / City"
            />
          </label>

          <label>
            Pass Type
            <select
              value={passForm.type}
              onChange={(e) =>
                setPassForm({
                  ...passForm,
                  type: e.target.value,
                })
              }
            >
              <option>NORMAL</option>
              <option>EMERGENCY</option>
            </select>
          </label>

          <label>
            Departure *
            <input
              type="datetime-local"
              value={passForm.departure}
              onChange={(e) =>
                setPassForm({
                  ...passForm,
                  departure: e.target.value,
                })
              }
            />
          </label>

          <label>
            Expected Arrival *
            <input
              type="datetime-local"
              value={passForm.arrival}
              onChange={(e) =>
                setPassForm({
                  ...passForm,
                  arrival: e.target.value,
                })
              }
            />
          </label>

          <label className="hostel-form-full">
            Reason *
            <textarea
              rows="4"
              value={passForm.reason}
              onChange={(e) =>
                setPassForm({
                  ...passForm,
                  reason: e.target.value,
                })
              }
              placeholder="Reason for leaving campus..."
            />
          </label>

        </div>

      </HostelModal>

      {/* =====================================================
          NOTICE
      ===================================================== */}

      <HostelModal
        open={modal === "notice"}
        title="Create Hostel Notice"
        subtitle="Publish an announcement for hostel residents."
        onClose={closeModal}
        onSubmit={handleCreateNotice}
        submitText="Publish Notice"
      >

        <div className="hostel-form-grid">

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
              placeholder="Hostel inspection notice"
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
              <option>All Hostelers</option>
              <option>Block A</option>
              <option>Block B</option>
              <option>Block C</option>
              <option>Block D</option>
            </select>
          </label>

          <label className="hostel-form-full">
            Notice Message *
            <textarea
              rows="6"
              value={noticeForm.message}
              onChange={(e) =>
                setNoticeForm({
                  ...noticeForm,
                  message: e.target.value,
                })
              }
              placeholder="Write the announcement..."
            />
          </label>

        </div>

      </HostelModal>

    </>
  );
}