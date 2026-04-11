/**
 * Read more / Show less for long content outside project cards.
 * - Paragraphs: main p with length > 300 (skips project cards, header, project toggles).
 * - Blocks: main .read-more-block (e.g. CompTIA "What you learned") when tall enough.
 * Runs on all viewports (desktop + mobile).
 */
(function () {
  "use strict";

  var MIN_CHARS = 300;
  var BLOCK_MIN_HEIGHT = 220;
  var INIT_MARK = "data-rm-init";

  function unwrapAll() {
    document.querySelectorAll("main .read-more[" + INIT_MARK + "]").forEach(function (wrap) {
      var panel = wrap.querySelector(".read-more__panel");
      var parent = wrap.parentNode;
      if (!panel || !parent) return;
      while (panel.firstChild) {
        parent.insertBefore(panel.firstChild, wrap);
      }
      parent.removeChild(wrap);
    });
    document.querySelectorAll("main .read-more-block[" + INIT_MARK + "]").forEach(function (el) {
      el.removeAttribute(INIT_MARK);
    });
  }

  function bindToggle(panel, btn) {
    btn.addEventListener("click", function () {
      var expanded = panel.classList.contains("read-more__panel--expanded");
      if (expanded) {
        panel.classList.remove("read-more__panel--expanded");
        panel.classList.add("read-more__panel--collapsed");
        btn.setAttribute("aria-expanded", "false");
        btn.textContent = "Read more";
      } else {
        panel.classList.add("read-more__panel--expanded");
        panel.classList.remove("read-more__panel--collapsed");
        btn.setAttribute("aria-expanded", "true");
        btn.textContent = "Show less";
      }
    });
  }

  function wrapParagraph(p) {
    if (p.closest(".read-more")) return;
    if (p.closest(".site-header-strip")) return;
    if (p.closest(".read-more-block")) return;
    if (p.closest(".project-card-academic")) return;
    if (p.closest(".portfolio-feedback")) return;
    var t = p.textContent.replace(/\s+/g, " ").trim();
    if (t.length <= MIN_CHARS) return;

    var id = "rm-p-" + Math.random().toString(36).slice(2, 9);
    var wrap = document.createElement("div");
    wrap.className = "read-more";
    wrap.setAttribute(INIT_MARK, "true");

    var panel = document.createElement("div");
    panel.className = "read-more__panel read-more__panel--collapsed";
    panel.id = id;

    p.parentNode.insertBefore(wrap, p);
    panel.appendChild(p);
    wrap.appendChild(panel);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "read-more__toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", id);
    btn.textContent = "Read more";
    wrap.appendChild(btn);
    bindToggle(panel, btn);
  }

  function wrapBlock(block) {
    if (block.getAttribute(INIT_MARK)) return;
    if (block.scrollHeight <= BLOCK_MIN_HEIGHT) return;

    var id = "rm-b-" + Math.random().toString(36).slice(2, 9);
    var wrap = document.createElement("div");
    wrap.className = "read-more read-more--block";
    wrap.setAttribute(INIT_MARK, "true");

    var panel = document.createElement("div");
    panel.className = "read-more__panel read-more__panel--collapsed";
    panel.id = id;

    while (block.firstChild) {
      panel.appendChild(block.firstChild);
    }
    wrap.appendChild(panel);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "read-more__toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", id);
    btn.textContent = "Read more";
    wrap.appendChild(btn);

    block.appendChild(wrap);
    block.setAttribute(INIT_MARK, "true");
    bindToggle(panel, btn);
  }

  function init() {
    unwrapAll();
    requestAnimationFrame(function () {
      document.querySelectorAll("main p").forEach(wrapParagraph);
      document.querySelectorAll("main .read-more-block").forEach(wrapBlock);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
