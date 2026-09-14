/**
 * calendar.js
 * -----------
 * Pure vanilla JS calendar with deadline highlighting.
 */
(function () {
  "use strict";

  const ST = () => window.TFStorage;
  const U = () => window.Utils;

  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth();
  let selectedDate = U().todayISO();

  function init() {
    const user = App.init("calendar");
    if (!user) return;

    document.getElementById("cal-prev").addEventListener("click", () => {
      shiftMonth(-1);
    });
    document.getElementById("cal-next").addEventListener("click", () => {
      shiftMonth(1);
    });
    document.getElementById("cal-today").addEventListener("click", () => {
      const now = new Date();
      viewYear = now.getFullYear();
      viewMonth = now.getMonth();
      selectedDate = U().todayISO();
      render();
    });

    render();
  }

  function shiftMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear -= 1;
    } else if (viewMonth > 11) {
      viewMonth = 0;
      viewYear += 1;
    }
    render();
  }

  function tasksByDate() {
    const tasks = ST().get("tasks", []);
    const map = {};
    tasks.forEach((t) => {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    });
    return map;
  }

  function render() {
    const byDate = tasksByDate();
    const today = U().todayISO();
    const grid = document.getElementById("cal-grid");
    const title = document.getElementById("cal-title");

    const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString(
      "en-US",
      { month: "long", year: "numeric" }
    );
    title.textContent = monthName;

    const first = new Date(viewYear, viewMonth, 1);
    const startDow = first.getDay();

    const cells = [];
    for (let i = 0; i < 7; i++) {
      cells.push(
        '<div class="cal-dow" role="columnheader">' + DOW[i] + "</div>"
      );
    }

    const startOffset = startDow;
    const prevDays = new Date(viewYear, viewMonth, 0).getDate();

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevDays - i;
      const iso = isoDate(viewYear, viewMonth - 1, d);
      cells.push(dayCell(iso, d, true, byDate[iso], today));
    }

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = isoDate(viewYear, viewMonth, d);
      cells.push(dayCell(iso, d, false, byDate[iso], today));
    }

    const totalCells = cells.length;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const iso = isoDate(viewYear, viewMonth + 1, i);
      cells.push(dayCell(iso, i, true, byDate[iso], today));
    }

    grid.innerHTML = cells.join("");
    renderDetail();

    grid.querySelectorAll(".cal-day").forEach((cell) => {
      cell.addEventListener("click", () => {
        selectedDate = cell.getAttribute("data-iso");
        renderDetail();
        grid
          .querySelectorAll(".cal-day.is-selected")
          .forEach((c) => c.classList.remove("is-selected"));
        cell.classList.add("is-selected");
      });
    });
  }

  function dayCell(iso, dayNum, other, tasks, today) {
    const classes = ["cal-day"];
    if (other) classes.push("cal-day--other");
    if (iso === today) classes.push("cal-day--today");
    if (iso === selectedDate) classes.push("is-selected");

    let dots = "";
    if (tasks && tasks.length) {
      const list = tasks.slice(0, 4);
      dots =
        '<div class="cal-day__dots">' +
        list
          .map((t) => {
            const overdue = U().isOverdue(t.dueDate, t.status);
            const completed = t.status === "Completed";
            const cls = overdue
              ? "cal-dot cal-dot--overdue"
              : completed
                ? "cal-dot"
                : "cal-dot cal-dot--due";
            return (
              '<span class="' +
              cls +
              '" title="' +
              U().escapeHtml(t.title) +
              '">' +
              (completed ? "✓ " : "") +
              U().escapeHtml(t.title) +
              "</span>"
            );
          })
          .join("") +
        (tasks.length > 4
          ? '<span class="small muted">+' +
            (tasks.length - 4) +
            " more</span>"
          : "") +
        "</div>";
    }

    return (
      '<div class="' +
      classes.join(" ") +
      '" data-iso="' +
      iso +
      '" role="gridcell" tabindex="0" aria-label="' +
      iso +
      '">' +
      '<span class="cal-day__num">' +
      dayNum +
      "</span>" +
      dots +
      "</div>"
    );
  }

  function renderDetail() {
    const title = document.getElementById("cal-detail-title");
    const dateEl = document.getElementById("cal-detail-date");
    const list = document.getElementById("cal-detail-list");

    const tasks = ST()
      .get("tasks", [])
      .filter((t) => t.dueDate === selectedDate);

    const nice = new Date(selectedDate + "T00:00:00").toLocaleDateString(
      "en-US",
      { weekday: "long", month: "long", day: "numeric", year: "numeric" }
    );
    dateEl.textContent = nice;

    const isToday = selectedDate === U().todayISO();
    title.textContent = isToday
      ? "Tasks due today"
      : "Tasks due " +
        new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });

    if (!tasks.length) {
      list.innerHTML = '<p class="muted small">No tasks scheduled on this date.</p>';
      return;
    }

    list.innerHTML = tasks
      .map((t) => {
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
          '<div class="flex gap-2 wrap align-center">' +
          Forms.statusBadge(t.status) +
          (overdue
            ? '<span class="badge badge--overdue">Overdue</span>'
            : "") +
          "</div>" +
          "</button>"
        );
      })
      .join("");

    list.querySelectorAll("[data-task]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const task = ST()
          .get("tasks", [])
          .find((t) => t.id === btn.getAttribute("data-task"));
        if (task) Forms.taskView(task);
      });
    });
  }

  function isoDate(year, month, day) {
    const d = new Date(year, month, day);
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  document.addEventListener("DOMContentLoaded", init);
})();