const express = require("express");
const db = require("./db");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config();
require("dotenv").config({
  path: path.join(__dirname, ".env.local"),
});

const { analyzeRequest } = require("./campy");

const app = express();
const sessions = new Map();
const emailOtpChallenges = new Map();
const emailOtpRequestLimits = new Map();
const sosRequestLimits = new Map();
const SUPER_ADMIN_SESSION_TTL = 8 * 60 * 60 * 1000;
const EMAIL_OTP_TTL = 10 * 60 * 1000;
const EMAIL_OTP_MAX_ATTEMPTS = 5;
const EMAIL_OTP_MAX_REQUESTS_PER_HOUR = 5;
const EMAIL_OTP_MAX_REQUESTS_PER_IP_PER_HOUR = 60;
const EMAIL_OTP_RESEND_DELAY = 60 * 1000;
const SESSION_COOKIE = "ekam_session";
const EMAIL_OTP_HASH_SECRET = crypto.randomBytes(32);
let emailTransport;
const CAMPY_ACTIONS = new Set([
  "create_complaint",
  "create_application",
  "create_gate_pass",
  "create_emergency_gate_pass",
  "send_healthcare_sos",
  "send_security_sos",
  "get_attendance",
  "get_timetable",
  "get_mess_menu",
  "get_application_status",
  "get_complaint_status",
  "information",
]);

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? cookie.slice(name.length + 1) : "";
}

function getEmailTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error(
      "Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in backend/.env."
    );
  }
  if (
    !Number.isInteger(Number(SMTP_PORT)) ||
    Number(SMTP_PORT) < 1 ||
    Number(SMTP_PORT) > 65535
  ) {
    throw new Error("Configure SMTP_PORT with a valid port number in backend/.env.");
  }

  if (!emailTransport) {
    emailTransport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  return emailTransport;
}

function allowEmailOtpRequest(email, ip) {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  for (const [key, limit] of emailOtpRequestLimits) {
    if (now - limit.windowStartedAt >= hour) {
      emailOtpRequestLimits.delete(key);
    }
  }

  const emailKey = `email:${email}`;
  const ipKey = `ip:${ip}`;
  const emailLimit = emailOtpRequestLimits.get(emailKey);
  const ipLimit = emailOtpRequestLimits.get(ipKey);

  if (
    (emailLimit &&
      (now - emailLimit.lastRequestAt < EMAIL_OTP_RESEND_DELAY ||
        emailLimit.count >= EMAIL_OTP_MAX_REQUESTS_PER_HOUR)) ||
    (ipLimit && ipLimit.count >= EMAIL_OTP_MAX_REQUESTS_PER_IP_PER_HOUR) ||
    emailOtpRequestLimits.size >= 10000
  ) {
    return false;
  }

  for (const [key, limit] of [
    [emailKey, emailLimit],
    [ipKey, ipLimit],
  ]) {
    emailOtpRequestLimits.set(key, {
      windowStartedAt: limit?.windowStartedAt ?? now,
      lastRequestAt: now,
      count: (limit?.count ?? 0) + 1,
    });
  }
  return true;
}

function createEmailOtpHash(challengeId, code) {
  return crypto
    .createHmac("sha256", EMAIL_OTP_HASH_SECRET)
    .update(`${challengeId}:${code}`)
    .digest();
}

