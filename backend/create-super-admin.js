require("dotenv").config();
const readline = require("readline/promises");
const { stdin, stdout } = require("process");
const db = require("./db");

async function createSuperAdmin() {
  const terminal = readline.createInterface({ input: stdin, output: stdout });

  try {
    const [lockRows] = await db.query(
      "SELECT GET_LOCK('ekam-first-super-admin', 10) AS acquired"
    );
    if (lockRows[0].acquired !== 1) {
      throw new Error("Could not acquire the Super Admin setup lock.");
    }

    try {
      const [existing] = await db.query(
        "SELECT id FROM users WHERE role = 'super-admin' LIMIT 1"
      );
      if (existing.length > 0) {
        throw new Error(
          "A Super Admin already exists. Bootstrap is one-time; ask the existing Super Admin to add accounts."
        );
      }

      const name = (await terminal.question("Super Admin full name: ")).trim();
      const mobileInput = (await terminal.question(
        "Super Admin phone number (10 digits, with or without +91): "
      )).trim();
      const email = (await terminal.question("Super Admin email address: "))
        .trim()
        .toLowerCase();
      const mobileDigits = mobileInput.replace(/\D/g, "");
      const mobile =
        mobileDigits.length === 12 && mobileDigits.startsWith("91")
          ? mobileDigits.slice(2)
          : mobileDigits;

      if (
        !name ||
        !/^\d{10}$/.test(mobile) ||
        email.length > 150 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        throw new Error(
          "Enter a name, valid 10-digit Indian mobile number, and valid email address."
        );
      }

      const [matching] = await db.query(
        "SELECT id FROM users WHERE mobile = ? OR email = ? LIMIT 1",
        [mobile, email]
      );
      if (matching.length > 0) {
        throw new Error(
          "That phone number or email already belongs to another account. Resolve the existing record before bootstrapping."
        );
      }

      await db.query(
        `INSERT INTO users (name, mobile, email, role, status)
         VALUES (?, ?, ?, 'super-admin', 'ACTIVE')`,
        [name, mobile, email]
      );
      console.log(
        `Super Admin "${name}" created. Sign in with this email and complete email OTP verification.`
      );
    } finally {
      await db.query("SELECT RELEASE_LOCK('ekam-first-super-admin')");
    }
  } finally {
    terminal.close();
    await db.end();
  }
}

createSuperAdmin().catch((error) => {
  console.error("Super Admin setup failed:", error.message);
  process.exitCode = 1;
});
