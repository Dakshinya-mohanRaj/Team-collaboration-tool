/**
 * storage.js
 * -----------
 * Central localStorage wrapper for TASKFLOW.
 * All read/write operations go through the Storage object.
 * Corrupted data is caught, logged, and restored with defaults.
 */
(function () {
  "use strict";

  const PREFIX = "taskflow_";

  const KEYS = {
    users: PREFIX + "users",
    projects: PREFIX + "projects",
    tasks: PREFIX + "tasks",
    notifications: PREFIX + "notifications",
    settings: PREFIX + "settings",
    currentUser: PREFIX + "current_user",
  };

  const Storage = {
    KEYS: KEYS,

    _fallback: {},

    /**
     * Read a JSON value from localStorage.
     * Returns fallback value when the data is missing or corrupted.
     */
    get(key, fallback) {
      const fullKey = KEYS[key];

      if (this._fallback[fullKey] !== undefined) {
        return this._fallback[fullKey];
      }

      try {
        const raw = localStorage.getItem(fullKey);
        if (raw === null || raw === undefined || raw === "") {
          return fallback;
        }
        const parsed = JSON.parse(raw);
        if (parsed === null && raw !== "null") {
          return fallback;
        }
        return parsed;
      } catch (err) {
        console.error(
          "[Storage] Corrupted data detected for key `" + fullKey + "`. Restoring default.",
          err
        );
        localStorage.removeItem(fullKey);
        return fallback;
      }
    },

    /**
     * Write a JSON value to localStorage, wrapped in try/catch.
     */
    set(key, value) {
      const fullKey = KEYS[key];
      delete this._fallback[fullKey];
      try {
        localStorage.setItem(fullKey, JSON.stringify(value));
        return true;
      } catch (err) {
        console.error("[Storage] Failed to write key `" + fullKey + "`", err);
        this._fallback[fullKey] = value;
        return false;
      }
    },

    /**
     * Remove a key from localStorage.
     */
    remove(key) {
      const fullKey = KEYS[key];
      delete this._fallback[fullKey];
      try {
        localStorage.removeItem(fullKey);
        return true;
      } catch (err) {
        console.error("[Storage] Failed to remove key `" + fullKey + "`", err);
        return false;
      }
    },

    /**
     * Clear every TASKFLOW key, keeping unrelated keys intact.
     */
    clear() {
      Object.values(KEYS).forEach((fullKey) => {
        delete this._fallback[fullKey];
        try {
          localStorage.removeItem(fullKey);
        } catch (err) {
          console.warn("[Storage] Failed to clear key `" + fullKey + "`", err);
        }
      });
    },

    /**
     * Generate a unique id using timestamp + random suffix.
     * Prefix keeps ids readable, e.g. task_8712345678901_ab12
     */
    generateId(prefix) {
      const rand = Math.random().toString(36).substring(2, 6);
      const time = Date.now().toString(36);
      return (prefix || "record") + "_" + time + rand;
    },
  };

  window.TFStorage = Storage;
})();