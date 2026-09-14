/**
 * utils.js
 * --------
 * Shared helpers: dates, formatters, DOM helpers, toast + modal system.
 */
(function () {
  "use strict";

  const Utils = {
    /**
     * Format an ISO date (YYYY-MM-DD) into a friendly label.
     */
    formatDate(value, opts) {
      if (!value) return "—";
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      const o = opts || {};
      const day = d.toLocaleDateString("en-US", { day: "numeric" });
      const monthShort = d.toLocaleDateString("en-US", { month: "short" });
      const year = d.getFullYear();
      if (o.short) return monthShort + " " + day;
      return monthShort + " " + day + " " + year;
    },

    /**
     * Relative "time ago" for notifications.
     */
    timeAgo(iso) {
      if (!iso) return "";
      const then = new Date(iso).getTime();
      if (isNaN(then)) return "";
      const diff = Date.now() - then;
      const min = Math.floor(diff / 60000);
      if (min < 1) return "Just now";
      if (min < 60) return min + " min ago";
      const hr = Math.floor(min / 60);
      if (hr < 24) return hr + " hr ago";
      const day = Math.floor(hr / 24);
      if (day < 7) return day + " day" + (day > 1 ? "s" : "") + " ago";
      const wk = Math.floor(day / 7);
      return wk + " week" + (wk > 1 ? "s" : "") + " ago";
    },

    /**
     * Normalize a date to midnight local time.
     */
    startOfDay(d) {
      const copy = new Date(d);
      copy.setHours(0, 0, 0, 0);
      return copy;
    },

    /**
     * Today's ISO date string (YYYY-MM-DD).
     */
    todayISO() {
      const d = new Date();
      return d.toISOString().slice(0, 10);
    },

    /**
     * True when dueDate ISO is before today.
     */
    isOverdue(dueISO, status) {
      if (!dueISO) return false;
      if (status === "Completed") return false;
      return dueISO !== undefined && dueISO !== null && dueISO < this.todayISO();
    },

    /**
     * Escape user-provided strings before injection into HTML.
     */
    escapeHtml(str) {
      return String(str === undefined || str === null ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },

    /**
     * Generate initials from a name, max two letters.
     */
    initials(name) {
      if (!name) return "?";
      const parts = String(name).trim().split(/\s+/);
      const first = parts[0].charAt(0) || "";
      const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
      return (first + last).toUpperCase();
    },

    /**
     * Deterministic pastel hue from a string (for avatar colors).
     */
    hueFrom(name) {
      let h = 0;
      const s = String(name || "?");
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
      return h;
    },

    /**
     * Inline SVG data URI for a notification bell / icons not needed —
     * we use inline <svg> in HTML. Kept as a helper for small glyphs.
     */
    debounce(fn, wait) {
      let t;
      return function () {
        const ctx = this;
        const args = arguments;
        clearTimeout(t);
        t = setTimeout(() => fn.apply(ctx, args), wait);
      };
    },

    /**
     * Clamp a number between min and max.
     */
    clamp(n, min, max) {
      return Math.min(max, Math.max(min, n));
    },

    /**
     * Percentage helper, immune to divide-by-zero.
     */
    percent(done, total) {
      if (!total) return 0;
      return Math.round((done / total) * 100);
    },

    /**
     * Show a toast notification.
     */
    toast(message, type) {
      let container = document.getElementById("toast-container");
      if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        container.setAttribute("aria-live", "polite");
        document.body.appendChild(container);
      }
      const el = document.createElement("div");
      el.className = "toast toast--" + (type || "success");
      el.setAttribute("role", "status");
      const icon =
        type === "error"
          ? "!"
          : type === "warning"
            ? "⚠"
            : "✓";
      el.innerHTML =
        '<span class="toast__icon">' +
        icon +
        "</span><span class=\"toast__msg\"></span>";
      el.querySelector(".toast__msg").textContent = message;
      container.appendChild(el);
      requestAnimationFrame(() => el.classList.add("toast--visible"));
      setTimeout(() => {
        el.classList.remove("toast--visible");
        setTimeout(() => el.remove(), 300);
      }, 3200);
    },

    /**
     * Open a generic modal dialog.
     * Returns the dialog element for custom markup injection.
     */
    openModal(header, bodyHTML, options) {
      const o = options || {};
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay modal-overlay--open";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      if (o.labelId) overlay.setAttribute("aria-labelledby", o.labelId);

      overlay.innerHTML =
        '<div class="modal">' +
        '<div class="modal__header"><h3 class="modal__title" id="' +
        (o.labelId || "taskflow-modal-title") +
        '">' +
        header +
        '</h3><button type="button" class="modal__close" aria-label="Close dialog">&times;</button></div>' +
        '<div class="modal__body">' +
        bodyHTML +
        "</div>" +
        "</div>";

      const close = () => overlay.remove();
      overlay.querySelector(".modal__close").addEventListener("click", close);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay && o.dismissible !== false) close();
      });
      document.addEventListener("keydown", function onKey(ev) {
        if (ev.key === "Escape" && document.body.contains(overlay)) {
          close();
          document.removeEventListener("keydown", onKey);
        }
      });
      document.body.appendChild(overlay);
      const firstInput = overlay.querySelector("input, select, textarea, button");
      if (firstInput && o.focus !== false) firstInput.focus();
      return { overlay, close };
    },

    /**
     * Confirmation dialog built on top of the modal system.
     */
    confirm(message, options) {
      const o = options || {};
      return new Promise((resolve) => {
        const dialog = this.openModal(
          o.title || "Are you sure?",
          '<p class="confirm-text">' + message + "</p>" +
            '<div class="modal__footer">' +
            '<button type="button" class="btn btn--ghost" data-cancel>Cancel</button>' +
            '<button type="button" class="btn btn--danger" data-confirm>' +
            (o.confirmLabel || "Confirm") +
            "</button>" +
            "</div>",
          { dismissible: true }
        );
        dialog.overlay.querySelector("[data-cancel]").addEventListener(
          "click",
          () => {
            dialog.close();
            resolve(false);
          }
        );
        dialog.overlay.querySelector("[data-confirm]").addEventListener(
          "click",
          () => {
            dialog.close();
            resolve(true);
          }
        );
      });
    },

    /**
     * Escape key already handled by openModal. Prevent double listeners
     * by checking modal count before appending.
     */
  };

  window.Utils = Utils;

  // Esc-key handler for closing the last active modal only.
  window.TFUtils = Utils;
})();