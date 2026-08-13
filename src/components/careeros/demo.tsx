import { useEffect, useRef, useState } from "react";

/** Small, explicit marker that data on screen is illustrative sample data. */
export function DemoBadge({
  label = "Sample data",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accent/90 ${className}`}
    >
      <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
      {label}
    </span>
  );
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Counts to `value` once `active` becomes true. Respects reduced motion. */
export function useCountUp(value: number, active: boolean, duration = 1200) {
  const reduced = usePrefersReducedMotion();
  const [n, setN] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setN(value);
      return;
    }
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, active, duration, reduced]);

  return active && reduced ? value : n;
}

/** Fires `true` the first time the element enters the viewport. */
export function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}
