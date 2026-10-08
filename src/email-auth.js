const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function postAuthRequest(path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Unable to connect to EKAM. Make sure the backend is running.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid authentication response.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Email sign-in failed.");
  }
  return data;
}

export async function requestEmailOtp(email) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }

  return postAuthRequest("/api/auth/email-otp/request", {
    email: normalizedEmail,
  });
}

export async function verifyEmailOtp(challengeId, code, expectedRoles) {
  if (!challengeId || !/^\d{6}$/.test(code)) {
    throw new Error("Enter the 6-digit code sent to your email.");
  }

  const data = await postAuthRequest("/api/auth/email-otp/verify", {
    challengeId,
    code,
  });
  if (!data.user || typeof data.user.role !== "string") {
    throw new Error("The server returned an invalid user authentication response.");
  }
  const allowedRoles = Array.isArray(expectedRoles)
    ? expectedRoles
    : [expectedRoles];

  if (!allowedRoles.includes(data.user.role)) {
    await postAuthRequest("/api/auth/logout", {});
    throw new Error(
      allowedRoles.includes("student")
        ? "This email belongs to an admin account. Use the Admin sign-in."
        : "This email belongs to a student account. Use the Student sign-in."
    );
  }

  return data.user;
}
