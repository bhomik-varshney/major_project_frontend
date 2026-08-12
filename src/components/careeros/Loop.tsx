import { Reveal, SectionHeading } from "./Reveal";

const STAGES = ["Understand", "Discover", "Match", "Prepare", "Apply", "Learn", "Improve"];

export function Loop() {
  return (
    <section className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="The career loop"
          title="Growth is not a line. It is a loop."
          subtitle="Every cycle makes the system understand you better — and makes your next move stronger."
        />

        <Reveal delay={100}>
          <div className="relative mx-auto mt-16 max-w-4xl">
            <svg viewBox="0 0 400 160" className="w-full">
              <path
                d="M120 80 C 120 20, 20 20, 20 80 S 120 140, 200 80 S 380 20, 380 80 S 280 140, 200 80"
                fill="none"
                stroke="var(--rose)"
                strokeOpacity="0.4"
                strokeWidth="1.2"
                className="animate-dash"
              />
            </svg>
          </div>
        </Reveal>

        <ul className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-3">
          {STAGES.map((s, i) => (
            <Reveal as="li" key={s} delay={i * 60}>
              <span className="inline-flex items-center gap-3 rounded-full border border-border bg-secondary/45 px-5 py-2.5 text-sm text-muted-foreground transition-colors duration-500 hover:border-accent/40 hover:text-foreground">
                <span className="h-1.5 w-1.5 rotate-45 bg-accent" />
                {s}
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
