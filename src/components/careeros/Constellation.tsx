import { useEffect, useRef, useState } from "react";

/*
 * Node positions are kept inside a 16–84% band on Y so the diamond *and* its
 * label stay within the square container — the previous y:93 pushed the
 * "Goals" label past the bottom edge.
 */
const NODES = [
  { label: "Skills", x: 50, y: 16, r: 13, depth: 54 },
  { label: "Projects", x: 84, y: 34, r: 11, depth: 30 },
  { label: "Experience", x: 80, y: 70, r: 12, depth: 44 },
  { label: "Goals", x: 50, y: 84, r: 11, depth: 24 },
  { label: "Opportunities", x: 20, y: 70, r: 12, depth: 40 },
  { label: "Applications", x: 16, y: 34, r: 11, depth: 34 },
];

/* Deterministic particle field — identical on server and client (no hydration drift). */
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37.5) % 100,
  top: (i * 61.7) % 100,
  size: i % 5 === 0 ? 2.5 : 1.5,
  delay: (i % 9) * 0.4,
}));

/**
 * Career constellation — layered 2.5D with gentle mouse parallax.
 *
 * Deliberately avoids `backdrop-filter` anywhere inside the 3D context: a
 * backdrop filter inside `preserve-3d` forces the compositor to re-rasterize a
 * transformed layer, which tears into visible RGB smears on WebKit. Solid and
 * gradient fills give the same glass read without that cost.
 */
export function Constellation() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let next = { x: 0, y: 0 };
    const apply = () => {
      raf = 0;
      setTilt(next);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // Clamp so the tilt eases off rather than snapping at the edges.
      const px = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5));
      const py = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5));
      next = { x: px, y: py };
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      next = { x: 0, y: 0 };
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto aspect-square w-full max-w-[540px] select-none"
      style={{ perspective: "1200px" }}
      aria-hidden="true"
    >
      {/*
       * Ambient bloom sits OUTSIDE the 3D context so it never re-rasterizes.
       * Kept tight and low-opacity so it pools behind the core rather than
       * washing the whole diagram flat.
       */}
      <div
        className="pointer-events-none absolute inset-[26%] rounded-full opacity-60 blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, oklch(0.38 0.128 19 / 0.5), transparent 70%)",
        }}
      />

      <div
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{
          transform: `rotateX(${-tilt.y * 9}deg) rotateY(${tilt.x * 11}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Orbital rings — subtle, varied weights for depth. */}
        <div className="animate-orbit absolute inset-[6%] rounded-full border border-border/70" />
        <div
          className="animate-orbit absolute inset-[21%] rounded-full border border-primary/35"
          style={{ animationDirection: "reverse", animationDuration: "30s" }}
        />
        <div className="absolute inset-[36%] rounded-full border border-accent/15" />

        {/* Connections */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
          {/* Perimeter arcs first, so spokes read on top. */}
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
                strokeOpacity="0.22"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {NODES.map((n, i) => (
            <line
              key={n.label}
              x1="50"
              y1="50"
              x2={n.x}
              y2={n.y}
              stroke="var(--rose)"
              strokeOpacity="0.5"
              strokeWidth="1.1"
              vectorEffect="non-scaling-stroke"
              className="animate-dash"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </svg>

        {/* Central node — solid gradient, no backdrop-filter. */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{ transform: "translate3d(-50%,-50%,70px)" }}
        >
          <div className="relative grid h-20 w-20 rotate-45 place-items-center rounded-[22px] border border-accent/55 md:h-24 md:w-24">
            <div
              className="absolute inset-0 rounded-[22px]"
              style={{
                background:
                  "linear-gradient(145deg, oklch(0.46 0.14 12 / 0.95), oklch(0.24 0.05 350 / 0.9))",
                boxShadow:
                  "inset 0 1px 0 oklch(1 0 0 / 0.22), inset 0 0 30px -8px oklch(0.74 0.108 5 / 0.5), 0 24px 55px -18px oklch(0.38 0.128 19 / 0.95)",
              }}
            />
            {/* Counter-rotate so the label stays upright inside the tilted core. */}
            <span className="relative -rotate-45 font-display text-xl tracking-[0.06em] text-ivory md:text-2xl">
              YOU
            </span>
          </div>
        </div>

        {/*
         * Two nested elements per node: the outer one owns the 3D placement,
         * the inner one owns the float animation. Sharing one element would
         * make the keyframes overwrite the translate3d depth.
         */}
        {NODES.map((n, i) => (
          <div
            key={n.label}
            className="absolute left-0 top-0"
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              transform: `translate3d(-50%,-50%,${n.depth}px)`,
            }}
          >
            <div
              className="animate-float flex flex-col items-center gap-2.5"
              style={{
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${7 + (i % 3)}s`,
              }}
            >
              <span
                className="block rotate-45 rounded-[5px] border border-accent/70"
                style={{
                  width: n.r * 2,
                  height: n.r * 2,
                  background:
                    "linear-gradient(145deg, oklch(0.8 0.11 5 / 0.9), oklch(0.42 0.13 15 / 0.85))",
                  boxShadow: "0 0 26px -4px var(--rose), inset 0 1px 0 oklch(1 0 0 / 0.35)",
                }}
              />
              <span className="whitespace-nowrap text-[9px] uppercase tracking-[0.18em] text-muted-foreground/85">
                {n.label}
              </span>
            </div>
          </div>
        ))}

        {/* Particles */}
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="animate-pulse-soft absolute rounded-full bg-accent"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
