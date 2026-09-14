# TASKFLOW — Team Collaboration & Task Management

A complete team project management web application built as a **frontend-only** college mini project for **DAKSHINYA**.

TASKFLOW helps a small team manage projects, tasks, team members, deadlines, task priorities, statuses and overall project progress — with a modern, Trello/Asana-inspired interface.

> **Important:** This is a frontend-only application. **Browser `localStorage` is used as the local data store instead of a backend database.** No data ever leaves your browser, and the app works fully offline.

---

## Features

- 🔐 Welcome / login screen (simulated auth, demo user + password)
- 📊 Dynamic dashboard with live statistics
  - Total projects, total tasks, completed, in progress, overdue
  - Project progress bars, recent tasks, upcoming deadlines, team activity
- ✅ Full task management (create, edit, delete, view)
  - Search + multi-filter (status, priority, project, member, due date)
- 🗂️ Project management (create, edit, delete, view)
  - Progress auto-calculated from completed / total tasks
- 🎴 Kanban board with native HTML5 drag & drop
- 👥 Team management with member cards, stats and detail profiles
- 📅 Vanilla-JS calendar with deadline highlighting (today, due, overdue)
- 🔔 In-app notification system (mark read, mark all read, delete)
- 🌙 Full dark mode via CSS variables (persisted)
- ⚙️ Settings (theme, layout density, notifications)
- 👤 Editable user profile
- 🔎 Global search across tasks, projects and team members
- 🍞 Toast notifications + reusable confirmation dialogs
- 📱 Fully responsive (desktop / tablet / mobile)

---

## Technology Used

- **HTML5** — semantic markup
- **CSS3** — variables, flexbox, grid, custom design system
- **Vanilla JavaScript (ES6+)** — no frameworks, no libraries
- **localStorage** — browser-based local database
- **Native HTML5 Drag & Drop API** — Kanban board

No React, Vue, Angular, jQuery, Node.js, Express, Bootstrap, Tailwind, Firebase or any backend is used.

---

## Folder Structure

```
taskflow/
│
├── index.html              → Login / welcome screen
├── dashboard.html          → Overview + statistics
├── tasks.html              → Task management + filters
├── projects.html           → Project grid + CRUD
├── project-details.html    → Project overview + Kanban board
├── team.html               → Team member cards + profiles
├── calendar.html           → Deadline calendar
├── profile.html            → Editable user profile
├── settings.html           → Theme / layout / preferences
│
├── css/
│   ├── style.css           → Design tokens, base, shell layout
│   ├── components.css      → Buttons, cards, forms, modals, toasts
│   ├── dashboard.css       → Page-specific component styles
│   └── responsive.css      → Tablet & mobile breakpoints
│
├── js/
│   ├── storage.js          → Safe localStorage wrapper (single source of truth)
│   ├── data.js             → Seed / demo dataset
│   ├── utils.js            → Shared helpers, toasts, modal + confirm dialogs
│   ├── app.js              → Shell, theme, notifications, global search, auth
│   ├── forms.js            → Reusable task / project / member modals
│   ├── dashboard.js        → Dashboard rendering
│   ├── tasks.js            → Task CRUD + filters
│   ├── projects.js         → Project CRUD
│   ├── project-details.js  → Kanban board + project overview
│   ├── team.js             → Team management
│   ├── calendar.js         → Calendar rendering
│   ├── profile.js          → Profile editing
│   └── settings.js         → Preferences
│
└── README.md
```

---

## How to Run

There is **no build step** and **no server required**.

1. Download / unzip the project.
2. Open **`index.html`** in a modern browser (Chrome, Edge, Firefox, Safari).
3. Sign in with:

   | Field | Value |
   |---|---|
   | Email | `dakshinya@example.com` |
   | Password | `demo123` |

   …or click **"Continue as Demo User"**.

4. Explore: dashboard → tasks → projects → project-details (Kanban) → team → calendar → profile → settings.

> Tip: data persists across refreshes. Use **Settings → Reset Data** to restore the original demo dataset.

---

## How localStorage Works

- Every table is a JSON array stored under a `taskflow_`-prefixed key:

  | Key | Data |
  |---|---|
  | `taskflow_users` | Team members |
  | `taskflow_projects` | Projects |
  | `taskflow_tasks` | Tasks |
  | `taskflow_notifications` | Notifications |
  | `taskflow_settings` | User preferences |
  | `taskflow_current_user` | Active session |

- **All** read/write operations go through `js/storage.js` (`TFStorage`).
- If a stored value is corrupted JSON, `TFStorage.get()` catches the error, logs it, removes the bad key, and returns a safe fallback — **the app never crashes**.
- Project **progress is never stored** — it is calculated on the fly as `completedTasks / totalTasks × 100`.
- **Overdue** is never stored as a status — a task is *overdue* when `dueDate < today && status !== "Completed"` (computed dynamically).

---

## Data Structure

```js
// User
{
  id: "user_001",
  name: "Dakshinya",
  email: "dakshinya@example.com",
  phone: "9876543210",
  role: "Project Manager",
  department: "Development"
}

// Project
{
  id: "project_001",
  name: "Hospital Management System",
  description: "Hospital management web application",
  managerId: "user_001",
  memberIds: ["user_001", "user_002"],
  startDate: "2026-09-01",
  deadline: "2026-10-15",
  createdAt: "2026-09-01"
}

// Task
{
  id: "task_001",
  title: "Design Login Page",
  description: "Create responsive login page",
  projectId: "project_001",
  assignedTo: "user_002",
  priority: "High",
  status: "In Progress",
  startDate: "2026-09-05",
  dueDate: "2026-09-20",
  createdAt: "2026-09-05"
}

// Notification
{
  id: "notification_001",
  message: "A task was assigned to Dakshinya",
  type: "task",
  read: false,
  createdAt: "2026-09-10"
}
```

---

## Demo Users

| Name | Role | Department |
|---|---|---|
| **Dakshinya** | Project Manager | Development |
| Arun | Developer | Development |
| Priya | UI/UX Designer | Design |
| Karthik | Developer | Development |
| Meena | Tester | Quality Assurance |
| Rahul | Team Member | Operations |

The app ships with **4 sample projects** and **20+ tasks** across statuses, priorities and deadlines, so the dashboard looks alive on first launch.

---

## Screenshots

> Screenshots can be added here after taking captures of the login, dashboard, tasks, projects, Kanban, team, calendar and settings screens.

---

## Future Improvements

- Node.js + Express **REST API** backend
- **MySQL / PostgreSQL** database
- **Firebase** authentication & cloud database
- **Real-time collaboration** (editing the same board together)
- **WebSockets** for live updates
- Real **user authentication** & sessions
- **File uploads** and attachments
- Task **comments** / activity threads
- **Team chat**
- **Email notifications** for deadlines
- **Cloud database** sync across devices
- **Role-based permissions** (admin / manager / member)

---

## License & Notes

College mini project — built with HTML5, CSS3 and Vanilla JavaScript only. Authentication is simulated for demonstration purposes and is **not** secure.