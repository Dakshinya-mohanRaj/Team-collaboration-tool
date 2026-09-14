/**
 * data.js
 * -------
 * Default seed data used on first launch.
 * Safe to modify — values are only written when localStorage is empty.
 */
(function () {
  "use strict";

  const DemoData = {
    users() {
      return [
        {
          id: "user_001",
          name: "Dakshinya",
          email: "dakshinya@example.com",
          password: "demo123",
          phone: "9876543210",
          role: "Project Manager",
          department: "Development",
          bio: "Leading product engineering teams with a focus on clean code and great UX.",
        },
        {
          id: "user_002",
          name: "Arun",
          email: "arun@example.com",
          password: "demo123",
          phone: "9876543211",
          role: "Developer",
          department: "Development",
          bio: "Full-stack developer, passionate about APIs and clean architecture.",
        },
        {
          id: "user_003",
          name: "Priya",
          email: "priya@example.com",
          password: "demo123",
          phone: "9876543212",
          role: "UI/UX Designer",
          department: "Design",
          bio: "Designing interfaces that are both beautiful and accessible.",
        },
        {
          id: "user_004",
          name: "Karthik",
          email: "karthik@example.com",
          password: "demo123",
          phone: "9876543213",
          role: "Developer",
          department: "Development",
          bio: "Backend enthusiast. Loves databases and system design.",
        },
        {
          id: "user_005",
          name: "Meena",
          email: "meena@example.com",
          password: "demo123",
          phone: "9876543214",
          role: "Tester",
          department: "Quality Assurance",
          bio: "Breaking things so the team can build better software.",
        },
        {
          id: "user_006",
          name: "Rahul",
          email: "rahul@example.com",
          password: "demo123",
          phone: "9876543215",
          role: "Team Member",
          department: "Operations",
          bio: "Supporting the team with research, documentation and coordination.",
        },
      ];
    },

    projects() {
      const today = new Date();
      const iso = (offsetDays) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().slice(0, 10);
      };

      return [
        {
          id: "project_001",
          name: "Hospital Management System",
          description:
            "Complete hospital management web application covering patients, appointments, billing and reports.",
          managerId: "user_001",
          memberIds: ["user_001", "user_002", "user_003", "user_005"],
          startDate: iso(-30),
          deadline: iso(30),
          createdAt: iso(-30),
        },
        {
          id: "project_002",
          name: "E-Commerce Website",
          description:
            "Online store with product catalog, cart, checkout and order tracking.",
          managerId: "user_002",
          memberIds: ["user_001", "user_002", "user_004", "user_006"],
          startDate: iso(-20),
          deadline: iso(20),
          createdAt: iso(-20),
        },
        {
          id: "project_003",
          name: "College Event Portal",
          description:
            "Portal for managing college events, registrations, schedules and announcements.",
          managerId: "user_001",
          memberIds: ["user_001", "user_003", "user_005", "user_006"],
          startDate: iso(-12),
          deadline: iso(38),
          createdAt: iso(-12),
        },
        {
          id: "project_004",
          name: "Mobile Application",
          description:
            "Cross-platform mobile app companion for the hospital management platform.",
          managerId: "user_004",
          memberIds: ["user_002", "user_003", "user_004", "user_005"],
          startDate: iso(-5),
          deadline: iso(48),
          createdAt: iso(-5),
        },
      ];
    },

    tasks() {
      const today = new Date();
      const iso = (offsetDays) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().slice(0, 10);
      };
      const n = (s) => s.toLowerCase().replace(/\s+/g, "-");

      const seed = [
        // Project 1 — Hospital Management System
        { pr: "project_001", title: "Login Page", desc: "Implement responsive login with validation.", u: "user_003", p: "High", s: "Completed", start: -28, due: -22 },
        { pr: "project_001", title: "Patient Registration", desc: "Form and flow to register new patients.", u: "user_002", p: "High", s: "Completed", start: -26, due: -15 },
        { pr: "project_001", title: "Appointment Booking", desc: "Schedule appointments with doctors.", u: "user_004", p: "High", s: "In Progress", start: -14, due: 6 },
        { pr: "project_001", title: "Billing Module", desc: "Generate invoices and payment receipts.", u: "user_002", p: "Medium", s: "In Progress", start: -10, due: 10 },
        { pr: "project_001", title: "Patient Dashboard", desc: "Personal dashboard for patients.", u: "user_005", p: "Medium", s: "Review", start: -8, due: 5 },
        { pr: "project_001", title: "Reports Module", desc: "Department-wise and doctor-wise reports.", u: "user_001", p: "Critical", s: "To Do", start: 0, due: 18 },
        { pr: "project_001", title: "Doctor Scheduler", desc: "Week view scheduler for doctors.", u: "user_004", p: "Low", s: "To Do", start: 2, due: 16 },

        // Project 2 — E-Commerce Website
        { pr: "project_002", title: "Product Catalog", desc: "Grid listing with filters and sort.", u: "user_002", p: "High", s: "Completed", start: -18, due: -6 },
        { pr: "project_002", title: "Shopping Cart", desc: "Add, remove and update cart items.", u: "user_004", p: "High", s: "Completed", start: -15, due: -2 },
        { pr: "project_002", title: "Checkout Flow", desc: "Address, payment and order summary.", u: "user_002", p: "Critical", s: "In Progress", start: -6, due: 8 },
        { pr: "project_002", title: "Order Tracking", desc: "Track order status after purchase.", u: "user_006", p: "Medium", s: "In Progress", start: -4, due: 12 },
        { pr: "project_002", title: "Payment Gateway", desc: "Integrate payment provider sandbox.", u: "user_004", p: "Critical", s: "To Do", start: 1, due: 20 },
        { pr: "project_002", title: "Admin Analytics", desc: "Sales and traffic analytics page.", u: "user_001", p: "Low", s: "To Do", start: 3, due: 25 },

        // Project 3 — College Event Portal
        { pr: "project_003", title: "Event Listings", desc: "Public page listing upcoming events.", u: "user_003", p: "High", s: "Completed", start: -11, due: -4 },
        { pr: "project_003", title: "Registration Form", desc: "Sign up for events with details.", u: "user_005", p: "High", s: "In Progress", start: -6, due: 4 },
        { pr: "project_003", title: "Event Dashboard", desc: "Admin panel to manage events.", u: "user_001", p: "Medium", s: "In Progress", start: -3, due: 14 },
        { pr: "project_003", title: "Schedule Builder", desc: "Drag-drop schedule of sessions.", u: "user_003", p: "Medium", s: "Review", start: -2, due: 9 },
        { pr: "project_003", title: "Announcements", desc: "Real-time announcement board.", u: "user_006", p: "Low", s: "To Do", start: 2, due: 20 },

        // Project 4 — Mobile Application
        { pr: "project_004", title: "App Navigation Shell", desc: "Bottom tab navigation and screens.", u: "user_003", p: "High", s: "Completed", start: -4, due: 0 },
        { pr: "project_004", title: "Offline Data Sync", desc: "Cache data and sync when online.", u: "user_004", p: "Critical", s: "In Progress", start: -2, due: 15 },
        { pr: "project_004", title: "Push Notifications", desc: "Notify patients about appointments.", u: "user_002", p: "High", s: "To Do", start: 0, due: 18 },
        { pr: "project_004", title: "Biometric Login", desc: "Face / fingerprint authentication.", u: "user_004", p: "Medium", s: "To Do", start: 1, due: 22 },
        { pr: "project_004", title: "App Feedback", desc: "Collect ratings and feedback.", u: "user_005", p: "Low", s: "To Do", start: 2, due: 26 },
      ];

      return seed.map((t, i) => ({
        id: "task_" + String(i + 1).padStart(3, "0"),
        title: t.title,
        description: t.desc,
        projectId: t.pr,
        assignedTo: t.u,
        priority: t.p,
        status: t.s,
        startDate: iso(t.start),
        dueDate: iso(t.due),
        createdAt: iso(t.start),
      }));
    },

    notifications() {
      const today = new Date();
      const ago = (offsetHours) => {
        const d = new Date(today);
        d.setHours(d.getHours() - offsetHours);
        return d.toISOString();
      };
      return [
        {
          id: "ntf_001",
          message: "Dakshinya completed Billing Module",
          type: "task",
          read: true,
          createdAt: ago(2),
        },
        {
          id: "ntf_002",
          message: "Arun created a new task (Payment Gateway)",
          type: "task",
          read: false,
          createdAt: ago(5),
        },
        {
          id: "ntf_003",
          message: "Priya moved Patient Dashboard to Review",
          type: "task",
          read: false,
          createdAt: ago(9),
        },
        {
          id: "ntf_004",
          message: "Appointment Booking is due in 2 days",
          type: "deadline",
          read: false,
          createdAt: ago(14),
        },
      ];
    },

    settings() {
      return {
        theme: "light",
        layout: "comfortable",
        notifications: true,
      };
    },
  };

  window.DemoData = DemoData;
})();