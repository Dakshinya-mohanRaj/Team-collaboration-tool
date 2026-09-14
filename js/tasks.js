/**
 * tasks.js
 * --------
 * Task management: full CRUD + search + multi-filter.
 */
(function () {
  "use strict";

  const ST = () => window.TFStorage;
  const U = () => window.Utils;

  const state = {
    search: "",
    status: "",
    priority: "",
    projectId: "",
    memberId: "",
    due: "",
  };

  function init() {
    const user = App.init("tasks");
    if (!user) return;

    document.getElementById("empty-new-task").addEventListener("click", openNew);
    document.getElementById("new-task-btn").addEventListener("click", openNew);

    const searchBox = document.getElementById("task-search");
    searchBox.addEventListener(
      "input",
      U().debounce(() => {
        state.search = searchBox.value.trim().toLowerCase();
        render();
      }, 150)
    );

    [
      ["filter-status", "status"],
      ["filter-priority", "priority"],
      ["filter-project", "projectId"],
      ["filter-member", "memberId"],
      ["filter-due", "due"],
    ].forEach(([id, key]) => {
      const el = document.getElementById(id);
      el.addEventListener("change", () => {
        state[key] = el.value;
        render();
      });
    });

    document.getElementById("clear-filters").addEventListener("click", clearFilters);

    populateFilterOptions();

    const params = new URLSearchParams(window.location.search);
    const focus = params.get("focus");
    if (params.get("new") === "1") {
      openNew();
    } else if (focus) {
      render();
      setTimeout(() => {
        const card = document.querySelector('[data-task-id="' + focus + '"]');
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          card.style.outline = "2px solid var(--primary)";
          setTimeout(() => (card.style.outline = ""), 2500);
        }
      }, 120);
    }

    render();
  }

  function populateFilterOptions() {
    const projects = ST().get("projects", []);
    const users = ST().get("users", []);
    fillSelect("filter-project", projects, (p) => [p.id, p.name]);
    fillSelect("filter-member", users, (u) => [u.id, u.name]);
  }

  function fillSelect(id, list, mapFn) {
    const el = document.getElementById(id);
    if (!el) return;
    list.forEach((item) => {
      const [value, label] = mapFn(item);
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      el.appendChild(opt);
    });
  }

  function clearFilters() {
    state.search = "";
    state.status = "";
    state.priority = "";
    state.projectId = "";
    state.memberId = "";
    state.due = "";
    document.getElementById("task-search").value = "";
    [
      "filter-status",
      "filter-priority",
      "filter-project",
      "filter-member",
      "filter-due",
    ].forEach((id) => (document.getElementById(id).value = ""));
    render();
  }

  function getFiltered() {
    const tasks = ST().get("tasks", []);

    return tasks.filter((t) => {
      if (state.search) {
        const hay =
          ((t.title || "") + " " + (t.description || "")).toLowerCase();
        if (!hay.includes(state.search)) return false;
      }
      if (state.status && t.status !== state.status) return false;
      if (state.priority && t.priority !== state.priority) return false;
      if (state.projectId && t.projectId !== state.projectId) return false;
      if (state.memberId && t.assignedTo !== state.memberId) return false;
      if (state.due) {
        if (state.due === "Overdue" && !U().isOverdue(t.dueDate, t.status))
          return false;
        if (state.due === "Due Soon" && !isDueSoon(t)) return false;
        if (state.due === "Completed" && t.status !== "Completed") return false;
      }
      return true;
    });
  }

  function isDueSoon(t) {
    if (t.status === "Completed" || !t.dueDate) return false;
    const today = U().startOfDay(new Date());
    const due = U().startOfDay(new Date(t.dueDate + "T00:00:00"));
    const diff = (due - today) / 86400000;
    return diff >= 0 && diff <= 7;
  }

  function render() {
    const grid = document.getElementById("task-grid");
    const empty = document.getElementById("task-empty");
    const count = document.getElementById("task-count");
    const tasks = getFiltered();

    if (!tasks.length) {
      grid.innerHTML = "";
      empty.hidden = false;
      document.getElementById("task-empty-title").textContent =
        state.search || state.status || state.priority || state.projectId ||
        state.memberId || state.due
          ? "No tasks match your filters"
          : "No tasks found";
      document.getElementById("task-empty-desc").textContent =
        state.search || state.status || state.priority || state.projectId ||
        state.memberId || state.due
          ? "Try clearing or changing your filters."
          : "Create your first task to get started.";
      count.textContent = "";
      return;
    }
    empty.hidden = true;

    count.textContent =
      tasks.length + (tasks.length === 1 ? " task" : " tasks") + " shown";

    grid.innerHTML = tasks.map(taskCard).join("");
  }

  function taskCard(t) {
    const project = Forms.projectById(t.projectId);
    const assignee = Forms.userById(t.assignedTo);
    const isOverdue = U().isOverdue(t.dueDate, t.status);

    const dueLabel =
      (isOverdue ? "Overdue · " : "") + U().formatDate(t.dueDate);

    return (
      '<article class="task-card" data-task-id="' +
      t.id +
      '">' +
      '<div class="task-card__head">' +
      "<div class=\"min-w-0\">" +
      '<h3 class="task-card__title">' +
      U().escapeHtml(t.title) +
      "</h3>" +
      '<p class="task-card__desc">' +
      U().escapeHtml(t.description || "No description") +
      "</p>" +
      "</div>" +
      "</div>" +
      '<div class="task-card__badges flex wrap">' +
      Forms.priorityBadge(t.priority) +
      Forms.statusBadge(t.status) +
      (isOverdue ? '<span class="badge badge--overdue">Overdue</span>' : "") +
      "</div>" +
      '<div class="task-card__meta">' +
      '<div class="task-card__meta-row">' +
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>' +
      "<span>" +
      U().escapeHtml(project ? project.name : "Unknown project") +
      "</span></div>" +
      '<div class="task-card__meta-row">' +
      (assignee
        ? avatarSm(assignee)
        : '<span class="avatar avatar--sm">?</span>') +
      "<span>" +
      U().escapeHtml(assignee ? assignee.name : "Unassigned") +
      "</span></div>" +
      "</div>" +
      '<div class="task-card__footer">' +
      '<span class="task-card__due' +
      (isOverdue ? " muted" : "") +
      '">' +
      dueLabel +
      "</span>" +
      '<div class="task-card__actions">' +
      '<button type="button" class="icon-btn" data-act="view" data-id="' +
      t.id +
      '" aria-label="View task" title="View">' +
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
      "</button>" +
      '<button type="button" class="icon-btn" data-act="edit" data-id="' +
      t.id +
      '" aria-label="Edit task" title="Edit">' +
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>' +
      "</button>" +
      '<button type="button" class="icon-btn icon-btn--danger" data-act="delete" data-id="' +
      t.id +
      '" aria-label="Delete task" title="Delete">' +
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
      "</button>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function avatarSm(user) {
    return (
      '<span class="avatar avatar--sm" style="background:hsl(' +
      U().hueFrom(user.name) +
      ",70%,45%)" +
      '">' +
      U().initials(user.name) +
      "</span>"
    );
  }

  function openNew() {
    Forms.task({
      onSave() {
        render();
      },
    });
  }

  function openEdit(id) {
    const task = ST()
      .get("tasks", [])
      .find((t) => t.id === id);
    if (!task) return U().toast("Task not found.", "error");
    Forms.task({
      task,
      onSave() {
        render();
      },
    });
  }

  function openView(id) {
    const task = ST()
      .get("tasks", [])
      .find((t) => t.id === id);
    if (!task) return U().toast("Task not found.", "error");
    Forms.taskView(task);
  }

  async function confirmDelete(id) {
    const task = ST()
      .get("tasks", [])
      .find((t) => t.id === id);
    if (!task) return;

    const ok = await U().confirm(
      'Are you sure you want to delete this task? <br /><strong>' +
        U().escapeHtml(task.title) +
        "</strong>",
      { title: "Delete task", confirmLabel: "Delete Task" }
    );
    if (!ok) return;

    const list = ST()
      .get("tasks", [])
      .filter((t) => t.id !== id);
    ST().set("tasks", list);
    U().toast("Task deleted successfully");
    render();
  }

  document.getElementById("task-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const act = btn.getAttribute("data-act");
    if (act === "view") openView(id);
    else if (act === "edit") openEdit(id);
    else if (act === "delete") confirmDelete(id);
  });

  document.addEventListener("DOMContentLoaded", init);
})();