import { useEffect, useRef, useState } from "react";

const NODES = [
  { label: "Skills", x: 50, y: 8, r: 14 },
  { label: "Projects", x: 88, y: 30, r: 12 },
  { label: "Experience", x: 82, y: 74, r: 13 },
  { label: "Goals", x: 50, y: 93, r: 12 },
  { label: "Opportunities", x: 15, y: 72, r: 13 },
  { label: "Applications", x: 12, y: 27, r: 12 },
];

/** Cinematic career constellation — CSS/SVG 3D-feel, mouse parallax. */
export function Constellation() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: px, y: py });
    };
    const onLeave = () => setTilt({ x: 0, y: 0 });
    window.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto aspect-square w-full max-w-[560px] select-none"
      style={{ perspective: "1400px" }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{
          transform: `rotateX(${-tilt.y * 12}deg) rotateY(${tilt.x * 14}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* orbital rings */}
        <div className="animate-orbit absolute inset-[8%] rounded-full border border-border" />
        <div
          className="animate-orbit absolute inset-[20%] rounded-full border border-primary/40"
          style={{ animationDirection: "reverse", animationDuration: "26s" }}
        />
        <div className="absolute inset-[34%] rounded-full border border-accent/20" />

        {/* connecting lines */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {NODES.map((n, i) => (
            <line
              key={n.label}
              x1="50"
              y1="50"
              x2={n.x}
              y2={n.y}
              stroke="var(--rose)"
              strokeOpacity="0.35"
              strokeWidth="0.25"
              className="animate-dash"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
          {NODES.map((n, i) => {
            const m = NODES[(i + 1) % NODES.length]!;
            return (
              <line
                key={`arc-${n.label}`}
                x1={n.x}
                y1={n.y}
                x2={m.x}
                y2={m.y}
                stroke="var(--rose-gold)"
                strokeOpacity="0.12"
                strokeWidth="0.2"
              />
            );
          })}
        </svg>

        {/* central node */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ transform: "translate3d(-50%,-50%,60px)" }}
        >
          <div className="relative flex h-28 w-28 items-center justify-center rounded-[28px] border border-accent/30 bg-primary/25 backdrop-blur-md md:h-32 md:w-32">
            <div className="absolute inset-0 rounded-[28px] bg-accent/10 blur-2xl" />
            <span className="relative font-display text-2xl tracking-tight text-ivory md:text-3xl">
              YOU
            </span>
          </div>
        </div>

        {/* nodes */}
        {NODES.map((n, i) => (
          <div
            key={n.label}
            className="animate-float absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              animationDelay: `${i * 0.7}s`,
              transform: `translate3d(-50%,-50%,${30 + i * 6}px)`,
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className="rotate-45 rounded-[6px] border border-accent/40 bg-primary/40 shadow-[0_0_28px_-4px_var(--rose)] backdrop-blur-sm"
                style={{ width: n.r * 2.2, height: n.r * 2.2 }}
              />
              <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {n.label}
              </span>
            </div>
          </div>
        ))}

        {/* particles */}
        {Array.from({ length: 26 }).map((_, i) => (
          <span
            key={i}
            className="animate-pulse-soft absolute h-[3px] w-[3px] rounded-full bg-accent"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 61) % 100}%`,
              animationDelay: `${(i % 9) * 0.4}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
