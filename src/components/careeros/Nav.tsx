import { useEffect, useState } from "react";

const LINKS = [
  { label: "Intelligence", href: "#understands" },
  { label: "Agents", href: "#agents" },
  { label: "Opportunities", href: "#opportunities" },
  { label: "Command Center", href: "#command-center" },
  { label: "Roadmap", href: "#roadmap" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ${
        scrolled
          ? "border-b border-border bg-background/72 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <a href="#top" className="flex items-center gap-3">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-accent/35 bg-primary/30">
            <span className="h-2 w-2 rotate-45 rounded-[2px] bg-accent" />
          </span>
          <span className="font-display text-lg tracking-tight">CareerOS</span>
        </a>

        <ul className="hidden items-center gap-9 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="group relative text-sm text-muted-foreground transition-colors duration-500 hover:text-foreground"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-accent transition-all duration-500 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <a href="#final" className="btn-ghost !py-2.5 !text-sm">
          Enter CareerOS
        </a>
      </nav>
    </header>
  );
}
