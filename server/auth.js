/**
 * server/auth.js
 * --------------
 * Session-based auth using an httpOnly cookie.
 * Only the SHA-256 hash of the token is stored in the database.
 */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const express = require("express");
const { db, mapUser } = require("./db");

const COOKIE = "tf_session";
const SESSION_DAYS = 7;

const router = express.Router();

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

function createSession(userId, res) {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  db.prepare(
    "DELETE FROM sessions WHERE user_id = ?"
  ).run(userId);
  db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)"
  ).run(hashToken(token), userId, expiresAt);

  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  });
  return token;
}

function destroySession(req, res) {
  const token = req.cookies && req.cookies[COOKIE];
  if (token) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  }
  res.clearCookie(COOKIE, { path: "/" });
}

/**
 * Middleware: resolve the session cookie to the current user.
 * Attaches req.user on success, otherwise responds 401.
 */
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE];
  if (!token) return res.status(401).json({ error: "Not authenticated." });

  const row = db
    .prepare(
      `SELECT s.expires_at, u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(hashToken(token));

  if (!row) {
    res.clearCookie(COOKIE, { path: "/" });
    return res.status(401).json({ error: "Session expired." });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    res.clearCookie(COOKIE, { path: "/" });
    return res.status(401).json({ error: "Session expired." });
  }

  req.user = mapUser(row);
  next();
}

/* ------------------------------ routes ------------------------------ */

router.post("/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE LOWER(email) = ?")
    .get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  createSession(user.id, res);
  res.json({ ok: true, user: mapUser(user) });
});

router.post("/demo", (req, res) => {
  const user = db.prepare("SELECT * FROM users ORDER BY id LIMIT 1").get();
  if (!user) return res.status(404).json({ error: "Demo account missing." });
  createSession(user.id, res);
  res.json({ ok: true, user: mapUser(user) });
});

router.post("/logout", (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = { router, requireAuth, destroySession };