import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  Circle,
  FileText,
  FolderOpen,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { summaryQuery } from "@/services/api/queries";
import { ErrorNotice, LoadingCards, PageHeading, Panel } from "./shared";
import { formatDate } from "@/lib/workspace-date";

export function Dashboard() {
  const query = useQuery(summaryQuery);
  if (query.isPending)
    return (
      <>
        <PageHeading
          eyebrow="Your career, in focus"
          title="Making room for your next step."
          description="Loading your saved workspace…"
        />
        <LoadingCards />
      </>
    );
  if (query.isError)
    return (
      <>
        <PageHeading
          eyebrow="Your career, in focus"
          title="Let’s get you connected."
          description="Your workspace needs a connection to load your saved information."
        />
        <ErrorNotice error={query.error} retry={() => void query.refetch()} />
      </>
    );
  const data = query.data;
  const steps = [
    {
      label: "Introduce yourself",
      detail: "Add your education, projects, and direction.",
      done: data.profile_exists,
      to: "/profile",
      icon: UserRound,
    },
    {
      label: "Bring your experience",
      detail: "Keep a resume or supporting document here.",
      done: data.uploaded_document_count > 0,
      to: "/documents",
      icon: FileText,
    },
    {
      label: "Make it yours",
      detail: "Review and confirm the facts in your profile.",
      done: data.verification_state === "verified",
      to: "/profile",
      icon: ShieldCheck,
    },
  ] as const;
  return (
    <>
      <PageHeading
        eyebrow="Your career, in focus"
        title={
          data.candidate_name
            ? `Welcome back, ${data.candidate_name.split(" ")[0]}.`
            : "Your next chapter starts here."
        }
        description="A little clarity today. A more intentional next move tomorrow."
        action={
          <Link to="/profile" className="btn-ghost !py-2.5 !text-xs">
            {data.profile_exists ? "Edit profile" : "Create profile"}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
        <Panel light className="career-profile-hero">
          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="eyebrow !text-[9px]">The foundation of your career</span>
              <span className="career-pill">
                <span
                  className={`h-1 w-1 rounded-full ${data.verification_state === "verified" ? "bg-emerald-300" : "bg-accent"}`}
                />
                {data.verification_state === "verified"
                  ? "Facts confirmed"
                  : data.profile_exists
                    ? "Review your facts"
                    : "Ready when you are"}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-[22rem]">
                <h2 className="font-display text-3xl leading-[1.15] sm:text-4xl">
                  More than a résumé.
                  <br />
                  <span className="italic text-muted-foreground">A picture of you.</span>
                </h2>
                <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Your skills, your work, your ambitions. Give your career companion a foundation it
                  can trust.
                </p>
              </div>
              <div
                className="career-completion"
                role="img"
                aria-label={`Profile ${data.profile_completion}% complete`}
                style={{ "--completion": `${data.profile_completion}%` } as React.CSSProperties}
              >
                <div>
                  <span className="font-display text-4xl">
                    {data.profile_completion}
                    <span className="text-base text-muted-foreground">%</span>
                  </span>
                  <span className="mt-1 text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                    Profile complete
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <Link to="/profile" className="inline-flex items-center gap-3 text-xs text-accent">
                {data.profile_completion === 100
                  ? "Review your profile"
                  : "Continue building your profile"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-[10px] text-muted-foreground">
                {data.profile_revision
                  ? `Revision ${data.profile_revision} · saved locally`
                  : "One step at a time"}
              </span>
            </div>
          </div>
        </Panel>
        <Panel className="flex flex-col">
          <p className="eyebrow !text-[9px]">A good place to begin</p>
          <h2 className="mt-3 font-display text-2xl">Set yourself up.</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Three small steps toward a clearer direction.
          </p>
          <ol className="mt-5 flex-1 divide-y divide-border">
            {steps.map((step, i) => (
              <li key={step.label}>
                <Link to={step.to} className="group flex items-center gap-3 py-4">
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] ${step.done ? "border-accent/30 bg-accent/10 text-accent" : "border-border text-muted-foreground"}`}
                  >
                    {step.done ? <Check className="h-3 w-3" /> : `0${i + 1}`}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs group-hover:text-accent">{step.label}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                      {step.detail}
                    </p>
                  </div>
                  <ArrowUpRight className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ol>
          <span className="pt-2 text-[10px] text-muted-foreground">
            {steps.filter((step) => step.done).length} of 3 steps complete
          </span>
        </Panel>
      </div>
      <div className="my-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Your documents",
            value: data.uploaded_document_count,
            detail: "Stored in your library",
            icon: FolderOpen,
          },
          {
            label: "Profile skills",
            value: data.profile_skill_count,
            detail: data.extracted_skill_count
              ? `${data.extracted_skill_count} reviewed from documents`
              : "Added by you",
            icon: Sparkles,
          },
          {
            label: "Recommended jobs",
            value: data.recommended_job_count ?? "—",
            detail:
              data.recommended_job_count === null
                ? "Find matches from your confirmed profile"
                : "From your latest current matching run",
            icon: Target,
          },
          {
            label: "Applications",
            value: "—",
            detail: "Tracking is coming next",
            icon: CheckCheck,
          },
        ].map((metric) => (
          <Panel key={metric.label} light className="!p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">{metric.label}</p>
              <metric.icon className="h-3.5 w-3.5 text-accent/70" />
            </div>
            <p className="mt-5 font-display text-3xl">{metric.value}</p>
            <p className="mt-2 text-[10px] text-muted-foreground">{metric.detail}</p>
          </Panel>
        ))}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow !text-[9px]">One thing at a time</p>
              <h2 className="mt-3 font-display text-2xl">Your next moves</h2>
            </div>
            <span className="career-pill">Personal foundation</span>
          </div>
          <Link to="/matches" className="career-action-card group mt-6 block">
            <Target className="h-5 w-5 text-accent" />
            <h3 className="mt-3 text-sm">Find matching jobs</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Compare your confirmed profile with seeded opportunities and inspect every score.
            </p>
          </Link>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Link to="/profile" className="career-action-card group">
              <UserRound className="h-5 w-5 text-accent" />
              <h3 className="mt-5 text-sm">Shape your profile</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Add the work you’re proud of and the roles you’re curious about.
              </p>
              <span className="mt-5 flex items-center gap-2 text-[11px] text-accent">
                Open profile
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link to="/documents" className="career-action-card group">
              <ArrowDownToLine className="h-5 w-5 text-accent" />
              <h3 className="mt-5 text-sm">Bring your documents</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Upload a resume, review its extracted information, and confirm the facts you want to
                keep.
              </p>
              <span className="mt-5 flex items-center gap-2 text-[11px] text-accent">
                Open documents
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-secondary/25 p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Your profile changes only after your review. Document processing is local by default;
              optional Groq enhancement requires your choice. No external applications are sent.
            </p>
          </div>
          <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <Link to="/skill-gaps" className="text-xs">
              <span className="text-muted-foreground">Skill gaps</span>
              <p className="mt-2">{data.skill_gap_count ?? "Available after job matching"}</p>
            </Link>
            <Link to="/applications" className="text-xs">
              <span className="text-muted-foreground">Pending approvals</span>
              <p className="mt-2">
                {data.pending_approval_count ?? "Application review is coming next"}
              </p>
            </Link>
          </div>
        </Panel>
        <Panel>
          <p className="eyebrow !text-[9px]">The small steps add up</p>
          <h2 className="mt-3 font-display text-2xl">Recent activity</h2>
          {data.recent_activity.length === 0 ? (
            <div className="py-12 text-center">
              <span className="career-icon mx-auto">
                <Circle className="h-4 w-4" />
              </span>
              <p className="mt-4 text-xs">A fresh start.</p>
              <p className="mx-auto mt-2 max-w-48 text-[11px] leading-relaxed text-muted-foreground">
                Your saved changes and uploads will appear here.
              </p>
            </div>
          ) : (
            <ol className="mt-6 space-y-5">
              {data.recent_activity.map((activity) => (
                <li key={activity.id} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
                  <div>
                    <p className="text-xs leading-relaxed">{activity.message}</p>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
}
