/**
 * forms.js
 * --------
 * Shared modal builders: task create/edit/detail, project create/edit,
 * member create/edit. Loaded on pages that manage records.
 */
(function () {
  "use strict";

  const ST = () => window.TFStorage;
  const U = () => window.Utils;
  const A = () => window.TFApp;

  const STATUSES = ["To Do", "In Progress", "Review", "Completed"];
  const PRIORITIES = ["Low", "Medium", "High", "Critical"];
  const ROLES = ["Project Manager", "Developer", "Designer", "Tester", "Team Member"];

  const Forms = {
    STATUSES,
    PRIORITIES,
    ROLES,

    /* ------------------------- select option helper ------------------------- */

    options(list, selected, labels) {
      return list
        .map(
          (v) =>
            '<option value="' +
            v +
            '"' +
            (v === selected ? " selected" : "") +
            ">" +
            (labels && labels[v] ? labels[v] : v) +
            "</option>"
        )
        .join("");
    },

    /* ------------------------------ TASK FORM ------------------------------ */

    task(config) {
      const c = config || {};
      const task = c.task || {};
      const projects = ST().get("projects", []);
      const users = ST().get("users", []);
      const isEdit = !!task.id;

      const projectOptions = this.options(
        projects.map((p) => p.id),
        task.projectId || c.projectId || "",
        projects.reduce((acc, p) => ((acc[p.id] = p.name), acc), {})
      );
      const memberOptions = this.options(
        users.map((u) => u.id),
        task.assignedTo || c.assignedTo || "",
        users.reduce((acc, u) => ((acc[u.id] = u.name), acc), {})
      );

      const body =
        '<form id="task-form" novalidate>' +
        '<div class="field"><label for="tf-title">Task Title</label>' +
        '<input type="text" id="tf-title" class="input" required value="' +
        U().escapeHtml(task.title || "") +
        '" placeholder="e.g. Fix Login Page" /></div>' +
        '<div class="field"><label for="tf-desc">Description</label>' +
        '<textarea id="tf-desc" class="textarea" placeholder="Short description of the task">' +
        U().escapeHtml(task.description || "") +
        "</textarea></div>" +
        '<div class="form-grid">' +
        '<div class="field"><label for="tf-project">Project</label>' +
        '<select id="tf-project" class="select" required>' +
        '<option value="">Select project</option>' + projectOptions +
        "</select></div>" +
        '<div class="field"><label for="tf-member">Assigned Member</label>' +
        '<select id="tf-member" class="select" required>' +
        '<option value="">Assign member</option>' + memberOptions +
        "</select></div>" +
        '<div class="field"><label for="tf-priority">Priority</label>' +
        '<select id="tf-priority" class="select">' +
        this.options(PRIORITIES, task.priority || "Medium") +
        "</select></div>" +
        '<div class="field"><label for="tf-status">Status</label>' +
        '<select id="tf-status" class="select">' +
        this.options(STATUSES, task.status || "To Do") +
        "</select></div>" +
        '<div class="field"><label for="tf-start">Start Date</label>' +
        '<input type="date" id="tf-start" class="input" value="' +
        (task.startDate || "") +
        '" /></div>' +
        '<div class="field"><label for="tf-due">Due Date</label>' +
        '<input type="date" id="tf-due" class="input" value="' +
        (task.dueDate || "") +
        '" required /></div>' +
        "</div>" +
        '<div class="modal__footer">' +
        '<button type="button" class="btn btn--ghost" data-close>Cancel</button>' +
        '<button type="submit" class="btn btn--primary">' +
        (isEdit ? "Save Changes" : "Create Task") +
        "</button>" +
        "</div>" +
        "</form>";

      const dialog = U().openModal(
        (isEdit ? "Edit Task" : "Create Task"),
        body,
        { labelId: "task-form-title" }
      );

      const form = dialog.overlay.querySelector("#task-form");

      const validate = () => {
        const title = form.querySelector("#tf-title").value.trim();
        const projectId = form.querySelector("#tf-project").value;
        const due = form.querySelector("#tf-due").value;
        if (!title) return "Task title is required.";
        if (!projectId) return "Please choose a project.";
        if (!due) return "A due date is required.";
        return null;
      };

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const err = validate();
        if (err) {
          U().toast(err, "warning");
          return;
        }
        const data = {
          title: form.querySelector("#tf-title").value.trim(),
          description: form.querySelector("#tf-desc").value.trim(),
          projectId: form.querySelector("#tf-project").value,
          assignedTo:
            form.querySelector("#tf-member").value || c.assignedTo || "user_001",
          priority: form.querySelector("#tf-priority").value,
          status: form.querySelector("#tf-status").value,
          startDate: form.querySelector("#tf-start").value,
          dueDate: form.querySelector("#tf-due").value,
        };

        let saved;
        if (isEdit) {
          saved = Object.assign({}, task, data);
          const list = ST().get("tasks", []).map((t) =>
            t.id === saved.id ? saved : t
          );
          ST().set("tasks", list);
          U().toast("Task updated successfully");
        } else {
          saved = Object.assign(
            {
              id: ST().generateId("task"),
              createdAt: new Date().toISOString().slice(0, 10),
            },
            data
          );
          const list = ST().get("tasks", []);
          list.unshift(saved);
          ST().set("tasks", list);
          const assignee = userById(saved.assignedTo);
          U().toast("Task created successfully");
          A().createNotification(
            (assignee ? assignee.name : "A team member") +
              " was assigned a new task: " +
              saved.title,
            "task"
          );
        }
        dialog.close();
        if (typeof c.onSave === "function") c.onSave(saved);
      });

      dialog.overlay.querySelector("[data-close]").addEventListener("click", () =>
        dialog.close()
      );
      return dialog;
    },

    /* -------------------------- TASK DETAIL VIEW -------------------------- */

    taskView(task) {
      const users = ST().get("users", []);
      const projects = ST().get("projects", []);
      const assignee = userById(task.assignedTo);
      const project = projectById(task.projectId);
      const overdue = U().isOverdue(task.dueDate, task.status);

      const body =
        '<div class="flex gap-3 wrap mb-3">' +
        statusBadge(task.status) +
        priorityBadge(task.priority) +
        (overdue ? '<span class="badge badge--overdue">Overdue</span>' : "") +
        "</div>" +
        '<p class="mt-2" style="color:var(--text-muted)">' +
        U().escapeHtml(task.description || "No description provided.") +
        "</p>" +
        '<div class="member-detail__grid mt-4">' +
        '<div class="member-detail__cell"><label>Project</label><p>' +
        U().escapeHtml(project ? project.name : "—") +
        "</p></div>" +
        '<div class="member-detail__cell"><label>Assigned to</label><p class="flex gap-2 align-center">' +
        avatarSm(assignee) +
        "<span>" +
        U().escapeHtml(assignee ? assignee.name : "—") +
        "</span></p></div>" +
        '<div class="member-detail__cell"><label>Start date</label><p>' +
        U().formatDate(task.startDate) +
        "</p></div>" +
        '<div class="member-detail__cell"><label>Due date</label><p>' +
        U().formatDate(task.dueDate) +
        "</p></div>" +
        "</div>";

      const dialog = U().openModal(U().escapeHtml(task.title || "Task"), body, {
        labelId: "task-detail-title",
      });
      return dialog;
    },

    /* ---------------------------- PROJECT FORM ---------------------------- */

    project(config) {
      const c = config || {};
      const project = c.project || {};
      const users = ST().get("users", []);
      const isEdit = !!project.id;

      const managerOptions = this.options(
        users.map((u) => u.id),
        project.managerId || "user_001",
        users.reduce((acc, u) => ((acc[u.id] = u.name), acc), {})
      );

      const body =
        '<form id="project-form" novalidate>' +
        '<p class="form-hint mb-3">Team members are managed from the team column below.</p>' +
        '<div class="field"><label for="pf-name">Project Name</label>' +
        '<input type="text" id="pf-name" class="input" required value="' +
        U().escapeHtml(project.name || "") +
        '" placeholder="e.g. Hospital Management System" /></div>' +
        '<div class="field"><label for="pf-desc">Description</label>' +
        '<textarea id="pf-desc" class="textarea" placeholder="What is this project about?">' +
        U().escapeHtml(project.description || "") +
        "</textarea></div>" +
        '<div class="form-grid">' +
        '<div class="field"><label for="pf-start">Start Date</label>' +
        '<input type="date" id="pf-start" class="input" value="' +
        (project.startDate || U().todayISO()) +
        '" required /></div>' +
        '<div class="field"><label for="pf-deadline">Deadline</label>' +
        '<input type="date" id="pf-deadline" class="input" value="' +
        (project.deadline || "") +
        '" required /></div>' +
        '<div class="field"><label for="pf-manager">Project Manager</label>' +
        '<select id="pf-manager" class="select">' +
        managerOptions +
        "</select></div>" +
        "</div>" +
        '<div class="field"><label for="pf-members">Team Members</label>' +
        '<input type="text" id="pf-members" class="input" value="' +
        (project.memberIds ? project.memberIds.join(", ") : "") +
        '" disabled placeholder="-"/><span class="form-hint">Suggest names below.</span></div>' +
        '<div class="tag-list mb-3" id="pf-member-list"></div>' +
        '<div class="modal__footer">' +
        '<button type="button" class="btn btn--ghost" data-close>Cancel</button>' +
        '<button type="submit" class="btn btn--primary">' +
        (isEdit ? "Save Changes" : "Create Project") +
        "</button>" +
        "</div>" +
        "</form>";

      const dialog = U().openModal(
        isEdit ? "Edit Project" : "Create Project",
        body,
        { labelId: "project-form-title" }
      );

      const form = dialog.overlay.querySelector("#project-form");
      const selected = new Set(project.memberIds || []);

      const renderMembers = () => {
        const container = dialog.overlay.querySelector("#pf-member-list");
        container.innerHTML = users
          .map((u) => {
            const active = selected.has(u.id);
            return (
              '<button type="button" class="member-tag' +
              (active ? "" : "") +
              '" style="' +
              (active
                ? "background:var(--primary-soft);color:var(--primary)"
                : "") +
              '" data-mid="' +
              u.id +
              '">' +
              avatarSm(u, true) +
              "<span>" +
              U().escapeHtml(u.name) +
              "</span></button>"
            );
          })
          .join("");
        container.querySelectorAll("[data-mid]").forEach((chip) => {
          chip.addEventListener("click", () => {
            const id = chip.getAttribute("data-mid");
            if (selected.has(id)) selected.delete(id);
            else selected.add(id);
            renderMembers();
          });
        });
      };
      renderMembers();

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = form.querySelector("#pf-name").value.trim();
        const deadline = form.querySelector("#pf-deadline").value;
        if (!name) return U().toast("Project name is required.", "warning");
        if (!deadline) return U().toast("A deadline is required.", "warning");

        const data = {
          name,
          description: form.querySelector("#pf-desc").value.trim(),
          startDate: form.querySelector("#pf-start").value,
          deadline,
          managerId: form.querySelector("#pf-manager").value,
          memberIds: Array.from(selected),
        };

        let saved;
        if (isEdit) {
          saved = Object.assign({}, project, data);
          const list = ST().get("projects", []).map((p) =>
            p.id === saved.id ? saved : p
          );
          ST().set("projects", list);
          U().toast("Project updated successfully");
        } else {
          saved = Object.assign(
            {
              id: ST().generateId("project"),
              createdAt: new Date().toISOString().slice(0, 10),
            },
            data
          );
          const list = ST().get("projects", []);
          list.unshift(saved);
          ST().set("projects", list);
          U().toast("Project created successfully");
          A().createNotification("New project created: " + saved.name, "project");
        }
        dialog.close();
        if (typeof c.onSave === "function") c.onSave(saved);
      });

      dialog.overlay.querySelector("[data-close]").addEventListener("click", () =>
        dialog.close()
      );
      return dialog;
    },

    /* ----------------------------- MEMBER FORM ----------------------------- */

    member(config) {
      const c = config || {};
      const member = c.member || {};
      const isEdit = !!member.id;

      const roleOptions = this.options(ROLES, member.role || "Team Member");

      const hue = U().hueFrom(member.name || "?");

      const body =
        '<form id="member-form" novalidate>' +
        '<div class="member-detail__head mb-4">' +
        '<span class="avatar avatar--lg" id="member-avatar" style="background:hsl(' +
        hue +
        ",70%,45%)" +
        '">' +
        U().initials(member.name || "?") +
        "</span>" +
        '<p class="form-hint">Your avatar is generated automatically from your initials.</p>' +
        "</div>" +
        '<div class="form-grid">' +
        '<div class="field"><label for="mf-name">Name</label>' +
        '<input type="text" id="mf-name" class="input" required value="' +
        U().escapeHtml(member.name || "") +
        '" placeholder="Full name" /></div>' +
        '<div class="field"><label for="mf-email">Email</label>' +
        '<input type="email" id="mf-email" class="input" required value="' +
        U().escapeHtml(member.email || "") +
        '" placeholder="name@example.com" /></div>' +
        '<div class="field"><label for="mf-phone">Phone</label>' +
        '<input type="tel" id="mf-phone" class="input" value="' +
        U().escapeHtml(member.phone || "") +
        '" placeholder="Phone number" /></div>' +
        '<div class="field"><label for="mf-role">Role</label>' +
        '<select id="mf-role" class="select">' +
        roleOptions +
        "</select></div>" +
        '<div class="field"><label for="mf-dept">Department</label>' +
        '<input type="text" id="mf-dept" class="input" value="' +
        U().escapeHtml(member.department || "") +
        '" placeholder="Department" /></div>' +
        "</div>" +
        '<div class="modal__footer">' +
        '<button type="button" class="btn btn--ghost" data-close>Cancel</button>' +
        '<button type="submit" class="btn btn--primary">' +
        (isEdit ? "Save Changes" : "Add Member") +
        "</button>" +
        "</div>" +
        "</form>";

      const dialog = U().openModal(
        isEdit ? "Edit Team Member" : "Add Team Member",
        body,
        { labelId: "member-form-title" }
      );

      const form = dialog.overlay.querySelector("#member-form");
      const nameInput = form.querySelector("#mf-name");

      nameInput.addEventListener("input", () => {
        const preview = dialog.overlay.querySelector("#member-avatar");
        if (preview) {
          const value = nameInput.value || "?";
          preview.textContent = U().initials(value);
          preview.style.background = "hsl(" + U().hueFrom(value) + ",70%,45%)";
        }
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const email = form.querySelector("#mf-email").value.trim();
        if (!name) return U().toast("Member name is required.", "warning");
        if (!email || !email.includes("@"))
          return U().toast("A valid email is required.", "warning");

        const data = {
          name,
          email,
          phone: form.querySelector("#mf-phone").value.trim(),
          role: form.querySelector("#mf-role").value,
          department: form.querySelector("#mf-dept").value.trim(),
        };

        let saved;
        if (isEdit) {
          saved = Object.assign({}, member, data);
          const list = ST().get("users", []).map((u) =>
            u.id === saved.id ? saved : u
          );
          ST().set("users", list);
          U().toast("Member updated successfully");
        } else {
          saved = Object.assign(
            {
              id: ST().generateId("user"),
              password: "demo123",
              bio: "",
            },
            data
          );
          const list = ST().get("users", []);
          list.push(saved);
          ST().set("users", list);
          U().toast("Team member added");
          A().createNotification("New team member joined: " + saved.name, "project");
        }
        dialog.close();
        if (typeof c.onSave === "function") c.onSave(saved);
      });

      dialog.overlay.querySelector("[data-close]").addEventListener("click", () =>
        dialog.close()
      );
      return dialog;
    },
  };

  /* -------- expose badge helpers used across page scripts -------- */

  Forms.statusBadge = statusBadge;
  Forms.priorityBadge = priorityBadge;
  Forms.userById = userById;
  Forms.projectById = projectById;

  window.Forms = Forms;
  window.TFForms = Forms;

  function statusBadge(status) {
    const key = String(status || "To Do").toLowerCase().replace(/\s+/g, "");
    const map = {
      todo: "status-todo",
      todo2: "status-todo",
      inprogress: "status-progress",
      review: "status-review",
      completed: "status-completed",
      done: "status-completed",
    };
    const cls = map[key] || "status-todo";
    const label = status || "To Do";
    return '<span class="badge badge--' + cls + '">' + U().escapeHtml(label) + "</span>";
  }

  function priorityBadge(priority) {
    const key = String(priority || "Medium").toLowerCase();
    const map = { low: "low", medium: "medium", high: "high", critical: "critical" };
    const cls = map[key] || "medium";
    const label = priority || "Medium";
    return '<span class="badge badge--priority-' + cls + '">' + U().escapeHtml(label) + "</span>";
  }

  function userById(id) {
    const users = ST().get("users", []);
    return users.find((u) => u.id === id) || null;
  }

  function projectById(id) {
    const projects = ST().get("projects", []);
    return projects.find((p) => p.id === id) || null;
  }

  function avatarSm(user, asTag) {
    const u = user || { name: "?", role: "" };
    const hue = U().hueFrom(u.name || "?");
    const face =
      '<span class="avatar avatar--sm" style="background:hsl(' +
      hue +
      ',70%,45%)">' +
      U().initials(u.name) +
      "</span>";
    return face;
  }

  function avatarLg(name) {
    const hue = U().hueFrom(name);
    return (
      '<span class="avatar avatar--lg" style="background:hsl(' +
      hue +
      ",70%,45%)" +
      '">' +
      U().initials(name) +
      "</span>"
    );
  }
})();