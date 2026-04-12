/**
 * Private analytics UI (analytics.html only). Gate uses window.__ANALYTICS_SECRET_SHA256__
 * (lowercase hex SHA-256 of the UTF-8 passcode), not the plaintext secret.
 */
(function () {
  "use strict";

  function bufToHex(buf) {
    var bytes = new Uint8Array(buf);
    var hex = "";
    for (var i = 0; i < bytes.length; i++) {
      hex += ("0" + bytes[i].toString(16)).slice(-2);
    }
    return hex;
  }

  function sha256Utf8(str) {
    if (!window.crypto || !window.crypto.subtle) {
      return Promise.reject(new Error("Web Crypto unavailable"));
    }
    var enc = new TextEncoder();
    return window.crypto.subtle.digest("SHA-256", enc.encode(str)).then(bufToHex);
  }

  function $(id) {
    return document.getElementById(id);
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

    $("stat-views").textContent = String(events.length);

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
  }

  function initGate() {
    var expectedHash =
      typeof window !== "undefined" && window.__ANALYTICS_SECRET_SHA256__ !== undefined
        ? String(window.__ANALYTICS_SECRET_SHA256__)
            .trim()
            .toLowerCase()
        : "";
    var form = $("analytics-login-form");
    var err = $("analytics-login-error");

    try {
      if (sessionStorage.getItem("analytics_unlocked") === "1" && expectedHash) {
        showApp();
        return;
      }
    } catch (e) {}

    if (!expectedHash) {
      if (err) {
        err.textContent =
          "Set window.__ANALYTICS_SECRET_SHA256__ in analytics.html (hex SHA-256 of your passcode) before using this page.";
      }
      return;
    }

    if (!form) return;

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      err.textContent = "";
      var input = $("analytics-pass");
      var val = input ? input.value : "";
      sha256Utf8(val)
        .then(function (hex) {
          if (hex.toLowerCase() === expectedHash) {
            if (input) input.value = "";
            showApp();
          } else {
            err.textContent = "Incorrect passcode.";
          }
        })
        .catch(function () {
          err.textContent = "Could not verify passcode (Web Crypto required).";
        });
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
