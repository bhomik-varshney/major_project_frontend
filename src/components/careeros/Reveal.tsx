import { useEffect, useRef, useState, type ReactNode } from "react";

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}

export function Reveal({
  children,
  delay = 0,
  className = "",
  variant = "up",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** `up` fades upward, `x` slides in from the left, `none` only toggles `is-visible`. */
  variant?: "up" | "x" | "none";
  as?: "div" | "section" | "li" | "span";
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const base = variant === "x" ? "reveal-x" : variant === "none" ? "" : "reveal";
  return (
    <Tag
      ref={ref as never}
      className={`${base} ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/**
 * Editorial headline whose lines rise out of their own mask. Pass an array of
 * lines so each can carry its own stagger — a single string keeps one mask.
 */
export function MaskedLines({
  lines,
  className = "",
  lineClassName = "",
  stagger = 90,
  delay = 0,
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  stagger?: number;
  delay?: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <span ref={ref} className={`reveal-lines ${visible ? "is-visible" : ""} ${className}`}>
      {lines.map((line, i) => (
        <span className={`line-mask ${lineClassName}`} key={i}>
          <span style={{ transitionDelay: `${delay + i * stagger}ms` }}>{line}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * Editorial section header. Defaults to a LEFT-aligned, numbered composition —
 * centered headers are opt-in, so the page doesn't fall into a repeating
 * "centered title over a grid of cards" rhythm.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  subtitle,
  align = "left",
  className = "",
}: {
  /** Editorial section number, e.g. "01". Rendered as an oversized outline. */
  index?: string;
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={`${centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}>
      <Reveal>
        <div className={`flex items-center gap-4 ${centered ? "justify-center" : ""}`}>
          {index ? <span className="eyebrow tnum text-accent/55">{index}</span> : null}
          {index ? <span className="h-px w-8 bg-accent/30" aria-hidden="true" /> : null}
          <p className="eyebrow">{eyebrow}</p>
        </div>
      </Reveal>

      <Reveal delay={70}>
        <h2 className="mt-6 font-display text-[2.5rem] leading-[1.02] sm:text-5xl md:text-6xl lg:text-[4.25rem]">
          {title}
        </h2>
      </Reveal>

      {subtitle ? (
        <Reveal delay={140}>
          <p
            className={`mt-6 text-base leading-relaxed text-muted-foreground md:text-lg ${
              centered ? "mx-auto max-w-2xl" : "max-w-xl"
            }`}
          >
            {subtitle}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
