# TASKFLOW — Team Collaboration & Task Management

A complete team project management web application built as a **full-stack** project for **DAKSHINYA**.

TASKFLOW helps a small team manage projects, tasks, team members, deadlines, task priorities, statuses and overall project progress — with a modern, Trello/Asana-inspired interface.

> **Architecture:** The frontend (HTML + CSS + Vanilla JS) talks to a Node.js/Express REST API backed by SQLite. All data is stored server-side in `taskflow.sqlite`. Session-based authentication uses an httpOnly cookie.

---

## Features

- 🔐 Session-based login (httpOnly cookie, bcrypt-hashed passwords)
- 📊 Dynamic dashboard with live statistics (fetched from the server)
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

### Frontend
- **HTML5** — semantic markup
- **CSS3** — variables, flexbox, grid, custom design system
- **Vanilla JavaScript (ES6+)** — no frameworks, no libraries
- **Native HTML5 Drag & Drop API** — Kanban board

### Backend
- **Node.js + Express 4** — REST API + static file serving
- **SQLite** (better-sqlite3) — embedded relational database
- **bcryptjs** — password hashing
- **cookie-parser** — session cookie support
- **Optimistic sync cache** — synchronous frontend reads backed by async API writes (no framework required)

No React, Vue, Angular, jQuery, Tailwind, Firebase or other heavy frameworks are used.

---

## Folder Structure

```
Team-collaboration-tool/
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
│   ├── storage.js          → Sync cache store (maps to REST API)
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
│   └── settings.js         → Preferences + data reset
│
├── server/
│   ├── index.js            → Express entry point (API + static serving)
│   ├── db.js               → SQLite setup, schema, row mappers
│   ├── seed.js             → Demo dataset (bcrypt-hashed passwords)
│   ├── auth.js             → Login/logout/me + session middleware
│   └── routes.js           → Resource CRUD (users/projects/tasks/etc.)
│
├── package.json
├── .gitignore
└── README.md
```

---

## How to Run

### Prerequisites
- **Node.js** v18+ (tested on v24)
- npm (bundled with Node)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/Dakshinya-mohanRaj/Team-collaboration-tool.git
cd Team-collaboration-tool

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

Then open **http://localhost:3000** in a modern browser (Chrome, Edge, Firefox, Safari).

### Login

| Field | Value |
|---|---|
| Email | `dakshinya@example.com` |
| Password | `demo123` |

Or click **"Continue as Demo User"**.

4. Explore: dashboard → tasks → projects → project-details (Kanban) → team → calendar → profile → settings.

> Data persists across refreshes (stored in `taskflow.sqlite`). Use **Settings → Reset Data** to restore the original demo dataset.

---

## How the Data Store Works

The frontend uses a **synchronous in-memory cache** (`js/storage.js`) that mirrors the SQLite database:

- On every page load, `App.init()` calls `GET /api/bootstrap` and `GET /api/auth/me` to hydrate the cache.
- All page scripts read from the cache synchronously via `ST().get("users", [])` — identical to the old localStorage API.
- Writes are **optimistic**: the cache updates immediately, then a background queue sends granular create/update/delete calls to the REST API.
- If any write fails, the user is notified and the cache re-syncs on next navigation.

### API Endpoints (under `/api`)

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Log in (email + password), set session cookie |
| `/api/auth/demo` | POST | Log in as first demo user |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/me` | GET | Return current user (or 401) |
| `/api/bootstrap` | GET | Return all collections + user (auth required) |
| `/api/users` | GET/POST | List or create users |
| `/api/users/:id` | PATCH/DELETE | Update or remove a user |
| `/api/projects` | GET/POST | List or create projects |
| `/api/projects/:id` | PATCH/DELETE | Update or remove a project |
| `/api/tasks` | GET/POST | List or create tasks |
| `/api/tasks/:id` | PATCH/DELETE | Update or remove a task |
| `/api/notifications` | GET/POST | List or create notifications |
| `/api/notifications/:id` | PATCH/DELETE | Mark read or delete a notification |
| `/api/notifications/read-all` | POST | Mark all notifications read |
| `/api/settings` | GET/PATCH | Read or update preferences |
| `/api/reset` | POST | Wipe and restore demo dataset |

---

## Data Structure

### User
```json
{ "id": "user_001", "name": "Dakshinya", "email": "dakshinya@example.com",
  "phone": "9876543210", "role": "Project Manager",
  "department": "Development", "bio": "..." }
```

### Project
```json
{ "id": "project_001", "name": "Hospital Management System",
  "description": "...", "managerId": "user_001",
  "memberIds": ["user_001", "user_002"],
  "startDate": "2026-09-01", "deadline": "2026-10-15", "createdAt": "2026-09-01" }
```

### Task
```json
{ "id": "task_001", "title": "Design Login Page", "description": "...",
  "projectId": "project_001", "assignedTo": "user_002", "priority": "High",
  "status": "In Progress", "startDate": "2026-09-05",
  "dueDate": "2026-09-20", "createdAt": "2026-09-05" }
```

### Notification
```json
{ "id": "ntf_001", "message": "A task was assigned to Dakshinya",
  "type": "task", "read": false, "createdAt": "2026-09-10T06:00:00.000Z" }
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

## License & Notes

College project — built with HTML5, CSS3 and Vanilla JavaScript frontend, Node.js + Express + SQLite backend. Authentication is simulated for demonstration purposes (bcrypt hashing is used, but session management is not production-grade).