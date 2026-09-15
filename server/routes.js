/**
 * server/routes.js
 * ----------------
 * Authenticated resource routes: users, projects, tasks, notifications,
 * settings, bootstrap (initial read) and demo-data reset.
 */
const express = require("express");
const bcrypt = require("bcryptjs");
const { db, genId, mapUser, mapTask, mapProject, mapNotification, mapSettings } = require("./db");
const { reseed } = require("./seed");

const router = express.Router();

/* ------------------------------ helpers ------------------------------ */

const pick = (obj, keys) => {
  const out = {};
  keys.forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
};

function memberIdsOf(projectId) {
  const rows = db
    .prepare("SELECT user_id FROM project_members WHERE project_id = ?")
    .all(projectId);
  return rows.map((r) => r.user_id);
}

function projectJson(row) {
  return mapProject(row, row ? memberIdsOf(row.id) : []);
}

const notifInt = (v) => (v ? 1 : 0);

/* ------------------------------ bootstrap ------------------------------ */

// GET /api/bootstrap — everything the frontend cache needs in one call.
router.get("/bootstrap", (req, res) => {
  const users = db.prepare("SELECT * FROM users ORDER BY name").all().map(mapUser);
  const projects = db.prepare("SELECT * FROM projects ORDER BY created_at").all().map(projectJson);
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at").all().map(mapTask);
  const notifications = db
    .prepare("SELECT * FROM notifications ORDER BY created_at DESC")
    .all()
    .map(mapNotification);
  const settings = mapSettings(
    db.prepare("SELECT * FROM settings WHERE id = 1").get()
  ) || {};
  res.json({ user: req.user, users, projects, tasks, notifications, settings });
});

/* ------------------------------- users ------------------------------- */

router.get("/users", (req, res) => {
  const users = db.prepare("SELECT * FROM users ORDER BY name").all().map(mapUser);
  res.json(users);
});

