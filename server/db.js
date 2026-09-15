/**
 * server/db.js
 * ------------
 * SQLite setup, schema, and row <-> JSON mappers.
 * The database file is created on first run (taskflow.sqlite).
 */
const path = require("path");
const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "..", "taskflow.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'Team Member',
  department TEXT DEFAULT '',
  bio TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  manager_id TEXT,
  start_date TEXT DEFAULT '',
  deadline TEXT DEFAULT '',
  created_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  project_id TEXT,
  assigned_to TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'To Do',
  start_date TEXT DEFAULT '',
  due_date TEXT DEFAULT '',
  created_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'task',
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  theme TEXT DEFAULT 'light',
  layout TEXT DEFAULT 'comfortable',
  notifications INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
`);

/**
 * Generate a readable unique id, matching the frontend prefix style.
 */
function genId(prefix) {
  const rand = Math.random().toString(36).substring(2, 6);
  const time = Date.now().toString(36);
  return (prefix || "record") + "_" + time + rand;
}

/* ------------------------------ mappers ------------------------------ */

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    role: row.role || "Team Member",
    department: row.department || "",
    bio: row.bio || "",
  };
}

function mapTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    projectId: row.project_id || "",
    assignedTo: row.assigned_to || "",
    priority: row.priority || "Medium",
    status: row.status || "To Do",
    startDate: row.start_date || "",
    dueDate: row.due_date || "",
    createdAt: row.created_at || "",
  };
}

function mapProject(row, memberIds) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    managerId: row.manager_id || "",
    memberIds: memberIds || [],
    startDate: row.start_date || "",
    deadline: row.deadline || "",
    createdAt: row.created_at || "",
  };
}

function mapNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    message: row.message,
    type: row.type || "task",
    read: !!row.read,
    createdAt: row.created_at || "",
  };
}

function mapSettings(row) {
  if (!row) return null;
  return {
    theme: row.theme || "light",
    layout: row.layout || "comfortable",
    notifications: row.notifications !== 0,
  };
}

module.exports = { db, genId, mapUser, mapTask, mapProject, mapNotification, mapSettings };