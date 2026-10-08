import React, { useMemo, useState } from "react";
import "./AccountsAdmin.css";

/* =========================================================
   SAMPLE DATA
========================================================= */

const INITIAL_FEES = [
  {
    id: "STU001",
    name: "Aditya Kumar",
    branch: "CSE",
    semester: "5th",
    total: 85000,
    paid: 85000,
    due: 0,
    status: "PAID",
  },
  {
    id: "STU002",
    name: "Rahul Kumar",
    branch: "CSE",
    semester: "5th",
    total: 85000,
    paid: 65000,
    due: 20000,
    status: "PARTIAL",
  },
  {
    id: "STU003",
    name: "Priya Das",
    branch: "ECE",
    semester: "3rd",
    total: 78000,
    paid: 48000,
    due: 30000,
    status: "DUE",
  },
  {
    id: "STU004",
    name: "Sneha Patnaik",
    branch: "CSE",
    semester: "3rd",
    total: 82000,
    paid: 82000,
    due: 0,
    status: "PAID",
  },
  {
    id: "STU005",
    name: "Rohan Mishra",
    branch: "ME",
    semester: "5th",
    total: 76000,
    paid: 56000,
    due: 20000,
    status: "PARTIAL",
  },
];

const INITIAL_PAYMENTS = [
  {
    id: "PAY001",
    studentId: "STU002",
    student: "Rahul Kumar",
    amount: 20000,
    method: "UPI",
    reference: "UPI-928374",
    date: "08 Oct 2026",
    status: "PENDING",
  },
  {
    id: "PAY002",
    studentId: "STU003",
    student: "Priya Das",
    amount: 15000,
    method: "Bank Transfer",
    reference: "NEFT-293847",
    date: "08 Oct 2026",
    status: "PENDING",
  },
  {
    id: "PAY003",
    studentId: "STU005",
    student: "Rohan Mishra",
    amount: 20000,
    method: "UPI",
    reference: "UPI-483920",
    date: "07 Oct 2026",
    status: "VERIFIED",
  },
];

const INITIAL_REFUNDS = [
  {
    id: "REF001",
    studentId: "STU004",
    student: "Sneha Patnaik",
    amount: 5000,
    reason: "Duplicate payment",
    date: "07 Oct 2026",
    status: "PENDING",
  },
  {
    id: "REF002",
    studentId: "STU001",
    student: "Aditya Kumar",
    amount: 2500,
    reason: "Excess payment",
    date: "06 Oct 2026",
    status: "APPROVED",
  },
];

