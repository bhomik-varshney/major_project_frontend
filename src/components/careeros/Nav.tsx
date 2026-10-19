import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";

const LINKS = [
  { label: "Problem", id: "problem" },
  { label: "Agents", id: "agents" },
  { label: "Intelligence", id: "understands" },
  { label: "Opportunities", id: "opportunities" },
  { label: "Command Center", id: "command-center" },
  { label: "Roadmap", id: "roadmap" },
];

export function Nav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLSpanElement>(null);

  /*
   * One passive, rAF-throttled scroll listener drives both the header state and
   * the progress bar. The bar is written straight to a style property so
   * scrolling never triggers a React re-render.
   */
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const y = window.scrollY;
      const past = y > 24;
      setScrolled((prev) => (prev === past ? prev : past));
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(y / max, 1) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!onHome) return;
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [onHome]);

  const href = (id: string) => (onHome ? `#${id}` : `/#${id}`);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/*
       * No container chrome: the links sit directly on the page. A soft veil
       * fades in on scroll so text stays legible over content without ever
       * drawing a visible bar or pill.
       */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          scrolled || open ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(to bottom, oklch(0.145 0.005 285 / 0.92), oklch(0.145 0.005 285 / 0.55) 62%, transparent)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          maskImage: "linear-gradient(to bottom, black 62%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black 62%, transparent)",
        }}
      />

      <nav
        aria-label="Primary"
        className={`relative mx-auto flex max-w-[96rem] items-center justify-between gap-8 px-5 transition-all duration-500 sm:px-8 lg:px-10 ${
          scrolled ? "py-4" : "py-6"
        }`}
      >
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setOpen(false)}
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-accent/40 bg-primary/30 transition-colors duration-500 group-hover:border-accent/70">
            <span className="h-2 w-2 rotate-45 rounded-[2px] bg-accent transition-transform duration-500 group-hover:rotate-[135deg]" />
          </span>
          <span className="font-display text-xl tracking-tight">CareerOS</span>
        </Link>

        {/*
         * Bare editorial links — no pill, no border. Hierarchy comes from a
         * hairline that draws in under the active/hovered item and a small
         * accent tick, matching the section-index language used down-page.
         */}
        <ul className="hidden items-center gap-9 lg:flex">
          {LINKS.map((l) => {
            const on = onHome && active === l.id;
            return (
              <li key={l.id}>
                <a
                  href={href(l.id)}
                  aria-current={on ? "true" : undefined}
                  className={`group relative block py-1 text-[13px] tracking-[0.01em] transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    on ? "text-ivory" : "text-muted-foreground hover:text-ivory"
                  }`}
                >
                  {l.label}
                  {/* Hairline indicator: full width when active, grows on hover. */}
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-1.5 left-0 h-px origin-left bg-gradient-to-r from-accent to-accent/25 transition-all duration-500 ${
                      on
                        ? "w-full opacity-100"
                        : "w-0 opacity-0 group-hover:w-full group-hover:opacity-70"
                    }`}
                  />
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            to="/dashboard"
            className="btn-hero group hidden !px-5 !py-2.5 !text-sm sm:inline-flex"
          >
            Enter CareerOS
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors duration-300 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-border bg-background/95 px-5 pb-6 pt-4 backdrop-blur-xl sm:px-8 lg:hidden">
          <ul className="flex flex-col">
            {LINKS.map((l, i) => (
              <li key={l.id}>
                <a
                  href={href(l.id)}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-4 border-b border-border/60 py-3.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="tnum text-[10px] tracking-[0.2em] text-accent/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="btn-hero mt-5 w-full !text-sm sm:hidden"
          >
            Enter CareerOS
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}

      {/* Reading progress — driven imperatively, never re-renders. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-primary via-accent to-rose-gold"
        ref={barRef}
        style={{ transform: "scaleX(0)" }}
      />
    </header>
  );
}