router.post("/users", (req, res) => {
  const { id, name, email, phone, role, department, bio } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required." });

  const existing = db.prepare("SELECT 1 FROM users WHERE LOWER(email) = ?").get(String(email).toLowerCase());
  if (existing) return res.status(409).json({ error: "Email already in use." });

  const userId = id || genId("user");
  const password = req.body.password || "demo123";
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, phone, role, department, bio)
     VALUES (@id, @name, @email, @hash, @phone, @role, @department, @bio)`
  ).run({
    id: userId,
    name,
    email,
    hash: bcrypt.hashSync(password, 10),
    phone: phone || "",
    role: role || "Team Member",
    department: department || "",
    bio: bio || "",
  });
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  res.status(201).json(mapUser(row));
});

router.patch("/users/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "User not found." });

  const patch = pick(req.body, ["name", "email", "phone", "role", "department", "bio"]);
  const fields = Object.keys(patch);
  if (fields.length === 0 && req.body.password === undefined) {
    return res.status(200).json(mapUser(existing));
  }

  const sets = [];
  const vals = {};
  fields.forEach((f) => {
    sets.push(f + " = @" + f);
    vals[f] = patch[f];
  });
  if (req.body.password) {
    sets.push("password_hash = @hash");
    vals.hash = bcrypt.hashSync(String(req.body.password), 10);
  }
  vals.id = req.params.id;
  db.prepare("UPDATE users SET " + sets.join(", ") + " WHERE id = @id").run(vals);

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  res.json(mapUser(row));
});

router.delete("/users/:id", (req, res) => {
  db.prepare("DELETE FROM project_members WHERE user_id = ?").run(req.params.id);
  const result = db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "User not found." });
  res.status(204).end();
});

/* ------------------------------ projects ------------------------------ */

router.get("/projects", (req, res) => {
  const projects = db.prepare("SELECT * FROM projects ORDER BY created_at").all().map(projectJson);
  res.json(projects);
});

function insertProject(p) {
  db.prepare(
    `INSERT INTO projects (id, name, description, manager_id, start_date, deadline, created_at)
     VALUES (@id, @name, @description, @manager_id, @start_date, @deadline, @created_at)`
  ).run({
    id: p.id,
    name: p.name,
    description: p.description || "",
    manager_id: p.managerId || "",
    start_date: p.startDate || "",
    deadline: p.deadline || "",
    created_at: p.createdAt || new Date().toISOString().slice(0, 10),
  });
  replaceMembers(p.id, p.memberIds);
}

function replaceMembers(projectId, memberIds) {
  if (memberIds === undefined) return;
  db.prepare("DELETE FROM project_members WHERE project_id = ?").run(projectId);
  const insert = db.prepare("INSERT INTO project_members (project_id, user_id) VALUES (?, ?)");
  Array.from(memberIds || []).forEach((uid) => insert.run(projectId, uid));
}

router.post("/projects", (req, res) => {
  const { id, name } = req.body;
  if (!name) return res.status(400).json({ error: "Project name is required." });
  const projectId = id || genId("project");
  insertProject(Object.assign({}, req.body, { id: projectId }));
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
  res.status(201).json(projectJson(row));
});

router.patch("/projects/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Project not found." });

  const patch = pick(req.body, ["name", "description", "managerId", "startDate", "deadline"]);
  const fields = Object.keys(patch);
  if (fields.length) {
    const sets = fields.map((f) => {
      const col = {
        managerId: "manager_id",
        startDate: "start_date",
        deadline: "deadline",
      }[f] || f;
      return col + " = @" + col;
    });
    const vals = {};
    fields.forEach((f) => {
      vals[f === "managerId" ? "manager_id" : f === "startDate" ? "start_date" : f === "deadline" ? "deadline" : f] = patch[f];
    });
    vals.id = req.params.id;
    db.prepare("UPDATE projects SET " + sets.join(", ") + " WHERE id = @id").run(vals);
  }
  replaceMembers(req.params.id, req.body.memberIds);

  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
  res.json(projectJson(row));
});

router.delete("/projects/:id", (req, res) => {
  db.prepare("DELETE FROM tasks WHERE project_id = ?").run(req.params.id);
  db.prepare("DELETE FROM project_members WHERE project_id = ?").run(req.params.id);
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Project not found." });
  res.status(204).end();
});

/* -------------------------------- tasks -------------------------------- */

router.get("/tasks", (req, res) => {
  let rows;
  if (req.query.project) {
    rows = db.prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at").all(req.query.project);
  } else {
    rows = db.prepare("SELECT * FROM tasks ORDER BY created_at").all();
  }
  res.json(rows.map(mapTask));
});

function insertTask(t) {
  db.prepare(
    `INSERT INTO tasks (id, title, description, project_id, assigned_to, priority, status, start_date, due_date, created_at)
     VALUES (@id, @title, @description, @project_id, @assigned_to, @priority, @status, @start_date, @due_date, @created_at)`
  ).run({
    id: t.id,
    title: t.title,
    description: t.description || "",
    project_id: t.projectId || "",
    assigned_to: t.assignedTo || "",
    priority: t.priority || "Medium",
    status: t.status || "To Do",
    start_date: t.startDate || "",
    due_date: t.dueDate || "",
    created_at: t.createdAt || new Date().toISOString().slice(0, 10),
  });
}

router.post("/tasks", (req, res) => {
  const { id, title } = req.body;
  if (!title) return res.status(400).json({ error: "Task title is required." });
  const taskId = id || genId("task");
  insertTask(Object.assign({}, req.body, { id: taskId }));
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
  res.status(201).json(mapTask(row));
});

router.patch("/tasks/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Task not found." });

  const colOf = {
    projectId: "project_id",
    assignedTo: "assigned_to",
    startDate: "start_date",
    dueDate: "due_date",
    createdAt: "created_at",
  };
  const patch = pick(req.body, [
    "title", "description", "projectId", "assignedTo", "priority", "status", "startDate", "dueDate", "createdAt",
  ]);
  const fields = Object.keys(patch);
  if (fields.length) {
    const sets = fields.map((f) => (colOf[f] || f) + " = @" + (colOf[f] || f));
    const vals = { id: req.params.id };
    fields.forEach((f) => {
      const col = colOf[f] || f;
      vals[col] = patch[f];
    });
    db.prepare("UPDATE tasks SET " + sets.join(", ") + " WHERE id = @id").run(vals);
  }

  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  res.json(mapTask(row));
});

router.delete("/tasks/:id", (req, res) => {
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Task not found." });
  res.status(204).end();
});

/* ---------------------------- notifications ---------------------------- */

router.get("/notifications", (req, res) => {
  const rows = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC").all();
  res.json(rows.map(mapNotification));
});

router.post("/notifications", (req, res) => {
  const { id, message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required." });
  const nId = id || genId("ntf");
  db.prepare(
    "INSERT INTO notifications (id, message, type, read, created_at) VALUES (@id, @message, @type, @read, @created_at)"
  ).run({
    id: nId,
    message,
    type: req.body.type || "task",
    read: notifInt(req.body.read),
    created_at: req.body.createdAt || new Date().toISOString(),
  });
  const row = db.prepare("SELECT * FROM notifications WHERE id = ?").get(nId);
  res.status(201).json(mapNotification(row));
});

router.patch("/notifications/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM notifications WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Notification not found." });

  const patch = pick(req.body, ["message", "type", "read", "createdAt"]);
  if (Object.keys(patch).length) {
    const sets = [];
    const vals = { id: req.params.id, read: notifInt(patch.read) };
    if (patch.message !== undefined) { sets.push("message = @message"); vals.message = patch.message; }
    if (patch.type !== undefined) { sets.push("type = @type"); vals.type = patch.type; }
    if (patch.createdAt !== undefined) { sets.push("created_at = @created_at"); vals.created_at = patch.createdAt; }
    sets.push("read = @read");
    db.prepare("UPDATE notifications SET " + sets.join(", ") + " WHERE id = @id").run(vals);
  } else {
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(req.params.id);
  }

  const row = db.prepare("SELECT * FROM notifications WHERE id = ?").get(req.params.id);
  res.json(mapNotification(row));
});

router.post("/notifications/read-all", (req, res) => {
  db.prepare("UPDATE notifications SET read = 1 WHERE read = 0").run();
  res.json({ ok: true });
});

router.delete("/notifications/:id", (req, res) => {
  const result = db.prepare("DELETE FROM notifications WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Notification not found." });
  res.status(204).end();
});

/* ------------------------------ settings ------------------------------ */

router.get("/settings", (req, res) => {
  const row = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  res.json(mapSettings(row));
});

router.patch("/settings", (req, res) => {
  const patch = pick(req.body, ["theme", "layout", "notifications"]);
  const sets = [];
  const vals = { id: 1 };
  if (patch.theme !== undefined) { sets.push("theme = @theme"); vals.theme = patch.theme; }
  if (patch.layout !== undefined) { sets.push("layout = @layout"); vals.layout = patch.layout; }
  if (patch.notifications !== undefined) { sets.push("notifications = @notifications"); vals.notifications = notifInt(patch.notifications); }
  if (sets.length) {
    db.prepare("UPDATE settings SET " + sets.join(", ") + " WHERE id = @id").run(vals);
  }
  const row = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  res.json(mapSettings(row));
});

/* -------------------------------- reset -------------------------------- */

router.post("/reset", (req, res) => {
  reseed();
  res.json({ ok: true });
});

module.exports = router;