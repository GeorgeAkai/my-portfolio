/**
 * One "Read more" / "Show less" per project card (summary: title, abstract, tech stack).
 * Toggles visibility of .project-card__details (role, narratives, key contributions).
 */
(function () {
  "use strict";

  function init() {
    document.querySelectorAll(".project-card__toggle").forEach(function (btn) {
      var id = btn.getAttribute("aria-controls");
      if (!id) return;
      var panel = document.getElementById(id);
      if (!panel || btn.dataset.pcBound) return;
      btn.dataset.pcBound = "true";

      function setExpanded(expanded) {
        panel.hidden = !expanded;
        btn.setAttribute("aria-expanded", expanded ? "true" : "false");
        btn.textContent = expanded ? "Show less" : "Read more";
      }

      btn.addEventListener("click", function () {
        setExpanded(panel.hidden);
      });

      setExpanded(false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
