/**
 * app.js
 * ------
 * Common application shell: authentication, sidebar, topbar,
 * theme, notifications, global search and shared page bootstrap.
 */
(function () {
  "use strict";

  const ST = () => window.TFStorage;
  const U = () => window.Utils;

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "grid" },
    { id: "tasks", label: "My Tasks", href: "tasks.html", icon: "check" },
    { id: "projects", label: "Projects", href: "projects.html", icon: "folder" },
    { id: "team", label: "Team", href: "team.html", icon: "users" },
    { id: "calendar", label: "Calendar", href: "calendar.html", icon: "calendar" },
    { id: "profile", label: "Profile", href: "profile.html", icon: "user" },
    { id: "settings", label: "Settings", href: "settings.html", icon: "gear" },
  ];

  const ICONS = {
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.7L19 10.5l-5.1 1.8L12 18l-1.9-5.7L5 10.5l5.1-1.8z"/></svg>',
  };

  const App = {
    currentUser: null,
    settings: null,
    page: null,

    /**
     * Hydrate the shared data cache from the backend and build the shell.
     * Returns a promise resolving to the current user (or null).
     */
    async init(page) {
      this.page = page || "dashboard";

      const publicPage = this.page === "login";

      // 1. Hydrate the data cache from the REST API.
      const auth = await ST().bootstrap();

      this.settings = ST().get("settings", {});
      this.applySettings();

      // 2. Auth check — index.html is public.
      this.currentUser = auth.user ? this.findUser(auth.user.id) || auth.user : null;

      if (!publicPage && !this.currentUser) {
        window.location.replace("index.html");
        return null;
      }

      // 3. Build shell for authed pages
      if (!publicPage) {
        this.buildShell();
        this.bindShellEvents();
      }
      return this.currentUser;
    },

    findUser(id) {
      if (!id) return null;
      const users = ST().get("users", []);
      const u = users.find((x) => x.id === id) || null;
      return u ? u : null;
    },

    /* ---------------- Auth ---------------- */

    login(email, password) {
      return fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: email, password: password }),
      })
        .then((res) =>
          res.json().then((data) => ({ res: res, data: data }))
        )
        .then(({ res, data }) => {
          if (!res.ok) {
            return { ok: false, error: data.error || "Login failed." };
          }
          ST().setLocal("currentUser", data.user);
          return { ok: true, user: data.user };
        })
        .catch(() => ({ ok: false, error: "Cannot reach the server." }));
    },

    loginDemo() {
      return fetch("/api/auth/demo", {
        method: "POST",
        credentials: "same-origin",
      })
        .then((res) => (res.ok ? res.json() : ({ user: null })))
        .then((data) => {
          if (!data || !data.user) return null;
          ST().setLocal("currentUser", data.user);
          return data.user;
        })
        .catch(() => null);
    },

    loginDemoNamed() {
      return this.loginDemo();
    },

    logout() {
      ST().clear();
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      }).catch(() => {});
      window.location.href = "index.html";
    },

    /* ---------------- Theme / settings ---------------- */

    applySettings() {
      const s = this.settings || {};
      if (s.theme === "dark") document.body.classList.add("dark-mode");
      else document.body.classList.remove("dark-mode");
      if (s.layout === "compact") document.body.classList.add("layout-compact");
      else document.body.classList.remove("layout-compact");
    },

    toggleTheme() {
      this.settings = ST().get("settings", {});
      this.settings.theme =
        document.body.classList.contains("dark-mode") ? "light" : "dark";
      ST().set("settings", this.settings);
      this.applySettings();
      const moon = document.getElementById("theme-toggle");
      if (moon) moon.innerHTML = ICONS[this.settings.theme === "dark" ? "sun" : "moon"];
    },

    saveSettings(patch) {
      this.settings = Object.assign({}, ST().get("settings", {}), patch);
      ST().set("settings", this.settings);
      this.applySettings();
    },

    /* ---------------- Notifications ---------------- */

    createNotification(message, type) {
      const list = ST().get("notifications", []);
      list.unshift({
        id: ST().generateId("ntf"),
        message: message,
        type: type || "task",
        read: false,
        createdAt: new Date().toISOString(),
      });
      if (list.length > 60) list.length = 60;
      ST().set("notifications", list);
      return list[0];
    },

    unreadCount() {
      const list = ST().get("notifications", []);
      return list.filter((n) => !n.read).length;
    },

    /* ---------------- Shell ---------------- */

    buildShell() {
      const u = this.currentUser;
      if (!u) return;
      const body = document.body;
      if (body.querySelector(".sidebar")) return;

      const dark = (this.settings && this.settings.theme) === "dark";
      const avatar =
        '<span class="avatar avatar--sm" style="background:hsl(' +
        U().hueFrom(u.name) +
        ',70%,45%)">' +
        U().initials(u.name) +
        "</span>";

      const shell = document.createElement("div");
      shell.className = "app-shell";
      shell.innerHTML =
        '<aside class="sidebar">' +
        '<div class="sidebar__brand">' +
        '<a href="dashboard.html" class="sidebar__logo" aria-label="Taskflow home">' +
        '<span class="logo-mark">TF</span>' +
        '<span class="logo-text">TASKFLOW</span>' +
        "</a>" +
        "</div>" +
        '<nav class="sidebar__nav" aria-label="Main navigation">' +
        NAV_ITEMS.map((item) => {
          const active = maybeActive(item, this.page);
          return (
            '<a href="' +
            item.href +
            '" class="sidebar__link' +
            (active ? " is-active" : "") +
            '" data-nav="' +
            item.id +
            '">' +
            '<span class="sidebar__icon">' +
            ICONS[item.icon] +
            "</span><span>" +
            item.label +
            "</span></a>"
          );
        }).join("") +
        "</nav>" +
        '<div class="sidebar__footer">' +
        '<button type="button" class="sidebar__link sidebar__link--flat" id="theme-toggle" aria-label="Toggle dark mode">' +
        '<span class="sidebar__icon">' +
        (dark ? ICONS.sun : ICONS.moon) +
        '</span><span id="theme-toggle-label">' +
        (dark ? "Light Mode" : "Dark Mode") +
        "</span></button>" +
        '<a href="profile.html" class="sidebar__user">' +
        avatar +
        '<span class="sidebar__user-meta"><strong>' +
        U().escapeHtml(u.name) +
        "</strong><small>" +
        U().escapeHtml(u.role) +
        "</small></span></a>" +
        "</div>" +
        "</aside>" +
        '<div class="sidebar-overlay" data-close-sidebar aria-hidden="true"></div>' +
        '<div class="app-main">' +
        '<header class="topbar">' +
        '<button type="button" class="topbar__menu" id="sidebar-open" aria-label="Open menu">' +
        ICONS.menu +
        "</button>" +
        '<div class="topbar__search" id="global-search">' +
        '<span class="topbar__search-icon">' + ICONS.search + "</span>" +
        '<input type="search" id="global-search-input" class="topbar__search-input" placeholder="Search tasks, projects, people..." aria-label="Global search">' +
        '<div class="search-results" id="search-results" hidden></div>' +
        "</div>" +
        '<div class="topbar__actions">' +
        '<div class="notif" id="notif-wrap">' +
        '<button type="button" class="topbar__icon-btn notif__btn" id="notif-toggle" aria-label="Notifications" aria-haspopup="true">' +
        ICONS.bell +
        '<span class="notif__dot" id="notif-dot" hidden>0</span>' +
        "</button>" +
        '<div class="notif__panel" id="notif-panel" hidden>' +
        '<div class="notif__head">' +
        "<strong>Notifications</strong>" +
        '<button type="button" class="btn-link" id="notif-mark-all">Mark all read</button>' +
        "</div>" +
        '<ul class="notif__list" id="notif-list" aria-label="Notifications list"></ul>' +
        "</div>" +
        "</div>" +
        '<div class="topbar__user" title="' +
        U().escapeHtml(u.name) +
        '">' +
        avatar +
        "<span>" +
        U().escapeHtml(u.name) +
        "</span></div>" +
        "</div>" +
        "</header>" +
        '<main class="content" id="page-content"></main>' +
        "</div>";

      body.prepend(shell);

      // Move the real page content into the shell.
      const real = document.getElementById("view");
      if (real) {
        document.getElementById("page-content").appendChild(real);
      }
    },

    bindShellEvents() {
      const openBtn = document.getElementById("sidebar-open");
      const overlay = document.querySelector(".sidebar-overlay");
      const body = document.body;

      if (openBtn) {
        openBtn.addEventListener("click", () => {
          body.classList.add("sidebar-open");
        });
      }
      if (overlay) {
        overlay.addEventListener("click", () => {
          body.classList.remove("sidebar-open");
        });
      }
      body.querySelectorAll(".sidebar__link").forEach((link) => {
        link.addEventListener("click", () => {
          body.classList.remove("sidebar-open");
        });
      });

      const themeBtn = document.getElementById("theme-toggle");
      if (themeBtn) {
        themeBtn.addEventListener("click", () => this.toggleTheme());
      }

      this.bindNotifications();
      this.bindGlobalSearch();
    },

    bindNotifications() {
      const toggle = document.getElementById("notif-toggle");
      const panel = document.getElementById("notif-panel");
      const dot = document.getElementById("notif-dot");
      if (!toggle || !panel) return;

      const render = () => {
        const list = ST().get("notifications", []);
        const unread = list.filter((n) => !n.read).length;
        dot.hidden = unread === 0;
        dot.textContent = unread > 9 ? "9+" : unread;
        const ul = document.getElementById("notif-list");
        const container = panel.querySelector(".notif__body") || panel;
        if (list.length === 0) {
          ul.innerHTML =
            '<li class="notif__empty">You have no notifications yet.</li>';
        } else {
          ul.innerHTML = list
            .map((n) => {
              const isUnread = n.read ? "" : " is-unread";
              return (
                '<li class="notif__item' +
                isUnread +
                '" data-id="' +
                n.id +
                '">' +
                '<div class="notif__item-main">' +
                '<span class="notif__type notif__type--' +
                (n.type || "task") +
                '"></span>' +
                '<div><p class="notif__msg">' +
                U().escapeHtml(n.message) +
                "</p>" +
                '<small class="notif__time">' +
                U().timeAgo(n.createdAt) +
                "</small></div></div>" +
                '<button type="button" class="notif__del" data-del="' +
                n.id +
                '" aria-label="Delete notification">&times;</button>' +
                "</li>"
              );
            })
            .join("");
        }
      };

      const togglePanel = (force) => {
        const show =
          force === undefined ? panel.hidden : !force;
        panel.hidden = !show;
        toggle.setAttribute("aria-expanded", String(show));
        if (show) render();
      };

      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePanel(panel.hidden);
      });

      document.addEventListener("click", (e) => {
        const wrap = document.getElementById("notif-wrap");
        if (wrap && !wrap.contains(e.target)) togglePanel(false);
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") togglePanel(false);
      });

      panel.addEventListener("click", (e) => {
        const item = e.target.closest(".notif__item");
        if (e.target.closest("[data-del]")) {
          const id = e.target.getAttribute("data-del");
          const list = ST().get("notifications", []).filter((n) => n.id !== id);
          ST().set("notifications", list);
          render();
          return;
        }
        if (item) {
          const list = ST().get("notifications", []);
          list.forEach((n) => {
            if (n.id === item.getAttribute("data-id")) n.read = true;
          });
          ST().set("notifications", list);
          render();
        }
      });

      const markAll = document.getElementById("notif-mark-all");
      if (markAll) {
        markAll.addEventListener("click", () => {
          const list = ST().get("notifications", []);
          list.forEach((n) => (n.read = true));
          ST().set("notifications", list);
          render();
        });
      }

      // store render for page use
      this.renderNotifications = render;
    },

    bindGlobalSearch() {
      const input = document.getElementById("global-search-input");
      const results = document.getElementById("search-results");
      if (!input || !results) return;

      const run = U().debounce(() => {
        const q = input.value.trim().toLowerCase();
        if (!q) {
          results.hidden = true;
          return;
        }

        const tasks = ST().get("tasks", []);
        const projects = ST().get("projects", []);
        const users = ST().get("users", []);

        const matchedTasks = tasks
          .filter(
            (t) =>
              (t.title || "").toLowerCase().includes(q) ||
              (t.description || "").toLowerCase().includes(q)
          )
          .slice(0, 4);
        const matchedProjects = projects
          .filter((p) => (p.name || "").toLowerCase().includes(q))
          .slice(0, 3);
        const matchedUsers = users
          .filter(
            (u) =>
              (u.name || "").toLowerCase().includes(q) ||
              (u.role || "").toLowerCase().includes(q)
          )
          .slice(0, 3);

        const buildUser = (u) =>
          '<span class="avatar avatar--xs" style="background:hsl(' +
          U().hueFrom(u.name) +
          ",70%,45%)'>" +
          U().initials(u.name) +
          "</span> " +
          U().escapeHtml(u.name) +
          ' <small>· ' +
          U().escapeHtml(u.role) +
          "</small>";

        let html = "";
        if (matchedTasks.length) {
          html += '<p class="search-results__group">Tasks</p>';
          html += matchedTasks
            .map(
              (t) =>
                '<a class="search-results__item" href="tasks.html?focus=' +
                t.id +
                '">' +
                '<span class="search-results__icon">' +
                ICONS.check +
                "</span>" +
                U().escapeHtml(t.title) +
                " <small>· " +
                U().escapeHtml(nameById(projects, t.projectId)) +
                "</small></a>"
            )
            .join("");
        }
        if (matchedProjects.length) {
          html += '<p class="search-results__group">Projects</p>';
          html += matchedProjects
            .map(
              (p) =>
                '<a class="search-results__item" href="project-details.html?id=' +
                p.id +
                '">' +
                '<span class="search-results__icon">' +
                ICONS.folder +
                "</span>" +
                U().escapeHtml(p.name) +
                "</a>"
            )
            .join("");
        }
        if (matchedUsers.length) {
          html += '<p class="search-results__group">People</p>';
          html += matchedUsers
            .map(
              (u) =>
                '<a class="search-results__item" href="team.html?member=' +
                u.id +
                '">' +
                '<span class="search-results__icon">' +
                ICONS.user +
                "</span>" +
                buildUser(u) +
                "</a>"
            )
            .join("");
        }
        if (!html) {
          html = '<p class="search-results__empty">No matches found.</p>';
        }
        results.innerHTML = html;
        results.hidden = false;
      }, 150);

      input.addEventListener("input", run);
      input.addEventListener("focus", run);
      document.addEventListener("click", (e) => {
        if (e.target.closest("#global-search")) return;
        results.hidden = true;
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") results.hidden = true;
      });
    },

    /* ---------------- Helpers ---------------- */

    pageBreadcrumbs(label) {
      return (
        '<div class="content-head">' +
        "<div><h1 class=\"content-head__title\">" +
        label +
        "</h1><p class=\"content-head__sub\">" +
        (this.pageSubtitle || "") +
        "</p></div></div>"
      );
    },
  };

  function maybeActive(item, page) {
    return (
      item.id === page ||
      (page === "project-details" && item.id === "projects")
    );
  }

  function nameById(projects, id) {
    const p = projects.find((x) => x.id === id);
    return p ? p.name : "";
  }

  window.App = App;

  // Utility exposed for page scripts
  window.TFApp = App;
})();