function createSession(res, user) {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token);
  }

  const sessionToken = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionToken, {
    userId: user.id,
    role: user.role,
    expiresAt: now + SUPER_ADMIN_SESSION_TTL,
  });

  const secureCookie =
    process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${sessionToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SUPER_ADMIN_SESSION_TTL / 1000}${secureCookie}`
  );

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      facultyId: user.faculty_id,
      registration_no: user.registration_no,
      isHosteller: Boolean(user.is_hosteller),
      role: user.role,
      department: user.department,
      branch: user.branch,
      semester: user.semester,
      status: user.status,
    },
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    const token = getCookie(req, SESSION_COOKIE);
    const session = sessions.get(token);

    if (!token || !session || session.expiresAt <= Date.now()) {
      if (token) sessions.delete(token);
      return res.status(401).json({
      success: false,
      message: "Your session has expired. Please sign in again.",
      });
    }

    if (!roles.includes(session.role)) {
      return res.status(403).json({
      success: false,
      message: "You do not have permission to perform this action.",
      });
    }

    req.authenticatedUser = session;
    next();
  };
}

const requireSuperAdmin = requireRole("super-admin");

function requireAcademicManager(req, res, next) {
  if (req.authenticatedUser.role === "super-admin") {
    return next();
  }

  db.query(
    "SELECT department FROM users WHERE id = ? AND role = 'admin' LIMIT 1",
    [req.authenticatedUser.userId]
  )
    .then(([rows]) => {
      if (
        String(rows[0]?.department || "")
          .trim()
          .toLowerCase() === "academics"
      ) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: "Only Academics Admin or Super Admin can manage assignments.",
      });
    })
    .catch((error) => {
      console.error("Assignment authorization error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to verify assignment permissions.",
      });
    });
}

function isValidAttendanceDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value;
}

function requireAttendanceManager(req, res, next) {
  if (req.authenticatedUser.role === "super-admin") {
    return next();
  }

  db.query(
    "SELECT department FROM users WHERE id = ? AND role = 'admin' LIMIT 1",
    [req.authenticatedUser.userId]
  )
    .then(([rows]) => {
      const department = String(rows[0]?.department || "")
        .trim()
        .toLowerCase();
      if (department === "teaching faculty" || department === "academics") {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: "Only Teaching Faculty or Super Admin can manage attendance.",
      });
    })
    .catch((error) => {
      console.error("Attendance authorization error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to verify attendance permissions.",
      });
    });
}

const requireCampyUser = requireRole(
  "student",
  "admin",
  "super-admin"
);
const ADMIN_CAMPY_ACTIONS = new Set([
  "create_complaint",
  "get_attendance",
  "get_timetable",
  "get_mess_menu",
  "get_application_status",
  "get_complaint_status",
  "information",
]);

function getCampyError(error) {
  if (error?.message === "GEMINI_API_KEY is missing from .env") {
    return {
      status: 503,
      message: "CAMPY is not configured. Add a valid GEMINI_API_KEY to backend/.env and restart the backend.",
    };
  }

  if (
    error?.status === 400 &&
    (error?.message?.includes("API key not valid") ||
      error?.message?.includes("API_KEY_INVALID"))
  ) {
    return {
      status: 503,
      message: "CAMPY's Gemini API key is invalid. Update GEMINI_API_KEY in backend/.env and restart the backend.",
    };
  }

  if (error?.status === 429) {
    return {
      status: 429,
      message: "CAMPY is receiving too many requests right now. Please wait a moment and try again.",
    };
  }

  console.error("CAMPY provider error:", error);
  return {
    status: 502,
    message: "CAMPY could not reach its AI service. Check the backend connection and try again.",
  };
}

function validateStudent(body) {
  const student = {
    name: typeof body?.name === "string" ? body.name.trim() : "",
    registrationNo:
      typeof body?.registrationNo === "string"
        ? body.registrationNo.trim()
        : "",
    mobile: typeof body?.mobile === "string" ? body.mobile.trim() : "",
    email: typeof body?.email === "string" ? body.email.trim() : "",
    branch: typeof body?.branch === "string" ? body.branch.trim() : "",
    semester: Number(body?.semester),
    department:
      typeof body?.department === "string" ? body.department.trim() : "",
    isHosteller:
      body?.isHosteller === true ||
      body?.isHosteller === "true",
    status:
      typeof body?.status === "string"
        ? body.status.trim().toUpperCase()
        : "ACTIVE",
  };

  if (
    !student.name ||
    !student.registrationNo ||
    !/^\d{10}$/.test(student.mobile) ||
    !student.branch ||
    !Number.isInteger(student.semester) ||
    student.semester < 1 ||
    student.semester > 12 ||
    !student.department ||
    student.email.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email) ||
    !["ACTIVE", "INACTIVE"].includes(student.status)
  ) {
    return {
      error:
        "Enter a name, registration number, valid 10-digit mobile, valid email, branch, semester (1-12), department, and valid status.",
    };
  }

  return {
    student: {
      ...student,
      email: student.email || null,
    },
  };
}

async function findDuplicateStudentFields(student, excludeId = null) {
  const [rows] = await db.query(
    `SELECT
      EXISTS (
        SELECT 1 FROM users
        WHERE registration_no = ? AND (? IS NULL OR id <> ?)
      ) AS registrationNo,
      EXISTS (
        SELECT 1 FROM users
        WHERE mobile = ? AND role = 'student'
          AND (? IS NULL OR id <> ?)
      ) AS mobile,
      EXISTS (
        SELECT 1 FROM users
        WHERE email = ? AND (? IS NULL OR id <> ?)
      ) AS email`,
    [
      student.registrationNo,
      excludeId,
      excludeId,
      student.mobile,
      excludeId,
      excludeId,
      student.email,
      excludeId,
      excludeId,
    ]
  );

  return Object.entries(rows[0])
    .filter(([, exists]) => Boolean(exists))
    .map(([field]) => field);
}

function duplicateStudentMessage(fields) {
  const labels = {
    registrationNo: "registration number",
    mobile: "mobile number",
    email: "email",
  };
  const names = fields.map((field) => labels[field]);
  const fieldList =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
      : names[0];

  return `The ${fieldList} ${
    names.length > 1 ? "are" : "is"
  } already used by another account. Enter unique details.`;
}

async function findDuplicateAdminFields(admin, excludeId = null) {
  const [rows] = await db.query(
    `SELECT
      EXISTS (
        SELECT 1 FROM users
        WHERE faculty_id = ? AND (? IS NULL OR id <> ?)
      ) AS facultyId,
      EXISTS (
        SELECT 1 FROM users
        WHERE mobile = ? AND role = 'admin'
          AND (? IS NULL OR id <> ?)
      ) AS mobile,
      EXISTS (
        SELECT 1 FROM users
        WHERE email = ? AND (? IS NULL OR id <> ?)
      ) AS email`,
    [
      admin.facultyId,
      excludeId,
      excludeId,
      admin.mobile,
      excludeId,
      excludeId,
      admin.email,
      excludeId,
      excludeId,
    ]
  );

  return Object.entries(rows[0])
    .filter(([, exists]) => Boolean(exists))
    .map(([field]) => field);
}

function duplicateAdminMessage(fields) {
  const labels = {
    facultyId: "faculty ID",
    mobile: "mobile number",
    email: "email",
  };
  const names = fields.map((field) => labels[field]);
  const fieldList =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
      : names[0];

  return `The ${fieldList} ${
    names.length > 1 ? "are" : "is"
  } already used by another department admin. Enter unique details.`;
}

// =====================================================
// CAMPUS DATA
// =====================================================

// =====================================================
// HOME / DATABASE TEST
// =====================================================

app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DATABASE() AS database_name"
    );

    res.json({
      success: true,
      database: rows[0].database_name,
    });
  } catch (error) {
    console.error("Database test error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "EKAM backend is running",
  });
});

// =====================================================
// EMAIL OTP AUTHENTICATION
// =====================================================

app.post("/api/auth/email-otp/request", async (req, res) => {
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid email address.",
    });
  }

  try {
    const transport = getEmailTransport();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!allowEmailOtpRequest(email, ip)) {
      return res.status(429).json({
        success: false,
        message: "Too many code requests. Wait before trying again.",
      });
    }

    const challengeId = crypto.randomBytes(32).toString("hex");
    const [users] = await db.query(
      `SELECT id, email
       FROM users
       WHERE LOWER(email) = ? AND status = 'ACTIVE'
       LIMIT 1`,
      [email]
    );

    if (users.length > 0) {
      for (const [id, challenge] of emailOtpChallenges) {
        if (challenge.expiresAt <= Date.now() || challenge.email === email) {
          emailOtpChallenges.delete(id);
        }
      }

      if (emailOtpChallenges.size >= 10000) {
        return res.status(503).json({
          success: false,
          message: "Email sign-in is busy. Try again later.",
        });
      }

      const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
      emailOtpChallenges.set(challengeId, {
        userId: users[0].id,
        email,
        codeHash: createEmailOtpHash(challengeId, code),
        expiresAt: Date.now() + EMAIL_OTP_TTL,
        attempts: 0,
      });

      try {
        await transport.sendMail({
          from: process.env.SMTP_FROM,
          to: email,
          subject: "Your EKAM sign-in code",
          text: `Your EKAM sign-in code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
        });
      } catch (error) {
        emailOtpChallenges.delete(challengeId);
        console.error("Email OTP delivery failed:", error.message);
        return res.status(503).json({
          success: false,
          message: "Unable to send a sign-in code right now. Try again later.",
        });
      }
    }

    res.status(202).json({
      success: true,
      challengeId,
      message: "If this email belongs to an active EKAM account, a sign-in code has been sent.",
    });
  } catch (error) {
    if (error.message?.includes("Configure SMTP_")) {
      return res.status(503).json({
        success: false,
        message: "Email sign-in is not configured. Set the SMTP settings in backend/.env and restart the API.",
      });
    }
    console.error("Email OTP request error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to request a sign-in code.",
    });
  }
});

app.post("/api/auth/email-otp/verify", async (req, res) => {
  const challengeId =
    typeof req.body?.challengeId === "string" ? req.body.challengeId : "";
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  const challenge = emailOtpChallenges.get(challengeId);

  if (!/^[a-f0-9]{64}$/.test(challengeId) || !/^\d{6}$/.test(code) || !challenge) {
    return res.status(401).json({
      success: false,
      message: "The code is invalid or expired. Request a new code.",
    });
  }

  if (
    challenge.expiresAt <= Date.now() ||
    challenge.attempts >= EMAIL_OTP_MAX_ATTEMPTS
  ) {
    emailOtpChallenges.delete(challengeId);
    return res.status(401).json({
      success: false,
      message: "The code is invalid or expired. Request a new code.",
    });
  }

  const [users] = await db.query(
    `SELECT id, name, mobile, email, faculty_id, registration_no, role,
            department, branch, semester, is_hosteller, status
     FROM users
     WHERE id = ? AND LOWER(email) = ? AND status = 'ACTIVE'
     LIMIT 1`,
    [challenge.userId, challenge.email]
  );
  if (users.length === 0) {
    emailOtpChallenges.delete(challengeId);
    return res.status(401).json({
      success: false,
      message: "The code is invalid or expired. Request a new code.",
    });
  }

  const expectedHash = challenge.codeHash;
  const suppliedHash = createEmailOtpHash(challengeId, code);
  if (!crypto.timingSafeEqual(expectedHash, suppliedHash)) {
    challenge.attempts += 1;
    if (challenge.attempts >= EMAIL_OTP_MAX_ATTEMPTS) {
      emailOtpChallenges.delete(challengeId);
    }
    return res.status(401).json({
      success: false,
      message: "The code is invalid or expired. Request a new code.",
    });
  }

  emailOtpChallenges.delete(challengeId);
  createSession(res, users[0]);
});

