require("dotenv").config();
const mysql = require("mysql2/promise");

async function setupDatabase() {
  const databaseName = process.env.DB_NAME || "ekam";
  if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
    throw new Error("DB_NAME may only contain letters, numbers, and underscores.");
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${databaseName}\``);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(20) NULL,
        email VARCHAR(150) NULL UNIQUE,
        faculty_id VARCHAR(50) NULL UNIQUE,
        registration_no VARCHAR(50) NULL UNIQUE,
        password_hash VARCHAR(255) NULL,
        role ENUM('student', 'admin', 'super-admin', 'faculty') NOT NULL,
        department VARCHAR(100) NULL,
        branch VARCHAR(100) NULL,
        semester VARCHAR(50) NULL,
        is_hosteller BOOLEAN NOT NULL DEFAULT FALSE,
        status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [hostellerColumn] = await connection.query(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'is_hosteller'`,
      [databaseName]
    );
    if (hostellerColumn.length === 0) {
      await connection.query(
        "ALTER TABLE users ADD COLUMN is_hosteller BOOLEAN NOT NULL DEFAULT FALSE"
      );
    }

    const [mobileIndexes] = await connection.query(
      `SELECT INDEX_NAME AS indexName, COUNT(*) AS columnCount
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'mobile' AND NON_UNIQUE = 0
       GROUP BY INDEX_NAME`,
      [databaseName]
    );
    for (const index of mobileIndexes) {
      if (Number(index.columnCount) === 1 && index.indexName !== "PRIMARY") {
        const safeIndexName = index.indexName.replace(/`/g, "``");
        await connection.query(
          `ALTER TABLE users DROP INDEX \`${safeIndexName}\``
        );
      }
    }

    const [mobileLookupIndex] = await connection.query(
      `SELECT INDEX_NAME
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
         AND INDEX_NAME = 'idx_users_mobile'
       LIMIT 1`,
      [databaseName]
    );
    if (mobileLookupIndex.length === 0) {
      await connection.query(
        "CREATE INDEX idx_users_mobile ON users (mobile)"
      );
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        faculty_id INT NOT NULL,
        subject VARCHAR(150) NOT NULL,
        class_date DATE NOT NULL,
        status ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL,
        remarks VARCHAR(255) NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_attendance_student_subject_date (student_id, subject, class_date),
        KEY idx_attendance_faculty (faculty_id),
        CONSTRAINT fk_attendance_student
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_attendance_faculty
          FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [duplicateAttendance] = await connection.query(
      `SELECT student_id, subject, class_date
       FROM attendance
       GROUP BY student_id, subject, class_date
       HAVING COUNT(*) > 1
       LIMIT 1`
    );
    if (duplicateAttendance.length > 0) {
      throw new Error(
        "Attendance contains duplicate student/subject/date records. Resolve duplicates before enabling unique daily attendance."
      );
    }

    const [attendanceUniqueIndex] = await connection.query(
      `SELECT INDEX_NAME
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'attendance'
         AND INDEX_NAME = 'uq_attendance_student_subject_date'
       LIMIT 1`,
      [databaseName]
    );
    if (attendanceUniqueIndex.length === 0) {
      await connection.query(
        "CREATE UNIQUE INDEX uq_attendance_student_subject_date ON attendance (student_id, subject, class_date)"
      );
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    for (const name of [
      "Academics",
      "Hostel",
      "Security",
      "Accounts",
      "Maintenance",
      "Teaching Faculty",
      "Documentation",
    ]) {
      await connection.query(
        `INSERT INTO departments (name, status)
         SELECT ?, 'ACTIVE'
         WHERE NOT EXISTS (
           SELECT 1 FROM departments WHERE LOWER(name) = LOWER(?)
         )`,
        [name, name]
      );
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'GENERAL',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_notifications_user_created (user_id, created_at),
        CONSTRAINT fk_notifications_user
          FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        department_id INT NULL,
        faculty_id INT NULL,
        subject VARCHAR(150) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NULL,
        due_date DATE NULL,
        branch VARCHAR(100) NULL,
        semester VARCHAR(30) NULL,
        status ENUM('ACTIVE', 'COMPLETED', 'CLOSED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_assignments_department (department_id),
        KEY idx_assignments_faculty (faculty_id),
        KEY idx_assignments_target_due (branch, semester, due_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    for (const [columnName, columnDefinition] of [
      ["branch", "VARCHAR(100) NULL"],
      ["semester", "VARCHAR(30) NULL"],
    ]) {
      const [column] = await connection.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'assignments'
           AND COLUMN_NAME = ?`,
        [databaseName, columnName]
      );
      if (column.length === 0) {
        await connection.query(
          `ALTER TABLE assignments ADD COLUMN ${columnName} ${columnDefinition}`
        );
      }
    }
    const [assignmentTargetIndex] = await connection.query(
      `SELECT INDEX_NAME
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'assignments'
         AND INDEX_NAME = 'idx_assignments_target_due'
       LIMIT 1`,
      [databaseName]
    );
    if (assignmentTargetIndex.length === 0) {
      await connection.query(
        "CREATE INDEX idx_assignments_target_due ON assignments (branch, semester, due_date)"
      );
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS assignment_reminders (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        assignment_id INT NOT NULL,
        reminder_key VARCHAR(10) NOT NULL,
        scheduled_at DATETIME NOT NULL,
        processed_at DATETIME NULL,
        UNIQUE KEY uq_assignment_reminder (assignment_id, reminder_key),
        KEY idx_assignment_reminders_due (scheduled_at, processed_at),
        CONSTRAINT fk_assignment_reminders_assignment
          FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        department_id INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        subcategory VARCHAR(100) NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
        status ENUM('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')
          DEFAULT 'SUBMITTED',
        assigned_to INT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_complaints_student (student_id),
        KEY idx_complaints_department (department_id),
        KEY idx_complaints_assignee (assigned_to),
        CONSTRAINT fk_complaints_student
          FOREIGN KEY (student_id) REFERENCES users(id),
        CONSTRAINT fk_complaints_department
          FOREIGN KEY (department_id) REFERENCES departments(id),
        CONSTRAINT fk_complaints_assignee
          FOREIGN KEY (assigned_to) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sos_alerts (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        sos_type ENUM('HEALTHCARE', 'SECURITY') NOT NULL,
        message TEXT NULL,
        latitude DECIMAL(10, 7) NULL,
        longitude DECIMAL(10, 7) NULL,
        status ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED') DEFAULT 'ACTIVE',
        responded_by INT NULL,
        responded_at TIMESTAMP NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_sos_alerts_student (student_id),
        KEY idx_sos_alerts_responder (responded_by),
        CONSTRAINT fk_sos_alerts_student
          FOREIGN KEY (student_id) REFERENCES users(id),
        CONSTRAINT fk_sos_alerts_responder
          FOREIGN KEY (responded_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log(`Database "${databaseName}" and required tables are ready.`);
  } finally {
    await connection.end();
  }
}

setupDatabase().catch((error) => {
  console.error("Database setup failed:", error.message);
  process.exitCode = 1;
});
