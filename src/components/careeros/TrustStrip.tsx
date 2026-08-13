import { Reveal } from "./Reveal";

const COMPANIES = [
  "Google",
  "Microsoft",
  "Amazon",
  "NVIDIA",
  "Airbnb",
  "Stripe",
  "Spotify",
  "Linear",
];

/**
 * A quiet editorial band between the hero and the narrative. Explicitly framed
 * as illustrative — these are sample target companies, not customers.
 */
export function TrustStrip() {
  return (
    <section
      aria-label="Illustrative target companies"
      className="relative border-y border-border/60 py-11"
    >
      <div className="shell">
        <Reveal>
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-14">
            <p className="shrink-0 text-center text-[10px] uppercase leading-relaxed tracking-[0.24em] text-muted-foreground/70 lg:max-w-[13rem] lg:text-left">
              Illustrative target companies used throughout this demonstration
            </p>
            <span className="hidden h-10 w-px shrink-0 bg-border lg:block" aria-hidden="true" />
            <ul className="flex flex-wrap items-center justify-center gap-x-9 gap-y-4 lg:justify-start">
              {COMPANIES.map((c) => (
                <li
                  key={c}
                  className="font-display text-lg tracking-wide text-muted-foreground/55 transition-colors duration-500 hover:text-accent/85 md:text-xl"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
