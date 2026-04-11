/**
 * Records page views in localStorage for the private analytics dashboard.
 * This is per-browser only unless you add an ingest URL (see below).
 * Not loaded on analytics.html until after unlock (see shouldSkip).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "site_analytics_v1";
  var MAX_EVENTS = 3000;
  var SESSION_KEY = "site_analytics_sid";

  function getSessionId() {
    try {
      var sid = sessionStorage.getItem(SESSION_KEY);
      if (!sid) {
        sid = "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem(SESSION_KEY, sid);
      }
      return sid;
    } catch (e) {
      return "unknown";
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { events: [], schema: 1 };
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return { events: [], schema: 1 };
      return {
        schema: 1,
        events: Array.isArray(data.events) ? data.events : [],
      };
    } catch (e) {
      return { events: [], schema: 1 };
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      while (data.events.length > 100 && data.events.length) {
        data.events.shift();
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return;
        } catch (e2) {}
      }
    }
  }

  function shouldSkip() {
    var path = (typeof location !== "undefined" && location.pathname) || "";
    /* analytics.html records visits only when the dashboard unlocks (see analytics-dashboard.js). */
    if (path.indexOf("analytics.html") !== -1) return true;
    return false;
  }

  function optionalIngest(event) {
    var url = typeof window !== "undefined" && window.__ANALYTICS_INGEST_URL__;
    if (!url || typeof fetch !== "function") return;
    try {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }

  function recordVisit() {
    if (shouldSkip()) return;
    var data = load();
    var ev = {
      ts: Date.now(),
      path: location.pathname || "/",
      title: document.title || "",
      sid: getSessionId(),
      ref: typeof document !== "undefined" && document.referrer ? String(document.referrer).slice(0, 200) : "",
    };
    data.events.push(ev);
    while (data.events.length > MAX_EVENTS) {
      data.events.shift();
    }
    save(data);
    optionalIngest(ev);
  }

  function exportAll() {
    return JSON.stringify(load(), null, 2);
  }

  function importMerge(jsonStr) {
    var incoming;
    try {
      incoming = JSON.parse(jsonStr);
    } catch (e) {
      return { ok: false, error: "Invalid JSON" };
    }
    if (!incoming || !Array.isArray(incoming.events)) {
      return { ok: false, error: "Expected { events: [...] }" };
    }
    var data = load();
    var seen = {};
    data.events.forEach(function (e) {
      seen[e.ts + "|" + e.path + "|" + e.sid] = true;
    });
    incoming.events.forEach(function (e) {
      var k = e.ts + "|" + e.path + "|" + e.sid;
      if (!seen[k]) {
        data.events.push(e);
        seen[k] = true;
      }
    });
    data.events.sort(function (a, b) {
      return a.ts - b.ts;
    });
    while (data.events.length > MAX_EVENTS) {
      data.events.shift();
    }
    save(data);
    return { ok: true, merged: incoming.events.length };
  }

  window.SiteAnalytics = {
    recordVisit: recordVisit,
    load: load,
    exportAll: exportAll,
    importMerge: importMerge,
    getSessionId: getSessionId,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", recordVisit);
  } else {
    recordVisit();
  }
})();