app.post("/api/auth/logout", (req, res) => {
  const token = getCookie(req, SESSION_COOKIE);
  if (token) sessions.delete(token);
  const secureCookie =
    process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureCookie}`
  );
  res.json({ success: true });
});

// =====================================================
// SUPER ADMIN STUDENT MANAGEMENT
// =====================================================

app.get("/api/admins", requireSuperAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, faculty_id AS facultyId, mobile, email,
              department, status
       FROM users
       WHERE role = 'admin'
       ORDER BY name ASC`
    );
    res.json({ success: true, admins: rows });
  } catch (error) {
    console.error("Admin list error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load department administrators.",
    });
  }
});

app.post("/api/admins", requireSuperAdmin, async (req, res) => {
  const admin = {
    name: typeof req.body?.name === "string" ? req.body.name.trim() : "",
    facultyId:
      typeof req.body?.facultyId === "string"
        ? req.body.facultyId.trim()
        : "",
    mobile: typeof req.body?.mobile === "string" ? req.body.mobile.trim() : "",
    email: typeof req.body?.email === "string" ? req.body.email.trim() : "",
    department:
      typeof req.body?.department === "string"
        ? req.body.department.trim()
        : "",
  };

  if (
    !admin.name ||
    !admin.facultyId ||
    !/^\d{10}$/.test(admin.mobile) ||
    !admin.department ||
    admin.email.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.email)
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a name, faculty ID, valid 10-digit phone, department, and valid email.",
    });
  }

  try {
    const duplicateFields = await findDuplicateAdminFields(admin);
    if (duplicateFields.length > 0) {
      return res.status(409).json({
        success: false,
        message: duplicateAdminMessage(duplicateFields),
      });
    }

    const [result] = await db.query(
      `INSERT INTO users
        (name, faculty_id, mobile, email, role, department, status)
       VALUES (?, ?, ?, ?, 'admin', ?, 'ACTIVE')`,
      [
        admin.name,
        admin.facultyId,
        admin.mobile,
        admin.email || null,
        admin.department,
      ]
    );
    res.status(201).json({
      success: true,
      admin: { id: result.insertId, ...admin, status: "ACTIVE" },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "That faculty ID or email is already registered.",
      });
    }
    console.error("Admin create error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create department administrator.",
    });
  }
});

app.put("/api/admins/:id", requireSuperAdmin, async (req, res) => {
  const admin = {
    name: typeof req.body?.name === "string" ? req.body.name.trim() : "",
    facultyId:
      typeof req.body?.facultyId === "string"
        ? req.body.facultyId.trim()
        : "",
    mobile: typeof req.body?.mobile === "string" ? req.body.mobile.trim() : "",
    email: typeof req.body?.email === "string" ? req.body.email.trim() : "",
    department:
      typeof req.body?.department === "string"
        ? req.body.department.trim()
        : "",
    status:
      typeof req.body?.status === "string"
        ? req.body.status.trim().toUpperCase()
        : "",
  };

  if (
    !admin.name ||
    !admin.facultyId ||
    !/^\d{10}$/.test(admin.mobile) ||
    !admin.department ||
    !["ACTIVE", "INACTIVE"].includes(admin.status) ||
    admin.email.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.email)
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter valid administrator details and status.",
    });
  }

  try {
    const duplicateFields = await findDuplicateAdminFields(
      admin,
      req.params.id
    );
    if (duplicateFields.length > 0) {
      return res.status(409).json({
        success: false,
        message: duplicateAdminMessage(duplicateFields),
      });
    }

    const [result] = await db.query(
      `UPDATE users
       SET name = ?, faculty_id = ?, mobile = ?, email = ?,
           department = ?, status = ?
       WHERE id = ? AND role = 'admin'`,
      [
        admin.name,
        admin.facultyId,
        admin.mobile,
        admin.email || null,
        admin.department,
        admin.status,
        req.params.id,
      ]
    );
    if (result.affectedRows === 0) {
      const [rows] = await db.query(
        "SELECT id FROM users WHERE id = ? AND role = 'admin' LIMIT 1",
        [req.params.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Department administrator not found.",
        });
      }
    }
    res.json({
      success: true,
      admin: { id: Number(req.params.id), ...admin },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "That faculty ID or email is already registered.",
      });
    }
    console.error("Admin update error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update department administrator.",
    });
  }
});

app.delete("/api/admins/:id", requireSuperAdmin, async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM users WHERE id = ? AND role = 'admin'",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Department administrator not found.",
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Admin delete error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to delete department administrator.",
    });
  }
});

app.get(
  "/api/notifications",
  requireRole("student", "admin", "super-admin"),
  async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT id, type, title, message, created_at AS createdAt,
                is_read AS readAt
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
        [req.authenticatedUser.userId]
      );
      res.json({
        success: true,
        notifications: rows.map((notification) => ({
          ...notification,
          id: Number(notification.id),
        })),
      });
    } catch (error) {
      console.error("Notification inbox error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to load campus notifications.",
      });
    }
  }
);

app.post(
  "/api/notifications/:id/read",
  requireRole("student", "admin", "super-admin"),
  async (req, res) => {
    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId) || notificationId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification.",
      });
    }
    try {
      await db.query(
        "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
        [notificationId, req.authenticatedUser.userId]
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Notification read update error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to update notification.",
      });
    }
  }
);

app.get("/api/assignments", requireRole("student"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, title, subject, description,
            DATE_FORMAT(due_date, '%Y-%m-%d') AS due, status
       FROM assignments
       WHERE status = 'ACTIVE'
         AND branch = (SELECT branch FROM users WHERE id = ?)
         AND REGEXP_REPLACE(LOWER(semester), '[^0-9]', '') =
             (SELECT REGEXP_REPLACE(LOWER(semester), '[^0-9]', '')
              FROM users WHERE id = ?)
       ORDER BY due_date ASC`,
      [req.authenticatedUser.userId, req.authenticatedUser.userId]
    );
    res.json({ success: true, assignments: rows });
  } catch (error) {
    console.error("Student assignments error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load assignments.",
    });
  }
});

app.get(
  "/api/admin/assignments",
  requireRole("admin", "super-admin"),
  requireAcademicManager,
  async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT id, title, subject, description, branch, semester,
                DATE_FORMAT(due_date, '%Y-%m-%d') AS due
         FROM assignments
         WHERE status = 'ACTIVE'
         ORDER BY due_date ASC`
      );
      res.json({ success: true, assignments: rows });
    } catch (error) {
      console.error("Admin assignments error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to load assignment records.",
      });
    }
  }
);