const INITIAL_RECEIPTS = [
  {
    id: "REC001",
    studentId: "STU001",
    student: "Aditya Kumar",
    amount: 85000,
    paymentId: "PAY-1001",
    date: "02 Oct 2026",
    method: "UPI",
  },
  {
    id: "REC002",
    studentId: "STU002",
    student: "Rahul Kumar",
    amount: 45000,
    paymentId: "PAY-1002",
    date: "01 Oct 2026",
    method: "Bank Transfer",
  },
  {
    id: "REC003",
    studentId: "STU003",
    student: "Priya Das",
    amount: 48000,
    paymentId: "PAY-1003",
    date: "28 Sep 2026",
    method: "UPI",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const formatMoney = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

const getStatusClass = (status) => {
  return String(status || "").toLowerCase().replace(/\s+/g, "-");
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AccountsAdmin({ module = "dashboard" }) {
  const [fees, setFees] = useState(INITIAL_FEES);
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);
  const [refunds, setRefunds] = useState(INITIAL_REFUNDS);
  const [receipts, setReceipts] = useState(INITIAL_RECEIPTS);

  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
 const [selectedStudent, setSelectedStudent] = useState(null);
const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [feeForm, setFeeForm] = useState({
    name: "",
    studentId: "",
    branch: "CSE",
    semester: "5th",
    total: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    studentId: "",
    amount: "",
    method: "UPI",
    reference: "",
  });

  const [refundForm, setRefundForm] = useState({
    studentId: "",
    amount: "",
    reason: "",
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
     CALCULATIONS
  ======================================================= */

  const totalCollected = useMemo(
    () => fees.reduce((sum, item) => sum + Number(item.paid || 0), 0),
    [fees]
  );

  const totalOutstanding = useMemo(
    () => fees.reduce((sum, item) => sum + Number(item.due || 0), 0),
    [fees]
  );

  const fullyPaidStudents = useMemo(
    () => fees.filter((item) => item.status === "PAID").length,
    [fees]
  );

  const studentsWithDues = useMemo(
    () => fees.filter((item) => Number(item.due) > 0).length,
    [fees]
  );

  const pendingPayments = useMemo(
    () => payments.filter((item) => item.status === "PENDING").length,
    [payments]
  );

  const pendingRefunds = useMemo(
    () => refunds.filter((item) => item.status === "PENDING").length,
    [refunds]
  );

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredFees = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return fees;
    }

    return fees.filter(
      (item) =>
        item.name.toLowerCase().includes(value) ||
        item.id.toLowerCase().includes(value) ||
        item.branch.toLowerCase().includes(value)
    );
  }, [fees, search]);

  /* =======================================================
     ADD FEE
  ======================================================= */

  const handleAddFee = (event) => {
    event.preventDefault();

    if (
      !feeForm.name.trim() ||
      !feeForm.studentId.trim() ||
      !feeForm.total
    ) {
      showMessage("Please enter student name, ID and total fee.");
      return;
    }

    const exists = fees.some(
      (item) =>
        item.id.toLowerCase() === feeForm.studentId.trim().toLowerCase()
    );

    if (exists) {
      showMessage("A fee record already exists for this student.");
      return;
    }

    const total = Number(feeForm.total);

    if (total <= 0) {
      showMessage("Please enter a valid fee amount.");
      return;
    }

    const newFee = {
      id: feeForm.studentId.trim().toUpperCase(),
      name: feeForm.name.trim(),
      branch: feeForm.branch,
      semester: feeForm.semester,
      total,
      paid: 0,
      due: total,
      status: "DUE",
    };

    setFees((previous) => [...previous, newFee]);

    setFeeForm({
      name: "",
      studentId: "",
      branch: "CSE",
      semester: "5th",
      total: "",
    });

    setShowFeeModal(false);

    showMessage("Fee record added successfully.");
  };

  /* =======================================================
     ADD PAYMENT
  ======================================================= */

  const handleAddPayment = (event) => {
    event.preventDefault();

    if (
      !paymentForm.studentId.trim() ||
      !paymentForm.amount ||
      !paymentForm.reference.trim()
    ) {
      showMessage("Please complete all payment details.");
      return;
    }

    const student = fees.find(
      (item) =>
        item.id.toLowerCase() ===
        paymentForm.studentId.trim().toLowerCase()
    );

    if (!student) {
      showMessage("Student fee record not found.");
      return;
    }

    const amount = Number(paymentForm.amount);

    if (amount <= 0) {
      showMessage("Please enter a valid payment amount.");
      return;
    }

    const newPayment = {
      id: `PAY${Date.now()}`,
      studentId: student.id,
      student: student.name,
      amount,
      method: paymentForm.method,
      reference: paymentForm.reference.trim(),
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "PENDING",
    };

    setPayments((previous) => [newPayment, ...previous]);

    setPaymentForm({
      studentId: "",
      amount: "",
      method: "UPI",
      reference: "",
    });

    setShowPaymentModal(false);

    showMessage("Payment request submitted for verification.");
  };

  /* =======================================================
     ADD REFUND
  ======================================================= */

  const handleAddRefund = (event) => {
    event.preventDefault();

    if (
      !refundForm.studentId.trim() ||
      !refundForm.amount ||
      !refundForm.reason.trim()
    ) {
      showMessage("Please complete all refund details.");
      return;
    }

    const student = fees.find(
      (item) =>
        item.id.toLowerCase() ===
        refundForm.studentId.trim().toLowerCase()
    );

    if (!student) {
      showMessage("Student fee record not found.");
      return;
    }

    const amount = Number(refundForm.amount);

    if (amount <= 0) {
      showMessage("Please enter a valid refund amount.");
      return;
    }

    const newRefund = {
      id: `REF${Date.now()}`,
      studentId: student.id,
      student: student.name,
      amount,
      reason: refundForm.reason.trim(),
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "PENDING",
    };

    setRefunds((previous) => [newRefund, ...previous]);

    setRefundForm({
      studentId: "",
      amount: "",
      reason: "",
    });

    setShowRefundModal(false);

    showMessage("Refund request submitted.");
  };

  /* =======================================================
     PAYMENT ACTIONS
  ======================================================= */

  const verifyPayment = (payment) => {
    setPayments((previous) =>
      previous.map((item) =>
        item.id === payment.id
          ? {
              ...item,
              status: "VERIFIED",
            }
          : item
      )
    );

    setFees((previous) =>
      previous.map((fee) => {
        if (fee.id !== payment.studentId) {
          return fee;
        }

        const newPaid = Math.min(
          Number(fee.total),
          Number(fee.paid) + Number(payment.amount)
        );

        const newDue = Math.max(
          0,
          Number(fee.total) - newPaid
        );

        return {
          ...fee,
          paid: newPaid,
          due: newDue,
          status:
            newDue === 0
              ? "PAID"
              : newPaid > 0
              ? "PARTIAL"
              : "DUE",
        };
      })
    );

    const receipt = {
      id: `REC${Date.now()}`,
      studentId: payment.studentId,
      student: payment.student,
      amount: Number(payment.amount),
      paymentId: payment.id,
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      method: payment.method,
    };

    setReceipts((previous) => [receipt, ...previous]);

    showMessage("Payment verified and receipt generated.");
  };

  const rejectPayment = (payment) => {
    setPayments((previous) =>
      previous.map((item) =>
        item.id === payment.id
          ? {
              ...item,
              status: "REJECTED",
            }
          : item
      )
    );

    showMessage("Payment request rejected.");
  };

  /* =======================================================
     REFUND ACTIONS
  ======================================================= */

  const approveRefund = (refund) => {
    setRefunds((previous) =>
      previous.map((item) =>
        item.id === refund.id
          ? {
              ...item,
              status: "APPROVED",
            }
          : item
      )
    );

    showMessage("Refund request approved.");
  };

  const rejectRefund = (refund) => {
    setRefunds((previous) =>
      previous.map((item) =>
        item.id === refund.id
          ? {
              ...item,
              status: "REJECTED",
            }
          : item
      )
    );

    showMessage("Refund request rejected.");
  };

  /* =======================================================
     STUDENT DETAILS
  ======================================================= */

  const openStudentDetails = (student) => {
    setSelectedStudent(student);
  };

  /* =======================================================
     HEADER
  ======================================================= */

  const renderHeader = (title, subtitle, action = null) => {
    return (
      <div className="accounts-page-header">
        <div>
          <span className="accounts-eyebrow">
            ACCOUNTS ADMIN
          </span>

          <h1>{title}</h1>

          <p>{subtitle}</p>
        </div>

        {action}
      </div>
    );
  };

  /* =======================================================
     DASHBOARD
  ======================================================= */

  const renderDashboard = () => {
    return (
      <>
        {renderHeader(
          "Accounts Management",
          "Campus-wide financial operations, fees and payment control."
        )}

        <div className="accounts-stats">
          <div className="accounts-stat-card success">
            <span>Total Collected</span>
            <strong>{formatMoney(totalCollected)}</strong>
            <small>Verified student payments</small>
          </div>

          <div className="accounts-stat-card danger">
            <span>Total Outstanding</span>
            <strong>{formatMoney(totalOutstanding)}</strong>
            <small>Pending student dues</small>
          </div>

          <div className="accounts-stat-card success">
            <span>Students Fully Paid</span>
            <strong>{fullyPaidStudents}</strong>
            <small>Fee accounts cleared</small>
          </div>

          <div className="accounts-stat-card warning">
            <span>Students With Dues</span>
            <strong>{studentsWithDues}</strong>
            <small>Requires attention</small>
          </div>
        </div>

        <div className="accounts-module-grid">
          <button
            className="accounts-module-card"
            onClick={() => {
              setSearch("");
              window.history.pushState({}, "", "/admin/accounts");
            }}
          >
            <span>💳</span>
            <strong>Student Fees</strong>
            <small>
              View student-wise fee collection and dues.
            </small>
          </button>

          <button
            className="accounts-module-card"
            onClick={() => showMessage("Pending Dues module opened.")}
          >
            <span>💰</span>
            <strong>Pending Dues</strong>
            <small>
              Identify students with outstanding payments.
            </small>
          </button>

          <button
            className="accounts-module-card"
            onClick={() =>
              showMessage(
                `${pendingPayments} payment request${
                  pendingPayments === 1 ? "" : "s"
                } pending verification.`
              )
            }
          >
            <span>📥</span>
            <strong>Payment Requests</strong>
            <small>
              Verify student payment submissions.
            </small>
          </button>

          <button
            className="accounts-module-card"
            onClick={() =>
              showMessage(
                `${receipts.length} receipts are available.`
              )
            }
          >
            <span>🧾</span>
            <strong>Receipts</strong>
            <small>
              View generated payment receipts.
            </small>
          </button>

          <button
            className="accounts-module-card"
            onClick={() =>
              showMessage(
                `${pendingRefunds} refund request${
                  pendingRefunds === 1 ? "" : "s"
                } pending.`
              )
            }
          >
            <span>🔄</span>
            <strong>Refund Requests</strong>
            <small>
              Review student refund requests.
            </small>
          </button>

          <button
            className="accounts-module-card"
            onClick={() =>
              showMessage("Financial reports module opened.")
            }
          >
            <span>📊</span>
            <strong>Financial Reports</strong>
            <small>
              Review campus-wide financial performance.
            </small>
          </button>
        </div>

        <section className="accounts-panel">
          <div className="accounts-panel-header">
            <div>
              <h2>Accounts Overview</h2>
              <p>
                Current financial status across student accounts.
              </p>
            </div>

            <button
              className="accounts-primary-btn"
              onClick={() =>
                showMessage(
                  "Financial report generated successfully."
                )
              }
            >
              Generate Report
            </button>
          </div>

          <div className="accounts-report-bars">
            <div>
              <span>Fee Collection</span>
              <strong>{formatMoney(totalCollected)}</strong>

              <div className="accounts-progress">
                <i style={{ width: "82%" }} />
              </div>
            </div>

            <div>
              <span>Pending Dues</span>
              <strong>{formatMoney(totalOutstanding)}</strong>

              <div className="accounts-progress">
                <i style={{ width: "38%" }} />
              </div>
            </div>

            <div>
              <span>Payment Verification</span>
              <strong>
                {pendingPayments} pending
              </strong>

              <div className="accounts-progress">
                <i style={{ width: "52%" }} />
              </div>
            </div>
          </div>
        </section>
      </>
    );
  };

  /* =======================================================
     FEES
  ======================================================= */

  const renderFeeTable = () => {
    return (
      <>
        {renderHeader(
          "Student Fee Directory",
          "Search and review student payment status.",
          <button
            className="accounts-primary-btn"
            onClick={() => setShowFeeModal(true)}
          >
            + Add Fee Record
          </button>
        )}

        <section className="accounts-panel">
          <div className="accounts-search">
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search student, ID or branch..."
            />
          </div>

          <div className="accounts-table-wrap">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>BRANCH</th>
                  <th>SEMESTER</th>
                  <th>TOTAL</th>
                  <th>PAID</th>
                  <th>DUE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredFees.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.name}</strong>
                      <small>{student.id}</small>
                    </td>

                    <td>{student.branch}</td>

                    <td>{student.semester}</td>

                    <td>
                      {formatMoney(student.total)}
                    </td>

                    <td>
                      {formatMoney(student.paid)}
                    </td>

                    <td className="due-text">
                      {formatMoney(student.due)}
                    </td>

                    <td>
                      <span
                        className={`accounts-status ${getStatusClass(
                          student.status
                        )}`}
                      >
                        {student.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="accounts-small-btn"
                        onClick={() =>
                          openStudentDetails(student)
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

          {filteredFees.length === 0 && (
            <p style={{ marginTop: 20 }}>
              No student records found.
            </p>
          )}
        </section>
      </>
    );
  };

  /* =======================================================
     DUES
  ======================================================= */

  const renderPendingDues = () => {
    const dueStudents = fees.filter(
      (item) => Number(item.due) > 0
    );

    return (
      <>
        {renderHeader(
          "Pending Dues",
          "Students requiring fee payment follow-up."
        )}

        <section className="accounts-panel">
          <div className="accounts-panel-header">
            <div>
              <h2>Outstanding Fee Accounts</h2>
              <p>
                Total outstanding:{" "}
                <strong>
                  {formatMoney(totalOutstanding)}
                </strong>
              </p>
            </div>

            <button
              className="accounts-primary-btn"
              onClick={() =>
                showMessage(
                  "Due reminder notifications prepared."
                )
              }
            >
              Send Reminders
            </button>
          </div>

          <div className="accounts-table-wrap">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>BRANCH</th>
                  <th>TOTAL FEE</th>
                  <th>PAID</th>
                  <th>DUE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {dueStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.name}</strong>
                      <small>{student.id}</small>
                    </td>

                    <td>{student.branch}</td>

                    <td>{formatMoney(student.total)}</td>

                    <td>{formatMoney(student.paid)}</td>

                    <td className="due-text">
                      {formatMoney(student.due)}
                    </td>

                    <td>
                      <span className="accounts-status due">
                        PAYMENT DUE
                      </span>
                    </td>

                    <td>
                      <button
                        className="accounts-small-btn"
                        onClick={() =>
                          showMessage(
                            `Reminder sent to ${student.name}.`
                          )
                        }
                      >
                        Remind
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
     PAYMENT REQUESTS
  ======================================================= */

  const renderPayments = () => {
    return (
      <>
        {renderHeader(
          "Payment Requests",
          "Review and verify student payment submissions.",
          <button
            className="accounts-primary-btn"
            onClick={() => setShowPaymentModal(true)}
          >
            + Add Payment
          </button>
        )}

        <section className="accounts-panel">
          <div className="accounts-panel-header">
            <div>
              <h2>Payment Verification Queue</h2>
              <p>
                {pendingPayments} pending verification
              </p>
            </div>
          </div>

          <div className="accounts-table-wrap">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>AMOUNT</th>
                  <th>METHOD</th>
                  <th>REFERENCE</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <strong>{payment.student}</strong>
                      <small>{payment.studentId}</small>
                    </td>

                    <td>
                      {formatMoney(payment.amount)}
                    </td>

                    <td>{payment.method}</td>

                    <td>{payment.reference}</td>

                    <td>{payment.date}</td>

                    <td>
                      <span
                        className={`accounts-status ${getStatusClass(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    <td className="accounts-actions">
                      {payment.status === "PENDING" ? (
                        <>
                          <button
                            className="accounts-approve-btn"
                            onClick={() =>
                              verifyPayment(payment)
                            }
                          >
                            Verify
                          </button>

                          <button
                            className="accounts-reject-btn"
                            onClick={() =>
                              rejectPayment(payment)
                            }
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span>—</span>
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
  };

  /* =======================================================
     RECEIPTS
  ======================================================= */

  const renderReceipts = () => {
    return (
      <>
        {renderHeader(
          "Payment Receipts",
          "Generated receipts for verified student payments."
        )}

        <section className="accounts-panel">
          <div className="accounts-table-wrap">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>RECEIPT</th>
                  <th>STUDENT</th>
                  <th>AMOUNT</th>
                  <th>PAYMENT ID</th>
                  <th>METHOD</th>
                  <th>DATE</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td>
                      <strong>{receipt.id}</strong>
                    </td>

                    <td>
                      <strong>{receipt.student}</strong>
                      <small>{receipt.studentId}</small>
                    </td>

                    <td>
                      {formatMoney(receipt.amount)}
                    </td>

                    <td>{receipt.paymentId}</td>

                    <td>{receipt.method}</td>

                    <td>{receipt.date}</td>

                    <td>
                     <button
  className="accounts-small-btn"
  onClick={() => setSelectedReceipt(receipt)}
>
  View Receipt
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
     REFUNDS
  ======================================================= */

  const renderRefunds = () => {
    return (
      <>
        {renderHeader(
          "Refund Requests",
          "Review and process student refund applications.",
          <button
            className="accounts-primary-btn"
            onClick={() => setShowRefundModal(true)}
          >
            + New Refund
          </button>
        )}

        <section className="accounts-panel">
          <div className="accounts-panel-header">
            <div>
              <h2>Refund Queue</h2>
              <p>
                {pendingRefunds} pending refund request
                {pendingRefunds === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="accounts-table-wrap">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>AMOUNT</th>
                  <th>REASON</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund.id}>
                    <td>
                      <strong>{refund.student}</strong>
                      <small>{refund.studentId}</small>
                    </td>

                    <td>
                      {formatMoney(refund.amount)}
                    </td>

                    <td>{refund.reason}</td>

                    <td>{refund.date}</td>

                    <td>
                      <span
                        className={`accounts-status ${getStatusClass(
                          refund.status
                        )}`}
                      >
                        {refund.status}
                      </span>
                    </td>

                    <td className="accounts-actions">
                      {refund.status === "PENDING" ? (
                        <>
                          <button
                            className="accounts-approve-btn"
                            onClick={() =>
                              approveRefund(refund)
                            }
                          >
                            Approve
                          </button>

                          <button
                            className="accounts-reject-btn"
                            onClick={() =>
                              rejectRefund(refund)
                            }
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span>—</span>
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
  };

  /* =======================================================
     REPORTS
  ======================================================= */

  const renderReports = () => {
    const totalFeeValue = fees.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    const collectionPercentage =
      totalFeeValue > 0
        ? Math.round(
            (totalCollected / totalFeeValue) * 100
          )
        : 0;

    return (
      <>
        {renderHeader(
          "Financial Reports",
          "Campus-wide fee collection and financial performance."
        )}

        <div className="accounts-report-grid">
          <div className="accounts-report-card">
            <span>💰</span>
            <small>Total Collected</small>
            <strong>{formatMoney(totalCollected)}</strong>
          </div>

          <div className="accounts-report-card">
            <span>⚠️</span>
            <small>Total Outstanding</small>
            <strong>
              {formatMoney(totalOutstanding)}
            </strong>
          </div>

          <div className="accounts-report-card">
            <span>✅</span>
            <small>Students Fully Paid</small>
            <strong>{fullyPaidStudents}</strong>
          </div>

          <div className="accounts-report-card">
            <span>📌</span>
            <small>Students With Dues</small>
            <strong>{studentsWithDues}</strong>
          </div>
        </div>

        <section className="accounts-panel">
          <div className="accounts-panel-header">
            <div>
              <h2>Collection Overview</h2>
              <p>Current accounts summary.</p>
            </div>

            <button
              className="accounts-primary-btn"
              onClick={() =>
                showMessage(
                  "Financial report generated successfully."
                )
              }
            >
              Generate Report
            </button>
          </div>

          <div className="accounts-report-bars">
            <div>
              <span>Fee Collection</span>
              <strong>
                {formatMoney(totalCollected)}
              </strong>

              <div className="accounts-progress">
                <i
                  style={{
                    width: `${Math.min(
                      collectionPercentage,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <span>Pending Dues</span>
              <strong>
                {formatMoney(totalOutstanding)}
              </strong>

              <div className="accounts-progress">
                <i style={{ width: "38%" }} />
              </div>
            </div>

            <div>
              <span>Payment Verification</span>
              <strong>
                {pendingPayments} pending
              </strong>

              <div className="accounts-progress">
                <i
                  style={{
                    width: `${Math.min(
                      pendingPayments * 20,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </>
    );
  };

  /* =======================================================
     MODULE ROUTER
  ======================================================= */

  const renderCurrentModule = () => {
    switch (module) {
      case "fees":
        return renderFeeTable();

      case "dues":
        return renderPendingDues();

      case "payments":
        return renderPayments();

      case "receipts":
        return renderReceipts();

      case "refunds":
        return renderRefunds();

      case "reports":
        return renderReports();

      case "dashboard":
      default:
        return renderDashboard();
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="accounts-admin-page">

      {renderCurrentModule()}

      {/* =====================================================
          FEE MODAL
      ===================================================== */}

      {showFeeModal && (
        <div
          className="accounts-modal-overlay"
          onClick={() => setShowFeeModal(false)}
        >
          <div
            className="accounts-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="accounts-modal-header">
              <div>
                <span>ACCOUNTS</span>
                <h2>Add Fee Record</h2>
              </div>

              <button
                onClick={() => setShowFeeModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddFee}>
              <label>
                Student Name
                <input
                  value={feeForm.name}
                  onChange={(event) =>
                    setFeeForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Enter student name"
                />
              </label>

              <label>
                Student ID
                <input
                  value={feeForm.studentId}
                  onChange={(event) =>
                    setFeeForm((previous) => ({
                      ...previous,
                      studentId: event.target.value,
                    }))
                  }
                  placeholder="Example: STU006"
                />
              </label>

              <label>
                Branch
                <select
                  value={feeForm.branch}
                  onChange={(event) =>
                    setFeeForm((previous) => ({
                      ...previous,
                      branch: event.target.value,
                    }))
                  }
                >
                  <option>CSE</option>
                  <option>ECE</option>
                  <option>ME</option>
                  <option>CE</option>
                  <option>EEE</option>
                </select>
              </label>

              <label>
                Semester
                <select
                  value={feeForm.semester}
                  onChange={(event) =>
                    setFeeForm((previous) => ({
                      ...previous,
                      semester: event.target.value,
                    }))
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
                Total Fee
                <input
                  type="number"
                  value={feeForm.total}
                  onChange={(event) =>
                    setFeeForm((previous) => ({
                      ...previous,
                      total: event.target.value,
                    }))
                  }
                  placeholder="Enter total fee"
                />
              </label>

              <button
                type="submit"
                className="accounts-primary-btn full"
              >
                Add Fee Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          PAYMENT MODAL
      ===================================================== */}

      {showPaymentModal && (
        <div
          className="accounts-modal-overlay"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="accounts-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="accounts-modal-header">
              <div>
                <span>ACCOUNTS</span>
                <h2>Add Payment Request</h2>
              </div>

              <button
                onClick={() =>
                  setShowPaymentModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddPayment}>
              <label>
                Student ID
                <input
                  value={paymentForm.studentId}
                  onChange={(event) =>
                    setPaymentForm((previous) => ({
                      ...previous,
                      studentId: event.target.value,
                    }))
                  }
                  placeholder="Example: STU002"
                />
              </label>

              <label>
                Amount
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(event) =>
                    setPaymentForm((previous) => ({
                      ...previous,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="Enter payment amount"
                />
              </label>

              <label>
                Payment Method
                <select
                  value={paymentForm.method}
                  onChange={(event) =>
                    setPaymentForm((previous) => ({
                      ...previous,
                      method: event.target.value,
                    }))
                  }
                >
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                  <option>Card</option>
                </select>
              </label>

              <label>
                Transaction Reference
                <input
                  value={paymentForm.reference}
                  onChange={(event) =>
                    setPaymentForm((previous) => ({
                      ...previous,
                      reference: event.target.value,
                    }))
                  }
                  placeholder="Enter transaction ID"
                />
              </label>

              <button
                type="submit"
                className="accounts-primary-btn full"
              >
                Submit Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          REFUND MODAL
      ===================================================== */}

      {showRefundModal && (
        <div
          className="accounts-modal-overlay"
          onClick={() => setShowRefundModal(false)}
        >
          <div
            className="accounts-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="accounts-modal-header">
              <div>
                <span>ACCOUNTS</span>
                <h2>Create Refund Request</h2>
              </div>

              <button
                onClick={() =>
                  setShowRefundModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddRefund}>
              <label>
                Student ID
                <input
                  value={refundForm.studentId}
                  onChange={(event) =>
                    setRefundForm((previous) => ({
                      ...previous,
                      studentId: event.target.value,
                    }))
                  }
                  placeholder="Example: STU004"
                />
              </label>

              <label>
                Refund Amount
                <input
                  type="number"
                  value={refundForm.amount}
                  onChange={(event) =>
                    setRefundForm((previous) => ({
                      ...previous,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="Enter refund amount"
                />
              </label>

              <label>
                Reason
                <textarea
                  rows="4"
                  value={refundForm.reason}
                  onChange={(event) =>
                    setRefundForm((previous) => ({
                      ...previous,
                      reason: event.target.value,
                    }))
                  }
                  placeholder="Enter reason for refund"
                />
              </label>

              <button
                type="submit"
                className="accounts-primary-btn full"
              >
                Submit Refund Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          STUDENT DETAILS MODAL
      ===================================================== */}

      {selectedStudent && (
        <div
          className="accounts-modal-overlay"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="accounts-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="accounts-modal-header">
              <div>
                <span>STUDENT ACCOUNT</span>
                <h2>{selectedStudent.name}</h2>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
              >
                ×
              </button>
            </div>

            <div className="accounts-detail-grid">
              <div>
                <small>Student ID</small>
                <strong>
                  {selectedStudent.id}
                </strong>
              </div>

              <div>
                <small>Branch</small>
                <strong>
                  {selectedStudent.branch}
                </strong>
              </div>

              <div>
                <small>Semester</small>
                <strong>
                  {selectedStudent.semester}
                </strong>
              </div>

              <div>
                <small>Status</small>
                <strong>
                  {selectedStudent.status}
                </strong>
              </div>

              <div>
                <small>Total Fee</small>
                <strong>
                  {formatMoney(selectedStudent.total)}
                </strong>
              </div>

              <div>
                <small>Total Paid</small>
                <strong>
                  {formatMoney(selectedStudent.paid)}
                </strong>
              </div>

              <div>
                <small>Outstanding Due</small>
                <strong>
                  {formatMoney(selectedStudent.due)}
                </strong>
              </div>

              <div>
                <small>Payment Progress</small>
                <strong>
                  {selectedStudent.total > 0
                    ? Math.round(
                        (selectedStudent.paid /
                          selectedStudent.total) *
                          100
                      )
                    : 0}
                  %
                </strong>
              </div>
            </div>

            <button
              className="accounts-primary-btn full"
              onClick={() => setSelectedStudent(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          EKAM TOAST
      ===================================================== */}
{/* =====================================================
    RECEIPT VIEW / PRINT MODAL
===================================================== */}

{selectedReceipt && (
  <div
    className="receipt-modal-overlay"
    onClick={() => setSelectedReceipt(null)}
  >
    <div
      className="receipt-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="receipt-modal-top">
        <div>
          <span className="receipt-modal-label">
            PAYMENT RECEIPT
          </span>

          <h2>Fee Payment Receipt</h2>
        </div>

        <button
          className="receipt-close-btn"
          onClick={() => setSelectedReceipt(null)}
        >
          ×
        </button>
      </div>

      <div className="printable-receipt">

        <div className="receipt-header">
          <div className="receipt-logo">
            E
          </div>

          <div>
            <h1>EKAM</h1>
            <p>One campus. One platform.</p>
          </div>

          <div className="receipt-copy">
            <strong>FEE RECEIPT</strong>
            <span>Original Copy</span>
          </div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-meta">
          <div>
            <span>Receipt No.</span>
            <strong>{selectedReceipt.id}</strong>
          </div>

          <div>
            <span>Date</span>
            <strong>{selectedReceipt.date}</strong>
          </div>
        </div>

        <div className="receipt-student-section">
          <h3>Student Information</h3>

          <div className="receipt-info-grid">
            <div>
              <span>Student Name</span>
              <strong>
                {selectedReceipt.student}
              </strong>
            </div>

            <div>
              <span>Student ID</span>
              <strong>
                {selectedReceipt.studentId}
              </strong>
            </div>

            <div>
              <span>Payment ID</span>
              <strong>
                {selectedReceipt.paymentId}
              </strong>
            </div>

            <div>
              <span>Payment Method</span>
              <strong>
                {selectedReceipt.method}
              </strong>
            </div>
          </div>
        </div>

        <div className="receipt-payment-section">
          <h3>Payment Details</h3>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Academic / College Fee Payment</td>

                <td>
                  {formatMoney(
                    selectedReceipt.amount
                  )}
                </td>
              </tr>

              <tr className="receipt-total-row">
                <td>Total Paid</td>

                <td>
                  {formatMoney(
                    selectedReceipt.amount
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="receipt-paid">
          <span>PAYMENT STATUS</span>
          <strong>PAID</strong>
        </div>

        <div className="receipt-footer">
          <div>
            <p>
              This is a system-generated payment
              receipt from EKAM.
            </p>

            <small>
              Please retain this receipt for future
              reference.
            </small>
          </div>

          <div className="receipt-sign">
            <div />
            <span>Accounts Administrator</span>
          </div>
        </div>

      </div>

      <div className="receipt-modal-actions">
        <button
          className="receipt-secondary-btn"
          onClick={() => setSelectedReceipt(null)}
        >
          Close
        </button>

        <button
          className="receipt-print-btn"
          onClick={() => window.print()}
        >
          🖨️ Print Receipt
        </button>
      </div>
    </div>
  </div>
)}
      {toast && (
        <div className="accounts-toast">
          <span>✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}