/**
 * dashboard.js
 * ------------
 * Dashboard rendering: live statistics, project progress,
 * upcoming deadlines, recent tasks and team activity.
 */
(function () {
  "use strict";

  const ST = () => window.TFStorage;
  const U = () => window.Utils;

  const ICONS = {
    projects:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    tasks:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    done:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    progress:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    alert:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  };

  function init() {
    const user = App.init("dashboard");
    if (!user) return;

    const welcome = document.getElementById("dash-welcome");
    welcome.textContent =
      "Welcome back, " + user.name + ". Here's what's happening across your team.";

    render();
  }

  function render() {
    renderStats();
    renderProjectProgress();
    renderDeadlines();
    renderRecentTasks();
    renderActivity();
  }

  function renderStats() {
    const tasks = ST().get("tasks", []);
    const projects = ST().get("projects", []);
    const done = tasks.filter((t) => t.status === "Completed").length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    const overdue = tasks.filter((t) => U().isOverdue(t.dueDate, t.status)).length;

    const cards = [
      { label: "Total Projects", value: projects.length, icon: "projects", tone: "primary" },
      { label: "Total Tasks", value: tasks.length, icon: "tasks", tone: "info" },
      { label: "Completed", value: done, icon: "done", tone: "success" },
      { label: "In Progress", value: inProgress, icon: "progress", tone: "warning" },
      { label: "Overdue", value: overdue, icon: "alert", tone: "danger" },
    ];

    document.getElementById("stat-grid").innerHTML = cards
      .map(
        (c) =>
          '<div class="stat-card">' +
          '<div class="stat-card__icon stat-card__icon--' +
          c.tone +
          '">' +
          ICONS[c.icon] +
          "</div>" +
          '<div><div class="stat-card__value">' +
          c.value +
          '</div><div class="stat-card__label">' +
          c.label +
          "</div></div>" +
          "</div>"
      )
      .join("");
  }

  function renderProjectProgress() {
    const projects = ST().get("projects", []);
    const tasks = ST().get("tasks", []);
    const container = document.getElementById("project-progress");

    if (!projects.length) {
      container.innerHTML = '<p class="muted small">No projects yet.</p>';
      return;
    }

    container.innerHTML = projects
      .map((p) => {
        const ptasks = tasks.filter((t) => t.projectId === p.id);
        const done = ptasks.filter((t) => t.status === "Completed").length;
        const pct = U().percent(done, ptasks.length);
        const overdue = p.deadline && p.deadline < U().todayISO();
        return (
          '<a class="project-progress-item" href="project-details.html?id=' +
          p.id +
          '">' +
          '<div class="project-progress-item__head">' +
          '<span class="project-progress-item__name">' +
          U().escapeHtml(p.name) +
          "</span>" +
          '<span class="project-progress-item__meta">' +
          ptasks.length +
          " task" +
          (ptasks.length === 1 ? "" : "s") +
          " · due " +
          U().formatDate(p.deadline, { short: true }) +
          "</span>" +
          "</div>" +
          '<div class="project-progress-item__bar">' +
          '<div class="progress">' +
          '<div class="progress__bar' +
          (overdue ? " progress__bar--danger" : "") +
          '" style="width:' +
          pct +
          '%"></div>' +
          "</div>" +
          '<span class="project-progress-item__pct">' +
          pct +
          "%</span>" +
          "</div>" +
          "</a>"
        );
      })
      .join("");
  }

  function renderDeadlines() {
    const tasks = ST()
      .get("tasks", [])
      .filter((t) => t.status !== "Completed" && t.dueDate)
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0))
      .slice(0, 6);
    const container = document.getElementById("deadline-list");

    if (!tasks.length) {
      container.innerHTML = '<p class="muted small">No upcoming deadlines.</p>';
      return;
    }

    container.innerHTML = tasks.map(deadlineItem).join("");
    bindTaskClicks(container, tasks);
  }

  function deadlineItem(t) {
    const project = Forms.projectById(t.projectId);
    const overdue = U().isOverdue(t.dueDate, t.status);
    const d = new Date(t.dueDate + "T00:00:00");
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    return (
      '<button type="button" class="deadline-item' +
      (overdue ? " is-overdue" : "") +
      '" data-task="' +
      t.id +
      '" style="width:100%;text-align:left;cursor:pointer">' +
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
      (overdue
        ? '<span class="badge badge--overdue deadline-item__badge">Overdue</span>'
        : "") +
      "</button>"
    );
  }

  function renderRecentTasks() {
    const tasks = ST()
      .get("tasks", [])
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 6);
    const container = document.getElementById("recent-tasks");

    if (!tasks.length) {
      container.innerHTML = '<p class="muted small">No tasks yet.</p>';
      return;
    }

    container.innerHTML = tasks.map(recentTaskItem).join("");
    bindTaskClicks(container, tasks);
  }

  function recentTaskItem(t) {
    const project = Forms.projectById(t.projectId);
    const assignee = Forms.userById(t.assignedTo);
    const overdue = U().isOverdue(t.dueDate, t.status);
    return (
      '<button type="button" class="deadline-item" data-task="' +
      t.id +
      '" style="width:100%;text-align:left;cursor:pointer">' +
      '<div class="min-w-0">' +
      '<div class="deadline-item__title">' +
      U().escapeHtml(t.title) +
      "</div>" +
      '<div class="deadline-item__proj">' +
      U().escapeHtml(project ? project.name : "") +
      " · " +
      U().escapeHtml(assignee ? assignee.name : "Unassigned") +
      "</div>" +
      "</div>" +
      '<div class="flex gap-2 wrap align-center" style="margin-left:auto">' +
      Forms.statusBadge(t.status) +
      (overdue ? '<span class="badge badge--overdue">Overdue</span>' : "") +
      "</div>" +
      "</button>"
    );
  }

  function renderActivity() {
    const notifications = ST().get("notifications", []).slice(0, 6);
    const container = document.getElementById("activity-list");

    if (!notifications.length) {
      container.innerHTML = '<p class="muted small">No recent activity.</p>';
      return;
    }

    container.innerHTML = notifications
      .map((n) => {
        const subject = (n.message || "?").split(" ")[0];
        const hue = U().hueFrom(n.message || "?");
        return (
          '<div class="activity-item">' +
          '<span class="activity-avatar"><span class="avatar avatar--sm" style="background:hsl(' +
          hue +
          ",70%,45%)" +
          '">' +
          U().initials(subject) +
          "</span></span>" +
          '<div class="activity-item__main">' +
          "<p>" +
          U().escapeHtml(n.message) +
          '</p><small class="muted">' +
          U().timeAgo(n.createdAt) +
          "</small>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function bindTaskClicks(container, tasks) {
    container.querySelectorAll("[data-task]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const task = tasks.find((t) => t.id === btn.getAttribute("data-task"));
        if (task) Forms.taskView(task);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();