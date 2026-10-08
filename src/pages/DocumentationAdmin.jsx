import React, { useMemo, useState } from "react";
import "./DocumentationAdmin.css";

const INITIAL_APPLICATIONS = [
  {
    id: "APP-1001",
    student: "Adya Anwesha Dash",
    studentId: "STU001",
    branch: "CSE",
    semester: "5th",
    type: "Leave Application",
    subject: "Medical Leave Request",
    date: "08 Oct 2026",
    reason:
      "Requesting leave due to personal medical reasons.",
    status: "PENDING",
    signatures: {
      principal: false,
      mentor: false,
      hod: false,
    },
  },
  {
    id: "APP-1002",
    student: "Rahul Kumar",
    studentId: "STU002",
    branch: "CSE",
    semester: "5th",
    type: "Bonafide Certificate",
    subject: "Bonafide Certificate Request",
    date: "07 Oct 2026",
    reason:
      "Required for scholarship documentation.",
    status: "APPROVED",
    signatures: {
      principal: true,
      mentor: true,
      hod: true,
    },
  },
  {
    id: "APP-1003",
    student: "Priya Das",
    studentId: "STU003",
    branch: "ECE",
    semester: "3rd",
    type: "Academic Application",
    subject: "Subject Change Request",
    date: "06 Oct 2026",
    reason:
      "Requesting subject change according to academic guidelines.",
    status: "PENDING",
    signatures: {
      principal: false,
      mentor: true,
      hod: false,
    },
  },
];

const INITIAL_CERTIFICATES = [
  {
    id: "CERT-1001",
    student: "Sneha Patnaik",
    studentId: "STU004",
    type: "Bonafide Certificate",
    requested: "08 Oct 2026",
    status: "PENDING",
  },
  {
    id: "CERT-1002",
    student: "Rohan Mishra",
    studentId: "STU005",
    type: "Character Certificate",
    requested: "07 Oct 2026",
    status: "VERIFIED",
  },
  {
    id: "CERT-1003",
    student: "Neha Singh",
    studentId: "STU006",
    type: "Study Certificate",
    requested: "06 Oct 2026",
    status: "PENDING",
  },
];

const INITIAL_DOCUMENTS = [
  {
    id: "DOC-1001",
    student: "Adya Anwesha Dash",
    studentId: "STU001",
    document: "Semester Marksheet",
    submitted: "08 Oct 2026",
    status: "PENDING",
  },
  {
    id: "DOC-1002",
    student: "Rahul Kumar",
    studentId: "STU002",
    document: "Identity Proof",
    submitted: "07 Oct 2026",
    status: "VERIFIED",
  },
  {
    id: "DOC-1003",
    student: "Priya Das",
    studentId: "STU003",
    document: "Address Proof",
    submitted: "06 Oct 2026",
    status: "REJECTED",
  },
];

const INITIAL_NOTICES = [
  {
    id: "NOTICE-001",
    title: "Semester Examination Form Submission",
    audience: "All Students",
    branch: "All Branches",
    semester: "All Semesters",
    date: "08 Oct 2026",
    status: "PUBLISHED",
  },
  {
    id: "NOTICE-002",
    title: "CSE Department Academic Meeting",
    audience: "CSE Students",
    branch: "CSE",
    semester: "5th Semester",
    date: "07 Oct 2026",
    status: "PUBLISHED",
  },
];

const STATUS_CLASS = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

