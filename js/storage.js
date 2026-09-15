/**
 * storage.js
 * ----------
 * Frontend data store: a synchronous in-memory cache backed by the
 * TASKFLOW REST API.
 *
 * The public surface (get / set / remove / clear / generateId / KEYS)
 * is intentionally identical to the old localStorage wrapper so every
 * page script keeps working unchanged. Writes are optimistic: the cache
 * updates immediately, then granular create/update/delete calls are
 * pushed to the server in a FIFO queue.
 */
(function () {
  "use strict";

  const KEYS = {
    users: "users",
    projects: "projects",
    tasks: "tasks",
    notifications: "notifications",
    settings: "settings",
    currentUser: "currentUser",
  };

  const COLLECTION_BASE = {
    users: "/api/users",
    projects: "/api/projects",
    tasks: "/api/tasks",
    notifications: "/api/notifications",
  };

  const cache = {
    users: [],
    projects: [],
    tasks: [],
    notifications: [],
    settings: {},
    currentUser: null,
  };

  let queue = Promise.resolve();
  let syncError = false;

  /* --------------------------- low-level request --------------------------- */

  const clone = (value) =>
    value === undefined
      ? value
      : JSON.parse(JSON.stringify(value));

  async function request(method, url, body) {
    const res = await fetch(url, {
      method: method,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const err = new Error(method + " " + url + " failed (" + res.status + ")");
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  function toast(message, type) {
    if (window.Utils && typeof window.Utils.toast === "function") {
      window.Utils.toast(message, type || "error");
    }
  }

  /* ------------------------------- diffing ------------------------------- */

  function buildCollectionOps(key, oldList, newList) {
    const base = COLLECTION_BASE[key];
    if (!base) return [];

    const oldById = {};
    oldList.forEach((item) => (oldById[item.id] = item));
    const newById = {};
    newList.forEach((item) => (newById[item.id] = item));

    const ops = [];

    newList.forEach((item) => {
      const prev = oldById[item.id];
      if (!prev) {
        ops.push({ method: "POST", url: base, body: item });
      } else if (JSON.stringify(prev) !== JSON.stringify(item)) {
        ops.push({
          method: "PATCH",
          url: base + "/" + encodeURIComponent(item.id),
          body: item,
        });
      }
    });

    oldList.forEach((item) => {
      if (!newById[item.id]) {
        ops.push({
          method: "DELETE",
          url: base + "/" + encodeURIComponent(item.id),
        });
      }
    });

    return ops;
  }

  function enqueue(ops) {
    ops.forEach((op) => {
      queue = queue.then(() => request(op.method, op.url, op.body).catch(handleSyncError));
    });
    if (ops.length) queue = queue.catch(() => {});
  }

  function handleSyncError(err) {
    console.error("[Storage] Sync failed:", err);
    if (err && err.status === 401) {
      window.location.href = "index.html";
      return;
    }
    if (!syncError) {
      syncError = true;
      toast("Some changes could not be saved to the server.", "warning");
      // Re-sync on next navigation/bootstrap.
    }
  }

  /* -------------------------------- store -------------------------------- */

  const Storage = {
    KEYS: KEYS,

    /**
     * Read a value from the in-memory cache.
     * Returns a deep copy so callers never corrupt the cached state.
     */
    get(key, fallback) {
      const value = cache[key];
      if (value === undefined) return fallback;
      return clone(value);
    },

    /**
     * Cache-only write (no network). Used for auth/session state.
     */
    setLocal(key, value) {
      cache[key] = clone(value);
    },

    /**
     * Optimistic write: update the cache now, sync to the server next.
     */
    set(key, value) {
      if (key === "currentUser") {
        cache[key] = clone(value);
        return true;
      }
      if (key === "settings") {
        cache.settings = clone(value) || {};
        const body = {
          theme: (value && value.theme) || "light",
          layout: (value && value.layout) || "comfortable",
          notifications: value ? value.notifications !== false : true,
        };
        enqueue([{ method: "PATCH", url: "/api/settings", body: body }]);
        return true;
      }

      const oldList = Array.isArray(cache[key]) ? clone(cache[key]) : [];
      const newList = Array.isArray(value) ? clone(value) : [];
      cache[key] = newList;

      if (COLLECTION_BASE[key]) {
        enqueue(buildCollectionOps(key, oldList, newList));
      }
      return true;
    },

    /**
     * Remove a key from the cache. Collection data must be removed via set()
     * so deletions reach the server.
     */
    remove(key) {
      if (key === "currentUser") cache[key] = null;
      else if (cache[key] !== undefined) cache[key] = [];
    },

    /**
     * Drop the cache (used on logout / hard reset).
     */
    clear() {
      Object.keys(KEYS).forEach((key) => {
        cache[key] = key === "settings" ? {} : key === "currentUser" ? null : [];
      });
      queue = Promise.resolve();
    },

    /**
     * Generate a unique id using timestamp + random suffix.
     */
    generateId(prefix) {
      const rand = Math.random().toString(36).substring(2, 6);
      const time = Date.now().toString(36);
      return (prefix || "record") + "_" + time + rand;
    },

    /**
     * Hydrate the cache from the server. Resolves with the current user
     * (or null when unauthenticated). Safe to call repeatedly.
     */
    async bootstrap() {
      let me = null;
      let boot = null;

      try {
        const meRes = await request("GET", "/api/auth/me");
        me = meRes.user || null;
      } catch (err) {
        if (err && err.status === 401) me = null;
        else console.error("[Storage] /api/auth/me failed:", err);
      }

      try {
        boot = await request("GET", "/api/bootstrap");
      } catch (err) {
        if (err && err.status === 401) boot = null;
        else console.error("[Storage] /api/bootstrap failed:", err);
      }

      if (boot) {
        cache.users = boot.users || [];
        cache.projects = boot.projects || [];
        cache.tasks = boot.tasks || [];
        cache.notifications = boot.notifications || [];
        cache.settings = boot.settings || {};
      }
      cache.currentUser = me;
      syncError = false;

      return { user: me };
    },
  };

  window.TFStorage = Storage;
})();