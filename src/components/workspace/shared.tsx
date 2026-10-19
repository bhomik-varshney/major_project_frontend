import type { ReactNode } from "react";
import { ArrowRight, AlertCircle, RotateCcw, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ApiError } from "@/services/api/client";

export function Panel({
  children,
  className = "",
  light = false,
}: {
  children: ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <section
      className={`career-panel ${className}`}
      {...(light ? { "data-panel-light": true } : {})}
    >
      {children}
    </section>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div role="alert" className="career-error">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm">
          {error instanceof Error ? error.message : "Something went wrong. Try again."}
        </p>
        {error instanceof ApiError && error.fields.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs">
            {error.fields.map((item) => (
              <li key={item.field}>
                {item.field.replaceAll("_", " ")}: {item.message}
              </li>
            ))}
          </ul>
        )}
        {error instanceof ApiError && error.operationId && (
          <p className="mt-2 break-all text-[10px] text-muted-foreground">
            Reference: {error.operationId}
          </p>
        )}
        {retry && (
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 text-xs underline underline-offset-4"
            onClick={retry}
          >
            <RotateCcw className="h-3 w-3" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
export function LoadingCards() {
  return (
    <div role="status" aria-label="Loading workspace" className="grid gap-5 sm:grid-cols-2">
      <span className="sr-only">Loading workspace…</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="career-panel min-h-40 animate-pulse">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="mt-6 h-8 w-3/4 rounded bg-muted" />
          <div className="mt-3 h-3 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
export function PlannedPage({ title, description }: { title: string; description: string }) {
  return (
    <>
      <PageHeading eyebrow="On the horizon" title={title} description={description} />
      <Panel className="py-16 text-center">
        <span className="career-icon mx-auto">
          <Sparkles className="h-5 w-5" />
        </span>
        <h2 className="mt-6 font-display text-3xl">A little further along the path.</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          This feature is planned for the next implementation phase. Start with your profile and
          documents; nothing is running in the background.
        </p>
        <Link to="/profile" className="btn-hero mt-7 !text-sm">
          Build your profile
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Panel>
    </>
  );
}
