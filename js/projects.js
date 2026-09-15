/**
 * projects.js
 * -----------
 * Project management: list, create, edit, delete, search.
 */
(function () {
  "use strict";

  const ST = () => window.TFStorage;
  const U = () => window.Utils;

  let searchTerm = "";

  async function init() {
    const user = await App.init("projects");
    if (!user) return;

    document.getElementById("new-project-btn").addEventListener("click", openNew);
    document.getElementById("empty-new-project").addEventListener("click", openNew);

    const search = document.getElementById("project-search");
    search.addEventListener(
      "input",
      U().debounce(() => {
        searchTerm = search.value.trim().toLowerCase();
        render();
      }, 150)
    );

    render();
  }

  function getFiltered() {
    const projects = ST().get("projects", []);
    if (!searchTerm) return projects;
    return projects.filter((p) =>
      (p.name + " " + (p.description || "")).toLowerCase().includes(searchTerm)
    );
  }

  function render() {
    const grid = document.getElementById("project-grid");
    const empty = document.getElementById("project-empty");
    const projects = getFiltered();

    if (!projects.length) {
      grid.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    grid.innerHTML = projects.map(projectCard).join("");
  }

  function projectCard(p) {
    const tasks = ST().get("tasks", []).filter((t) => t.projectId === p.id);
    const done = tasks.filter((t) => t.status === "Completed").length;
    const pct = U().percent(done, tasks.length);
    const manager = Forms.userById(p.managerId);
    const members = (p.memberIds || [])
      .map((id) => Forms.userById(id))
      .filter(Boolean);

    return (
      '<article class="card card--hover project-card" data-project-id="' +
      p.id +
      '">' +
      '<div class="project-card__head">' +
      '<div class="project-avatar">' +
      U().initials(p.name) +
      "</div>" +
      '<div class="min-w-0">' +
      '<h3 class="project-card__name">' +
      U().escapeHtml(p.name) +
      "</h3>" +
      '<p class="project-card__desc">' +
      U().escapeHtml(p.description || "") +
      "</p>" +
      "</div>" +
      "</div>" +
      '<div class="project-card__stats">' +
      "<div><strong>" +
      tasks.length +
      "</strong> tasks</div>" +
      "<div><strong>" +
      done +
      "</strong> completed</div>" +
      "<div><strong>" +
      pct +
      "%</strong> done</div>" +
      "</div>" +
      '<div class="progress"><div class="progress__bar' +
      (pct < 40 && tasks.length ? " progress__bar--danger" : "") +
      '" style="width:' +
      pct +
      '%"></div></div>' +
      '<div class="project-card__footer">' +
      '<div class="flex gap-3 align-center wrap">' +
      '<span class="avatar-row">' +
      members
        .slice(0, 4)
        .map((m) => miniAvatar(m))
        .join("") +
      "</span>" +
      '<span class="daterange-mini">' +
      U().formatDate(p.startDate) +
      " → " +
      U().formatDate(p.deadline) +
      "</span>" +
      "</div>" +
      '<div class="action-row">' +
      '<button type="button" class="btn btn--sm btn--secondary" data-act="view" data-id="' +
      p.id +
      '">View</button>' +
      '<button type="button" class="icon-btn" data-act="edit" data-id="' +
      p.id +
      '" aria-label="Edit project" title="Edit">' +
      editIcon() +
      "</button>" +
      '<button type="button" class="icon-btn icon-btn--danger" data-act="delete" data-id="' +
      p.id +
      '" aria-label="Delete project" title="Delete">' +
      trashIcon() +
      "</button>" +
      "</div>" +
      "</div>" +
      "<p class=\"small muted\">Manager: " +
      U().escapeHtml(manager ? manager.name : "—") +
      "</p>" +
      "</article>"
    );
  }

  function miniAvatar(user) {
    return (
      '<span class="avatar avatar--sm" title="' +
      U().escapeHtml(user.name) +
      '" style="background:hsl(' +
      U().hueFrom(user.name) +
      ",70%,45%)" +
      '">' +
      U().initials(user.name) +
      "</span>"
    );
  }

  function editIcon() {
    return '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>';
  }

  function trashIcon() {
    return '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
  }

  function openNew() {
    Forms.project({
      onSave() {
        render();
      },
    });
  }

  function openEdit(id) {
    const project = ST()
      .get("projects", [])
      .find((p) => p.id === id);
    if (!project) return U().toast("Project not found.", "error");
    Forms.project({
      project,
      onSave() {
        render();
      },
    });
  }

  async function confirmDelete(id) {
    const project = ST()
      .get("projects", [])
      .find((p) => p.id === id);
    if (!project) return;

    const ok = await U().confirm(
      'Are you sure you want to delete this project? <br /><strong>' +
        U().escapeHtml(project.name) +
        "</strong><br /><span class=\"small muted\">All of its tasks will also be removed.</span>",
      { title: "Delete project", confirmLabel: "Delete Project" }
    );
    if (!ok) return;

    let tasks = ST().get("tasks", []).filter((t) => t.projectId !== id);
    ST().set("tasks", tasks);
    const projects = ST()
      .get("projects", [])
      .filter((p) => p.id !== id);
    ST().set("projects", projects);
    U().toast("Project deleted successfully");
    render();
  }

  document.getElementById("project-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const act = btn.getAttribute("data-act");
    if (act === "view") window.location.href = "project-details.html?id=" + id;
    else if (act === "edit") openEdit(id);
    else if (act === "delete") confirmDelete(id);
  });

  document.addEventListener("DOMContentLoaded", init);
})();