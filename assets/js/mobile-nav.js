/**
 * Portfolio mobile navigation: hamburger toggle, aria, focus-friendly.
 * Requires: #site-nav-toggle, #site-nav-menu
 */
(function () {
  "use strict";

  function init() {
    var toggle = document.getElementById("site-nav-toggle");
    var menu = document.getElementById("site-nav-menu");
    if (!toggle || !menu) return;

    function setOpen(open) {
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(!menu.classList.contains("is-open"));
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 639px)").matches) {
          setOpen(false);
        }
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener(
      "resize",
      debounce(function () {
        if (!window.matchMedia("(max-width: 639px)").matches) {
          setOpen(false);
        }
      }, 200)
    );
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
