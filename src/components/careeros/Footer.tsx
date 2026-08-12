import { Github, Linkedin, Twitter } from "lucide-react";

const COLUMNS = [
  { title: "Product", links: ["Intelligence", "Agents", "Command Center", "Roadmap"] },
  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security"] },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/35 bg-primary/30">
                <span className="h-2 w-2 rotate-45 rounded-[2px] bg-accent" />
              </span>
              <span className="font-display text-lg tracking-tight">CareerOS</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              An agentic AI career operating system. Understand, discover, decide,
              and grow.
            </p>
            <form
              className="mt-7 flex max-w-sm gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                required
                placeholder="you@work.com"
                aria-label="Email address"
                className="w-full rounded-full border border-border bg-secondary/50 px-5 py-3 text-sm outline-none transition-colors duration-500 placeholder:text-muted-foreground/70 focus-visible:border-accent/50"
              />
              <button type="submit" className="btn-hero !px-6 !py-3 !text-sm">
                Join
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
                  {c.title}
                </p>
                <ul className="mt-5 space-y-3">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#top"
                        className="group text-sm text-muted-foreground transition-colors duration-500 hover:text-foreground"
                      >
                        <span className="bg-gradient-to-r from-accent to-accent bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
                          {l}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-5 border-t border-border pt-8">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CareerOS. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {[Twitter, Linkedin, Github].map((Icon, i) => (
              <a
                key={i}
                href="#top"
                aria-label="Social link"
                className="text-muted-foreground transition-colors duration-500 hover:text-accent"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