export default function DocumentationAdmin({
  module = "dashboard",
  onNavigate,
}) {
  const [applications, setApplications] = useState(
    INITIAL_APPLICATIONS
  );

  const [certificates, setCertificates] = useState(
    INITIAL_CERTIFICATES
  );

  const [documents, setDocuments] = useState(
    INITIAL_DOCUMENTS
  );

  const [notices, setNotices] = useState(
    INITIAL_NOTICES
  );

  const [search, setSearch] = useState("");

  const [selectedApplication, setSelectedApplication] =
    useState(null);

  const [selectedCertificate, setSelectedCertificate] =
    useState(null);

  const [selectedDocument, setSelectedDocument] =
    useState(null);

  const [showApplication, setShowApplication] =
    useState(false);

  const [showCertificate, setShowCertificate] =
    useState(false);

  const [showDocument, setShowDocument] =
    useState(false);

  const [showNoticeForm, setShowNoticeForm] =
    useState(false);

  const [toast, setToast] = useState("");

  const [noticeForm, setNoticeForm] = useState({
    title: "",
    audience: "All Students",
    branch: "All Branches",
    semester: "All Semesters",
  });

  /* =====================================================
     HELPERS
  ===================================================== */

  const showMessage = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const goTo = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return applications;
    }

    return applications.filter(
      (item) =>
        item.id.toLowerCase().includes(query) ||
        item.student.toLowerCase().includes(query) ||
        item.studentId.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query)
    );
  }, [applications, search]);

  const pendingApplications = applications.filter(
    (item) => item.status === "PENDING"
  );

  const pendingCertificates = certificates.filter(
    (item) => item.status === "PENDING"
  );

  const pendingDocuments = documents.filter(
    (item) => item.status === "PENDING"
  );

  /* =====================================================
     APPLICATION SIGNATURES
  ===================================================== */

  const toggleSignature = (signature) => {
    if (!selectedApplication) return;

    setApplications((previous) =>
      previous.map((application) => {
        if (
          application.id !== selectedApplication.id
        ) {
          return application;
        }

        return {
          ...application,
          signatures: {
            ...application.signatures,
            [signature]:
              !application.signatures[signature],
          },
        };
      })
    );

    setSelectedApplication((previous) => ({
      ...previous,
      signatures: {
        ...previous.signatures,
        [signature]:
          !previous.signatures[signature],
      },
    }));

    const names = {
      principal: "Principal signature and stamp",
      mentor: "Mentor signature and stamp",
      hod: "HOD signature and stamp",
    };

    showMessage(
      `${
        selectedApplication.signatures[signature]
          ? names[signature] + " removed."
          : names[signature] + " added."
      }`
    );
  };

  /* =====================================================
     APPLICATION ACTIONS
  ===================================================== */

  const approveApplication = (id) => {
    setApplications((previous) =>
      previous.map((application) =>
        application.id === id
          ? {
              ...application,
              status: "APPROVED",
            }
          : application
      )
    );

    setSelectedApplication((previous) =>
      previous
        ? {
            ...previous,
            status: "APPROVED",
          }
        : previous
    );

    showMessage("Application approved successfully.");
  };

  const rejectApplication = (id) => {
    setApplications((previous) =>
      previous.map((application) =>
        application.id === id
          ? {
              ...application,
              status: "REJECTED",
            }
          : application
      )
    );

    setSelectedApplication((previous) =>
      previous
        ? {
            ...previous,
            status: "REJECTED",
          }
        : previous
    );

    showMessage("Application rejected.");
  };

  /* =====================================================
     CERTIFICATE ACTIONS
  ===================================================== */

  const verifyCertificate = (id) => {
    setCertificates((previous) =>
      previous.map((certificate) =>
        certificate.id === id
          ? {
              ...certificate,
              status: "VERIFIED",
            }
          : certificate
      )
    );

    setSelectedCertificate((previous) =>
      previous
        ? {
            ...previous,
            status: "VERIFIED",
          }
        : previous
    );

    showMessage("Certificate request verified.");
  };

  const rejectCertificate = (id) => {
    setCertificates((previous) =>
      previous.map((certificate) =>
        certificate.id === id
          ? {
              ...certificate,
              status: "REJECTED",
            }
          : certificate
      )
    );

    setSelectedCertificate((previous) =>
      previous
        ? {
            ...previous,
            status: "REJECTED",
          }
        : previous
    );

    showMessage("Certificate request rejected.");
  };

  /* =====================================================
     DOCUMENT ACTIONS
  ===================================================== */

  const verifyDocument = (id) => {
    setDocuments((previous) =>
      previous.map((document) =>
        document.id === id
          ? {
              ...document,
              status: "VERIFIED",
            }
          : document
      )
    );

    setSelectedDocument((previous) =>
      previous
        ? {
            ...previous,
            status: "VERIFIED",
          }
        : previous
    );

    showMessage("Document verified successfully.");
  };

  const rejectDocument = (id) => {
    setDocuments((previous) =>
      previous.map((document) =>
        document.id === id
          ? {
              ...document,
              status: "REJECTED",
            }
          : document
      )
    );

    setSelectedDocument((previous) =>
      previous
        ? {
            ...previous,
            status: "REJECTED",
          }
        : previous
    );

    showMessage("Document rejected.");
  };

  /* =====================================================
     NOTICE
  ===================================================== */

  const createNotice = () => {
    if (!noticeForm.title.trim()) {
      showMessage("Please enter a notice title.");
      return;
    }

    const newNotice = {
      id: `NOTICE-${Date.now()}`,
      title: noticeForm.title.trim(),
      audience: noticeForm.audience,
      branch: noticeForm.branch,
      semester: noticeForm.semester,
      date: new Date().toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      ),
      status: "PUBLISHED",
    };

    setNotices((previous) => [
      newNotice,
      ...previous,
    ]);

    setNoticeForm({
      title: "",
      audience: "All Students",
      branch: "All Branches",
      semester: "All Semesters",
    });

    setShowNoticeForm(false);

    showMessage("Notice published successfully.");
  };

  /* =====================================================
     DASHBOARD
  ===================================================== */

  const renderDashboard = () => (
    <>
      <div className="documentation-header">
        <div>
          <span className="documentation-eyebrow">
            DOCUMENTATION ADMIN
          </span>

          <h1>Documentation Management</h1>

          <p>
            Manage student applications, certificates,
            document verification and campus notices.
          </p>
        </div>

        <div className="documentation-status">
          <span />
          Documentation System Active
        </div>
      </div>

      <div className="documentation-stats">
        <div className="documentation-stat">
          <span>Total Applications</span>
          <strong>{applications.length}</strong>
          <small>
            {pendingApplications.length} pending review
          </small>
        </div>

        <div className="documentation-stat">
          <span>Certificate Requests</span>
          <strong>{certificates.length}</strong>
          <small>
            {pendingCertificates.length} pending
          </small>
        </div>

        <div className="documentation-stat">
          <span>Documents</span>
          <strong>{documents.length}</strong>
          <small>
            {pendingDocuments.length} awaiting verification
          </small>
        </div>

        <div className="documentation-stat">
          <span>Published Notices</span>
          <strong>
            {
              notices.filter(
                (item) => item.status === "PUBLISHED"
              ).length
            }
          </strong>
          <small>Campus communications</small>
        </div>
      </div>

      <div className="documentation-action-grid">
        <button
          onClick={() =>
            goTo("admin-documents-applications")
          }
        >
          <span>📝</span>
          <strong>Applications</strong>
          <small>
            Review and process student applications.
          </small>
        </button>

        <button
          onClick={() =>
            goTo("admin-documents-certificates")
          }
        >
          <span>📜</span>
          <strong>Certificate Requests</strong>
          <small>
            Verify and process certificate requests.
          </small>
        </button>

        <button
          onClick={() =>
            goTo("admin-documents-verification")
          }
        >
          <span>✅</span>
          <strong>Document Verification</strong>
          <small>
            Verify submitted student documents.
          </small>
        </button>

        <button
          onClick={() => setShowNoticeForm(true)}
        >
          <span>📢</span>
          <strong>Create Notice</strong>
          <small>
            Publish a campus-wide or targeted notice.
          </small>
        </button>
      </div>

      <section className="documentation-panel">
        <div className="documentation-panel-head">
          <div>
            <h2>Pending Applications</h2>
            <p>
              Applications requiring documentation review.
            </p>
          </div>

          <button
            onClick={() =>
              goTo("admin-documents-applications")
            }
          >
            View All
          </button>
        </div>

        <div className="documentation-mini-list">
          {pendingApplications
            .slice(0, 4)
            .map((application) => (
              <button
                key={application.id}
                onClick={() => {
                  setSelectedApplication(application);
                  setShowApplication(true);
                }}
              >
                <div>
                  <strong>
                    {application.subject}
                  </strong>

                  <small>
                    {application.student} •{" "}
                    {application.id}
                  </small>
                </div>

                <span
                  className={`documentation-status-pill ${STATUS_CLASS(
                    application.status
                  )}`}
                >
                  {application.status}
                </span>
              </button>
            ))}
        </div>
      </section>
    </>
  );

  /* =====================================================
     APPLICATIONS
  ===================================================== */

  const renderApplications = () => (
    <>
      <div className="documentation-header">
        <div>
          <span className="documentation-eyebrow">
            DOCUMENTATION / APPLICATIONS
          </span>

          <h1>Student Applications</h1>

          <p>
            Review, approve, reject and prepare applications
            for authorized signatures and printing.
          </p>
        </div>
      </div>

      <section className="documentation-panel">
        <div className="documentation-toolbar">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search application, student or type..."
          />

          <span>
            {filteredApplications.length} applications
          </span>
        </div>

        <div className="documentation-table-wrap">
          <table className="documentation-table">
            <thead>
              <tr>
                <th>APPLICATION</th>
                <th>STUDENT</th>
                <th>TYPE</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {filteredApplications.map(
                (application) => (
                  <tr key={application.id}>
                    <td>
                      <strong>{application.id}</strong>
                      <small>
                        {application.subject}
                      </small>
                    </td>

                    <td>
                      <strong>
                        {application.student}
                      </strong>
                      <small>
                        {application.studentId} •{" "}
                        {application.branch}
                      </small>
                    </td>

                    <td>{application.type}</td>

                    <td>{application.date}</td>

                    <td>
                      <span
                        className={`documentation-status-pill ${STATUS_CLASS(
                          application.status
                        )}`}
                      >
                        {application.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="documentation-view-btn"
                        onClick={() => {
                          setSelectedApplication(
                            application
                          );
                          setShowApplication(true);
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
     CERTIFICATES
  ===================================================== */

  const renderCertificates = () => (
    <>
      <div className="documentation-header">
        <div>
          <span className="documentation-eyebrow">
            DOCUMENTATION / CERTIFICATES
          </span>

          <h1>Certificate Requests</h1>

          <p>
            Verify and process student certificate requests.
          </p>
        </div>
      </div>

      <section className="documentation-panel">
        <div className="documentation-table-wrap">
          <table className="documentation-table">
            <thead>
              <tr>
                <th>REQUEST ID</th>
                <th>STUDENT</th>
                <th>CERTIFICATE</th>
                <th>REQUESTED</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {certificates.map((certificate) => (
                <tr key={certificate.id}>
                  <td>{certificate.id}</td>

                  <td>
                    <strong>
                      {certificate.student}
                    </strong>

                    <small>
                      {certificate.studentId}
                    </small>
                  </td>

                  <td>{certificate.type}</td>

                  <td>{certificate.requested}</td>

                  <td>
                    <span
                      className={`documentation-status-pill ${STATUS_CLASS(
                        certificate.status
                      )}`}
                    >
                      {certificate.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="documentation-view-btn"
                      onClick={() => {
                        setSelectedCertificate(
                          certificate
                        );
                        setShowCertificate(true);
                      }}
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

  /* =====================================================
     DOCUMENT VERIFICATION
  ===================================================== */

  const renderVerification = () => (
    <>
      <div className="documentation-header">
        <div>
          <span className="documentation-eyebrow">
            DOCUMENTATION / VERIFICATION
          </span>

          <h1>Document Verification</h1>

          <p>
            Review student-submitted documents and update
            verification status.
          </p>
        </div>
      </div>

      <section className="documentation-panel">
        <div className="documentation-table-wrap">
          <table className="documentation-table">
            <thead>
              <tr>
                <th>DOCUMENT ID</th>
                <th>STUDENT</th>
                <th>DOCUMENT</th>
                <th>SUBMITTED</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td>{document.id}</td>

                  <td>
                    <strong>
                      {document.student}
                    </strong>

                    <small>
                      {document.studentId}
                    </small>
                  </td>

                  <td>{document.document}</td>

                  <td>{document.submitted}</td>

                  <td>
                    <span
                      className={`documentation-status-pill ${STATUS_CLASS(
                        document.status
                      )}`}
                    >
                      {document.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="documentation-view-btn"
                      onClick={() => {
                        setSelectedDocument(
                          document
                        );
                        setShowDocument(true);
                      }}
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

  /* =====================================================
     NOTICES
  ===================================================== */

  const renderNotices = (target = "all") => {
    const filteredNotices =
      target === "branch"
        ? notices.filter(
            (notice) =>
              notice.branch !== "All Branches"
          )
        : target === "semester"
        ? notices.filter(
            (notice) =>
              notice.semester !== "All Semesters"
          )
        : notices;

    return (
      <>
        <div className="documentation-header">
          <div>
            <span className="documentation-eyebrow">
              DOCUMENTATION / NOTICES
            </span>

            <h1>
              {target === "branch"
                ? "Branch Notices"
                : target === "semester"
                ? "Semester Notices"
                : "Notices & Announcements"}
            </h1>

            <p>
              Publish targeted academic and campus
              communications.
            </p>
          </div>

          <button
            className="documentation-primary-btn"
            onClick={() =>
              setShowNoticeForm(true)
            }
          >
            + Create Notice
          </button>
        </div>

        <section className="documentation-panel">
          <div className="notice-list">
            {filteredNotices.map((notice) => (
              <div
                className="notice-card"
                key={notice.id}
              >
                <div>
                  <span>{notice.id}</span>

                  <h3>{notice.title}</h3>

                  <p>
                    {notice.audience} •{" "}
                    {notice.branch} •{" "}
                    {notice.semester}
                  </p>

                  <small>
                    Published: {notice.date}
                  </small>
                </div>

                <span className="documentation-status-pill published">
                  PUBLISHED
                </span>
              </div>
            ))}

            {filteredNotices.length === 0 && (
              <div className="documentation-empty">
                No notices found.
              </div>
            )}
          </div>
        </section>
      </>
    );
  };

  /* =====================================================
     MODULE ROUTER
  ===================================================== */

  const renderModule = () => {
    switch (module) {
      case "applications":
        return renderApplications();

      case "certificates":
        return renderCertificates();

      case "verification":
        return renderVerification();

      case "notices":
        return renderNotices("all");

      case "branch-notices":
        return renderNotices("branch");

      case "semester-notices":
        return renderNotices("semester");

      case "dashboard":
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="documentation-page">
      {renderModule()}

      {/* =================================================
          APPLICATION VIEW / PRINT
      ================================================= */}

      {showApplication &&
        selectedApplication && (
          <div
            className="documentation-modal-overlay"
            onClick={() =>
              setShowApplication(false)
            }
          >
            <div
              className="documentation-modal application-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="documentation-modal-head no-print">
                <div>
                  <span>APPLICATION PREVIEW</span>
                  <h2>
                    {selectedApplication.subject}
                  </h2>
                  <p>
                    {selectedApplication.id}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowApplication(false)
                  }
                >
                  ×
                </button>
              </div>

              <div className="application-actions no-print">
                <button
                  className="signature-button principal"
                  onClick={() =>
                    toggleSignature("principal")
                  }
                >
                  ✍ Principal Signature + Stamp
                </button>

                <button
                  className="signature-button mentor"
                  onClick={() =>
                    toggleSignature("mentor")
                  }
                >
                  ✍ Mentor Signature + Stamp
                </button>

                <button
                  className="signature-button hod"
                  onClick={() =>
                    toggleSignature("hod")
                  }
                >
                  ✍ HOD Signature + Stamp
                </button>
              </div>

              <div className="application-document">
                <div className="application-document-header">
                  <div className="application-logo">
                    E
                  </div>

                  <div>
                    <h1>EKAM</h1>
                    <p>
                      One campus. One platform.
                    </p>
                  </div>

                  <div className="application-document-meta">
                    <strong>
                      {selectedApplication.id}
                    </strong>

                    <span>
                      {selectedApplication.date}
                    </span>
                  </div>
                </div>

                <div className="application-title">
                  <h2>
                    {selectedApplication.type}
                  </h2>

                  <span
                    className={`documentation-status-pill ${STATUS_CLASS(
                      selectedApplication.status
                    )}`}
                  >
                    {selectedApplication.status}
                  </span>
                </div>

                <div className="application-info-grid">
                  <div>
                    <span>Student Name</span>
                    <strong>
                      {selectedApplication.student}
                    </strong>
                  </div>

                  <div>
                    <span>Student ID</span>
                    <strong>
                      {selectedApplication.studentId}
                    </strong>
                  </div>

                  <div>
                    <span>Branch</span>
                    <strong>
                      {selectedApplication.branch}
                    </strong>
                  </div>

                  <div>
                    <span>Semester</span>
                    <strong>
                      {selectedApplication.semester}
                    </strong>
                  </div>
                </div>

                <div className="application-subject">
                  <span>Subject</span>
                  <strong>
                    {selectedApplication.subject}
                  </strong>
                </div>

                <div className="application-reason">
                  <span>Application / Reason</span>

                  <p>
                    {selectedApplication.reason}
                  </p>
                </div>

                {/* SIGNATURES AUTOMATICALLY APPEAR HERE */}

                {(selectedApplication.signatures
                  .principal ||
                  selectedApplication.signatures
                    .mentor ||
                  selectedApplication.signatures
                    .hod) && (
                  <div className="application-signature-section">
                    <h3>Authorization</h3>

                    <div className="application-signature-grid">
                      {selectedApplication
                        .signatures.principal && (
                        <div className="official-signature">
                          <div className="signature-space">
                            Authorized Signature
                          </div>

                          <div className="stamp">
                            OFFICIAL
                            <br />
                            STAMP
                          </div>

                          <strong>
                            Principal
                          </strong>

                          <span>
                            Principal Office
                          </span>
                        </div>
                      )}

                      {selectedApplication
                        .signatures.mentor && (
                        <div className="official-signature">
                          <div className="signature-space">
                            Authorized Signature
                          </div>

                          <div className="stamp">
                            OFFICIAL
                            <br />
                            STAMP
                          </div>

                          <strong>
                            Mentor
                          </strong>

                          <span>
                            Faculty Mentor
                          </span>
                        </div>
                      )}

                      {selectedApplication
                        .signatures.hod && (
                        <div className="official-signature">
                          <div className="signature-space">
                            Authorized Signature
                          </div>

                          <div className="stamp">
                            OFFICIAL
                            <br />
                            STAMP
                          </div>

                          <strong>HOD</strong>

                          <span>
                            Head of Department
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="application-document-footer">
                  <span>
                    Generated through EKAM
                  </span>

                  <span>
                    {selectedApplication.id}
                  </span>
                </div>
              </div>

              <div className="application-bottom-actions no-print">
                {selectedApplication.status ===
                  "PENDING" && (
                  <>
                    <button
                      className="application-approve"
                      onClick={() =>
                        approveApplication(
                          selectedApplication.id
                        )
                      }
                    >
                      ✓ Approve Application
                    </button>

                    <button
                      className="application-reject"
                      onClick={() =>
                        rejectApplication(
                          selectedApplication.id
                        )
                      }
                    >
                      ✕ Reject
                    </button>
                  </>
                )}

                <button
                  className="application-print"
                  onClick={() => window.print()}
                >
                  🖨 Print Application
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =================================================
          CERTIFICATE MODAL
      ================================================= */}

      {showCertificate &&
        selectedCertificate && (
          <div
            className="documentation-modal-overlay"
            onClick={() =>
              setShowCertificate(false)
            }
          >
            <div
              className="documentation-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="documentation-modal-head">
                <div>
                  <span>CERTIFICATE REQUEST</span>
                  <h2>
                    {selectedCertificate.type}
                  </h2>
                  <p>
                    {selectedCertificate.student} •{" "}
                    {selectedCertificate.studentId}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowCertificate(false)
                  }
                >
                  ×
                </button>
              </div>

              <div className="documentation-detail-box">
                <div>
                  <span>Request ID</span>
                  <strong>
                    {selectedCertificate.id}
                  </strong>
                </div>

                <div>
                  <span>Requested</span>
                  <strong>
                    {selectedCertificate.requested}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>
                    {selectedCertificate.status}
                  </strong>
                </div>
              </div>

              <div className="documentation-modal-actions">
                {selectedCertificate.status ===
                  "PENDING" && (
                  <>
                    <button
                      className="documentation-approve"
                      onClick={() =>
                        verifyCertificate(
                          selectedCertificate.id
                        )
                      }
                    >
                      ✓ Verify
                    </button>

                    <button
                      className="documentation-reject"
                      onClick={() =>
                        rejectCertificate(
                          selectedCertificate.id
                        )
                      }
                    >
                      ✕ Reject
                    </button>
                  </>
                )}

                <button
                  className="documentation-secondary"
                  onClick={() =>
                    setShowCertificate(false)
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =================================================
          DOCUMENT MODAL
      ================================================= */}

      {showDocument &&
        selectedDocument && (
          <div
            className="documentation-modal-overlay"
            onClick={() =>
              setShowDocument(false)
            }
          >
            <div
              className="documentation-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="documentation-modal-head">
                <div>
                  <span>DOCUMENT VERIFICATION</span>

                  <h2>
                    {selectedDocument.document}
                  </h2>

                  <p>
                    {selectedDocument.student} •{" "}
                    {selectedDocument.studentId}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowDocument(false)
                  }
                >
                  ×
                </button>
              </div>

              <div className="document-preview">
                <div className="document-preview-icon">
                  📄
                </div>

                <strong>
                  {selectedDocument.document}
                </strong>

                <span>
                  Submitted on{" "}
                  {selectedDocument.submitted}
                </span>
              </div>

              <div className="documentation-modal-actions">
                {selectedDocument.status ===
                  "PENDING" && (
                  <>
                    <button
                      className="documentation-approve"
                      onClick={() =>
                        verifyDocument(
                          selectedDocument.id
                        )
                      }
                    >
                      ✓ Verify Document
                    </button>

                    <button
                      className="documentation-reject"
                      onClick={() =>
                        rejectDocument(
                          selectedDocument.id
                        )
                      }
                    >
                      ✕ Reject
                    </button>
                  </>
                )}

                <button
                  className="documentation-secondary"
                  onClick={() =>
                    setShowDocument(false)
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =================================================
          NOTICE FORM
      ================================================= */}

      {showNoticeForm && (
        <div
          className="documentation-modal-overlay"
          onClick={() =>
            setShowNoticeForm(false)
          }
        >
          <div
            className="documentation-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="documentation-modal-head">
              <div>
                <span>NOTICE MANAGEMENT</span>
                <h2>Create Notice</h2>
                <p>
                  Publish a targeted campus
                  announcement.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowNoticeForm(false)
                }
              >
                ×
              </button>
            </div>

            <div className="notice-form">
              <label>
                Notice Title
                <input
                  value={noticeForm.title}
                  onChange={(event) =>
                    setNoticeForm({
                      ...noticeForm,
                      title: event.target.value,
                    })
                  }
                  placeholder="Enter notice title"
                />
              </label>

              <label>
                Audience
                <select
                  value={noticeForm.audience}
                  onChange={(event) =>
                    setNoticeForm({
                      ...noticeForm,
                      audience: event.target.value,
                    })
                  }
                >
                  <option>All Students</option>
                  <option>Students</option>
                  <option>Faculty</option>
                  <option>Staff</option>
                </select>
              </label>

              <label>
                Branch
                <select
                  value={noticeForm.branch}
                  onChange={(event) =>
                    setNoticeForm({
                      ...noticeForm,
                      branch: event.target.value,
                    })
                  }
                >
                  <option>All Branches</option>
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
                  onChange={(event) =>
                    setNoticeForm({
                      ...noticeForm,
                      semester: event.target.value,
                    })
                  }
                >
                  <option>All Semesters</option>
                  <option>1st Semester</option>
                  <option>3rd Semester</option>
                  <option>5th Semester</option>
                  <option>7th Semester</option>
                </select>
              </label>
            </div>

            <div className="documentation-modal-actions">
              <button
                className="documentation-approve"
                onClick={createNotice}
              >
                📢 Publish Notice
              </button>

              <button
                className="documentation-secondary"
                onClick={() =>
                  setShowNoticeForm(false)
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="documentation-toast">
          <span>✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}