/**
 * team.js
 * -------
 * Team management: member cards, stats, add/edit/delete, details modal.
 */
(function () {
  "use strict";

  const ST = () => window.TFStorage;
  const U = () => window.Utils;

  let searchTerm = "";
  let roleFilter = "";

  function init() {
    const user = App.init("team");
    if (!user) return;

    document.getElementById("new-member-btn").addEventListener("click", openNew);

    const search = document.getElementById("member-search");
    search.addEventListener(
      "input",
      U().debounce(() => {
        searchTerm = search.value.trim().toLowerCase();
        render();
      }, 150)
    );

    document.getElementById("member-role-filter").addEventListener("change", (e) => {
      roleFilter = e.target.value;
      render();
    });

    render();

    const params = new URLSearchParams(window.location.search);
    const member = params.get("member");
    if (member) {
      setTimeout(() => showMember(member), 120);
    }
  }

  function getFiltered() {
    let members = ST().get("users", []);
    if (roleFilter) members = members.filter((m) => m.role === roleFilter);
    if (searchTerm) {
      members = members.filter((m) =>
        (
          (m.name || "") +
          " " +
          (m.role || "") +
          " " +
          (m.department || "")
        )
          .toLowerCase()
          .includes(searchTerm)
      );
    }
    return members;
  }

  function render() {
    const grid = document.getElementById("member-grid");
    const empty = document.getElementById("member-empty");
    const members = getFiltered();

    if (!members.length) {
      grid.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    grid.innerHTML = members.map(memberCard).join("");
  }

  function memberCard(m) {
    const tasks = ST().get("tasks", []).filter((t) => t.assignedTo === m.id);
    const done = tasks.filter((t) => t.status === "Completed").length;
    const overdue = tasks.filter((t) => U().isOverdue(t.dueDate, t.status)).length;

    return (
      '<article class="member-card" data-member-id="' +
      m.id +
      '" tabindex="0" role="button" aria-label="Open profile for ' +
      U().escapeHtml(m.name) +
      '">' +
      '<div class="member-card__manage">' +
      '<button type="button" class="icon-btn" data-edit="' +
      m.id +
      '" aria-label="Edit member">' +
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>' +
      "</button>" +
      "</div>" +
      avatar(m.name, "lg") +
      '<h3 class="member-card__name">' +
      U().escapeHtml(m.name) +
      "</h3>" +
      '<span class="member-card__role">' +
      U().escapeHtml(m.role || "Team Member") +
      "</span>" +
      '<span class="member-card__dept">' +
      U().escapeHtml(m.department || "") +
      "</span>" +
      '<div class="member-card__stats">' +
      '<div class="member-card__stat"><strong>' +
      tasks.length +
      "</strong><small>Tasks</small></div>" +
      '<div class="member-card__stat"><strong>' +
      done +
      "</strong><small>Completed</small></div>" +
      '<div class="member-card__stat"><strong>' +
      workload(m, tasks) +
      "</strong><small>Workload</small></div>" +
      "</div>" +
      "</article>"
    );
  }

  function workload(member, tasks) {
    const active = tasks.filter(
      (t) => t.status !== "Completed"
    ).length;
    const capacity = 6;
    const pct = Math.min(100, Math.round((active / capacity) * 100));
    return pct + "%";
  }

  function avatar(name, size) {
    const cls = size === "lg" ? "avatar--lg" : "avatar--md";
    return (
      '<span class="avatar ' +
      cls +
      '" style="background:hsl(' +
      U().hueFrom(name) +
      ",70%,45%)" +
      '">' +
      U().initials(name) +
      "</span>"
    );
  }

  function openNew() {
    Forms.member({
      onSave() {
        render();
      },
    });
  }

  function showMember(id) {
    const member = ST()
      .get("users", [])
      .find((m) => m.id === id);
    if (!member) return U().toast("Member not found.", "error");

    const tasks = ST().get("tasks", []).filter((t) => t.assignedTo === id);
    const done = tasks.filter((t) => t.status === "Completed").length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    const overdue = tasks.filter((t) => U().isOverdue(t.dueDate, t.status)).length;

    const taskRows =
      tasks.length
        ? tasks
            .slice()
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .map((t) => {
              const project = Forms.projectById(t.projectId);
              return (
                '<div class="deadline-item">' +
                '<div class="min-w-0">' +
                '<div class="deadline-item__title">' +
                U().escapeHtml(t.title) +
                "</div>" +
                '<div class="deadline-item__proj">' +
                U().escapeHtml(project ? project.name : "") +
                "</div>" +
                "</div>" +
                '<div class="flex gap-2 wrap" style="margin-left:auto;align-items:center">' +
                Forms.priorityBadge(t.priority) +
                Forms.statusBadge(t.status) +
                '<span class="small muted">' +
                U().formatDate(t.dueDate) +
                "</span>" +
                "</div>" +
                "</div>"
              );
            })
            .join("")
        : '<p class="muted small">No tasks assigned yet.</p>';

    const body =
      '<div class="member-detail">' +
      '<div class="member-detail__head">' +
      avatar(member.name, "lg") +
      "<div>" +
      '<div class="member-detail__name">' +
      U().escapeHtml(member.name) +
      "</div>" +
      '<div class="member-detail__role">' +
      U().escapeHtml(member.role || "Team Member") +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="member-detail__grid">' +
      '<div class="member-detail__cell"><label>Email</label><p>' +
      U().escapeHtml(member.email || "—") +
      "</p></div>" +
      '<div class="member-detail__cell"><label>Phone</label><p>' +
      U().escapeHtml(member.phone || "—") +
      "</p></div>" +
      '<div class="member-detail__cell"><label>Department</label><p>' +
      U().escapeHtml(member.department || "—") +
      "</p></div>" +
      '<div class="member-detail__cell"><label>Assigned tasks</label><p>' +
      tasks.length +
      "</p></div>" +
      "</div>" +
      '<div class="member-detail__stats">' +
      '<div class="mini-stat"><div class="mini-stat__value">' +
      tasks.length +
      '</div><div class="mini-stat__label">Total</div></div>' +
      '<div class="mini-stat"><div class="mini-stat__value">' +
      done +
      '</div><div class="mini-stat__label">Completed</div></div>' +
      '<div class="mini-stat"><div class="mini-stat__value">' +
      inProgress +
      '</div><div class="mini-stat__label">In Progress</div></div>' +
      '<div class="mini-stat"><div class="mini-stat__value">' +
      overdue +
      '</div><div class="mini-stat__label">Overdue</div></div>' +
      "</div>" +
      "<div>" +
      '<h4 class="section__title mb-2">Assigned Tasks</h4>' +
      '<div class="deadline-list">' +
      taskRows +
      "</div>" +
      "</div>" +
      "</div>";

    U().openModal(U().escapeHtml(member.name), body, {
      labelId: "member-detail-title",
    });
  }

  function editMember(id) {
    const member = ST()
      .get("users", [])
      .find((m) => m.id === id);
    if (!member) return U().toast("Member not found.", "error");
    Forms.member({
      member,
      onSave() {
        render();
      },
    });
  }

  document.getElementById("member-grid").addEventListener("click", (e) => {
    const edit = e.target.closest("[data-edit]");
    if (edit) {
      e.stopPropagation();
      editMember(edit.getAttribute("data-edit"));
      return;
    }
    const card = e.target.closest("[data-member-id]");
    if (card) showMember(card.getAttribute("data-member-id"));
  });

  document.getElementById("member-grid").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const card = e.target.closest("[data-member-id]");
      if (card) {
        e.preventDefault();
        showMember(card.getAttribute("data-member-id"));
      }
    }
  });

  document.addEventListener("DOMContentLoaded", init);
})();