app.post(
  "/api/admin/assignments",
  requireRole("admin", "super-admin"),
  requireAcademicManager,
  async (req, res) => {
    const title = String(req.body.title || "").trim();
    const subject = String(req.body.subject || "").trim();
    const description = String(req.body.description || "").trim();
    const branch = String(req.body.branch || "").trim();
    const semester = String(req.body.semester || "").trim();
    const due = String(req.body.due || "").trim();
    if (
      !title ||
      title.length > 180 ||
      !subject ||
      subject.length > 150 ||
      description.length > 10000 ||
      !branch ||
      branch.length > 100 ||
      !semester ||
      semester.length > 30 ||
      !isValidAttendanceDate(due)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a title, subject, branch, semester, and valid due date.",
      });
    }

    const dueAt = new Date(`${due}T23:59:59`);
    if (Number.isNaN(dueAt.getTime()) || dueAt.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: "The assignment due date must be in the future.",
      });
    }

    const formatSqlDateTime = (date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes()
      ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
    let connection;
    let transactionStarted = false;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;
      const [departmentRows] = await connection.query(
        `SELECT departments.id
         FROM users
         LEFT JOIN departments
           ON LOWER(TRIM(departments.name)) = LOWER(TRIM(users.department))
           AND departments.status = 'ACTIVE'
         WHERE users.id = ?
         LIMIT 1`,
        [req.authenticatedUser.userId]
      );
      const departmentId = departmentRows[0]?.id || null;
      const [result] = await connection.query(
        `INSERT INTO assignments
           (department_id, faculty_id, subject, title, description, due_date,
            branch, semester)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          departmentId,
          req.authenticatedUser.userId,
          subject,
          title,
          description || null,
          due,
          branch,
          semester,
        ]
      );

      const reminderSchedules = [
        ["7d", 7 * 24],
        ["5d", 5 * 24],
        ...Array.from({ length: 24 }, (_, index) => [
          `${24 - index}h`,
          24 - index,
        ]),
      ];
      for (const [reminderKey, hoursBefore] of reminderSchedules) {
        const scheduledAt = new Date(
          dueAt.getTime() - hoursBefore * 60 * 60 * 1000
        );
        if (scheduledAt > new Date()) {
          await connection.query(
            `INSERT INTO assignment_reminders
               (assignment_id, reminder_key, scheduled_at)
             VALUES (?, ?, ?)`,
            [result.insertId, reminderKey, formatSqlDateTime(scheduledAt)]
          );
        }
      }
      await connection.commit();
      transactionStarted = false;
      res.status(201).json({
        success: true,
        assignment: {
          id: result.insertId,
          title,
          subject,
          description,
          branch,
          semester,
          due,
        },
      });
    } catch (error) {
      if (connection && transactionStarted) {
        await connection.rollback();
      }
      console.error("Assignment create error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to create assignment and schedule its reminders.",
      });
    } finally {
      connection?.release();
    }
  }
);

app.post("/api/sos", requireRole("student"), async (req, res) => {
  const type = String(req.body.type || "").trim().toUpperCase();
  const message = String(req.body.message || "").trim();
  const latitude =
    req.body.latitude == null ? null : Number(req.body.latitude);
  const longitude =
    req.body.longitude == null ? null : Number(req.body.longitude);
  if (
    !["HEALTHCARE", "SECURITY"].includes(type) ||
    !message ||
    message.length > 500 ||
    (latitude !== null &&
      (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
    (longitude !== null &&
      (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) ||
    (latitude === null) !== (longitude === null)
  ) {
    return res.status(400).json({
      success: false,
      message: "Provide a valid SOS type, message, and complete location coordinates when available.",
    });
  }

  const requesterId = req.authenticatedUser.userId;
  const cooldownKey = `${requesterId}:${type}`;
  const lastRequest = sosRequestLimits.get(cooldownKey) || 0;
  if (Date.now() - lastRequest < 30000) {
    return res.status(429).json({
      success: false,
      message: "An SOS of this type was just sent. Campus administrators have already been notified.",
    });
  }

  let connection;
  let transactionStarted = false;
  let alertId;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    const [userRows] = await connection.query(
      "SELECT name, registration_no, email FROM users WHERE id = ? AND role = 'student' LIMIT 1",
      [requesterId]
    );
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Student account was not found.",
      });
    }

    const [alertResult] = await connection.query(
      `INSERT INTO sos_alerts
         (student_id, sos_type, message, latitude, longitude)
       VALUES (?, ?, ?, ?, ?)`,
      [requesterId, type, message, latitude, longitude]
    );
    alertId = alertResult.insertId;
    const [recipients] = await connection.query(
      "SELECT id FROM users WHERE role IN ('admin', 'super-admin') AND status = 'ACTIVE'"
    );
    const title =
      type === "HEALTHCARE" ? "Healthcare SOS" : "Emergency SOS";
    const locationText =
      latitude === null
        ? "Location unavailable"
        : `https://maps.google.com/?q=${latitude},${longitude}`;
    const notificationMessage =
      `${userRows[0].name} (${userRows[0].registration_no || "student"}) requested ${
        type === "HEALTHCARE" ? "healthcare" : "emergency"
      } assistance. ${message}. Location: ${locationText}`;
    for (const recipient of recipients) {
      await connection.query(
        `INSERT INTO notifications
           (user_id, type, title, message)
         VALUES (?, 'SOS', ?, ?)`,
        [recipient.id, title, notificationMessage]
      );
    }
    await connection.commit();
    transactionStarted = false;
    sosRequestLimits.set(cooldownKey, Date.now());

    const delivery = {
      dashboard: recipients.length > 0 ? "sent" : "no_active_admin_accounts",
      email: type === "HEALTHCARE" ? "not_configured" : "not_requested",
      sms: "not_configured",
      location: latitude === null ? "unavailable" : "included",
    };
    if (type === "HEALTHCARE" && process.env.HEALTHCARE_SOS_EMAIL) {
      try {
        await getEmailTransport().sendMail({
          from: process.env.SMTP_FROM,
          to: process.env.HEALTHCARE_SOS_EMAIL,
          subject: "EKAM Healthcare SOS",
          text: [
            `Healthcare assistance requested by ${userRows[0].name}.`,
            `Student ID: ${userRows[0].registration_no || requesterId}`,
            `Message: ${message}`,
            `Location: ${locationText}`,
            "This is an automated EKAM alert. Contact campus emergency services directly if immediate response is required.",
          ].join("\n"),
        });
        delivery.email = "sent";
      } catch (error) {
        delivery.email = "failed";
        delivery.emailError = "Dashboard alert was saved, but the healthcare email could not be sent.";
        console.error("Healthcare SOS email delivery error:", error);
      }
    }

    if (recipients.length === 0) {
      console.error("SOS alert saved without dashboard recipients.", {
        alertId,
        type,
      });
    }
    const dashboardMessage =
      delivery.dashboard === "sent"
        ? "Admin dashboards were notified."
        : "The alert was recorded, but no active admin dashboard was available.";
    const emailMessage =
      type !== "HEALTHCARE"
        ? ""
        : delivery.email === "sent"
        ? " The healthcare contact was emailed."
        : delivery.email === "failed"
        ? " Healthcare email delivery failed."
        : " Healthcare email is not configured.";
    res.status(201).json({
      success: true,
      alertId,
      message: `${dashboardMessage}${emailMessage} SMS delivery is not configured.`,
      delivery,
    });
  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback();
    }
    console.error("SOS creation error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to send the SOS to campus dashboards.",
    });
  } finally {
    connection?.release();
  }
});

