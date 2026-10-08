import React, { useMemo, useState } from "react";
import "./SecurityAdmin.css";

const INITIAL_SOS = [
  {
    id: "SOS-1001",
    type: "SECURITY",
    student: "Student #2048",
    name: "Rahul Kumar",
    location: "Hostel Block B",
    latitude: 20.2961,
    longitude: 85.8245,
    time: "2 min ago",
    priority: "HIGH",
    status: "ACTIVE",
    message: "Security assistance requested.",
  },
  {
    id: "SOS-1002",
    type: "HEALTHCARE",
    student: "Student #1982",
    name: "Ananya Das",
    location: "Academic Block",
    latitude: 20.2938,
    longitude: 85.8242,
    time: "5 min ago",
    priority: "HIGH",
    status: "ACTIVE",
    message: "Medical assistance required.",
  },
];

const INITIAL_GATEPASSES = [
  {
    id: "EGP-001",
    student: "Rahul Kumar",
    destination: "City Hospital",
    reason: "Medical emergency",
    time: "2:10 PM",
    status: "PENDING",
  },
  {
    id: "EGP-002",
    student: "Priya Singh",
    destination: "Home",
    reason: "Family emergency",
    time: "1:45 PM",
    status: "PENDING",
  },
  {
    id: "EGP-003",
    student: "Aman Das",
    destination: "Medical Store",
    reason: "Medicine",
    time: "12:30 PM",
    status: "APPROVED",
  },
];

const INITIAL_INCIDENTS = [
  {
    id: "INC-001",
    title: "Unauthorized Entry Attempt",
    location: "Main Gate",
    severity: "HIGH",
    date: "08 Oct 2026",
    status: "OPEN",
  },
  {
    id: "INC-002",
    title: "Hostel Access Issue",
    location: "Hostel Block B",
    severity: "MEDIUM",
    date: "08 Oct 2026",
    status: "INVESTIGATING",
  },
  {
    id: "INC-003",
    title: "CCTV Camera Offline",
    location: "Academic Block",
    severity: "LOW",
    date: "07 Oct 2026",
    status: "RESOLVED",
  },
];

const INITIAL_ALERTS = [
  {
    id: "ALT-001",
    title: "Emergency SOS Active",
    message: "Security assistance requested by student.",
    type: "EMERGENCY",
    time: "2 min ago",
  },
  {
    id: "ALT-002",
    title: "Healthcare SOS Active",
    message: "Medical assistance request received.",
    type: "HEALTHCARE",
    time: "5 min ago",
  },
];

