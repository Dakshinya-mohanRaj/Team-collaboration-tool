/**
 * profile.js
 * ----------
 * Profile display + editing. Also refreshes the sidebar identity.
 */
(function () {
  "use strict";

  const ST = () => window.TFStorage;
  const U = () => window.Utils;

  async function init() {
    const user = await App.init("profile");
    if (!user) return;
    render(user);

    document.getElementById("profile-edit-btn").addEventListener("click", () => {
      openEdit(user);
    });
  }

  function render(user) {
    const tasks = ST().get("tasks", []).filter((t) => t.assignedTo === user.id);
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    const overdue = tasks.filter((t) => U().isOverdue(t.dueDate, t.status)).length;

    const avatar = document.getElementById("profile-avatar");
    avatar.textContent = U().initials(user.name);
    avatar.style.background =
      "hsl(" + U().hueFrom(user.name) + ",70%,45%)";

    document.getElementById("profile-name").textContent = user.name || "—";
    document.getElementById("profile-role").textContent = user.role || "Team Member";
    document.getElementById("profile-dept").textContent = user.department || "";

    document.getElementById("profile-total").textContent = tasks.length;
    document.getElementById("profile-completed").textContent = completed;
    document.getElementById("profile-inprogress").textContent = inProgress;
    document.getElementById("profile-overdue").textContent = overdue;

    document.getElementById("pi-name").textContent = user.name || "—";
    document.getElementById("pi-email").textContent = user.email || "—";
    document.getElementById("pi-phone").textContent = user.phone || "—";
    document.getElementById("pi-dept").textContent = user.department || "—";
    document.getElementById("pi-bio").textContent =
      user.bio || "No bio yet — click Edit Profile to add one.";
  }

  function openEdit(member) {
    const body =
      '<form id="profile-form" novalidate>' +
      '<div class="field"><label for="pf-name">Name</label>' +
      '<input type="text" id="pf-name" class="input" required value="' +
      U().escapeHtml(member.name || "") +
      '" /></div>' +
      '<div class="form-grid">' +
      '<div class="field"><label for="pf-email">Email</label>' +
      '<input type="email" id="pf-email" class="input" required value="' +
      U().escapeHtml(member.email || "") +
      '" /></div>' +
      '<div class="field"><label for="pf-phone">Phone</label>' +
      '<input type="tel" id="pf-phone" class="input" value="' +
      U().escapeHtml(member.phone || "") +
      '" /></div>' +
      '<div class="field"><label for="pf-dept">Department</label>' +
      '<input type="text" id="pf-dept" class="input" value="' +
      U().escapeHtml(member.department || "") +
      '" /></div>' +
      '<div class="field"><label for="pf-role">Role</label>' +
      '<input type="text" id="pf-role" class="input" value="' +
      U().escapeHtml(member.role || "") +
      '" /></div>' +
      "</div>" +
      '<div class="field"><label for="pf-bio">Bio</label>' +
      '<textarea id="pf-bio" class="textarea" placeholder="A short bio about yourself">' +
      U().escapeHtml(member.bio || "") +
      "</textarea></div>" +
      '<div class="modal__footer">' +
      '<button type="button" class="btn btn--ghost" data-close>Cancel</button>' +
      '<button type="submit" class="btn btn--primary">Save Changes</button>' +
      "</div>" +
      "</form>";

    const dialog = U().openModal("Edit Profile", body, {
      labelId: "profile-edit-title",
    });
    const form = dialog.overlay.querySelector("#profile-form");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.querySelector("#pf-name").value.trim();
      const email = form.querySelector("#pf-email").value.trim();
      if (!name) return U().toast("Name is required.", "warning");
      if (!email.includes("@"))
        return U().toast("A valid email is required.", "warning");

      const data = {
        name,
        email,
        phone: form.querySelector("#pf-phone").value.trim(),
        department: form.querySelector("#pf-dept").value.trim(),
        role: form.querySelector("#pf-role").value.trim(),
        bio: form.querySelector("#pf-bio").value.trim(),
      };

      const users = ST()
        .get("users", [])
        .map((u) => (u.id === member.id ? Object.assign({}, u, data) : u));
      ST().set("users", users);

      const updated = users.find((u) => u.id === member.id);
      window.App.currentUser = updated;
      U().toast("Changes saved");
      dialog.close();

      // refresh sidebar identity
      const sidebarUser = document.querySelector(".sidebar__user");
      if (sidebarUser) {
        sidebarUser.innerHTML =
          '<span class="avatar avatar--sm" style="background:hsl(' +
          U().hueFrom(data.name) +
          ",70%,45%)" +
          '">' +
          U().initials(data.name) +
          "</span>" +
          '<span class="sidebar__user-meta"><strong>' +
          U().escapeHtml(data.name) +
          "</strong><small>" +
          U().escapeHtml(data.role || "Team Member") +
          "</small></span>";
      }

      render(updated);
    });

    dialog.overlay.querySelector("[data-close]").addEventListener("click", () =>
      dialog.close()
    );
  }

  document.addEventListener("DOMContentLoaded", init);
})();