# Run EKAM locally with email OTP

## Requirements

- Node.js 20 or newer
- MySQL 8 (or a compatible MySQL server)
- An SMTP account for sending sign-in emails (a provider's free tier may work; check its limits)

## Configure email delivery

1. Choose an email provider that offers SMTP access. Create/verify a sender address and obtain its SMTP host, port, username, and password.
2. Copy `backend/.env.example` to `backend/.env` and set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`. Keep this file private; never put SMTP credentials in the frontend `.env` or commit them.
3. Set `FRONTEND_ORIGIN` to the exact origin used by the Vite app (default `http://localhost:5173`).

The backend sends a six-digit code that expires after 10 minutes. Codes are single-use, limited to five verification attempts, and send requests are rate-limited. The app returns a generic message whether or not the email belongs to an active account.

## Configure MySQL and create the first Super Admin

1. Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `backend/.env`.
2. Start MySQL.
3. If this database already has EKAM accounts, assign a unique email to every active account before switching sign-in. For example, find the Super Admin row with `SELECT id, name, role, email FROM users WHERE role = 'super-admin';`, then update it with `UPDATE users SET email = 'admin@example.com' WHERE id = <id>;`. Repeat for existing accounts, using each user's real email address.
4. From the project root, run:

   ```powershell
   npm install
   npm --prefix backend install
   npm --prefix backend run db:setup
   npm --prefix backend run create-super-admin
   ```

   Database setup creates the configured database and required tables if missing; it does not overwrite existing tables. It also safely adds the `is_hosteller` field to an existing `users` table, defaulting current students to non-hosteller, and adds a unique student/subject/date key to attendance so re-saving a class updates that class instead of duplicating it. If an older attendance table already contains duplicate student/subject/date rows, setup stops and reports that those duplicates must be resolved first. The one-time Super Admin setup asks for a name, phone number, and email address.
5. Add active student accounts with unique email addresses before sign-in. Use the Super Admin **Department Admins** screen to create department-admin accounts; each account needs a unique email. Existing accounts without an email must have one added before they can sign in.
6. The same mobile number may be shared by accounts with different roles. Registration numbers and email addresses must remain unique, and mobile numbers must be unique among student accounts and among department-admin accounts.

## Start the local website

Open two terminals in the project root:

```powershell
npm run dev:backend
```

```powershell
npm run dev
```

Open the local Vite URL (normally `http://localhost:5173`). The frontend API URL defaults to `http://localhost:5000`; if using different ports, change `VITE_API_BASE_URL` in the root `.env` and `FRONTEND_ORIGIN` in `backend/.env` together.

Email OTPs are generated and verified by the backend, which looks up the active MySQL account and creates an HTTP-only session cookie. The session cookie is held in backend memory, so restarting the backend signs out existing sessions and invalidates outstanding codes.

## Attendance data flow

Teaching Faculty (or a Super Admin) can record present, absent, or late status for registered students from the Attendance Management screen. Records are stored once per student, subject, and class date. Students see their saved subject totals and attendance percentages on the dashboard and Attendance screen; the Super Admin dashboard shows campus totals and a seven-day chart. These screens display an empty state until attendance is entered; they do not use sample attendance values.

## SOS, CAMPY complaints, and assignment reminders

- Run `npm --prefix backend run db:setup` after updating the app to create any missing notification, SOS, complaint, assignment, and reminder tables. It preserves existing records and adds branch/semester targeting columns to an existing assignments table when needed.
- Healthcare SOS alerts are saved to the database, appear in active Admin and Super Admin notification inboxes, and are emailed to `HEALTHCARE_SOS_EMAIL` using the configured SMTP account. Keep recipient settings in the ignored `backend/.env.local` or `backend/.env`; do not put private configuration in frontend variables or tracked files.
- The SOS screen requests the browser's location permission when the student sends an alert. If permitted, the alert includes a location snapshot and map link; this is not continuous live tracking. SMS to a phone number is not sent until an SMS provider is configured.
- CAMPY recognizes “help help help” as Healthcare SOS and “save me save me save me” as Security SOS. It categorizes complaint reports, creates a database ticket, and notifies active Admin and Super Admin accounts.
- Academics Admin assignment creation stores the assignment and schedules in-app reminders for matching branch/semester students: seven days before, five days before, and hourly from 24 hours before the due date through one hour before. The backend reminder worker checks every minute; keep the backend running for scheduled dispatch. Notifications remain in the recipient's inbox until they sign in.
