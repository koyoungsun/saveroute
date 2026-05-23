export type FloatingMenuPhase = "opening" | "open" | "closing" | "closed";

export type FloatingMenuState = {
  open: boolean;
  phase: FloatingMenuPhase;
};

export const FLOATING_MENU_EVENT = "sr:floating-menu";

export function emitFloatingMenuState(state: FloatingMenuState) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<FloatingMenuState>(FLOATING_MENU_EVENT, { detail: state }));
}
