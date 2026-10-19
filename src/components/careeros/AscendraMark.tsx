import type { PointerEvent } from "react";

type AscendraMarkProps = {
  size?: "nav" | "footer" | "workspace";
};

export function AscendraMark({ size = "nav" }: AscendraMarkProps) {
  const handlePointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--ascendra-tilt-x", `${x * 24}deg`);
    event.currentTarget.style.setProperty("--ascendra-tilt-y", `${y * -24}deg`);
    event.currentTarget.style.setProperty("--ascendra-light-x", `${(x + 0.5) * 100}%`);
    event.currentTarget.style.setProperty("--ascendra-light-y", `${(y + 0.5) * 100}%`);
  };

  const resetTilt = (event: PointerEvent<HTMLSpanElement>) => {
    event.currentTarget.style.setProperty("--ascendra-tilt-x", "0deg");
    event.currentTarget.style.setProperty("--ascendra-tilt-y", "0deg");
    event.currentTarget.style.setProperty("--ascendra-light-x", "50%");
    event.currentTarget.style.setProperty("--ascendra-light-y", "35%");
  };

  return (
    <span
      aria-hidden="true"
      className={`ascendra-mark ascendra-mark--${size}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <span className="ascendra-mark__surface">
        <img className="ascendra-mark__art" src="/file.svg" alt="" />
        <span className="ascendra-mark__shine" />
      </span>
    </span>
  );
}
