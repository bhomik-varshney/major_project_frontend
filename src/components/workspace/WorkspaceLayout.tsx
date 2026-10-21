import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCheck,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Menu,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { usePanelLight } from "@/hooks/use-panel-light";
import { healthQuery } from "@/services/api/queries";
import { AscendraMark } from "@/components/careeros/AscendraMark";

const navigation = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/profile", label: "My profile", icon: UserRound },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/jobs", label: "Opportunities", icon: BriefcaseBusiness },
  { to: "/matches", label: "My matches", icon: Target },
  { to: "/skill-gaps", label: "Skill gaps", icon: Sparkles },
  { to: "/applications", label: "Applications", icon: CheckCheck },
  { to: "/cover-letters", label: "Cover letters", icon: FileText },
  { to: "/resume-tailoring", label: "Resume tailoring", icon: FileText },
  { to: "/settings", label: "Workspace settings", icon: Settings2 },
] as const;

export function WorkspaceLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const health = useQuery(healthQuery);
  const root = usePanelLight();
  const page = navigation.find((item) => item.to === pathname)?.label || "Workspace";
  return (
    <div className="career-workspace min-h-dvh bg-background" ref={root}>
      <a className="career-skip" href="#workspace-main">
        Skip to content
      </a>
      {open && (
        <button
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`career-sidebar ${open ? "is-open" : ""}`}>
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <AscendraMark size="workspace" />
            <span className="font-display text-2xl">
              Ascendra<span className="text-accent">.</span>
            </span>
          </Link>
          <button
            className="p-2 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-8 mt-9 rounded-xl border border-border bg-secondary/50 p-3.5">
          <p className="text-xs font-medium">Student workspace</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Your career, taking shape.</p>
        </div>
        <p className="mb-3 px-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          Your space
        </p>
        <nav aria-label="Student workspace" className="flex-1 space-y-1">
          {navigation.map((item, i) => (
            <div key={item.to}>
              {i === 3 && (
                <p className="mb-3 mt-7 px-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Career toolkit
                </p>
              )}
              {i === 7 && <div className="my-5 border-t border-border" />}
              <Link
                to={item.to}
                onClick={() => setOpen(false)}
                className={`career-nav-link ${pathname === item.to ? "is-active" : ""}`}
                aria-current={pathname === item.to ? "page" : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {item.to === "/jobs" && (
                  <span className="ml-auto text-[9px] text-accent">Demo</span>
                )}
                {"planned" in item && (
                  <span className="ml-auto text-[9px] text-muted-foreground/75">Soon</span>
                )}
                {pathname === item.to && <ChevronRight className="ml-auto h-3 w-3" />}
              </Link>
            </div>
          ))}
        </nav>
        <div className="mt-8 rounded-xl border border-accent/15 bg-primary/10 p-4">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <p className="mt-3 text-xs">Your facts. Your decisions.</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Review your profile before it powers your next move.
          </p>
        </div>
        <Link to="/" className="mt-6 flex items-center gap-2 px-2 text-xs text-muted-foreground">
          <ArrowLeft className="h-3 w-3" />
          Back to home
          <ArrowUpRight className="ml-auto h-3 w-3" />
        </Link>
      </aside>
      <div className="career-content">
        <header className="career-topbar">
          <div className="flex items-center gap-3">
            <button
              className="grid h-9 w-9 place-items-center rounded-lg border border-border lg:hidden"
              aria-label="Open navigation"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="hidden text-xs text-muted-foreground sm:inline">Workspace</span>
            <ChevronRight className="hidden h-3 w-3 text-muted-foreground sm:block" />
            <span className="text-xs">{page}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-[10px] text-muted-foreground md:block">
              Local browser session
            </span>
            <button
              type="button"
              onClick={() => void health.refetch()}
              className="career-connection"
              aria-label="Check backend connection"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${health.isError ? "bg-rose-gold" : health.isPending ? "bg-muted-foreground" : "bg-emerald-300"}`}
              />
              {health.isPending ? "Connecting" : health.isError ? "Offline · retry" : "Connected"}
            </button>
            <span
              className="grid h-8 w-8 place-items-center rounded-full border border-accent/20 bg-primary/20 text-[11px] text-accent"
              aria-label="Local student workspace"
            >
              S
            </span>
          </div>
        </header>
        <main id="workspace-main" className="career-main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="career-workspace-footer">
          <span>Built for the next step.</span>
          <span>Ascendra · Phase 01</span>
        </footer>
      </div>
    </div>
  );
}
