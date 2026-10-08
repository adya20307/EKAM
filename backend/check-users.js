const db = require("./db");

async function checkUsers() {
  try {
    const [rows] = await db.query(
      "SELECT id, name, mobile, email, role, department, status FROM users WHERE role = 'student'"
    );

    console.table(rows);
  } catch (error) {
    console.error("ERROR:", error.message);
  } finally {
    process.exit();
  }
}

checkUsers();