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
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <Reveal>
          <p className="text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70 sm:text-[11px] sm:tracking-[0.28em]">
            Illustrative target companies used throughout this demo
          </p>
          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12 sm:gap-y-5">
            {COMPANIES.map((c) => (
              <li
                key={c}
                className="font-display text-base tracking-wide text-muted-foreground/60 transition-colors duration-500 hover:text-accent/80 sm:text-lg md:text-xl"
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
