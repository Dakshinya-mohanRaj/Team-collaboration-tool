/**
 * server/index.js
 * ---------------
 * TASKFLOW server: Express + SQLite REST API, plus static serving
 * of the frontend (HTML/CSS/JS) so the whole app runs from one origin.
 */
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const { db } = require("./db");
const { seedIfEmpty } = require("./seed");
const auth = require("./auth");
const routes = require("./routes");

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");

const app = express();
app.disable("x-powered-by");
app.use(express.json());
app.use(cookieParser());

/* ------------------------------ API routes ------------------------------ */

app.use("/api/auth", auth.router);
app.use("/api", auth.requireAuth, routes);
app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

/* --------------------------- static frontend --------------------------- */

const PAGES = [
  "index.html",
  "dashboard.html",
  "tasks.html",
  "projects.html",
  "project-details.html",
  "team.html",
  "calendar.html",
  "profile.html",
  "settings.html",
];

app.use("/css", express.static(path.join(ROOT, "css")));
app.use("/js", express.static(path.join(ROOT, "js")));

PAGES.forEach((page) => {
  app.get("/" + page, (req, res) => res.sendFile(path.join(ROOT, page)));
});
app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));

/* ------------------------------ error handling ------------------------------ */

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body." });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

/* --------------------------------- boot --------------------------------- */

seedIfEmpty();

app.listen(PORT, () => {
  console.log("TASKFLOW running at http://localhost:" + PORT);
  console.log("  Demo login: dakshinya@example.com / demo123");
});