app.get("/api/attendance/me", requireRole("student"), async (req, res) => {
  try {
    const [subjects] = await db.query(
      `SELECT
         subject,
         COUNT(*) AS totalClasses,
         SUM(status IN ('PRESENT', 'LATE')) AS attendedClasses,
         SUM(status = 'PRESENT') AS presentClasses,
         SUM(status = 'LATE') AS lateClasses,
         SUM(status = 'ABSENT') AS absentClasses
       FROM attendance
       WHERE student_id = ?
       GROUP BY subject
       ORDER BY subject ASC`,
      [req.authenticatedUser.userId]
    );
    const totals = subjects.reduce(
      (summary, subject) => ({
        totalClasses: summary.totalClasses + Number(subject.totalClasses),
        attendedClasses:
          summary.attendedClasses + Number(subject.attendedClasses),
      }),
      { totalClasses: 0, attendedClasses: 0 }
    );

    res.json({
      success: true,
      totals: {
        ...totals,
        percentage: totals.totalClasses
          ? Math.round((totals.attendedClasses / totals.totalClasses) * 100)
          : null,
      },
      subjects: subjects.map((subject) => ({
        ...subject,
        totalClasses: Number(subject.totalClasses),
        attendedClasses: Number(subject.attendedClasses),
        presentClasses: Number(subject.presentClasses),
        lateClasses: Number(subject.lateClasses),
        absentClasses: Number(subject.absentClasses),
        percentage: subject.totalClasses
          ? Math.round(
              (Number(subject.attendedClasses) /
                Number(subject.totalClasses)) *
                100
            )
          : 0,
      })),
    });
  } catch (error) {
    console.error("Student attendance read error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load attendance records.",
    });
  }
});

app.get(
  "/api/attendance/students",
  requireRole("admin", "super-admin"),
  requireAttendanceManager,
  async (req, res) => {
    const subject = String(req.query.subject || "").trim();
    const classDate = String(req.query.date || "").trim();
    if (!subject || subject.length > 150 || !isValidAttendanceDate(classDate)) {
      return res.status(400).json({
        success: false,
        message: "A subject and valid class date are required.",
      });
    }

    try {
      const [students] = await db.query(
        `SELECT
           u.id,
           u.name,
           u.registration_no AS registration,
           u.branch,
           u.semester,
           COALESCE(summary.totalClasses, 0) AS totalClasses,
           COALESCE(summary.attendedClasses, 0) AS attendedClasses,
           COALESCE(summary.percentage, 0) AS attendance,
           today.status AS todayStatus
         FROM users u
         LEFT JOIN (
           SELECT
             student_id,
             COUNT(*) AS totalClasses,
             SUM(status IN ('PRESENT', 'LATE')) AS attendedClasses,
             ROUND(
               SUM(status IN ('PRESENT', 'LATE')) / COUNT(*) * 100
             ) AS percentage
           FROM attendance
           GROUP BY student_id
         ) summary ON summary.student_id = u.id
         LEFT JOIN attendance today
           ON today.student_id = u.id
           AND today.subject = ?
           AND today.class_date = ?
         WHERE u.role = 'student'
         ORDER BY u.name ASC`,
        [subject, classDate]
      );
      res.json({ success: true, students });
    } catch (error) {
      console.error("Attendance student list error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to load students for attendance.",
      });
    }
  }
);

app.post(
  "/api/attendance",
  requireRole("admin", "super-admin"),
  requireAttendanceManager,
  async (req, res) => {
    const subject = String(req.body.subject || "").trim();
    const classDate = String(req.body.date || "").trim();
    const records = req.body.records;
    if (
      !subject ||
      subject.length > 150 ||
      !isValidAttendanceDate(classDate) ||
      !Array.isArray(records) ||
      records.length === 0 ||
      records.length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a subject, valid class date, and attendance records.",
      });
    }

    const validStatuses = new Set(["PRESENT", "ABSENT", "LATE"]);
    const studentIds = records.map((record) => Number(record.studentId));
    if (
      studentIds.some((id) => !Number.isInteger(id) || id < 1) ||
      new Set(studentIds).size !== studentIds.length ||
      records.some((record) => !validStatuses.has(record.status))
    ) {
      return res.status(400).json({
        success: false,
        message: "Each student must have one valid attendance status.",
      });
    }

    let connection;
    let transactionStarted = false;
    try {
      connection = await db.getConnection();
      const placeholders = studentIds.map(() => "?").join(", ");
      const [students] = await connection.query(
        `SELECT id FROM users WHERE role = 'student' AND id IN (${placeholders})`,
        studentIds
      );
      if (students.length !== studentIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected students could not be found.",
        });
      }

      await connection.beginTransaction();
      transactionStarted = true;
      for (const record of records) {
        await connection.query(
          `INSERT INTO attendance
             (student_id, faculty_id, subject, class_date, status)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             faculty_id = VALUES(faculty_id),
             status = VALUES(status)`,
          [
            Number(record.studentId),
            req.authenticatedUser.userId,
            subject,
            classDate,
            record.status,
          ]
        );
      }
      await connection.commit();
      transactionStarted = false;
      res.json({
        success: true,
        saved: records.length,
        message: `Attendance saved for ${records.length} students.`,
      });
    } catch (error) {
      if (connection && transactionStarted) {
        await connection.rollback();
      }
      console.error("Attendance save error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to save attendance.",
      });
    } finally {
      connection?.release();
    }
  }
);

app.get(
  "/api/attendance/overview",
  requireRole("admin", "super-admin"),
  requireAttendanceManager,
  async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT
           class_date AS date,
           COUNT(*) AS totalClasses,
           SUM(status IN ('PRESENT', 'LATE')) AS attendedClasses,
           SUM(status = 'ABSENT') AS absentClasses
         FROM attendance
         WHERE class_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY class_date
         ORDER BY class_date ASC`
      );
      const [totalsRows] = await db.query(
        `SELECT
           COUNT(DISTINCT student_id) AS students,
           COUNT(*) AS totalClasses,
           SUM(status IN ('PRESENT', 'LATE')) AS attendedClasses,
           SUM(status = 'ABSENT') AS absentClasses
         FROM attendance`
      );
      res.json({
        success: true,
        days: rows.map((row) => ({
          ...row,
          totalClasses: Number(row.totalClasses),
          attendedClasses: Number(row.attendedClasses),
          absentClasses: Number(row.absentClasses),
        })),
        totals: Object.fromEntries(
          Object.entries(totalsRows[0]).map(([key, value]) => [
            key,
            Number(value || 0),
          ])
        ),
      });
    } catch (error) {
      console.error("Attendance overview error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to load attendance overview.",
      });
    }
  }
);

app.get("/api/students", requireSuperAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        id,
        name,
        mobile,
        email,
        registration_no,
        branch,
        semester,
        is_hosteller AS isHosteller,
        department,
        status
       FROM users
       WHERE role = 'student'
       ORDER BY name ASC`
    );

    res.json({ success: true, students: rows });
  } catch (error) {
    console.error("Student list error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load students.",
    });
  }
});

