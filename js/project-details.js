/**
 * project-details.js
 * ------------------
 * Project overview + native HTML5 drag & drop Kanban board.
 */
(function () {
  "use strict";

  const ST = () => window.TFStorage;
  const U = () => window.Utils;

  const COLUMNS = ["To Do", "In Progress", "Review", "Completed"];
  let projectId = null;

  function init() {
    const user = App.init("project-details");
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    projectId = params.get("id");

    document.getElementById("pd-new-task").addEventListener("click", () => {
      Forms.task({
        projectId,
        assignedTo: user.id,
        onSave: loadAll,
      });
    });

    document.getElementById("pd-edit").addEventListener("click", () => {
      const project = getProject();
      if (project) {
        Forms.project({ project, onSave: loadAll });
      }
    });

    loadAll();
  }

  function getProject() {
    return ST()
      .get("projects", [])
      .find((p) => p.id === projectId) || null;
  }

  function loadAll() {
    const project = getProject();
    if (!project) {
      document.getElementById("project-not-found").hidden = false;
      document.getElementById("project-content").hidden = true;
      return;
    }
    document.getElementById("project-not-found").hidden = true;
    document.getElementById("project-content").hidden = false;

    renderHeader(project);
    renderKanban(project);
  }

  function renderHeader(project) {
    const tasks = ST().get("tasks", []).filter((t) => t.projectId === projectId);
    const done = tasks.filter((t) => t.status === "Completed").length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    const overdue = tasks.filter((t) => U().isOverdue(t.dueDate, t.status)).length;
    const pct = U().percent(done, tasks.length);
    const manager = Forms.userById(project.managerId);
    const members = (project.memberIds || [])
      .map((id) => Forms.userById(id))
      .filter(Boolean);

    setText("pd-icon", U().initials(project.name));
    setText("pd-title", project.name);
    setText("pd-desc", project.description || "");
    setText(
      "pd-manager",
      "Manager — " + (manager ? manager.name : "—")
    );
    setText("pd-deadline", "Deadline — " + U().formatDate(project.deadline));
    setText("pd-progress-text", pct + "% Complete");
    el("pd-progress-bar").style.width = pct + "%";

    setText("pd-total", tasks.length);
    setText("pd-completed", done);
    setText("pd-inprogress", inProgress);
    setText("pd-overdue", overdue);

    el("pd-members").innerHTML =
      (members.length
        ? members
            .map(
              (m) =>
                '<span class="avatar avatar--sm" title="' +
                U().escapeHtml(m.name) +
                '" style="background:hsl(' +
                U().hueFrom(m.name) +
                ",70%,45%)" +
                '">' +
                U().initials(m.name) +
                "</span>"
            )
            .join("")
        : '<span class="small muted">No members</span>');
  }

  function renderKanban(project) {
    const board = el("kanban");
    const tasks = ST().get("tasks", []).filter((t) => t.projectId === projectId);

    board.innerHTML = COLUMNS.map((col) => {
      const colTasks = tasks
        .filter((t) => t.status === col)
        .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));

      const body =
        colTasks.length
          ? colTasks.map((t) => kanbanCard(t)).join("")
          : '<div class="kanban__empty">No tasks in ' + col + "</div>";

      return (
        '<section class="kanban__column" data-status="' +
        col +
        '">' +
        '<header class="kanban__head">' +
        '<span class="kanban__dot" style="width:9px;height:9px;border-radius:50%;background:' +
        colColor(col) +
        '"></span>' +
        col +
        '<span class="kanban__count">' +
        colTasks.length +
        "</span>" +
        "</header>" +
        '<div class="kanban__body" data-drop>' +
        body +
        "</div>" +
        "</section>"
      );
    }).join("");

    wireDnD(board);
  }

  function kanbanCard(t) {
    const assignee = Forms.userById(t.assignedTo);
    const isOverdue = U().isOverdue(t.dueDate, t.status);
    return (
      '<article class="kanban-card" draggable="true" data-id="' +
      t.id +
      '" role="button" tabindex="0" aria-label="Task: ' +
      U().escapeHtml(t.title) +
      '">' +
      '<div class="kanban-card__title">' +
      U().escapeHtml(t.title) +
      "</div>" +
      '<div class="flex wrap gap-2 mb-2">' +
      Forms.priorityBadge(t.priority) +
      (isOverdue ? '<span class="badge badge--overdue">Overdue</span>' : "") +
      "</div>" +
      '<div class="kanban-card__meta">' +
      (assignee
        ? '<span class="avatar avatar--xs" style="background:hsl(' +
          U().hueFrom(assignee.name) +
          ",70%,45%)" +
          '">' +
          U().initials(assignee.name) +
          "</span>"
        : "") +
      '<span class="kanban-card__due' +
      (isOverdue ? " muted" : "") +
      '">' +
      (isOverdue ? "Overdue • " : "") +
      U().formatDate(t.dueDate) +
      "</span>" +
      "</div>" +
      '<button type="button" class="icon-btn" data-view="' +
      t.id +
      '" aria-label="View task details"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>' +
      "</article>"
    );
  }

  function wireDnD(board) {
    let draggedId = null;

    board.querySelectorAll(".kanban-card[draggable]").forEach((card) => {
      card.addEventListener("dragstart", (e) => {
        draggedId = card.getAttribute("data-id");
        card.classList.add("is-dragging");
        try {
          e.dataTransfer.setData("text/plain", draggedId);
          e.dataTransfer.effectAllowed = "move";
        } catch (err) {}
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("is-dragging");
        board
          .querySelectorAll(".kanban__body")
          .forEach((b) => b.classList.remove("is-dragover"));
        draggedId = null;
      });
    });

    board.querySelectorAll(".kanban__body").forEach((dropzone) => {
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        dropzone.classList.add("is-dragover");
      });

      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("is-dragover");
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("is-dragover");
        const id = draggedId || e.dataTransfer.getData("text/plain");
        if (!id) return;

        const colStatus = dropzone.closest(".kanban__column").getAttribute(
          "data-status"
        );
        const tasks = ST().get("tasks", []);
        const task = tasks.find((t) => t.id === id);
        if (!task) return;

        if (task.status === colStatus) return;

        task.status = colStatus;
        ST().set("tasks", tasks);
        U().toast(
          "Task moved to " + colStatus + ": " + task.title + "",
          "info"
        );
        App.createNotification(
          "Task moved to " + colStatus + ": " + task.title,
          "status"
        );
        renderKanban(getProject());
        renderHeader(getProject());
      });
    });

    // Click-to-view on cards (keyboard + pointer)
    board.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-view]");
      if (btn) {
        e.stopPropagation();
        const task = ST()
          .get("tasks", [])
          .find((t) => t.id === btn.getAttribute("data-view"));
        if (task) Forms.taskView(task);
        return;
      }
      const card = e.target.closest(".kanban-card");
      if (card) {
        const task = ST()
          .get("tasks", [])
          .find((t) => t.id === card.getAttribute("data-id"));
        if (task) Forms.taskView(task);
      }
    });

    board.querySelectorAll(".kanban-card[draggable]").forEach((card) => {
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const task = ST()
            .get("tasks", [])
            .find((t) => t.id === card.getAttribute("data-id"));
          if (task) Forms.taskView(task);
        }
      });
    });
  }

  function colColor(col) {
    const map = {
      "To Do": "var(--text-faint)",
      "In Progress": "var(--primary)",
      Review: "var(--warning)",
      Completed: "var(--success)",
    };
    return map[col] || "var(--primary)";
  }

  function setText(id, value) {
    const node = el(id);
    if (node) node.textContent = value;
  }

  function el(id) {
    return document.getElementById(id);
  }

  document.addEventListener("DOMContentLoaded", init);
})();