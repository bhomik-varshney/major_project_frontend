import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";

const LINKS = [
  { label: "Intelligence", id: "understands" },
  { label: "Preview", id: "preview" },
  { label: "Agents", id: "agents" },
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ${
        scrolled || open
          ? "border-b border-border bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-10"
      >
        <Link
          to="/"
          className="flex shrink-0 items-center gap-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setOpen(false)}
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-accent/35 bg-primary/30">
            <span className="h-2 w-2 rotate-45 rounded-[2px] bg-accent" />
          </span>
          <span className="font-display text-lg tracking-tight">CareerOS</span>
        </Link>

        <ul className="hidden items-center gap-7 xl:flex">
          {LINKS.map((l) => (
            <li key={l.id}>
              <a
                href={href(l.id)}
                aria-current={onHome && active === l.id ? "true" : undefined}
                className={`group relative rounded-sm text-sm transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  onHome && active === l.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
                <span
                  className={`absolute -bottom-1 left-0 h-px bg-accent transition-all duration-500 ${
                    onHome && active === l.id ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            to="/workspace"
            className="btn-hero hidden !px-5 !py-2.5 !text-sm sm:inline-flex"
          >
            Enter CareerOS
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground transition-colors duration-300 hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
          >
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-border bg-background/95 px-5 pb-6 pt-4 backdrop-blur-xl sm:px-6 xl:hidden">
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.id}>
                <a
                  href={href(l.id)}
                  onClick={() => setOpen(false)}
                  className="block border-b border-border/60 py-3.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <Link
            to="/workspace"
            onClick={() => setOpen(false)}
            className="btn-hero mt-5 w-full !text-sm sm:hidden"
          >
            Enter CareerOS
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}
    </header>
  );
}