function formatMapUrl(latitude, longitude) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${
    longitude - 0.008
  },${latitude - 0.008},${longitude + 0.008},${
    latitude + 0.008
  }&layer=mapnik&marker=${latitude},${longitude}`;
}

export default function SecurityAdmin({ module = "dashboard" }) {
  const [sosRequests, setSosRequests] = useState(INITIAL_SOS);
  const [gatepasses, setGatepasses] = useState(INITIAL_GATEPASSES);
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  const [selectedSOS, setSelectedSOS] = useState(INITIAL_SOS[0]);

  const activeSOS = sosRequests.filter(
    (item) => item.status === "ACTIVE"
  );

  const pendingGatepasses = gatepasses.filter(
    (item) => item.status === "PENDING"
  );

  const openIncidents = incidents.filter(
    (item) => item.status !== "RESOLVED"
  );

  const selectedMapUrl = useMemo(() => {
    if (!selectedSOS) return "";

    return formatMapUrl(
      selectedSOS.latitude,
      selectedSOS.longitude
    );
  }, [selectedSOS]);

  const respondToSOS = (id) => {
    setSosRequests((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, status: "RESPONDING" }
          : item
      )
    );

    const selected = sosRequests.find(
      (item) => item.id === id
    );

    if (selected) {
      setSelectedSOS({
        ...selected,
        status: "RESPONDING",
      });
    }
  };

  const resolveSOS = (id) => {
    setSosRequests((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, status: "RESOLVED" }
          : item
      )
    );

    if (selectedSOS?.id === id) {
      setSelectedSOS({
        ...selectedSOS,
        status: "RESOLVED",
      });
    }
  };

  const approveGatepass = (id) => {
    setGatepasses((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, status: "APPROVED" }
          : item
      )
    );
  };

  const rejectGatepass = (id) => {
    setGatepasses((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, status: "REJECTED" }
          : item
      )
    );
  };

  const resolveIncident = (id) => {
    setIncidents((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, status: "RESOLVED" }
          : item
      )
    );
  };

  const acknowledgeAlert = (id) => {
    setAlerts((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  /* =========================================================
     HEADER
  ========================================================= */

  const Header = ({ title, subtitle }) => (
    <div className="security-page-header">
      <div>
        <span className="security-eyebrow">
          SECURITY ADMIN
        </span>

        <h1>{title}</h1>

        <p>{subtitle}</p>
      </div>

      <div className="security-live-status">
        <span></span>
        LIVE MONITORING
      </div>
    </div>
  );

  /* =========================================================
     DASHBOARD
  ========================================================= */

  const Dashboard = () => (
    <>
      <Header
        title="Security & Emergency Management"
        subtitle="Monitor campus safety, emergency requests, SOS alerts and student movement."
      />

      <div className="security-emergency-banner">
        <div className="security-banner-icon">
          🚨
        </div>

        <div>
          <strong>Campus Emergency Response Center</strong>

          <p>
            Security team is actively monitoring emergency
            and healthcare SOS requests.
          </p>
        </div>

        <span className="monitoring-badge">
          ● MONITORING
        </span>
      </div>

      <div className="security-stats">

        <div className="security-stat">
          <span>Active SOS</span>
          <strong>{activeSOS.length}</strong>
          <small>Requires attention</small>
        </div>

        <div className="security-stat">
          <span>Emergency Requests</span>
          <strong>{activeSOS.length + 4}</strong>
          <small>Today</small>
        </div>

        <div className="security-stat">
          <span>Pending Gate Pass</span>
          <strong>{pendingGatepasses.length}</strong>
          <small>Awaiting approval</small>
        </div>

        <div className="security-stat">
          <span>Open Incidents</span>
          <strong>{openIncidents.length}</strong>
          <small>Requires investigation</small>
        </div>

      </div>

      <div className="security-grid">

        <section className="security-card">
          <div className="security-card-header">
            <div>
              <h2>Active SOS Requests</h2>
              <p>Emergency requests received from students.</p>
            </div>

            <span className="count-pill">
              {activeSOS.length} Active
            </span>
          </div>

          <div className="sos-list">
            {activeSOS.map((item) => (
              <SOSRow
                key={item.id}
                item={item}
              />
            ))}
          </div>
        </section>

        <section className="security-card">
          <div className="security-card-header">
            <div>
              <h2>Live Emergency Location</h2>
              <p>
                Real-time location associated with the selected
                emergency request.
              </p>
            </div>
          </div>

          <LiveMap />
        </section>

      </div>

      <section className="security-card security-full-card">
        <div className="security-card-header">
          <div>
            <h2>Emergency Response Queue</h2>
            <p>
              Respond immediately to active emergency requests.
            </p>
          </div>
        </div>

        <ResponseTable />
      </section>
    </>
  );

  /* =========================================================
     SOS ROW
  ========================================================= */

  const SOSRow = ({ item }) => (
    <button
      className={`sos-row ${
        selectedSOS?.id === item.id
          ? "selected"
          : ""
      }`}
      onClick={() => setSelectedSOS(item)}
    >
      <div
        className={`sos-icon ${
          item.type === "HEALTHCARE"
            ? "healthcare"
            : "emergency"
        }`}
      >
        {item.type === "HEALTHCARE"
          ? "🏥"
          : "🚨"}
      </div>

      <div className="sos-info">
        <strong>
          {item.type === "HEALTHCARE"
            ? "Healthcare SOS"
            : "Security SOS"}
        </strong>

        <span>
          {item.name} • {item.location}
        </span>

        <small>{item.time}</small>
      </div>

      <span className="high-badge">
        {item.priority}
      </span>
    </button>
  );

  /* =========================================================
     LIVE MAP
  ========================================================= */

  const LiveMap = () => {
    if (!selectedSOS) {
      return (
        <div className="empty-state">
          No active emergency location.
        </div>
      );
    }

    return (
      <div className="live-map-container">

        <div className="map-top-info">
          <div>
            <strong>
              📍 {selectedSOS.location}
            </strong>

            <span>
              {selectedSOS.name} • {selectedSOS.id}
            </span>
          </div>

          <span className="live-location-badge">
            ● LIVE
          </span>
        </div>

        <iframe
          title="Emergency live location map"
          src={selectedMapUrl}
          className="security-map"
        />

        <div className="location-details">

          <div>
            <span>Latitude</span>
            <strong>
              {selectedSOS.latitude}
            </strong>
          </div>

          <div>
            <span>Longitude</span>
            <strong>
              {selectedSOS.longitude}
            </strong>
          </div>

          <div>
            <span>Status</span>
            <strong>
              {selectedSOS.status}
            </strong>
          </div>

        </div>

        <div className="map-actions">

          <button
            className="secondary-btn"
            onClick={() =>
              window.open(
                `https://www.google.com/maps?q=${selectedSOS.latitude},${selectedSOS.longitude}`,
                "_blank"
              )
            }
          >
            🗺️ Open in Google Maps
          </button>

          <button
            className="primary-btn"
            onClick={() =>
              respondToSOS(selectedSOS.id)
            }
            disabled={
              selectedSOS.status !== "ACTIVE"
            }
          >
            🚨 Respond
          </button>

          <button
            className="success-btn"
            onClick={() =>
              resolveSOS(selectedSOS.id)
            }
            disabled={
              selectedSOS.status === "RESOLVED"
            }
          >
            ✓ Resolve
          </button>

        </div>
      </div>
    );
  };

  /* =========================================================
     RESPONSE TABLE
  ========================================================= */

  const ResponseTable = () => (
    <div className="security-table-wrapper">

      <table className="security-table">

        <thead>
          <tr>
            <th>REQUEST</th>
            <th>STUDENT</th>
            <th>LOCATION</th>
            <th>PRIORITY</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>

        <tbody>
          {sosRequests.map((item) => (
            <tr key={item.id}>

              <td>
                <strong>
                  {item.type === "HEALTHCARE"
                    ? "🏥 Healthcare SOS"
                    : "🚨 Security SOS"}
                </strong>

                <small>{item.id}</small>
              </td>

              <td>{item.name}</td>

              <td>
                📍 {item.location}
              </td>

              <td>
                <span className="priority-high">
                  {item.priority}
                </span>
              </td>

              <td>
                <span
                  className={`status ${
                    item.status.toLowerCase()
                  }`}
                >
                  {item.status}
                </span>
              </td>

              <td>
                <div className="table-actions">

                  <button
                    onClick={() =>
                      setSelectedSOS(item)
                    }
                  >
                    View
                  </button>

                  {item.status === "ACTIVE" && (
                    <button
                      className="respond-btn"
                      onClick={() =>
                        respondToSOS(item.id)
                      }
                    >
                      Respond
                    </button>
                  )}

                </div>
              </td>

            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );

  /* =========================================================
     EMERGENCY CENTER
  ========================================================= */

  const EmergencyCenter = () => (
    <>
      <Header
        title="Emergency Response Center"
        subtitle="Central control center for all campus emergency requests."
      />

      <div className="emergency-center-grid">

        <section className="security-card">
          <div className="security-card-header">
            <div>
              <h2>Active Emergencies</h2>
              <p>Live requests requiring response.</p>
            </div>

            <span className="danger-count">
              {activeSOS.length} ACTIVE
            </span>
          </div>

          {activeSOS.map((item) => (
            <div
              className="emergency-request"
              key={item.id}
            >
              <div className="emergency-request-icon">
                {item.type === "HEALTHCARE"
                  ? "🏥"
                  : "🚨"}
              </div>

              <div className="emergency-request-info">
                <strong>
                  {item.type === "HEALTHCARE"
                    ? "Healthcare SOS"
                    : "Security SOS"}
                </strong>

                <span>
                  {item.name}
                </span>

                <small>
                  📍 {item.location} • {item.time}
                </small>
              </div>

              <button
                className="primary-btn"
                onClick={() => {
                  setSelectedSOS(item);
                }}
              >
                View Location
              </button>
            </div>
          ))}
        </section>

        <section className="security-card">
          <div className="security-card-header">
            <div>
              <h2>Emergency Map</h2>
              <p>Locate active requests.</p>
            </div>
          </div>

          <LiveMap />
        </section>

      </div>
    </>
  );

  /* =========================================================
     SECURITY SOS
  ========================================================= */

  const SecuritySOS = () => (
    <>
      <Header
        title="Security SOS"
        subtitle="Monitor emergency and security assistance requests."
      />

      <div className="module-banner emergency-banner">
        🚨 Security SOS monitoring is active.
      </div>

      <section className="security-card">

        <div className="security-card-header">
          <div>
            <h2>Security Emergency Requests</h2>
            <p>
              Live security alerts from students.
            </p>
          </div>
        </div>

        <div className="large-sos-grid">

          {sosRequests
            .filter(
              (item) => item.type === "SECURITY"
            )
            .map((item) => (
              <div
                className="large-sos-card"
                key={item.id}
              >
                <div className="large-sos-icon">
                  🚨
                </div>

                <div>
                  <span>SECURITY SOS</span>

                  <h3>{item.name}</h3>

                  <p>{item.message}</p>

                  <small>
                    📍 {item.location}
                  </small>
                </div>

                <div className="large-sos-actions">
                  <button
                    onClick={() =>
                      setSelectedSOS(item)
                    }
                  >
                    View Location
                  </button>

                  <button
                    className="primary-btn"
                    onClick={() =>
                      respondToSOS(item.id)
                    }
                  >
                    Respond
                  </button>
                </div>
              </div>
            ))}

        </div>

        <LiveMap />

      </section>
    </>
  );

  /* =========================================================
     HEALTHCARE SOS
  ========================================================= */

  const HealthcareSOS = () => (
    <>
      <Header
        title="Healthcare SOS"
        subtitle="Monitor medical assistance requests and emergency locations."
      />

      <div className="module-banner healthcare-banner">
        🏥 Healthcare response system is active.
      </div>

      <section className="security-card">

        <div className="security-card-header">
          <div>
            <h2>Medical Emergency Requests</h2>
            <p>
              Students requesting immediate medical assistance.
            </p>
          </div>
        </div>

        {sosRequests
          .filter(
            (item) => item.type === "HEALTHCARE"
          )
          .map((item) => (
            <div
              className="healthcare-request"
              key={item.id}
            >
              <div className="healthcare-icon">
                🏥
              </div>

              <div className="healthcare-info">
                <strong>{item.name}</strong>

                <span>
                  Healthcare SOS • {item.time}
                </span>

                <p>{item.message}</p>

                <small>
                  📍 {item.location}
                </small>
              </div>

              <button
                className="primary-btn"
                onClick={() =>
                  setSelectedSOS(item)
                }
              >
                View Live Location
              </button>
            </div>
          ))}

        <div className="healthcare-map-section">
          <h3>📍 Live Healthcare Emergency Location</h3>

          <LiveMap />
        </div>

      </section>
    </>
  );

  /* =========================================================
     EMERGENCY GATE PASS
  ========================================================= */

  const EmergencyGatePass = () => (
    <>
      <Header
        title="Emergency Gate Pass"
        subtitle="Review and approve urgent student movement requests."
      />

      <div className="security-stats">

        <div className="security-stat">
          <span>Pending</span>
          <strong>
            {pendingGatepasses.length}
          </strong>
          <small>Need review</small>
        </div>

        <div className="security-stat">
          <span>Approved Today</span>
          <strong>11</strong>
          <small>Successful exits</small>
        </div>

        <div className="security-stat">
          <span>Emergency</span>
          <strong>2</strong>
          <small>Priority requests</small>
        </div>

      </div>

      <section className="security-card">

        <div className="security-card-header">
          <div>
            <h2>Emergency Gate Pass Requests</h2>
            <p>
              Review student emergency movement requests.
            </p>
          </div>
        </div>

        <div className="security-table-wrapper">

          <table className="security-table">

            <thead>
              <tr>
                <th>REQUEST</th>
                <th>STUDENT</th>
                <th>DESTINATION</th>
                <th>REASON</th>
                <th>TIME</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {gatepasses.map((item) => (
                <tr key={item.id}>

                  <td>
                    <strong>{item.id}</strong>
                  </td>

                  <td>{item.student}</td>

                  <td>{item.destination}</td>

                  <td>{item.reason}</td>

                  <td>{item.time}</td>

                  <td>
                    <span
                      className={`status ${item.status.toLowerCase()}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td>
                    {item.status === "PENDING" ? (
                      <div className="table-actions">

                        <button
                          className="approve-btn"
                          onClick={() =>
                            approveGatepass(
                              item.id
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          className="reject-btn"
                          onClick={() =>
                            rejectGatepass(
                              item.id
                            )
                          }
                        >
                          Reject
                        </button>

                      </div>
                    ) : (
                      <span>Completed</span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>

      </section>
    </>
  );

  /* =========================================================
     SECURITY INCIDENTS
  ========================================================= */

  const SecurityIncidents = () => (
    <>
      <Header
        title="Security Incidents"
        subtitle="Track, investigate and resolve campus safety incidents."
      />

      <section className="security-card">

        <div className="security-card-header">

          <div>
            <h2>Incident Directory</h2>
            <p>
              All reported security incidents.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() =>
              alert(
                "Create Incident form can be connected to the backend here."
              )
            }
          >
            + Create Incident
          </button>

        </div>

        <div className="incident-grid">

          {incidents.map((incident) => (
            <div
              className="incident-card"
              key={incident.id}
            >

              <div className="incident-top">

                <span className="incident-icon">
                  ⚠️
                </span>

                <span
                  className={`severity ${incident.severity.toLowerCase()}`}
                >
                  {incident.severity}
                </span>

              </div>

              <h3>{incident.title}</h3>

              <p>
                📍 {incident.location}
              </p>

              <small>
                {incident.date} • {incident.id}
              </small>

              <div className="incident-bottom">

                <span
                  className={`status ${incident.status.toLowerCase()}`}
                >
                  {incident.status}
                </span>

                {incident.status !==
                  "RESOLVED" && (
                  <button
                    onClick={() =>
                      resolveIncident(
                        incident.id
                      )
                    }
                  >
                    Resolve
                  </button>
                )}

              </div>

            </div>
          ))}

        </div>

      </section>
    </>
  );

  /* =========================================================
     SAFETY ALERTS
  ========================================================= */

  const SafetyAlerts = () => (
    <>
      <Header
        title="Safety Alerts"
        subtitle="Monitor and manage active campus safety notifications."
      />

      <section className="security-card">

        <div className="security-card-header">

          <div>
            <h2>Active Safety Alerts</h2>
            <p>
              Alerts requiring security attention.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() =>
              alert(
                "Create Safety Alert form can be connected here."
              )
            }
          >
            + Create Alert
          </button>

        </div>

        <div className="alert-list">

          {alerts.length === 0 && (
            <div className="empty-state">
              ✓ No active safety alerts.
            </div>
          )}

          {alerts.map((alertItem) => (
            <div
              className={`safety-alert ${
                alertItem.type ===
                "HEALTHCARE"
                  ? "healthcare"
                  : "emergency"
              }`}
              key={alertItem.id}
            >

              <div className="alert-icon">
                {alertItem.type ===
                "HEALTHCARE"
                  ? "🏥"
                  : "🚨"}
              </div>

              <div className="alert-info">

                <strong>
                  {alertItem.title}
                </strong>

                <p>
                  {alertItem.message}
                </p>

                <small>
                  {alertItem.time}
                </small>

              </div>

              <button
                onClick={() =>
                  acknowledgeAlert(
                    alertItem.id
                  )
                }
              >
                Acknowledge
              </button>

            </div>
          ))}

        </div>

      </section>
    </>
  );

  /* =========================================================
     ROUTER INSIDE SECURITY ADMIN
  ========================================================= */

  switch (module) {
    case "emergency":
      return (
        <div className="security-admin-page">
          <EmergencyCenter />
        </div>
      );

    case "sos":
      return (
        <div className="security-admin-page">
          <SecuritySOS />
        </div>
      );

    case "healthcare":
      return (
        <div className="security-admin-page">
          <HealthcareSOS />
        </div>
      );

    case "gatepass":
      return (
        <div className="security-admin-page">
          <EmergencyGatePass />
        </div>
      );

    case "incidents":
      return (
        <div className="security-admin-page">
          <SecurityIncidents />
        </div>
      );

    case "alerts":
      return (
        <div className="security-admin-page">
          <SafetyAlerts />
        </div>
      );

    case "dashboard":
    default:
      return (
        <div className="security-admin-page">
          <Dashboard />
        </div>
      );
  }
}