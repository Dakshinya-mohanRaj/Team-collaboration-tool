/**
 * settings.js
 * -----------
 * Appearance / layout / notification preferences + data reset.
 */
(function () {
  "use strict";

  const ST = () => window.TFStorage;
  const U = () => window.Utils;

  async function init() {
    const user = await App.init("settings");
    if (!user) return;

    loadValues();

    const themeGroup = document.getElementById("theme-toggle-group");
    themeGroup.querySelectorAll("[data-theme]").forEach((btn) => {
      btn.addEventListener("click", () => {
        App.saveSettings({ theme: btn.getAttribute("data-theme") });
        loadValues();
        U().toast("Theme updated");
      });
    });

    const layoutGroup = document.getElementById("layout-toggle-group");
    layoutGroup.querySelectorAll("[data-layout]").forEach((btn) => {
      btn.addEventListener("click", () => {
        App.saveSettings({ layout: btn.getAttribute("data-layout") });
        loadValues();
        U().toast("Layout updated");
      });
    });

    const notifSwitch = document.getElementById("notif-switch");
    notifSwitch.addEventListener("change", () => {
      App.saveSettings({ notifications: notifSwitch.checked });
      U().toast(
        notifSwitch.checked
          ? "Notifications enabled"
          : "Notifications disabled"
      );
    });

    document.getElementById("reset-data").addEventListener("click", async () => {
      const ok = await U().confirm(
        "This will erase all your current data and restore the original demo dataset. Continue?",
        { title: "Reset demo data", confirmLabel: "Reset Data" }
      );
      if (!ok) return;
      try {
        await fetch("/api/reset", {
          method: "POST",
          credentials: "same-origin",
        });
        await ST().bootstrap();
        U().toast("Demo data restored");
        location.href = "dashboard.html";
      } catch (err) {
        U().toast("Could not reset data. Please try again.", "error");
      }
    });
  }

  function loadValues() {
    const settings = ST().get("settings", {});
    const theme = settings.theme || "light";
    const layout = settings.layout || "comfortable";

    document.querySelectorAll("[data-theme]").forEach((btn) => {
      btn.classList.toggle(
        "is-active",
        btn.getAttribute("data-theme") === theme
      );
    });
    document.querySelectorAll("[data-layout]").forEach((btn) => {
      btn.classList.toggle(
        "is-active",
        btn.getAttribute("data-layout") === layout
      );
    });
    const notifSwitch = document.getElementById("notif-switch");
    notifSwitch.checked = settings.notifications !== false;
  }

  document.addEventListener("DOMContentLoaded", init);
})();