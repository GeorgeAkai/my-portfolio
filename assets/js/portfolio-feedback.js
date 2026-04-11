/**
 * Portfolio like + comments. Data is stored in localStorage only (per browser).
 * Inputs are sanitized before save; comments render via textContent (XSS-safe).
 * If you add a server later, use parameterized queries. Never concatenate SQL with user input.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "portfolio_feedback_v1";
  var MAX_COMMENT_LEN = 100;
  var MAX_NAME_LEN = 80;
  var MAX_COMMENTS = 50;

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
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

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* quota or private mode */
    }
  }

  /** Strip tags, control chars, and length-limit. Display still uses textContent only. */
  function sanitizeText(input, maxLen) {
    if (typeof input !== "string") return "";
    var s = input.replace(/\0/g, "");
    s = s.replace(/<[^>]*>/g, "");
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    s = s.trim();
    if (s.length > maxLen) s = s.slice(0, maxLen);
    return s;
  }

  function init() {
    var root = document.getElementById("portfolio-feedback");
    if (!root) return;

    var likeBtn = document.getElementById("portfolio-like-btn");
    var likeCountEl = document.getElementById("portfolio-like-count");
    var likeHint = document.getElementById("portfolio-like-hint");
    var form = document.getElementById("portfolio-comment-form");
    var nameInput = document.getElementById("portfolio-comment-name");
    var textInput = document.getElementById("portfolio-comment-text");
    var statusEl = document.getElementById("portfolio-feedback-status");
    var listEl = document.getElementById("portfolio-comment-list");

    if (!likeBtn || !form || !textInput || !listEl) return;

    function render(state) {
      var n = state.likeCount || 0;
      if (likeCountEl) likeCountEl.textContent = String(n);
      likeBtn.classList.toggle("is-liked", n > 0);
      likeBtn.setAttribute("aria-label", "Like this portfolio. Current likes: " + n);
      if (likeHint) {
        likeHint.textContent = n > 0 ? "Thanks for the support." : "Click the heart to add a like.";
      }

      listEl.innerHTML = "";
      var comments = state.comments.slice(-MAX_COMMENTS);
      if (comments.length === 0) {
        var empty = document.createElement("p");
        empty.className = "portfolio-feedback__empty";
        empty.textContent = "No comments yet. Be the first.";
        listEl.appendChild(empty);
        return;
      }

      comments.forEach(function (c) {
        var li = document.createElement("li");
        li.className = "portfolio-feedback__comment";

        var meta = document.createElement("div");
        meta.className = "portfolio-feedback__comment-meta";
        var namePart = c.name ? c.name : "Anonymous";
        var dateStr = "";
        try {
          if (c.ts) dateStr = new Date(c.ts).toLocaleString();
        } catch (e2) {}
        meta.textContent = namePart + (dateStr ? " · " + dateStr : "");

        var body = document.createElement("div");
        body.className = "portfolio-feedback__comment-body";
        body.textContent = c.text || "";

        li.appendChild(meta);
        li.appendChild(body);
        listEl.appendChild(li);
      });
    }

    var state = loadState();
    render(state);

    likeBtn.addEventListener("click", function () {
      state = loadState();
      state.likeCount = (state.likeCount || 0) + 1;
      saveState(state);
      render(state);
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      statusEl.textContent = "";

      var rawName = nameInput ? nameInput.value : "";
      var rawText = textInput.value;

      var name = sanitizeText(rawName, MAX_NAME_LEN);
      var text = sanitizeText(rawText, MAX_COMMENT_LEN);

      if (!text) {
        statusEl.textContent = "Please enter a comment.";
        textInput.focus();
        return;
      }

      state = loadState();
      state.comments = state.comments || [];
      state.comments.push({
        id: "c-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        name: name,
        text: text,
        ts: Date.now(),
      });
      if (state.comments.length > MAX_COMMENTS) {
        state.comments = state.comments.slice(-MAX_COMMENTS);
      }
      saveState(state);
      render(state);
      textInput.value = "";
      if (nameInput) nameInput.value = "";
      statusEl.textContent = "Comment added. Thank you.";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
