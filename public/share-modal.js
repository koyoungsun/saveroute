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
 *
 * 레이아웃에 <script src="/share-modal.js" defer></script> 가 있거나
 * 정적 게시 시 이 파일만 서빙되는 경우 안전해야 합니다.
 */
(function shareModalBoot() {
  if (typeof document === "undefined") {
    return;
  }

  function onReady(cb) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb, { once: true });
    } else {
      cb();
    }
  }

  onReady(function attachShareModal() {
    var trigger = document.querySelector("[data-share-modal-trigger]");
    var modal = document.getElementById("share-modal");

    if (!trigger || !modal) {
      return;
    }

    var backdrop = modal.querySelector("[data-share-modal-backdrop]");
    var closeNodes = modal.querySelectorAll("[data-share-modal-close]");

    function openModal() {
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    }

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
    });

    if (backdrop) {
      backdrop.addEventListener("click", closeModal);
    }

    for (var i = 0; i < closeNodes.length; i += 1) {
      closeNodes[i].addEventListener("click", closeModal);
    }

    /** Escape 로 닫기 (모달 초기화가 성립한 페이지에서만) */
    document.addEventListener(
      "keydown",
      function (ev) {
        if (ev.key === "Escape" && !modal.classList.contains("hidden")) {
          closeModal();
        }
      },
      true,
    );
  });
})();
