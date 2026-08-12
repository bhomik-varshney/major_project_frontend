import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export function FinalCTA() {
  return (
    <section id="final" className="relative overflow-hidden py-32 lg:py-44">
      <div className="hero-glow pointer-events-none absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="animate-pulse-soft absolute h-[2px] w-[2px] rounded-full bg-accent"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 29) % 100}%`,
              animationDelay: `${(i % 11) * 0.35}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-10">
        <Reveal>
          <h2 className="font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
            Your next opportunity is
            <br />
            <span className="text-gradient italic">already out there.</span>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mt-6 text-base text-muted-foreground md:text-lg">
            Let's make sure you're ready for it.
          </p>
        </Reveal>
        <Reveal delay={180}>
          <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
            <a href="#top" className="btn-hero !px-9 !py-4 !text-base">
              Enter CareerOS
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#understands" className="btn-ghost !px-8 !py-4 !text-base">
              Explore the intelligence
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