app.post("/api/students", requireSuperAdmin, async (req, res) => {
  const result = validateStudent(req.body);
  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  const { student } = result;

  try {
    const duplicateFields = await findDuplicateStudentFields(student);
    if (duplicateFields.length > 0) {
      return res.status(409).json({
        success: false,
        message: duplicateStudentMessage(duplicateFields),
      });
    }

    const [insertResult] = await db.query(
      `INSERT INTO users
        (name, mobile, email, registration_no, branch, semester, is_hosteller, role, department, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'student', ?, ?)`,
      [
        student.name,
        student.mobile,
        student.email,
        student.registrationNo,
        student.branch,
        student.semester,
        student.isHosteller,
        student.department,
        student.status,
      ]
    );

    res.status(201).json({
      success: true,
      student: { id: insertResult.insertId, ...student },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A user already uses this registration number, mobile, or email.",
      });
    }

    console.error("Student create error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create student.",
    });
  }
});

app.put("/api/students/:id", requireSuperAdmin, async (req, res) => {
  const result = validateStudent(req.body);
  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  const { student } = result;
  const { id } = req.params;

  try {
    const duplicateFields = await findDuplicateStudentFields(student, id);
    if (duplicateFields.length > 0) {
      return res.status(409).json({
        success: false,
        message: duplicateStudentMessage(duplicateFields),
      });
    }

    const [studentExists] = await db.query(
      "SELECT id FROM users WHERE id = ? AND role = 'student' LIMIT 1",
      [id]
    );

    if (studentExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    await db.query(
      `UPDATE users
       SET name = ?, mobile = ?, email = ?, registration_no = ?,
           branch = ?, semester = ?, is_hosteller = ?, department = ?, status = ?
       WHERE id = ? AND role = 'student'`,
      [
        student.name,
        student.mobile,
        student.email,
        student.registrationNo,
        student.branch,
        student.semester,
        student.isHosteller,
        student.department,
        student.status,
        id,
      ]
    );

    res.json({
      success: true,
      student: { id: Number(id), ...student },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Another user already uses this registration number, mobile, or email.",
      });
    }

    console.error("Student update error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update student.",
    });
  }
});

app.delete("/api/students/:id", requireSuperAdmin, async (req, res) => {
  try {
    const [deleteResult] = await db.query(
      "DELETE FROM users WHERE id = ? AND role = 'student'",
      [req.params.id]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Student delete error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to delete student.",
    });
  }
});

// =====================================================
// CAMPY AI ANALYZER
// =====================================================

app.post("/api/campy/analyze", requireCampyUser, async (req, res) => {
  try {
    const { message } = req.body;

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    const result = await analyzeRequest(message.trim());

    res.json({
      success: true,
      campy: result,
    });

  } catch (error) {
    const campyError = getCampyError(error);
    res.status(campyError.status).json({
      success: false,
      error: campyError.message,
    });
  }
});

// =====================================================
// CREATE TICKET FUNCTION
// =====================================================

function classifyComplaint(message, parameters) {
  const text = message.toLowerCase();
  const categories = [
    {
      match: /\bwi[\s-]?fi\b|\binternet\b|\bnetwork\b|\brouter\b|\bconnectivity\b/,
      category: "IT",
      authority: "IT / Network Team",
      subcategory: "Wi-Fi / Network Issue",
    },
    {
      match: /\bmess\b|\bfood\b|\bmeal\b|\bcanteen\b/,
      category: "Mess",
      authority: "Mess Administration",
      subcategory: "Mess / Food",
    },
    {
      match: /\bfee\b|\bpayment\b|\baccounts\b|\brefund\b/,
      category: "Accounts",
      authority: "Accounts Administration",
      subcategory: "Fees / Accounts",
    },
    {
      match: /\bhostel\b|\bfan\b|\blight\b|\bair conditioner\b|\bac\b|\bwater leak\b|\bbathroom\b|\belectricity\b|\bfurniture\b|\broom\b/,
      category: "Hostel",
      authority: "Hostel Maintenance",
      subcategory: "Hostel Maintenance",
    },
    {
      match: /\bclass\b|\bteacher\b|\bfaculty\b|\bexam\b|\bassignment\b|\bcertificate\b|\bacademic\b|\bmarks\b/,
      category: "Academic",
      authority: "Academic Administration",
      subcategory: "Academic Issue",
    },
  ];
  const matched = categories.find((item) => item.match.test(text));
  const allowedCategories = new Set([
    "IT",
    "Hostel",
    "Academic",
    "Mess",
    "Accounts",
    "Other",
  ]);
  const category = matched?.category ||
    (allowedCategories.has(parameters.category) ? parameters.category : "Other");
  const validPriorities = new Set(["low", "medium", "high", "critical"]);
  const priority = validPriorities.has(
    String(parameters.priority || "").toLowerCase()
  )
    ? String(parameters.priority).toLowerCase()
    : "medium";

  return {
    category,
    subcategory: matched?.subcategory ||
      String(parameters.subcategory || "General campus issue").trim().slice(0, 120),
    priority,
    authority:
      matched?.authority ||
      ({
        IT: "IT / Network Team",
        Hostel: "Hostel Maintenance",
        Academic: "Academic Administration",
        Mess: "Mess Administration",
        Accounts: "Accounts Administration",
        Other: "Campus Administration",
      }[category]),
  };
}

