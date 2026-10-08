// src/App.jsx

import React, { useEffect, useRef, useState } from "react";
import { LanguageProvider } from "./i18n";
import { useLanguage } from "./language-context";

import AdminLogin from "./pages/AdminLogin";
import Login from "./pages/Login";

import AdminDashboardPage from "./pages/AdminDashboard";
import SuperAdminDashboardPage from "./pages/SuperAdminDashboard";
import DepartmentAdmins from "./pages/DepartmentAdmins";
import StudentsAdmin from "./pages/StudentsAdmin";
import AcademicsAdmin from "./pages/AcademicsAdmin";
import HostelAdmin from "./pages/HostelAdmin";
import SecurityAdmin from "./pages/SecurityAdmin";
import AccountsAdmin from "./pages/AccountsAdmin";
import MaintenanceAdmin from "./pages/MaintenanceAdmin";
import TeachingFacultyAdmin from "./pages/TeachingFacultyAdmin";
import DocumentationAdmin from "./pages/DocumentationAdmin";

import {
  DashboardPage,
  AttendancePage,
  TimetablePage,
  AssignmentsPage,
  MaterialsPage,
  ResultsPage,
  NoticesPage,
  EventsPage,
  CampusUpdatesPage,
  HostelDashboardPage,
  HostelComplaintsPage,
  RoomDetailsPage,
  TodayMenuPage,
  WeeklyMenuPage,
  MessFeedbackPage,
  GatePassPage,
  ApplicationsPage,
  CertificateRequestsPage,
  FeeStatusPage,
  VoiceHelpdeskPage,
  FAQPage,
  SOSPage,
  ProfilePage,
  SettingsPage,
} from "./pages/Pages";

import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  FileText,
  Trophy,
  Bell,
  Building2,
  Utensils,
  QrCode,
  Shield,
  Bot,
  ChevronDown,
  ChevronRight,
  Search,
  UserCircle,
  Settings,
  LogOut,
  HeartPulse,
  Mic,
  Megaphone,
  BedDouble,
  MessageSquare,
  Home,
  CreditCard,
  Receipt,
  HelpCircle,
  FileCheck,
  Menu,
  X,
  Users,
  Wrench,
  GraduationCap,
  Wallet,
  FolderOpen,
  AlertTriangle,
  Settings2,
} from "lucide-react";

