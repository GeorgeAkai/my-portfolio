/**
 * Private analytics UI (analytics.html only). Requires correct passcode in window.__ANALYTICS_SECRET__.
 */
(function () {
  "use strict";

  var FEEDBACK_KEY = "portfolio_feedback_v1";

  function $(id) {
    return document.getElementById(id);
  }

  function loadFeedback() {
    try {
      var raw = localStorage.getItem(FEEDBACK_KEY);
      if (!raw) return { likeCount: 0, comments: [] };
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return { likeCount: 0, comments: [] };
      var likeCount = typeof data.likeCount === "number" ? data.likeCount : 0;
      if (data.liked === true && likeCount < 1) likeCount = 1;
      return {
        likeCount: Math.max(0, likeCount),
        comments: Array.isArray(data.comments) ? data.comments : [],
      };
    } catch (e) {
      return { likeCount: 0, comments: [] };
    }
  }

  function fmtTs(ts) {
    try {
      return new Date(ts).toLocaleString();
    } catch (e) {
      return String(ts);
    }
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function dateKey(ts) {
    try {
      var d = new Date(ts);
      return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
    } catch (e) {
      return "?";
    }
  }

  function showApp() {
    var gate = $("analytics-gate");
    var app = $("analytics-app");
    if (gate) gate.hidden = true;
    if (app) app.hidden = false;
    try {
      sessionStorage.setItem("analytics_unlocked", "1");
    } catch (e) {}
    if (window.SiteAnalytics && typeof window.SiteAnalytics.recordVisit === "function") {
      window.SiteAnalytics.recordVisit();
    }
    render();
    initExport();
  }

  function render() {
    var data = window.SiteAnalytics ? window.SiteAnalytics.load() : { events: [] };
    var events = data.events || [];
    var feedback = loadFeedback();

    $("stat-views").textContent = String(events.length);
    $("stat-likes").textContent = String(feedback.likeCount);
    $("stat-comments").textContent = String(feedback.comments.length);

    var sids = {};
    events.forEach(function (e) {
      if (e.sid) sids[e.sid] = true;
    });
    $("stat-sessions").textContent = String(Object.keys(sids).length);

    var byDate = {};
    events.forEach(function (e) {
      var dk = dateKey(e.ts);
      byDate[dk] = (byDate[dk] || 0) + 1;
    });
    var dates = Object.keys(byDate).sort().reverse();
    var tbody = $("table-by-date");
    tbody.innerHTML = "";
    dates.forEach(function (d) {
      var tr = document.createElement("tr");
      var td1 = document.createElement("td");
      td1.textContent = d;
      var td2 = document.createElement("td");
      td2.textContent = String(byDate[d]);
      tr.appendChild(td1);
      tr.appendChild(td2);
      tbody.appendChild(tr);
    });
    if (dates.length === 0) {
      var tr0 = document.createElement("tr");
      var td0 = document.createElement("td");
      td0.colSpan = 2;
      td0.className = "u-muted";
      td0.textContent = "No page views recorded yet.";
      tr0.appendChild(td0);
      tbody.appendChild(tr0);
    }

    var byPath = {};
    events.forEach(function (e) {
      var p = e.path || "/";
      byPath[p] = (byPath[p] || 0) + 1;
    });
    var paths = Object.keys(byPath).sort(function (a, b) {
      return byPath[b] - byPath[a];
    });
    var ptbody = $("table-by-path");
    ptbody.innerHTML = "";
    paths.slice(0, 20).forEach(function (p) {
      var tr = document.createElement("tr");
      var td1 = document.createElement("td");
      td1.textContent = p;
      td1.style.wordBreak = "break-all";
      var td2 = document.createElement("td");
      td2.textContent = String(byPath[p]);
      tr.appendChild(td1);
      tr.appendChild(td2);
      ptbody.appendChild(tr);
    });

    var recent = events.slice(-80).reverse();
    var rtbody = $("table-recent");
    rtbody.innerHTML = "";
    recent.forEach(function (e) {
      var tr = document.createElement("tr");
      ["ts", "path", "sid"].forEach(function (key) {
        var td = document.createElement("td");
        if (key === "ts") td.textContent = fmtTs(e.ts);
        else if (key === "path") {
          td.textContent = e.path || "";
          td.style.wordBreak = "break-all";
        } else {
          td.textContent = (e.sid || "").slice(0, 24) + (e.sid && e.sid.length > 24 ? "…" : "");
        }
        tr.appendChild(td);
      });
      rtbody.appendChild(tr);
    });

    var cwrap = $("comments-preview");
    cwrap.innerHTML = "";
    feedback.comments.slice(-15).reverse().forEach(function (c) {
      var div = document.createElement("div");
      div.className = "analytics-comment-preview";
      var meta = document.createElement("div");
      meta.className = "analytics-comment-meta";
      meta.textContent = (c.name || "Anonymous") + " · " + (c.ts ? fmtTs(c.ts) : "");
      var body = document.createElement("div");
      body.className = "analytics-comment-body";
      body.textContent = c.text || "";
      div.appendChild(meta);
      div.appendChild(body);
      cwrap.appendChild(div);
    });
    if (feedback.comments.length === 0) {
      var p = document.createElement("p");
      p.className = "u-muted text-sm";
      p.textContent = "No comments in local storage.";
      cwrap.appendChild(p);
    }
  }

  function initGate() {
    var secret =
      typeof window !== "undefined" && window.__ANALYTICS_SECRET__ !== undefined
        ? String(window.__ANALYTICS_SECRET__)
        : "";
    var form = $("analytics-login-form");
    var err = $("analytics-login-error");

    try {
      if (sessionStorage.getItem("analytics_unlocked") === "1" && secret) {
        showApp();
        return;
      }
    } catch (e) {}

    if (!secret) {
      if (err) err.textContent = "Set window.__ANALYTICS_SECRET__ in analytics.html before using this page.";
      return;
    }

    if (!form) return;

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      err.textContent = "";
      var input = $("analytics-pass");
      var val = input ? input.value : "";
      if (val === secret) {
        input.value = "";
        showApp();
      } else {
        err.textContent = "Incorrect passcode.";
      }
    });
  }

  function initExport() {
    var btnE = $("btn-export");
    var btnI = $("btn-import");
    if (!btnE || !btnI || btnE.dataset.bound) return;
    btnE.dataset.bound = "1";
    btnI.dataset.bound = "1";
    btnE.addEventListener("click", function () {
      var ta = $("analytics-import-export");
      if (!ta) return;
      ta.value = window.SiteAnalytics ? window.SiteAnalytics.exportAll() : "{}";
      ta.select();
      try {
        document.execCommand("copy");
      } catch (e) {}
    });
    btnI.addEventListener("click", function () {
      var ta = $("analytics-import-export");
      var status = $("analytics-io-status");
      if (!ta) return;
      var r = window.SiteAnalytics ? window.SiteAnalytics.importMerge(ta.value) : { ok: false };
      if (!status) return;
      if (r.ok) {
        status.textContent = "Import merged. Refreshing.";
        render();
      } else {
        status.textContent = r.error || "Import failed.";
      }
    });
  }

  function init() {
    initGate();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
