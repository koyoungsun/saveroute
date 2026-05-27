/**
 * 선택적 공유 UI — 마크업이 없는 페이지에서는 아무 동작도 하지 않습니다.
 *
 * 선택자 (모두 존재할 때만 초기화):
 *   - 트리거: [data-share-modal-trigger]
 *   - 패널:   #share-modal
 *
 * 선택적:
 *   - 닫기(백드롭): #share-modal [data-share-modal-backdrop]
 *   - 닫기(버튼):  #share-modal [data-share-modal-close]
 */
(function shareModalBoot() {
  if (typeof document === "undefined") {
    return;
  }

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function bindClick(element, handler) {
    if (!element || typeof element.addEventListener !== "function") {
      return;
    }

    element.addEventListener("click", handler);
  }

  onReady(function attachShareModal() {
    try {
      var modal = document.getElementById("share-modal");
      if (!modal) {
        return;
      }

      var triggers = document.querySelectorAll("[data-share-modal-trigger]");
      if (!triggers || triggers.length === 0) {
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

      document.addEventListener(
        "keydown",
        function onEscapeKey(event) {
          if (event.key !== "Escape" || modal.classList.contains("hidden")) {
            return;
          }

          closeModal();
        },
        true,
      );
    } catch (_error) {
      // Optional UI — never break host pages when markup is absent or incomplete.
    }
  });
})();
