/**
 * dashboard.js
 * ------------
 * Renders dashboard stats, project progress, deadlines, activity
 * and the recent tasks table from localStorage.
 */
(function () {
  "use strict";

  const ST = () => window.TFStorage;
  const U = () => window.Utils;

  function init() {
    const user = App.init("dashboard");
    if (!user) return;
    loadPage(user);
  }

  function loadPage(user) {
    const tasks = ST().get("tasks", []);
    const projects = ST().get("projects", []);

    setGreeting(user);
    setStats(tasks, projects);
    renderProjectProgress(projects, tasks);
    renderDeadlines(tasks);
    renderActivity();
    renderRecentTasks(tasks);
    bindQuickAdd(user);
  }

  function setGreeting(user) {
    const now = new Date();
    const hour = now.getHours();
    let part = "Good evening";
    if (hour < 12) part = "Good morning";
    else if (hour < 17) part = "Good afternoon";
    const title = document.getElementById("welcome-title");
    if (title) title.textContent = part + ", " + (user.name || "there");
  }

  function setStats(tasks, projects) {
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    const overdue = tasks.filter(
      (t) => U().isOverdue(t.dueDate, t.status)
    ).length;

    setText("stat-projects", projects.length);
    setText("stat-tasks", tasks.length);
    setText("stat-completed", completed);
    setText("stat-inprogress", inProgress);
    setText("stat-overdue", overdue);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function renderProjectProgress(projects, tasks) {
    const list = document.getElementById("project-progress-list");
    const empty = document.getElementById("project-progress-empty");
    if (!list) return;

    if (!projects.length) {
      list.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    list.innerHTML = projects
      .map((p) => {
        const pTasks = tasks.filter((t) => t.projectId === p.id);
        const done = pTasks.filter((t) => t.status === "Completed").length;
        const pct = U().percent(done, pTasks.length);
        const danger = pct < 40 && pTasks.length > 0;
        return (
          '<a href="project-details.html?id=' +
          p.id +
          '" class="project-progress-item" style="text-decoration:none;color:inherit">' +
          '<div class="project-progress-item__head">' +
          '<span class="project-progress-item__name">' +
          U().escapeHtml(p.name) +
          "</span>" +
          '<span class="project-progress-item__meta">' +
          done +
          "/" +
          pTasks.length +
          " tasks · due " +
          U().formatDate(p.deadline) +
          "</span>" +
          "</div>" +
          '<div class="project-progress-item__bar">' +
          '<div class="progress"><div class="progress__bar' +
          (danger ? " progress__bar--danger" : "") +
          '" style="width:' +
          pct +
          '%"></div></div>' +
          '<span class="project-progress-item__pct">' +
          pct +
          "%</span>" +
          "</div>" +
          "</a>"
        );
      })
      .join("");
  }

  function renderDeadlines(tasks) {
    const list = document.getElementById("deadline-list");
    if (!list) return;

    const relevant = tasks
      .filter((t) => t.status !== "Completed" && t.dueDate)
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
      .slice(0, 6);

    if (!relevant.length) {
      list.innerHTML =
        '<p class="muted small">No upcoming deadlines. You are all clear.</p>';
      return;
    }

    list.innerHTML = relevant
      .map((t) => {
        const overdue = U().isOverdue(t.dueDate, t.status);
        const dueDate = new Date(t.dueDate + "T00:00:00");
        const day = dueDate.getDate();
        const month = dueDate
          .toLocaleDateString("en-US", { month: "short" })
          .toUpperCase();
        const project = projectById(t.projectId);
        return (
          '<div class="deadline-item' +
          (overdue ? " is-overdue" : "") +
          '">' +
          '<div class="deadline-item__date"><span class="d">' +
          day +
          '</span><span class="m">' +
          month +
          "</span></div>" +
          '<div class="min-w-0">' +
          '<div class="deadline-item__title">' +
          U().escapeHtml(t.title) +
          "</div>" +
          '<div class="deadline-item__proj">' +
          U().escapeHtml(project ? project.name : "") +
          "</div>" +
          "</div>" +
          '<div class="deadline-item__badge">' +
          (overdue
            ? '<span class="badge badge--priority-critical">Overdue</span>'
            : '<span class="badge badge--status-' +
              statusClass(t.status) +
              '">' +
              U().escapeHtml(t.status) +
              "</span>") +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderActivity() {
    const list = document.getElementById("activity-list");
    if (!list) return;

    const notifs = ST().get("notifications", []).slice(0, 6);
    if (!notifs.length) {
      list.innerHTML = '<p class="muted small">No activity yet.</p>';
      return;
    }

    list.innerHTML = notifs
      .map((n) => {
        const match = n.message.match(/^([A-Za-z]+) /);
        const actorName = match ? match[1] : "Someone";
        return (
          '<div class="activity-item">' +
          '<span class="activity-avatar avatar avatar--sm" style="background:hsl(' +
          U().hueFrom(actorName) +
          ",70%,45%)" +
          '">' +
          U().initials(actorName) +
          "</span>" +
          '<div class="activity-item__main min-w-0">' +
          "<p>" +
          U().escapeHtml(n.message) +
          "</p>" +
          '<span class="small muted">' +
          U().timeAgo(n.createdAt) +
          "</span>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderRecentTasks(tasks) {
    const body = document.getElementById("recent-tasks-body");
    const empty = document.getElementById("recent-tasks-empty");
    if (!body) return;

    const recent = tasks
      .slice()
      .sort((a, b) => {
        const x = a.createdAt || "";
        const y = b.createdAt || "";
        return x < y ? 1 : -1;
      })
      .slice(0, 8);

    if (!recent.length) {
      body.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    body.innerHTML = recent
      .map((t) => {
        const assignee = userById(t.assignedTo);
        const project = projectById(t.projectId);
        return (
          "<tr>" +
          "<td><strong>" +
          U().escapeHtml(t.title) +
          "</strong></td>" +
          "<td>" +
          U().escapeHtml(project ? project.name : "—") +
          "</td>" +
          '<td><span class="flex gap-2 align-center">' +
          avatarSm(assignee) +
          "<span>" +
          U().escapeHtml(assignee ? assignee.name : "—") +
          "</span></span></td>" +
          '<td>' + Forms.priorityBadge(t.priority) + "</td>" +
          "<td>" + Forms.statusBadge(t.status) + "</td>" +
          '<td class="muted">' +
          U().formatDate(t.dueDate) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function bindQuickAdd(user) {
    const btn = document.getElementById("quick-add-task");
    if (!btn) return;
    btn.addEventListener("click", () => {
      Forms.task({
        projectId: "",
        assignedTo: user.id,
        onSave() {
          const tasks = ST().get("tasks", []);
          const projects = ST().get("projects", []);
          setStats(tasks, projects);
          renderProjectProgress(projects, tasks);
          renderDeadlines(tasks);
          renderRecentTasks(tasks);
        },
      });
    });
  }

  /* ------------------------------- helpers ------------------------------- */

  function projectById(id) {
    return ST().get("projects", []).find((p) => p.id === id) || null;
  }

  function userById(id) {
    return ST().get("users", []).find((u) => u.id === id) || null;
  }

  function avatarSm(user) {
    const u = user || { name: "?", role: "" };
    return (
      '<span class="avatar avatar--sm" style="background:hsl(' +
      U().hueFrom(u.name) +
      ",70%,45%)" +
      '">' +
      U().initials(u.name) +
      "</span>"
    );
  }

  function statusClass(status) {
    const s = String(status || "").toLowerCase().replace(/\s+/g, "");
    if (s === "inprogress") return "progress";
    return s || "todo";
  }

  document.addEventListener("DOMContentLoaded", init);
})();