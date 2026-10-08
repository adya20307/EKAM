import React, { useState } from "react";
import { requestEmailOtp, verifyEmailOtp } from "../email-auth";
import "./AdminLogin.css";

export default function AdminLogin({ onLogin, onStudentLogin }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await requestEmailOtp(email);
      setChallengeId(result.challengeId);
      setOtpSent(true);
    } catch (error) {
      console.error("Admin OTP request error:", error);
      setError(error.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await verifyEmailOtp(
        challengeId,
        otp.trim(),
        ["admin", "super-admin"]
      );
      onLogin?.(user);
    } catch (error) {
      console.error("Admin OTP verification error:", error);
      setError(error.message || "Admin sign-in failed.");
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
          <div className="admin-brand-icon">E</div>

          <div>
            <h2>EKAM</h2>
            <p>One Campus. One Platform.</p>
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
            Manage complaints, attendance, hostel, mess,
            documents, gate passes and more — all from one
            intelligent platform.
          </p>
        </div>

        <div className="admin-feature-row">

          <div>
            <strong>360°</strong>
            <span>Campus Management</span>
          </div>

          <div>
            <strong>AI</strong>
            <span>Smart Assistance</span>
          </div>

          <div>
            <strong>24/7</strong>
            <span>Campus Access</span>
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
              onClick={onStudentLogin}
            >
              🎓 Student
            </button>

            <button
              type="button"
              className="active"
            >
              🛡️ Admin
            </button>

          </div>
          <div className="admin-login-heading">

            <h1>{otpSent ? "Verify Your Email" : "Admin Portal Login"}</h1>

            <p>
              {otpSent
                ? `Enter the code sent to ${email}`
                : "Sign in using your registered email address"}
            </p>

          </div>

          <div className="admin-info-box">
            🛡️ Admin and Super Admin accounts use email verification.
          </div>

          {!otpSent ? (
            <form onSubmit={handleSubmit}>
              <div className="admin-field">
                <label htmlFor="admin-email">Email Address</label>
                <div className="admin-input-wrap">
                  <span>✉️</span>
                  <input
                    id="admin-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="name@college.edu"
                    maxLength="150"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="admin-signin-button"
                disabled={loading}
              >
                {loading ? "Sending code..." : "Send code"}
                {!loading && <span>→</span>}
              </button>
            </form>
          ) : (
            <div>
              <div className="admin-field">
                <label htmlFor="admin-otp">Enter 6-digit code</label>
                <div className="admin-input-wrap">
                  <span>🔐</span>
                  <input
                    id="admin-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    maxLength="6"
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                className="admin-signin-button"
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify & Continue"}
                {!loading && <span>→</span>}
              </button>
              <button
                type="button"
                onClick={handleChangeEmail}
                style={{
                  width: "100%",
                  marginTop: "12px",
                  padding: "12px",
                  border: "none",
                  background: "transparent",
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

          <div className="admin-login-footer">

            <strong>EKAM Administration</strong>

            <p>
              Authorized faculty and administrators only.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}