async function createTicket(data) {
  const description = String(data.message || "").trim();
  if (!description || description.length > 2000) {
    throw new Error("Complaint description must contain 1 to 2000 characters.");
  }

  const category = String(data.category || "Other");
  const requestedPriority = String(data.priority || "medium").toLowerCase();
  const priority = ["low", "medium", "high", "critical"].includes(
    requestedPriority
  )
    ? requestedPriority
    : "medium";
  const subcategory = String(data.subcategory || "General campus issue")
    .trim()
    .slice(0, 100);
  const authority = String(data.authority || "Campus Administration")
    .trim()
    .slice(0, 120);
  const departmentName =
    ({
      IT: "Maintenance",
      Hostel: "Hostel",
      Mess: "Hostel",
      Accounts: "Accounts",
      Academic: "Academics",
      Other: "Academics",
    }[category] || "Academics");
  let connection;
  let transactionStarted = false;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    const [departments] = await connection.query(
      `SELECT id FROM departments
       WHERE LOWER(name) = LOWER(?) AND status = 'ACTIVE'
       LIMIT 1`,
      [departmentName]
    );
    if (departments.length === 0) {
      throw new Error(`No active complaint department is configured for ${category}.`);
    }
    const [result] = await connection.query(
      `INSERT INTO complaints
         (student_id, department_id, category, subcategory, title,
          description, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.createdBy,
        departments[0].id,
        category,
        subcategory,
        description.slice(0, 200),
        description,
        priority.toUpperCase(),
      ]
    );
    const ticketCode = `EKAM-${1000 + Number(result.insertId)}`;

    const [admins] = await connection.query(
      "SELECT id FROM users WHERE role IN ('admin', 'super-admin') AND status = 'ACTIVE'"
    );
    for (const admin of admins) {
      await connection.query(
        `INSERT INTO notifications
           (user_id, type, title, message)
         VALUES (?, 'COMPLAINT', ?, ?)`,
        [
          admin.id,
          `New ${category} complaint`,
          `${ticketCode}: ${description}`,
        ]
      );
    }
    await connection.commit();
    transactionStarted = false;

    return {
      id: ticketCode,
      message: description,
      type: data.type || "complaint",
      category,
      subcategory,
      priority,
      authority,
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
      adminNotified: admins.length,
    };
  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection?.release();
  }
}

// =====================================================
// NORMAL TICKET API
// =====================================================

app.post(
  "/api/tickets",
  requireRole("student", "admin", "super-admin"),
  async (req, res) => {
  try {
    const {
      message,
      type,
      category,
      subcategory,
      priority,
      authority,
    } = req.body;

    // Validate
    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 2000 ||
      !category ||
      !subcategory ||
      !authority
    ) {
      return res.status(400).json({
        success: false,
        error: "Required ticket information is missing",
      });
    }

    // Create ticket
    const classification = classifyComplaint(message, {
      category,
      subcategory,
      priority,
      authority,
    });
    const ticket = await createTicket({
      message,
      type,
      ...classification,
      createdBy: req.authenticatedUser.userId,
    });

    res.status(201).json({
      success: true,
      message:
        ticket.adminNotified > 0
          ? "Ticket created and campus administrators were notified."
          : "Ticket was saved, but no active campus administrator accounts were available to notify.",
      ticket,
    });

  } catch (error) {
    console.error(
      "Ticket Creation Error:",
      error
    );

    res.status(500).json({
      success: false,
      error: "Unable to create ticket",
    });
  }
});

// =====================================================
// CAMPY AUTOMATIC ACTION ENGINE
// =====================================================

app.post("/api/campy/execute", requireCampyUser, async (req, res) => {
  try {
    const { message } = req.body;

    // Validate message
    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // =================================================
    // STEP 1
    // CAMPY UNDERSTANDS NATURAL LANGUAGE
    // =================================================

    const analysis = await analyzeRequest(message.trim());

    if (
      !analysis ||
      !CAMPY_ACTIONS.has(analysis.action) ||
      typeof analysis.reply !== "string" ||
      !analysis.reply.trim() ||
      !analysis.parameters ||
      typeof analysis.parameters !== "object" ||
      Array.isArray(analysis.parameters)
    ) {
      throw new Error("CAMPY returned an unsupported response.");
    }

    console.log(
      "CAMPY Analysis:",
      analysis
    );

    // =================================================
    // STEP 2
    // CAMPY CHOOSES AN ACTION
    // =================================================

    const action = analysis.action;

    if (
      ["admin", "super-admin"].includes(req.authenticatedUser.role) &&
      !ADMIN_CAMPY_ACTIONS.has(action)
    ) {
      return res.status(403).json({
        success: false,
        error: "That CAMPY action is only available to student accounts.",
      });
    }

    const parameters =
      analysis.parameters || {};

    // =================================================
    // CREATE COMPLAINT
    // =================================================

    if (action === "create_complaint") {
      const complaintMessage =
        String(parameters.description || analysis.message || message).trim();
      const classification = classifyComplaint(
        complaintMessage,
        parameters
      );
      analysis.parameters = {
        ...classification,
        description: complaintMessage,
      };
      let ticket;
      try {
        ticket = await createTicket({
          message: complaintMessage,
          type: "complaint",
          ...classification,
          createdBy: req.authenticatedUser.userId,
        });
      } catch (error) {
        console.error("CAMPY complaint persistence error:", error);
        return res.status(500).json({
          success: false,
          error: "CAMPY understood your complaint but could not save it. Please try again.",
        });
      }

      return res.status(201).json({
        success: true,

        action: "create_complaint",

        message:
          analysis.reply ||
          "Your complaint has been submitted successfully.",

        ticket,

        campy: analysis,
      });
    }

    // =================================================
    // CREATE APPLICATION
    // =================================================

    if (action === "create_application") {

      return res.status(200).json({
        success: true,

        action: "create_application",

        message:
          analysis.reply ||
          "Your application request has been received.",

        application: {
          type:
            parameters.applicationType ||
            "other",

          description:
            parameters.description ||
            analysis.message,

          status: "PENDING REVIEW",

          createdAt:
            new Date().toISOString(),
        },

        campy: analysis,
      });
    }

    // =================================================
    // NORMAL GATE PASS
    // =================================================

    if (action === "create_gate_pass") {

      return res.status(200).json({
        success: true,

        action: "create_gate_pass",

        message:
          analysis.reply ||
          "Your gate pass request has been received.",

        gatePass: {
          purpose:
            parameters.purpose ||
            "Not specified",

          date:
            parameters.date ||
            "Not specified",

          time:
            parameters.time ||
            "Not specified",

          status: "PENDING REVIEW",

          authority:
            "Warden / Gate Pass Authority",

          createdAt:
            new Date().toISOString(),
        },

        campy: analysis,
      });
    }

    // =================================================
    // EMERGENCY GATE PASS
    // =================================================

    if (
      action === "create_emergency_gate_pass"
    ) {

      return res.status(200).json({
        success: true,

        action:
          "create_emergency_gate_pass",

        message:
          analysis.reply ||
          "Your emergency gate pass request has been received.",

        emergencyGatePass: {
          reason:
            parameters.reason ||
            "Emergency",

          urgency:
            parameters.urgency ||
            "critical",

          status:
            "EMERGENCY REQUESTED",

          authority:
            "Warden / Gate Pass Authority",

          createdAt:
            new Date().toISOString(),
        },

        campy: analysis,
      });
    }

    // =================================================
    // HEALTHCARE SOS
    // =================================================

    if (
      action === "send_healthcare_sos"
    ) {

      console.log(
        "HEALTHCARE SOS:",
        analysis.message
      );

      return res.status(200).json({
        success: true,

        action:
          "send_healthcare_sos",

        message:
          analysis.reply ||
          "Healthcare SOS has been activated.",

        sos: {
          type: "HEALTHCARE",

          priority: "CRITICAL",

          status: "ACTIVATED",

          createdAt:
            new Date().toISOString(),
        },

        campy: analysis,
      });
    }

    // =================================================
    // SECURITY SOS
    // =================================================

    if (
      action === "send_security_sos"
    ) {

      console.log(
        "SECURITY SOS:",
        analysis.message
      );

      return res.status(200).json({
        success: true,

        action:
          "send_security_sos",

        message:
          analysis.reply ||
          "Security SOS has been activated.",

        sos: {
          type: "SECURITY",

          priority: "CRITICAL",

          status: "ACTIVATED",

          createdAt:
            new Date().toISOString(),
        },

        campy: analysis,
      });
    }

    // =================================================
    // GET ATTENDANCE
    // =================================================

    if (
      action === "get_attendance"
    ) {
      const attendanceFilter =
        req.authenticatedUser.role === "student"
          ? "WHERE student_id = ?"
          : "";
      const [attendanceRows] = await db.query(
        `SELECT
           subject,
           COUNT(*) AS totalClasses,
           SUM(status IN ('PRESENT', 'LATE')) AS attendedClasses,
           SUM(status = 'ABSENT') AS absentClasses
         FROM attendance
         ${attendanceFilter}
         GROUP BY subject
         ORDER BY subject ASC`,
        req.authenticatedUser.role === "student"
          ? [req.authenticatedUser.userId]
          : []
      );
      const totalClasses = attendanceRows.reduce(
        (total, row) => total + Number(row.totalClasses),
        0
      );
      const attendedClasses = attendanceRows.reduce(
        (total, row) => total + Number(row.attendedClasses),
        0
      );

      return res.status(200).json({
        success: true,

        action:
          "get_attendance",

        message:
          analysis.reply ||
          "Here is your attendance information.",

        data: {
          totalClasses,
          attendedClasses,
          percentage: totalClasses
            ? Math.round((attendedClasses / totalClasses) * 100)
            : null,
          subjects: attendanceRows,
          message: totalClasses
            ? undefined
            : "No attendance has been recorded yet.",
        },

        campy: analysis,
      });
    }

    // =================================================
    // GET TIMETABLE
    // =================================================

    if (
      action === "get_timetable"
    ) {

      return res.status(200).json({
        success: true,

        action:
          "get_timetable",

        message:
          analysis.reply ||
          "Here is your timetable.",

        data: {
          status: "DEMO_DATA",

          message:
            "Timetable database will be connected next.",
        },

        campy: analysis,
      });
    }

    // =================================================
    // GET MESS MENU
    // =================================================

    if (
      action === "get_mess_menu"
    ) {

      return res.status(200).json({
        success: true,

        action:
          "get_mess_menu",

        message:
          analysis.reply ||
          "Here is today's mess menu.",

        data: {
          status: "DEMO_DATA",

          message:
            "Mess menu database will be connected next.",
        },

        campy: analysis,
      });
    }

    // =================================================
    // APPLICATION STATUS
    // =================================================

    if (
      action === "get_application_status"
    ) {

      return res.status(200).json({
        success: true,

        action:
          "get_application_status",

        message:
          analysis.reply ||
          "I will check your application status.",

        data: {
          status: "DEMO_DATA",

          message:
            "Application tracking will be connected next.",
        },

        campy: analysis,
      });
    }

    // =================================================
    // COMPLAINT STATUS
    // =================================================

    if (
      action === "get_complaint_status"
    ) {

      return res.status(200).json({
        success: true,

        action:
          "get_complaint_status",

        message:
          analysis.reply ||
          "I will check your complaint status.",

        data: {
          status: "DEMO_DATA",

          message:
            "Complaint tracking will be connected next.",
        },

        campy: analysis,
      });
    }

    // =================================================
    // INFORMATION
    // =================================================

    if (
      action === "information"
    ) {

      return res.status(200).json({
        success: true,

        action: "information",

        message:
          analysis.reply ||
          "I understand your question.",

        campy: analysis,
      });
    }

    // =================================================
    // UNKNOWN ACTION
    // =================================================

    return res.status(200).json({
      success: true,

      action: "no_action",

      message:
        analysis.reply ||
        "I understood your request, but I need more information to complete it.",

      campy: analysis,
    });

  } catch (error) {
    const campyError = getCampyError(error);
    res.status(campyError.status).json({
      success: false,
      error: campyError.message,
    });
  }
});

async function dispatchDueAssignmentReminders() {
  await db.query(
    `UPDATE assignment_reminders
     SET processed_at = CURRENT_TIMESTAMP
     WHERE processed_at IS NULL
       AND scheduled_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 65 MINUTE)`
  );

  const [dueReminders] = await db.query(
    `SELECT reminder.id, reminder.assignment_id AS assignmentId,
            reminder.reminder_key AS reminderKey,
            assignment.faculty_id AS createdBy,
            assignment.title, assignment.subject, assignment.branch,
            assignment.semester,
            CONCAT(assignment.due_date, ' 23:59:59') AS dueAt
     FROM assignment_reminders reminder
     JOIN assignments assignment ON assignment.id = reminder.assignment_id
     WHERE reminder.processed_at IS NULL
       AND reminder.scheduled_at <= CURRENT_TIMESTAMP
       AND assignment.status = 'ACTIVE'
       AND assignment.branch IS NOT NULL
       AND assignment.semester IS NOT NULL
     ORDER BY reminder.scheduled_at ASC
     LIMIT 100`
  );

  for (const reminder of dueReminders) {
    const connection = await db.getConnection();
    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;
      const [lockedJobs] = await connection.query(
        "SELECT processed_at FROM assignment_reminders WHERE id = ? FOR UPDATE",
        [reminder.id]
      );
      if (!lockedJobs.length || lockedJobs[0].processed_at) {
        await connection.rollback();
        transactionStarted = false;
        continue;
      }

      const [students] = await connection.query(
        `SELECT id FROM users
         WHERE role = 'student' AND status = 'ACTIVE'
            AND branch = ?
            AND REGEXP_REPLACE(LOWER(semester), '[^0-9]', '') =
                REGEXP_REPLACE(LOWER(?), '[^0-9]', '')`,
        [reminder.branch, reminder.semester]
      );
      const dueDate = new Date(reminder.dueAt).toLocaleDateString();
      const title = `Assignment due ${reminder.reminderKey}`;
      const notificationMessage =
        `${reminder.title} (${reminder.subject}) is due on ${dueDate}.`;
      for (const student of students) {
        await connection.query(
          `INSERT INTO notifications
             (user_id, type, title, message)
           VALUES (?, 'ASSIGNMENT', ?, ?)`,
          [
            student.id,
            title,
            notificationMessage,
          ]
        );
      }
      await connection.query(
        "UPDATE assignment_reminders SET processed_at = CURRENT_TIMESTAMP WHERE id = ?",
        [reminder.id]
      );
      await connection.commit();
      transactionStarted = false;
    } catch (error) {
      if (transactionStarted) {
        await connection.rollback();
      }
      console.error("Assignment reminder dispatch error:", {
        reminderId: reminder.id,
        error,
      });
    } finally {
      connection.release();
    }
  }
}

setTimeout(() => {
  dispatchDueAssignmentReminders().catch((error) => {
    console.error("Assignment reminder scheduler startup error:", error);
  });
}, 1000);
setInterval(() => {
  dispatchDueAssignmentReminders().catch((error) => {
    console.error("Assignment reminder scheduler error:", error);
  });
}, 60 * 1000);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found",
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {

  console.error(
    "Server Error:",
    err
  );

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// =====================================================
// START SERVER
// =====================================================

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(
    `EKAM backend running on http://localhost:${PORT}`
  );
});