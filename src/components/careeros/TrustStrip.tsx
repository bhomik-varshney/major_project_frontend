import { Reveal } from "./Reveal";

const COMPANIES = [
  "Google",
  "Microsoft",
  "Amazon",
  "NVIDIA",
  "Airbnb",
  "Stripe",
  "Spotify",
];

export function TrustStrip() {
  return (
    <section className="relative border-y border-border/70 py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <p className="text-center text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
            Opportunities sourced from teams at
          </p>
          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
            {COMPANIES.map((c) => (
              <li
                key={c}
                className="font-display text-lg tracking-wide text-muted-foreground/60 transition-colors duration-500 hover:text-accent/80 md:text-xl"
              >
                {c}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