import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const campyWakeRef = useRef(null);
  const getInitialPage = () => {
    const savedUser = localStorage.getItem("ekamUser");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);

        if (user.role === "student") {
          return "dashboard";
        }

      if (user.role === "admin") {
  return `admin-${user.department?.toLowerCase().replace(/\s+/g, "-")}`;
}

        if (user.role === "super-admin") {
          return "super-admin-dashboard";
        }
      } catch {
        localStorage.removeItem("ekamUser");
      }
    }

    const path = window.location.pathname;

    if (path === "/admin") {
      return "admin-login";
    }

    if (path === "/super-admin") {
      return "admin-login";
    }

    return "login";
  };

  const [page, setPage] = useState(getInitialPage);

  const [openSection, setOpenSection] = useState("academics");
  const [openMaterials, setOpenMaterials] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [toast, setToast] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [serverNotifications, setServerNotifications] = useState([]);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("ekamUser")) || {};
    } catch {
      return {};
    }
  })();

  const isStudent = currentUser.role === "student";
  const isAdmin = currentUser.role === "admin";
  const isSuperAdmin = currentUser.role === "super-admin";
  const isHosteller = currentUser.isHosteller === true;

  useEffect(() => {
    if (!currentUser.id || !["student", "admin", "super-admin"].includes(currentUser.role)) {
      return undefined;
    }

    let active = true;
    const loadNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications`, {
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load campus notifications.");
        }
        if (active) setServerNotifications(data.notifications);
      } catch (error) {
        if (active) console.error("Notification inbox error:", error);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [currentUser.id, currentUser.role]);

  /* =========================================================
     HELPERS
  ========================================================= */

  const showToast = (message) => {
    setToast(message);

    clearTimeout(window.ekamToastTimer);

    window.ekamToastTimer = setTimeout(() => {
      setToast("");
    }, 2500);
  };

  const navigate = (targetPage) => {
    const hostelPages = [
      "hostel-dashboard",
      "hostel-complaints",
      "room-details",
      "today-menu",
      "weekly-menu",
      "mess-feedback",
    ];
    if (isStudent && !isHosteller && hostelPages.includes(targetPage)) {
      showToast("Hostel and mess services are available to hostellers.");
      return;
    }

    setPage(targetPage);

    setMobileOpen(false);
    setProfileOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const toggleSection = (section) => {
    setOpenSection(
      openSection === section ? "" : section
    );
  };

  const handleLogout = async () => {
    let serverLogoutError;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Unable to end the EKAM server session.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      serverLogoutError = error;
    }

    localStorage.removeItem("ekamStudent");
    localStorage.removeItem("ekamUser");
    setServerNotifications([]);

    setProfileOpen(false);

    window.history.pushState({}, "", "/login");

    setPage("login");

    showToast(
      serverLogoutError
        ? "Logged out on this device, but could not reach the server to end your session."
        : "Logged out successfully."
    );
  };

  const handleSuspension = (notification) => {
    setNotifications((previous) => [
      {
        ...notification,
        id: Date.now(),
        type: "danger",
        time: "Just now",
      },
      ...previous,
    ]);

    showToast("Class suspension notification added.");
  };

  const markNotificationRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update notification.");
      }
      setServerNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, readAt: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      console.error("Notification read update error:", error);
      showToast(error.message);
    }
  };

  /* =========================================================
     STUDENT ROUTES
  ========================================================= */

  const renderStudentPage = () => {
    switch (page) {
      case "dashboard":
        return (
          <DashboardPage
            notifications={[
              ...notifications,
              ...serverNotifications
                .filter((notification) => !notification.readAt)
                .map((notification) => ({
                ...notification,
                text: notification.message,
                time: notification.createdAt,
                })),
            ]}
            onNavigate={navigate}
            onToast={showToast}
            isHosteller={isHosteller}
            onRegisterCampyWake={(startCampy) => {
              campyWakeRef.current = startCampy;
            }}
          />
        );

      case "attendance":
        return <AttendancePage />;

      case "timetable":
        return (
          <TimetablePage
            onSuspension={handleSuspension}
          />
        );

      case "assignments":
        return <AssignmentsPage />;

      case "materials-1":
        return <MaterialsPage semester="1st" />;

      case "materials-2":
        return <MaterialsPage semester="2nd" />;

      case "materials-3":
        return <MaterialsPage semester="3rd" />;

      case "materials-4":
        return <MaterialsPage semester="4th" />;

      case "materials-5":
        return <MaterialsPage semester="5th" />;

      case "materials-6":
        return <MaterialsPage semester="6th" />;

      case "materials-7":
        return <MaterialsPage semester="7th" />;

      case "materials-8":
        return <MaterialsPage semester="8th" />;

      case "results":
        return <ResultsPage />;

      case "notices":
        return <NoticesPage />;

      case "events":
        return <EventsPage />;

      case "campus-updates":
        return <CampusUpdatesPage />;

      case "hostel-dashboard":
        return <HostelDashboardPage />;

      case "hostel-complaints":
        return (
          <HostelComplaintsPage
            onToast={showToast}
          />
        );

      case "room-details":
        return <RoomDetailsPage />;

      case "today-menu":
        return <TodayMenuPage />;

      case "weekly-menu":
        return <WeeklyMenuPage />;

      case "mess-feedback":
        return (
          <MessFeedbackPage
            onToast={showToast}
          />
        );

      case "gate-pass":
        return (
          <GatePassPage
            onToast={showToast}
          />
        );

      case "applications":
        return (
          <ApplicationsPage
            onToast={showToast}
          />
        );

      case "certificates":
        return (
          <CertificateRequestsPage
            onToast={showToast}
          />
        );

      case "fee-status":
        return <FeeStatusPage />;

      case "emergency-sos":
        return (
          <SOSPage
            type="emergency"
            onToast={showToast}
          />
        );

      case "healthcare-sos":
        return (
          <SOSPage
            type="healthcare"
            onToast={showToast}
          />
        );

      case "voice-helpdesk":
        return (
          <VoiceHelpdeskPage
            onNavigate={navigate}
            onToast={showToast}
          />
        );

      case "faq":
        return <FAQPage />;

      case "profile":
        return <ProfilePage />;

      case "settings":
        return <SettingsPage />;

      default:
        return (
          <DashboardPage
            notifications={notifications}
            onNavigate={navigate}
          />
        );
    }
  };

  /* =========================================================
     ADMIN ROUTES
  ========================================================= */

 const renderAdminPage = () => {
  switch (page) {
    /* =========================================================
       MAIN ADMIN DASHBOARD
    ========================================================= */

    case "admin-dashboard":
      return <AdminDashboardPage />;

    case "profile":
      return <ProfilePage user={currentUser} />;

    case "settings":
      return <SettingsPage />;

    case "campy":
      return (
        <VoiceHelpdeskPage
          onNavigate={navigate}
          onToast={showToast}
        />
      );


    /* =========================================================
       ACADEMICS ADMIN
    ========================================================= */

    case "admin-academics":
      return (
        <AcademicsAdmin
          module="dashboard"
          onSuspension={handleSuspension}
        />
      );

    case "admin-academics-timetable":
      return (
        <AcademicsAdmin
          module="timetable"
          onSuspension={handleSuspension}
        />
      );

    case "admin-academics-assignments":
      return (
        <AcademicsAdmin
          module="assignments"
          onSuspension={handleSuspension}
        />
      );

    case "admin-academics-materials":
      return (
        <AcademicsAdmin
          module="materials"
          onSuspension={handleSuspension}
        />
      );

    case "admin-academics-results":
      return (
        <AcademicsAdmin
          module="results"
          onSuspension={handleSuspension}
        />
      );

    case "admin-academics-alerts":
      return (
        <AcademicsAdmin
          module="alerts"
          onSuspension={handleSuspension}
        />
      );

    case "admin-academics-notices":
      return (
        <AcademicsAdmin
          module="notices"
          onSuspension={handleSuspension}
        />
      );


    /* =========================================================
       OTHER DEPARTMENT DASHBOARDS
    ========================================================= */

   case "admin-hostel":
  return <HostelAdmin module="dashboard" />;

case "admin-hostel-rooms":
  return <HostelAdmin module="rooms" />;

case "admin-hostel-complaints":
  return <HostelAdmin module="complaints" />;

case "admin-hostel-mess":
  return <HostelAdmin module="mess" />;

case "admin-hostel-gatepass":
  return <HostelAdmin module="gatepass" />;

case "admin-hostel-emergency":
  return <HostelAdmin module="emergency" />;
  case "admin-hostel-notices":
  return <HostelAdmin module="notices" />;

case "admin-security":
  return <SecurityAdmin module="dashboard" />;

case "admin-security-emergency":
  return <SecurityAdmin module="emergency" />;

case "admin-security-sos":
  return <SecurityAdmin module="sos" />;

case "admin-security-healthcare":
  return <SecurityAdmin module="healthcare" />;

case "admin-security-gatepass":
  return <SecurityAdmin module="gatepass" />;

case "admin-security-incidents":
  return <SecurityAdmin module="incidents" />;

case "admin-security-alerts":
  return <SecurityAdmin module="alerts" />;

case "admin-accounts":
  return <AccountsAdmin module="dashboard" />;

case "admin-accounts-fees":
  return <AccountsAdmin module="fees" />;

case "admin-accounts-dues":
  return <AccountsAdmin module="dues" />;

case "admin-accounts-payments":
  return <AccountsAdmin module="payments" />;

case "admin-accounts-receipts":
  return <AccountsAdmin module="receipts" />;

case "admin-accounts-refunds":
  return <AccountsAdmin module="refunds" />;

case "admin-accounts-reports":
  return <AccountsAdmin module="reports" />;
      return <AccountsAdmin />;

case "admin-maintenance":
  return (
    <MaintenanceAdmin
      module="dashboard"
      onNavigate={navigate}
    />
  );

case "admin-maintenance-complaints":
  return (
    <MaintenanceAdmin
      module="complaints"
      onNavigate={navigate}
    />
  );

case "admin-maintenance-categories":
  return (
    <MaintenanceAdmin
      module="categories"
      onNavigate={navigate}
    />
  );

case "admin-maintenance-technicians":
  return (
    <MaintenanceAdmin
      module="technicians"
      onNavigate={navigate}
    />
  );

case "admin-maintenance-assignments":
  return (
    <MaintenanceAdmin
      module="assignments"
      onNavigate={navigate}
    />
  );

case "admin-maintenance-recurring":
  return (
    <MaintenanceAdmin
      module="recurring"
      onNavigate={navigate}
    />
  );

case "admin-maintenance-reports":
  return (
    <MaintenanceAdmin
      module="reports"
      onNavigate={navigate}
    />
  );
case "admin-teaching":
  return (
    <TeachingFacultyAdmin
      module="dashboard"
      onNavigate={navigate}
    />
  );

case "admin-teaching-students":
  return (
    <TeachingFacultyAdmin
      module="students"
      onNavigate={navigate}
    />
  );

case "admin-teaching-attendance":
  return (
    <TeachingFacultyAdmin
      module="attendance"
      onNavigate={navigate}
    />
  );

case "admin-teaching-reports":
  return (
    <TeachingFacultyAdmin
      module="reports"
      onNavigate={navigate}
    />
  );

case "admin-teaching-low-attendance":
  return (
    <TeachingFacultyAdmin
      module="low-attendance"
      onNavigate={navigate}
    />
  );

case "admin-teaching-schedule":
  return (
    <TeachingFacultyAdmin
      module="schedule"
      onNavigate={navigate}
    />
  );

case "admin-teaching-corrections":
  return (
    <TeachingFacultyAdmin
      module="corrections"
      onNavigate={navigate}
    />
  );
  case "admin-documents":
  return (
    <DocumentationAdmin
      module="dashboard"
      onNavigate={navigate}
    />
  );

case "admin-documents-applications":
  return (
    <DocumentationAdmin
      module="applications"
      onNavigate={navigate}
    />
  );

case "admin-documents-certificates":
  return (
    <DocumentationAdmin
      module="certificates"
      onNavigate={navigate}
    />
  );

case "admin-documents-verification":
  return (
    <DocumentationAdmin
      module="verification"
      onNavigate={navigate}
    />
  );

case "admin-notices":
  return (
    <DocumentationAdmin
      module="notices"
      onNavigate={navigate}
    />
  );

case "admin-documents-branch-notices":
  return (
    <DocumentationAdmin
      module="branch-notices"
      onNavigate={navigate}
    />
  );

case "admin-documents-semester-notices":
  return (
    <DocumentationAdmin
      module="semester-notices"
      onNavigate={navigate}
    />
  );

    /* =========================================================
       OLD GENERIC NOTICES ROUTE
       Kept for other departments temporarily.
    ========================================================= */

   case "admin-notices":
  return <DocumentationAdmin module="notices" />;

    /* =========================================================
       FALLBACK
    ========================================================= */

    default:
      return <AdminDashboardPage />;
  }
};
  /* =========================================================
     SUPER ADMIN ROUTES
  ========================================================= */

  const renderSuperAdminPage = () => {
    switch (page) {
      case "super-admin-dashboard":
        return <SuperAdminDashboardPage />;

      case "profile":
        return <ProfilePage user={currentUser} />;

      case "settings":
        return <SettingsPage />;

      case "campy":
        return (
          <VoiceHelpdeskPage
            onNavigate={navigate}
            onToast={showToast}
          />
        );

case "super-department-admins":
  return <DepartmentAdmins />;
      case "super-students":
        return <StudentsAdmin />;
      case "super-academics":
        return (
          <SuperModulePage
            title="Academics Overview"
            subtitle="Campus-wide academic performance."
            icon={<GraduationCap size={28} />}
            items={[
              "Department performance",
              "Semester-wise performance",
              "Timetable status",
              "Assignment completion",
              "Study material coverage",
              "Results overview",
            ]}
          />
        );

      case "super-hostel":
        return (
          <SuperModulePage
            title="Hostel Overview"
            subtitle="Campus-wide hostel operations."
            icon={<Building2 size={28} />}
            items={[
              "Hostel occupancy",
              "Room allocation",
              "Hostel complaints",
              "Hostel menu",
              "Gate-pass activity",
              "Hostel performance",
            ]}
          />
        );

      case "super-security":
        return (
          <SuperModulePage
            title="Security Overview"
            subtitle="Campus-wide safety and emergency monitoring."
            icon={<Shield size={28} />}
            items={[
              "Healthcare SOS",
              "Emergency SOS",
              "Emergency gate passes",
              "Security alerts",
              "Emergency resources",
            ]}
          />
        );

      case "super-accounts":
        return (
          <SuperModulePage
            title="Accounts Overview"
            subtitle="Campus-wide financial visibility."
            icon={<Wallet size={28} />}
            items={[
              "Total fees",
              "Outstanding dues",
              "Payment requests",
              "Payment status",
              "Financial trends",
            ]}
          />
        );

      case "super-maintenance":
        return (
          <SuperModulePage
            title="Maintenance Overview"
            subtitle="Campus-wide maintenance intelligence."
            icon={<Wrench size={28} />}
            items={[
              "Open complaints",
              "Complaint ageing",
              "Technician workload",
              "Recurring issues",
              "Department response time",
            ]}
          />
        );

      case "super-teaching":
        return (
          <SuperModulePage
            title="Teaching Faculty Overview"
            subtitle="Campus-wide faculty and attendance overview."
            icon={<GraduationCap size={28} />}
            items={[
              "Faculty overview",
              "Student attendance",
              "Semester attendance",
              "Department performance",
            ]}
          />
        );

      case "super-documents":
        return (
          <SuperModulePage
            title="Documents Overview"
            subtitle="Campus-wide application and document monitoring."
            icon={<FolderOpen size={28} />}
            items={[
              "Pending applications",
              "Certificate requests",
              "Document verification",
              "Processing time",
            ]}
          />
        );

      case "super-notices":
        return (
          <SuperModulePage
            title="Notices & Announcements"
            subtitle="Campus-wide communication control."
            icon={<MegaphoneIcon />}
            items={[
              "All branches",
              "Dedicated branch",
              "Semester-wise notices",
              "Notice history",
              "Read/action tracking",
            ]}
          />
        );

      case "super-recurring":
        return (
          <SuperModulePage
            title="Recurring Issues"
            subtitle="EKAM automatically identifies repeated campus problems."
            icon={<AlertTriangle size={28} />}
            items={[
              "Food quality — 21 reports / 4 days",
              "Water leakage — 14 reports / 6 days",
              "Wi-Fi failure — 11 reports / 3 days",
              "Room cleaning — 9 reports / 5 days",
            ]}
          />
        );

      case "super-settings":
        return (
          <SuperModulePage
            title="System Settings"
            subtitle="Manage campus-wide configuration."
            icon={<Settings2 size={28} />}
            items={[
              "Department configuration",
              "Admin permissions",
              "Notification settings",
              "System preferences",
            ]}
          />
        );

      default:
        return <SuperAdminDashboardPage />;
    }
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  if (page === "login") {
    return (
      <Login
        onLogin={(user) => {
          localStorage.setItem(
            "ekamUser",
            JSON.stringify(user)
          );

          localStorage.setItem("ekamStudent", JSON.stringify(user));
          window.history.pushState({}, "", "/");

          setPage("dashboard");
        }}
        onAdminLogin={() => {
          window.history.pushState({}, "", "/admin");

          setPage("admin-login");
        }}
      />
    );
  }

  if (page === "admin-login") {
    return (
      <AdminLogin
        onLogin={(user) => {
          localStorage.setItem(
            "ekamUser",
            JSON.stringify(user)
          );

          if (user.role === "super-admin") {
            window.history.pushState(
              {},
              "",
              "/super-admin"
            );

            setPage("super-admin-dashboard");
         } else {
  const departmentPage =
    `admin-${user.department
      ?.toLowerCase()
      .replace(/\s+/g, "-")}`;

  window.history.pushState(
    {},
    "",
    `/admin/${user.department
      ?.toLowerCase()
      .replace(/\s+/g, "-")}`
  );

  setPage(departmentPage);
}
        }}
        onStudentLogin={() => {
          window.history.pushState({}, "", "/login");

          setPage("login");
        }}
      />
    );
  }

  /* =========================================================
     SUPER ADMIN SHELL
  ========================================================= */

  if (isSuperAdmin) {
    return (
      <AdminShell
        page={page}
        navigate={navigate}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        handleLogout={handleLogout}
        toast={toast}
        serverNotifications={serverNotifications}
        markNotificationRead={markNotificationRead}
        title="Super Admin"
        user={currentUser}
        navItems={[
          {
            label: "Control Center",
            icon: <LayoutDashboard size={18} />,
            page: "super-admin-dashboard",
          },
          {
            label: "Department Admins",
            icon: <Users size={18} />,
            page: "super-department-admins",
          },
          {
            label: "Students",
            icon: <Users size={18} />,
            page: "super-students",
          },
          {
            label: "Academics",
            icon: <BookOpen size={18} />,
            page: "super-academics",
          },
          {
            label: "Hostel",
            icon: <Building2 size={18} />,
            page: "super-hostel",
          },
          {
            label: "Security",
            icon: <Shield size={18} />,
            page: "super-security",
          },
          {
            label: "Accounts",
            icon: <CreditCard size={18} />,
            page: "super-accounts",
          },
          {
            label: "Maintenance",
            icon: <Wrench size={18} />,
            page: "super-maintenance",
          },
          {
            label: "Teaching Faculty",
            icon: <GraduationCap size={18} />,
            page: "super-teaching",
          },
          {
            label: "Documents",
            icon: <FolderOpen size={18} />,
            page: "super-documents",
          },
          {
            label: "Notices & Announcements",
            icon: <MegaphoneIcon />,
            page: "super-notices",
          },
          {
            label: "Recurring Issues",
            icon: <AlertTriangle size={18} />,
            page: "super-recurring",
          },
          {
            label: "System Settings",
            icon: <Settings2 size={18} />,
            page: "super-settings",
          },
        ]}
      >
        {renderSuperAdminPage()}
      </AdminShell>
    );
  }

  /* =========================================================
     DEPARTMENT ADMIN SHELL
  ========================================================= */

  if (isAdmin) {
    const department =
      currentUser.department || "Academics";

    const departmentPageMap = {
      Academics: "admin-academics",
      Hostel: "admin-hostel",
      Security: "admin-security",
      Accounts: "admin-accounts",
      Maintenance: "admin-maintenance",
      "Teaching Faculty": "admin-teaching",
      Documentation: "admin-documents",
    };

  const ownPage =
  departmentPageMap[department] ||
  "admin-dashboard";

const adminSidebarItems = {
  Academics: [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      page: "admin-academics",
    },
    {
      label: "Timetable",
      icon: "📅",
      page: "admin-academics-timetable",
    },
    {
      label: "Assignments",
      icon: "📝",
      page: "admin-academics-assignments",
    },
    {
      label: "Study Materials",
      icon: "📚",
      page: "admin-academics-materials",
    },
    {
      label: "Results",
      icon: "🎓",
      page: "admin-academics-results",
    },
    {
      label: "Academic Alerts",
      icon: "🔔",
      page: "admin-academics-alerts",
    },
    {
      label: "Notices",
      icon: "📢",
      page: "admin-academics-notices",
    },
  ],

  Hostel: [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      page: "admin-hostel",
    },
    {
      label: "Rooms & Allotment",
      icon: "🛏️",
      page: "admin-hostel-rooms",
    },
    {
      label: "Complaints",
      icon: "🛠️",
      page: "admin-hostel-complaints",
    },
    {
      label: "Mess Management",
      icon: "🍽️",
      page: "admin-hostel-mess",
    },
    {
      label: "Gate Pass",
      icon: "🎫",
      page: "admin-hostel-gatepass",
    },
    {
      label: "Emergency Gate Pass",
      icon: "🚨",
      page: "admin-hostel-emergency",
    },
    {
      label: "Hostel Notices",
      icon: "📢",
     page: "admin-hostel-notices",
    },
  ],

  Security: [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      page: "admin-security",
    },
    {
      label: "Emergency Center",
      icon: "🚨",
      page: "admin-security-emergency",
    },
    {
      label: "Security SOS",
      icon: "🛡️",
      page: "admin-security-sos",
    },
    {
      label: "Healthcare SOS",
      icon: "🏥",
      page: "admin-security-healthcare",
    },
    {
      label: "Emergency Gate Pass",
      icon: "🎫",
      page: "admin-security-gatepass",
    },
    {
      label: "Security Incidents",
      icon: "⚠️",
      page: "admin-security-incidents",
    },
    {
      label: "Safety Alerts",
      icon: "🔔",
      page: "admin-security-alerts",
    },
  ],

  Accounts: [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      page: "admin-accounts",
    },
    {
      label: "Student Fees",
      icon: "💳",
      page: "admin-accounts-fees",
    },
    {
      label: "Pending Dues",
      icon: "💰",
      page: "admin-accounts-dues",
    },
    {
      label: "Payment Requests",
      icon: "📥",
      page: "admin-accounts-payments",
    },
    {
      label: "Receipts",
      icon: "🧾",
      page: "admin-accounts-receipts",
    },
    {
      label: "Refund Requests",
      icon: "🔄",
      page: "admin-accounts-refunds",
    },
    {
      label: "Financial Reports",
      icon: "📊",
      page: "admin-accounts-reports",
    },
  ],

  Maintenance: [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      page: "admin-maintenance",
    },
    {
      label: "Complaints",
      icon: "🛠️",
      page: "admin-maintenance-complaints",
    },
    {
      label: "Categories",
      icon: "📂",
      page: "admin-maintenance-categories",
    },
    {
      label: "Technicians",
      icon: "👷",
      page: "admin-maintenance-technicians",
    },
    {
      label: "Assignments",
      icon: "📋",
      page: "admin-maintenance-assignments",
    },
    {
      label: "Recurring Issues",
      icon: "🔄",
      page: "admin-maintenance-recurring",
    },
    {
      label: "Resolution Reports",
      icon: "📊",
      page: "admin-maintenance-reports",
    },
  ],

  "Teaching Faculty": [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      page: "admin-teaching",
    },
    {
      label: "Student Directory",
      icon: "👨‍🎓",
      page: "admin-teaching-students",
    },
    {
      label: "Attendance",
      icon: "📋",
      page: "admin-teaching-attendance",
    },
    {
      label: "Attendance Reports",
      icon: "📊",
      page: "admin-teaching-reports",
    },
    {
      label: "Low Attendance",
      icon: "⚠️",
      page: "admin-teaching-low-attendance",
    },
    {
      label: "Faculty Schedule",
      icon: "📅",
      page: "admin-teaching-schedule",
    },
    {
      label: "Attendance Corrections",
      icon: "✏️",
      page: "admin-teaching-corrections",
    },
  ],

  Documentation: [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      page: "admin-documents",
    },
    {
      label: "Applications",
      icon: "📝",
      page: "admin-documents-applications",
    },
    {
      label: "Certificate Requests",
      icon: "📜",
      page: "admin-documents-certificates",
    },
    {
      label: "Document Verification",
      icon: "✅",
      page: "admin-documents-verification",
    },
    {
     label: "Notices & Announcements",
icon: "📢",
page: "admin-academics-notices",
    },
    {
      label: "Branch Notices",
      icon: "🏢",
      page: "admin-documents-branch-notices",
    },
    {
      label: "Semester Notices",
      icon: "🎓",
      page: "admin-documents-semester-notices",
    },
  ],
};

const currentAdminNav =
  adminSidebarItems[department] ||
  adminSidebarItems.Academics;

return (
      <AdminShell
        page={page}
        navigate={navigate}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        handleLogout={handleLogout}
        toast={toast}
        serverNotifications={serverNotifications}
        markNotificationRead={markNotificationRead}
        title={`${department} Admin`}
        user={currentUser}
navItems={currentAdminNav}
      >
        {renderAdminPage()}
      </AdminShell>
    );
  }

  /* =========================================================
     STUDENT SHELL
  ========================================================= */

  return (
    <StudentShell
      page={page}
      navigate={navigate}
      openSection={openSection}
      toggleSection={toggleSection}
      openMaterials={openMaterials}
      setOpenMaterials={setOpenMaterials}
      profileOpen={profileOpen}
      setProfileOpen={setProfileOpen}
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
      handleLogout={handleLogout}
      toast={toast}
      serverNotifications={serverNotifications}
      markNotificationRead={markNotificationRead}
      user={currentUser}
      onCampyWake={() => campyWakeRef.current?.()}
    >
      {renderStudentPage()}
    </StudentShell>
  );
}

/* =========================================================
   ADMIN SHELL
========================================================= */

function AdminShell({
  children,
  page,
  navigate,
  profileOpen,
  setProfileOpen,
  mobileOpen,
  setMobileOpen,
  handleLogout,
  toast,
  serverNotifications,
  markNotificationRead,
  navItems,
  title,
  user,
}) {
  const { t } = useLanguage();
  const displayName = user?.name || title || "EKAM User";

  return (
    <div className="ekam-app">
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`ekam-sidebar ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        <div className="brand-row">
          <div className="brand-mark">E</div>

          <div>
            <strong>EKAM</strong>
            <span>{t("One campus. One platform.")}</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav>
          {navItems.map((item) => (
            <NavItem
              key={item.page}
              icon={item.icon}
              label={t(item.label)}
              active={page === item.page}
              onClick={() => navigate(item.page)}
            />
          ))}
        </nav>
      </aside>

      <main className="ekam-main">
        <header className="ekam-topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="top-search">
            <Search size={17} />
            <input placeholder={t("Search EKAM...")} />
          </div>

          <div className="top-actions">
            <NotificationInbox
              notifications={serverNotifications}
              onRead={markNotificationRead}
            />

            <div className="profile-wrap">
              <button
                className="profile-button"
                onClick={() =>
                  setProfileOpen(!profileOpen)
                }
              >
                <div className="avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>

                <div>
                  <strong>{displayName}</strong>
                  <span>{t(title)}</span>
                </div>

                <ChevronDown size={16} />
              </button>

              {profileOpen && (
                <div className="profile-menu">
                  <button
                    onClick={() => navigate("profile")}
                  >
                    <UserCircle size={17} />
                    {t("Profile")}
                  </button>

                  <button
                    onClick={() => navigate("settings")}
                  >
                    <Settings size={17} />
                    {t("Settings")}
                  </button>

                  <button onClick={handleLogout}>
                    <LogOut size={17} />
                    {t("Logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="ekam-content">
          {children}
        </section>

        <button
          className="ekam-floating-ai"
          onClick={() => navigate("campy")}
          title="Open CAMPY"
        >
          <Bot size={21} />
          <span>CAMPY</span>
        </button>
      </main>

      {toast && (
        <div className="ekam-toast">
          {toast}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STUDENT SHELL
========================================================= */

function StudentShell({
  children,
  page,
  navigate,
  openSection,
  toggleSection,
  openMaterials,
  setOpenMaterials,
  profileOpen,
  setProfileOpen,
  mobileOpen,
  setMobileOpen,
  handleLogout,
  toast,
  serverNotifications,
  markNotificationRead,
  user,
  onCampyWake,
}) {
  const { t } = useLanguage();
  const displayName = user?.name || "Student";

  return (
    <div className="ekam-app">
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`ekam-sidebar ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        <div className="brand-row">
          <div className="brand-mark">E</div>

          <div>
            <strong>EKAM</strong>
            <span>{t("One campus. One platform.")}</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav>
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={page === "dashboard"}
            onClick={() => navigate("dashboard")}
          />

          <Section
            title="Academics"
            icon={<BookOpen size={18} />}
            open={openSection === "academics"}
            onClick={() => toggleSection("academics")}
          >
            <NavChild
              icon={<ClipboardCheck size={15} />}
              label="Attendance"
              active={page === "attendance"}
              onClick={() => navigate("attendance")}
            />

            <NavChild
              icon={<CalendarDays size={15} />}
              label="Timetable"
              active={page === "timetable"}
              onClick={() => navigate("timetable")}
            />

            <NavChild
              icon={<FileText size={15} />}
              label="Assignments"
              active={page === "assignments"}
              onClick={() => navigate("assignments")}
            />

            <div
              className="nested-label"
              onClick={() =>
                setOpenMaterials(!openMaterials)
              }
            >
              <span>
                <BookOpen size={15} />
                Study Materials & PYQs
              </span>

              {openMaterials ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </div>

            {openMaterials && (
              <div className="nested-list">
                {Array.from(
                  { length: 8 },
                  (_, index) => {
                    const semester = index + 1;

                    let suffix = "th";

                    if (semester === 1)
                      suffix = "st";
                    if (semester === 2)
                      suffix = "nd";
                    if (semester === 3)
                      suffix = "rd";

                    return (
                      <NavChild
                        key={semester}
                        label={`${semester}${suffix} Semester`}
                        active={
                          page ===
                          `materials-${semester}`
                        }
                        onClick={() =>
                          navigate(
                            `materials-${semester}`
                          )
                        }
                      />
                    );
                  }
                )}
              </div>
            )}

            <NavChild
              icon={<Trophy size={15} />}
              label="Results"
              active={page === "results"}
              onClick={() => navigate("results")}
            />
          </Section>

          <Section
            title="Notices & Announcements"
            icon={<Megaphone size={18} />}
            open={openSection === "notices"}
            onClick={() => toggleSection("notices")}
          >
            <NavChild
              icon={<Bell size={15} />}
              label="Notices"
              active={page === "notices"}
              onClick={() => navigate("notices")}
            />

            <NavChild
              icon={<CalendarDays size={15} />}
              label="Events"
              active={page === "events"}
              onClick={() => navigate("events")}
            />

            <NavChild
              icon={<Megaphone size={15} />}
              label="Campus Updates"
              active={page === "campus-updates"}
              onClick={() =>
                navigate("campus-updates")
              }
            />
          </Section>

          {user?.isHosteller === true && (
          <Section
            title="Hostel"
            icon={<Building2 size={18} />}
            open={openSection === "hostel"}
            onClick={() => toggleSection("hostel")}
          >
            <NavChild
              icon={<Home size={15} />}
              label="Hostel Dashboard"
              active={page === "hostel-dashboard"}
              onClick={() =>
                navigate("hostel-dashboard")
              }
            />

            <NavChild
              icon={<MessageSquare size={15} />}
              label="Complaints & Tracking"
              active={page === "hostel-complaints"}
              onClick={() =>
                navigate("hostel-complaints")
              }
            />

            <NavChild
              icon={<BedDouble size={15} />}
              label="Room Details"
              active={page === "room-details"}
              onClick={() =>
                navigate("room-details")
              }
            />
          </Section>
          )}

          {user?.isHosteller === true && (
          <Section
            title="Mess"
            icon={<Utensils size={18} />}
            open={openSection === "mess"}
            onClick={() => toggleSection("mess")}
          >
            <NavChild
              label="Today's Menu"
              active={page === "today-menu"}
              onClick={() =>
                navigate("today-menu")
              }
            />

            <NavChild
              label="Weekly Menu"
              active={page === "weekly-menu"}
              onClick={() =>
                navigate("weekly-menu")
              }
            />

            <NavChild
              icon={<MessageSquare size={15} />}
              label="Feedback & Ratings"
              active={page === "mess-feedback"}
              onClick={() =>
                navigate("mess-feedback")
              }
            />
          </Section>
          )}

          <Section
            title="Services"
            icon={<QrCode size={18} />}
            open={openSection === "services"}
            onClick={() => toggleSection("services")}
          >
            <NavChild
              icon={<QrCode size={15} />}
              label="QR Gate Pass"
              active={page === "gate-pass"}
              onClick={() => navigate("gate-pass")}
            />

            <NavChild
              icon={<FileCheck size={15} />}
              label="Applications"
              active={page === "applications"}
              onClick={() =>
                navigate("applications")
              }
            />

            <NavChild
              icon={<Receipt size={15} />}
              label="Certificate Requests"
              active={page === "certificates"}
              onClick={() =>
                navigate("certificates")
              }
            />

            <NavChild
              icon={<CreditCard size={15} />}
              label="Fee Status"
              active={page === "fee-status"}
              onClick={() =>
                navigate("fee-status")
              }
            />
          </Section>

          <Section
            title="Safety"
            icon={<Shield size={18} />}
            open={openSection === "safety"}
            onClick={() => toggleSection("safety")}
          >
            <NavChild
              icon={<Shield size={15} />}
              label="Emergency SOS"
              active={page === "emergency-sos"}
              onClick={() =>
                navigate("emergency-sos")
              }
            />

            <NavChild
              icon={<HeartPulse size={15} />}
              label="Healthcare SOS"
              active={page === "healthcare-sos"}
              onClick={() =>
                navigate("healthcare-sos")
              }
            />
          </Section>

          <Section
            title="AI"
            icon={<Bot size={18} />}
            open={openSection === "ai"}
            onClick={() => toggleSection("ai")}
          >
            <NavChild
              icon={<Mic size={15} />}
              label="Voice & Smart Helpdesk"
              active={page === "voice-helpdesk"}
              onClick={() =>
                navigate("voice-helpdesk")
              }
            />

            <NavChild
              icon={<HelpCircle size={15} />}
              label="FAQ Chatbot"
              active={page === "faq"}
              onClick={() => navigate("faq")}
            />
          </Section>
        </nav>
      </aside>

      <main className="ekam-main">
        <header className="ekam-topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="top-search">
            <Search size={17} />
            <input placeholder={t("Search EKAM...")} />
          </div>

          <div className="top-actions">
            <NotificationInbox
              notifications={serverNotifications}
              onRead={markNotificationRead}
            />

            <div className="profile-wrap">
              <button
                className="profile-button"
                onClick={() =>
                  setProfileOpen(!profileOpen)
                }
              >
                <div className="avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>

                <div>
                  <strong>{displayName}</strong>
                  <span>{t("Student")}</span>
                </div>

                <ChevronDown size={16} />
              </button>

              {profileOpen && (
                <div className="profile-menu">
                  <button
                    onClick={() => navigate("profile")}
                  >
                    <UserCircle size={17} />
                    {t("Profile")}
                  </button>

                  <button
                    onClick={() => navigate("settings")}
                  >
                    <Settings size={17} />
                    {t("Settings")}
                  </button>

                  <button onClick={handleLogout}>
                    <LogOut size={17} />
                    {t("Logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="ekam-content">
          {children}
        </section>

        <button
          className="ekam-floating-ai"
          onClick={() => {
            if (page === "dashboard" && onCampyWake) {
              onCampyWake();
              return;
            }
            navigate("voice-helpdesk");
          }}
          title="Talk to CAMPY"
        >
          <Mic size={21} />
          <span>CAMPY</span>
        </button>
      </main>

      {toast && (
        <div className="ekam-toast">
          {toast}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Section({
  title,
  icon,
  open,
  onClick,
  children,
}) {
  const { t } = useLanguage();
  return (
    <div className="nav-section">
      <button
        className="nav-section-title"
        onClick={onClick}
      >
        <span>
          {icon}
          {t(title)}
        </span>

        {open ? (
          <ChevronDown size={15} />
        ) : (
          <ChevronRight size={15} />
        )}
      </button>

      {open && (
        <div className="nav-children">
          {children}
        </div>
      )}
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}) {
  const { t } = useLanguage();
  return (
    <button
      className={`nav-item ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{t(label)}</span>
    </button>
  );
}

function NavChild({
  icon,
  label,
  active,
  onClick,
}) {
  const { t } = useLanguage();
  return (
    <button
      className={`nav-child ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      {icon || <span className="child-bullet" />}
      <span>{t(label)}</span>
    </button>
  );
}

function NotificationInbox({ notifications, onRead }) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(
    (notification) => !notification.readAt
  ).length;

  return (
    <div className="notification-wrap">
      <button
        className="icon-btn"
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="notification-popover">
          <div className="notification-popover-header">
            <strong>Notifications</strong>
            <span>{unreadCount} unread</span>
          </div>
          {notifications.length === 0 ? (
            <p className="notification-empty">No campus notifications yet.</p>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <button
                  className={`notification-item ${
                    notification.readAt ? "read" : "unread"
                  }`}
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (!notification.readAt) onRead(notification.id);
                  }}
                >
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <small>
                    {notification.createdAt
                      ? new Date(notification.createdAt).toLocaleString()
                      : ""}
                    {notification.readAt ? "" : " · Mark read"}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   ADMIN MODULE PAGE
========================================================= */

function AdminModulePage({
  title,
  subtitle,
  icon,
  cards,
}) {
  return (
    <div className="admin-module-page">
      <div className="admin-page-header">
        <div className="admin-page-icon">
          {icon}
        </div>

        <div>
          <p className="admin-eyebrow">
            DEPARTMENT ADMIN
          </p>

          <h1>{title}</h1>

          <p>{subtitle}</p>
        </div>
      </div>

      <div className="admin-module-grid">
        {cards.map(([name, description]) => (
          <button
            key={name}
            className="admin-module-card"
            onClick={() =>
              alert(`${name} module opened.`)
            }
          >
            <strong>{name}</strong>
            <span>{description}</span>
            <b>Open →</b>
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   SUPER ADMIN MODULE PAGE
========================================================= */

function SuperModulePage({
  title,
  subtitle,
  icon,
  items = [],
}) {
  const { t } = useLanguage();
  const [overview, setOverview] = useState(null);

  const graphData = {
    "Academics Overview": [8, 12, 9, 15, 18, 14, 22],
    "Hostel Overview": [12, 18, 14, 21, 26, 23, 29],
    "Security Overview": [4, 7, 5, 9, 6, 11, 8],
    "Accounts Overview": [18, 22, 19, 27, 31, 28, 35],
    "Maintenance Overview": [14, 19, 17, 25, 21, 30, 27],
    "Teaching Faculty Overview": [20, 25, 22, 29, 31, 28, 34],
    "Documents Overview": [9, 13, 11, 18, 16, 22, 20],
    "Notices & Announcements": [5, 8, 12, 10, 15, 18, 21],
    "Recurring Issues": [3, 5, 4, 8, 7, 11, 9],
    "System Settings": [4, 4, 5, 5, 6, 6, 7],
    "Department Admins": [4, 5, 5, 6, 6, 7, 7],
  };

  const values =
    graphData[title] || [8, 12, 10, 15, 13, 18, 20];

  const maxValue = Math.max(...values);

  const points = values
    .map((value, index) => {
      const x = 20 + index * 43;
      const y = 150 - (value / maxValue) * 120;
      return `${x},${y}`;
    })
    .join(" ");

  const openOverview = (name, description) => {
    setOverview({
      name,
      description,
    });
  };

  if (overview) {
    return (
      <div className="super-module-page">

        <button
          className="super-detail-back"
          onClick={() => setOverview(null)}
        >
          ← Back to {title}
        </button>

        <div className="super-module-header">

          <div className="super-module-heading">

            <div className="super-module-icon">
              {icon}
            </div>

            <div>
              <p className="super-module-eyebrow">
                SUPER ADMIN
              </p>

              <h1>{overview.name}</h1>

              <p>{overview.description}</p>
            </div>

          </div>

          <div className="super-module-status">
            <span />
            Campus Operational
          </div>

        </div>


        <div className="super-detail-grid">

          <div className="super-detail-panel">

            <div className="super-detail-panel-header">
              <div>
                <h2>{overview.name}</h2>
                <p>
                  Current campus activity and operational
                  information.
                </p>
              </div>
            </div>

            <div className="super-detail-list">

              <div className="super-detail-list-row">
                <div>
                  <strong>Pending Requests</strong>
                  <span>Requests waiting for action</span>
                </div>
                <b>12</b>
              </div>

              <div className="super-detail-list-row">
                <div>
                  <strong>Active Records</strong>
                  <span>Currently active records</span>
                </div>
                <b>24</b>
              </div>

              <div className="super-detail-list-row">
                <div>
                  <strong>Completed</strong>
                  <span>Completed this month</span>
                </div>
                <b>86</b>
              </div>

              <div className="super-detail-list-row">
                <div>
                  <strong>Needs Attention</strong>
                  <span>Items requiring review</span>
                </div>
                <b className="super-warning-number">
                  4
                </b>
              </div>

            </div>

          </div>


          <div className="super-detail-panel">

            <div className="super-detail-panel-header">
              <div>
                <h2>Quick Actions</h2>
                <p>
                  Frequently used management actions.
                </p>
              </div>
            </div>

            <div className="super-detail-actions">

              <button
                onClick={() =>
                  openOverview(
                    `${overview.name} — Pending`,
                    "Review pending requests."
                  )
                }
              >
                📋
                <span>Review Pending Requests</span>
                →
              </button>

              <button
                onClick={() =>
                  openOverview(
                    `${overview.name} — Active`,
                    "View active campus records."
                  )
                }
              >
                📊
                <span>View Active Records</span>
                →
              </button>

              <button
                onClick={() =>
                  openOverview(
                    `${overview.name} — Reports`,
                    "Review operational reports."
                  )
                }
              >
                📈
                <span>View Reports</span>
                →
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }


  return (
    <div className="super-module-page">

      {/* HEADER */}

      <div className="super-module-header">

        <div className="super-module-heading">

          <div className="super-module-icon">
            {icon}
          </div>

          <div>
            <p className="super-module-eyebrow">
              SUPER ADMIN
            </p>

            <h1>{t(title)}</h1>

            <p>{t(subtitle)}</p>
          </div>

        </div>

        <div className="super-module-status">
          <span />
          {t("Campus Operational")}
        </div>

      </div>


      {/* STAT CARDS */}

      <div className="super-module-stats">

        <div className="super-stat-card">
          <span>{t("Pending")}</span>
          <strong>12</strong>
          <small>{t("Needs attention")}</small>
        </div>

        <div className="super-stat-card">
          <span>{t("Active")}</span>
          <strong>24</strong>
          <small>{t("Currently active")}</small>
        </div>

        <div className="super-stat-card">
          <span>{t("Completed")}</span>
          <strong>86</strong>
          <small>{t("This month")}</small>
        </div>

        <div className="super-stat-card">
          <span>{t("Alerts")}</span>
          <strong>4</strong>
          <small>{t("Requires review")}</small>
        </div>

      </div>


      {/* GRAPH */}

      <div className="super-overview-grid">

        <div className="super-module-panel">

          <div className="super-module-panel-header">

            <div>
              <h2>{t("Campus Activity")}</h2>

              <p>
                {t("Activity trend over the last 7 days.")}
              </p>
            </div>

            <span className="super-chart-label">
              {t("Last 7 Days")}
            </span>

          </div>

          <div className="super-chart">

            <div className="super-chart-y">
              <span>{maxValue}</span>
              <span>{Math.round(maxValue * 0.75)}</span>
              <span>{Math.round(maxValue * 0.5)}</span>
              <span>{Math.round(maxValue * 0.25)}</span>
              <span>0</span>
            </div>

            <svg
              viewBox="0 0 280 170"
              preserveAspectRatio="none"
            >

              <line
                x1="20"
                y1="30"
                x2="280"
                y2="30"
                className="chart-grid"
              />

              <line
                x1="20"
                y1="70"
                x2="280"
                y2="70"
                className="chart-grid"
              />

              <line
                x1="20"
                y1="110"
                x2="280"
                y2="110"
                className="chart-grid"
              />

              <line
                x1="20"
                y1="150"
                x2="280"
                y2="150"
                className="chart-grid"
              />

              <polyline
                points={points}
                fill="none"
                className="chart-line"
              />

              {values.map((value, index) => {

                const x = 20 + index * 43;
                const y =
                  150 -
                  (value / maxValue) * 120;

                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4"
                    className="chart-point"
                  />
                );
              })}

            </svg>

          </div>

          <div className="super-chart-days">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

        </div>


        {/* QUICK OVERVIEW */}

        <div className="super-module-panel">

          <div className="super-module-panel-header">

            <div>
              <h2>{t("Quick Overview")}</h2>

              <p>
                {t("Important campus information.")}
              </p>
            </div>

          </div>

          <div className="super-quick-overview">

            {items.slice(0, 6).map(
              (item, index) => (

                <button
                  key={item}
                  className="super-overview-item"
                  onClick={() =>
                    openOverview(
                      item,
                      `Manage ${item.toLowerCase()}.`
                    )
                  }
                >

                  <div className="super-overview-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div>
                    <strong>{t(item)}</strong>
                    <span>
                      {t("View operational details")}
                    </span>
                  </div>

                  <b>→</b>

                </button>

              )
            )}

          </div>

        </div>

      </div>


      {/* OPERATIONS */}

      <div className="super-module-panel super-operations-panel">

        <div className="super-module-panel-header">

          <div>
            <h2>{t(title)} {t("Operations")}</h2>

            <p>
              {t("Campus-wide operational activity.")}
            </p>
          </div>

          <button
            className="super-module-view-button"
            onClick={() =>
              openOverview(
                `${title} — Full Overview`,
                subtitle
              )
            }
          >
            {t("View all")} →
          </button>

        </div>


        <div className="super-module-table">

          {items.map((item, index) => (

            <div
              className="super-module-row"
              key={item}
            >

              <div className="super-row-main">

                <strong>{t(item)}</strong>

                <span>
                  {index % 2 === 0
                    ? t("Active campus operation")
                    : t("Requires monitoring")}
                </span>

              </div>

              <span
                className={`super-status ${
                  index % 3 === 0
                    ? "medium"
                    : "normal"
                }`}
              >
                {index % 3 === 0
                  ? t("Review")
                  : t("Active")}
              </span>

              <button
                className="super-row-action"
                onClick={() =>
                  openOverview(
                    item,
                    `Manage ${item.toLowerCase()}.`
                  )
                }
              >
                →
              </button>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}
function MegaphoneIcon() {
  return <Megaphone size={18} />;
}