/* share-modal.js v4 — optional share UI; no-op when markup is absent */
(function shareModalBoot() {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (window.__SAVEROUTE_SHARE_MODAL_BOOTED__) {
    return;
  }

  window.__SAVEROUTE_SHARE_MODAL_BOOTED__ = true;

  function safeRun(callback) {
    try {
      callback();
    } catch {
      // Optional UI — never break host pages when markup is absent or incomplete.
    }
  }

  function bindClick(element, handler) {
    if (!element || typeof element.addEventListener !== "function") {
      return;
    }

    element.addEventListener("click", handler);
  }

  function attachShareModal() {
    safeRun(function () {
      var modal = document.getElementById("share-modal");
      var triggers = document.querySelectorAll("[data-share-modal-trigger]");

      if (!modal || !triggers || triggers.length === 0) {
        return;
      }

      var backdrop = modal.querySelector("[data-share-modal-backdrop]");
      var closeNodes = modal.querySelectorAll("[data-share-modal-close]");

      function openModal(event) {
        if (event && typeof event.preventDefault === "function") {
          event.preventDefault();
        }

        modal.classList.remove("hidden");
        modal.setAttribute("aria-hidden", "false");
      }

      function closeModal() {
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
      }

      for (var triggerIndex = 0; triggerIndex < triggers.length; triggerIndex += 1) {
        bindClick(triggers[triggerIndex], openModal);
      }

      bindClick(backdrop, closeModal);

      for (var closeIndex = 0; closeIndex < closeNodes.length; closeIndex += 1) {
        bindClick(closeNodes[closeIndex], closeModal);
      }

      if (typeof document.addEventListener !== "function") {
        return;
      }

      document.addEventListener(
        "keydown",
        function onEscapeKey(event) {
          if (!event || event.key !== "Escape" || modal.classList.contains("hidden")) {
            return;
          }

          closeModal();
        },
        true,
      );
    });
  }

  safeRun(function scheduleShareModalInit() {
    if (typeof document.addEventListener !== "function") {
      return;
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", attachShareModal, { once: true });
      return;
    }

    attachShareModal();
  });
})();
