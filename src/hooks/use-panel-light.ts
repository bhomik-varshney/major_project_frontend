import { useEffect, useRef } from "react";

/** One delegated pointer listener for the workspace; no render on pointer movement. */
export function usePanelLight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let panel: HTMLElement | null = null;
    let previous: HTMLElement | null = null;
    let x = 0,
      y = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous?.style.removeProperty("--panel-x");
      previous?.style.removeProperty("--panel-y");
      previous = null;
    };
    const move = (event: PointerEvent) => {
      if (!pointer.matches || reduced.matches || event.pointerType === "touch") {
        reset();
        return;
      }
      panel = (event.target as HTMLElement).closest<HTMLElement>("[data-panel-light]");
      if (previous !== panel) reset();
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
      previous = panel;
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          panel?.style.setProperty("--panel-x", `${x}px`);
          panel?.style.setProperty("--panel-y", `${y}px`);
        });
    };
    root.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerleave", reset);
    pointer.addEventListener("change", reset);
    reduced.addEventListener("change", reset);
    return () => {
      reset();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", reset);
      pointer.removeEventListener("change", reset);
      reduced.removeEventListener("change", reset);
    };
  }, []);
  return ref;
}
