import React, { useState } from "react";
import { requestEmailOtp, verifyEmailOtp } from "../email-auth";
import "./AdminLogin.css";

export default function Login({ onLogin, onAdminLogin }) {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    try {
      const result = await requestEmailOtp(email);
      setChallengeId(result.challengeId);
      setOtpSent(true);
    } catch (requestError) {
      console.error("Student OTP request error:", requestError);
      setError(requestError.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    try {
      const student = await verifyEmailOtp(
        challengeId,
        otp.trim(),
        "student"
      );
      localStorage.setItem("ekamStudent", JSON.stringify(student));
      onLogin?.(student);
    } catch (verifyError) {
      console.error("Student OTP verification error:", verifyError);
      setError(verifyError.message || "Student sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setChallengeId("");
    setOtpSent(false);
    setOtp("");
    setError("");
  };

  return (
    <div className="admin-login-page">

      {/* LEFT BRANDING PANEL */}
      <div className="admin-login-hero">

        <div className="admin-brand">

          <div className="admin-brand-icon">
            E
          </div>

          <div>
            <h2>EKAM</h2>

            <p>
              One Campus. One Platform.
            </p>
          </div>

        </div>

        <div className="admin-badge">
          AI-POWERED CAMPUS OPERATIONS
        </div>

        <div className="admin-hero-content">

          <h1>
            Your campus
            <br />
            life,
            <span> simplified.</span>
          </h1>

          <p>
            Manage attendance, hostel, mess,
            complaints, gate passes, documents
            and more — all from one intelligent
            campus platform.
          </p>

        </div>

        <div className="admin-feature-row">

          <div>
            <strong>360°</strong>
            <span>
              Campus Management
            </span>
          </div>

          <div>
            <strong>AI</strong>
            <span>
              Smart Assistance
            </span>
          </div>

          <div>
            <strong>24/7</strong>
            <span>
              Campus Access
            </span>
          </div>

        </div>

      </div>

      {/* RIGHT LOGIN PANEL */}
      <div className="admin-login-area">

        <div className="admin-login-card">

          {/* PORTAL SWITCH */}
          <div className="portal-switch">

            <button
              type="button"
              className="active"
            >
              🎓 Student
            </button>

            <button
              type="button"
              onClick={onAdminLogin}
            >
              🛡️ Admin
            </button>

          </div>

          {/* HEADING */}
          <div className="admin-login-heading">

            <h1>
              {otpSent
                ? "Verify Your Email"
                : "Student Portal Login"}
            </h1>

            <p>
              {otpSent
                ? `Enter the code sent to ${email}`
                : "Sign in using your registered email address"}
            </p>

          </div>

          {/* INFO */}
          <div className="admin-info-box">
            🎓 Student portal sign-in uses email verification.
          </div>

          {!otpSent ? (

            /* =================================================
               EMAIL LOGIN
               ================================================= */

            <form onSubmit={handleSubmit}>

              <div className="admin-field">

                <label>
                  Email Address
                </label>

                <div className="admin-input-wrap">

                  <span>
                    ✉️
                  </span>

                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="name@college.edu"
                    maxLength="150"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                </div>

              </div>

              <div className="admin-field">

                <label>
                  Login Method
                </label>

                <div
                  style={{
                    padding: "16px",
                    border:
                      "1px solid #d7dfe9",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    color: "#68758a",
                    fontSize: "14px",
                  }}
                >
                    🔐 A secure 6-digit code will be sent
                  to your registered email address.
                </div>

              </div>

              <button
                type="submit"
                className="admin-signin-button"
                disabled={loading}
              >
                {loading ? "Sending code..." : "Send code"}

                <span>
                  →
                </span>
              </button>

            </form>

          ) : (

            /* =================================================
               OTP VERIFICATION
               ================================================= */

            <div>

              <div className="admin-field">

                <label>
                  Enter 6-digit code
                </label>

                <div className="admin-input-wrap">

                  <span>
                    🔐
                  </span>

                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    maxLength="6"
                  />

                </div>

              </div>

              <p
                style={{
                  marginTop: "-4px",
                  marginBottom: "20px",
                  color: "#68758a",
                  fontSize: "13px",
                }}
              >
                If your email belongs to an active account, a code was sent to {email}.
              </p>

              <button
                type="button"
                className="admin-signin-button"
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
              >
                {loading
                  ? "Verifying..."
                  : "Verify & Continue"}

                <span>
                  →
                </span>
              </button>

              <button
                type="button"
                onClick={handleChangeEmail}
                style={{
                  width: "100%",
                  marginTop: "12px",
                  padding: "12px",
                  border: "none",
                  background:
                    "transparent",
                  color: "#24467f",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ← Change email address
              </button>

            </div>

          )}

          {error && (
            <div className="admin-info-box" role="alert">
              {error}
            </div>
          )}

          {/* FOOTER */}
          <div className="admin-login-footer">

            <strong>
              EKAM Student Portal
            </strong>

            <p>
              Secure access for registered
              students.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}