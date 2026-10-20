import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, MapPin, Search } from "lucide-react";
import { api } from "@/services/api/client";
import type { DemoJob, JobFilters } from "@/services/api/types";
import { ErrorNotice, Panel, PageHeading } from "./shared";
import { formatDate } from "@/lib/workspace-date";

const emptyFilters: JobFilters = {
  keyword: "",
  skills: "",
  location: "",
  work_mode: "",
  experience: "",
  category: "",
  employment_type: "",
  company: "",
  industry: "",
  country: "",
  posted_from: "",
  posted_to: "",
  availability: "all",
};
const inputStyle = "mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm";
const human = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
function compensation(job: DemoJob) {
  if (!job.salary) return "Not specified";
  const money = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: job.salary.currency,
    maximumFractionDigits: 0,
  });
  return `${money.format(job.salary.minimum)}–${money.format(job.salary.maximum)} / ${job.salary.period}`;
}
function demoStatus(job: DemoJob, referenceDate: string) {
  if (job.posted_date > referenceDate) return "Future-dated demo";
  if (job.closing_date && job.closing_date < referenceDate) return "Expired demo";
  return "Active at dataset date";
}

export function JobsPage() {
  const [form, setForm] = useState<JobFilters>(emptyFilters);
  const [filters, setFilters] = useState<JobFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const options = useQuery({
    queryKey: ["career", "job-options"],
    queryFn: ({ signal }) => api.jobOptions(signal),
    retry: false,
    staleTime: 30_000,
  });
  const jobs = useQuery({
    queryKey: ["career", "jobs", filters, page],
    queryFn: ({ signal }) => api.jobs(filters, page, signal),
    retry: false,
    staleTime: 30_000,
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFilters({ ...form });
    setPage(1);
  };
  const reset = () => {
    setForm(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
  };
  const textField = (
    key: keyof JobFilters,
    label: string,
    placeholder: string,
    maxLength = 120,
  ) => (
    <label className="text-xs" key={key}>
      {label}
      <input
        className={inputStyle}
        aria-label={label}
        value={form[key]}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </label>
  );
  const selectField = (key: keyof JobFilters, label: string, values: string[], any: string) => (
    <label className="text-xs" key={key}>
      {label}
      <select
        className={inputStyle}
        aria-label={label}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      >
        <option value="">{any}</option>
        {values.map((value) => (
          <option value={value} key={value}>
            {human(value)}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <>
      <PageHeading
        eyebrow="Explore the possibilities"
        title="Opportunity discovery."
        description="Explore careers across a broad demonstration dataset. Search and filter listings, or visit Your matches to compare them with your confirmed profile."
      />
      <Panel className="mb-5 border-accent/25">
        <p className="text-sm font-medium text-accent">Seeded demonstration jobs</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          All companies, vacancies, salaries and dates below are synthetic project data, not live
          openings. Application URLs are inactive placeholders. Expired, future-dated and unusual
          examples are included for evaluation.
        </p>
      </Panel>
      <Panel className="mb-6">
        <form onSubmit={submit} aria-label="Search demonstration jobs">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {textField("keyword", "Keyword", "Role, company or keyword")}
            <label className="text-xs">
              Skills
              <input
                className={inputStyle}
                aria-label="Skills"
                aria-describedby="jobs-skills-help"
                value={form.skills}
                maxLength={300}
                placeholder="Python, SQL"
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
              />
              <span id="jobs-skills-help" className="mt-1 block text-[10px] text-muted-foreground">
                Comma separated. All skills must match; JS and JavaScript are equivalent.
              </span>
            </label>
            {textField("location", "Location", "City or Remote")}
            {selectField(
              "work_mode",
              "Work arrangement",
              ["remote", "hybrid", "onsite"],
              "Any arrangement",
            )}
            {selectField(
              "experience",
              "Experience",
              options.data?.experience_levels || [
                "student",
                "fresher",
                "graduate",
                "entry_level",
                "junior",
                "limited_experience",
              ],
              "Any experience",
            )}
            {selectField("category", "Category", options.data?.categories || [], "All categories")}
          </div>
          <details className="mt-5 rounded-lg border border-border p-4">
            <summary className="cursor-pointer text-xs text-accent">More filters</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selectField(
                "employment_type",
                "Employment type",
                options.data?.employment_types || [
                  "internship",
                  "full_time",
                  "contract",
                  "apprenticeship",
                ],
                "Any employment type",
              )}
              {textField("company", "Company", "Synthetic company name", 160)}
              {selectField(
                "industry",
                "Industry",
                options.data?.industries || [],
                "All industries",
              )}
              {selectField("country", "Country", options.data?.countries || [], "All countries")}
              <label className="text-xs">
                Posted from
                <input
                  className={inputStyle}
                  aria-label="Posted from"
                  type="date"
                  value={form.posted_from}
                  onChange={(e) => setForm({ ...form, posted_from: e.target.value })}
                />
              </label>
              <label className="text-xs">
                Posted to
                <input
                  className={inputStyle}
                  aria-label="Posted to"
                  type="date"
                  min={form.posted_from || undefined}
                  value={form.posted_to}
                  onChange={(e) => setForm({ ...form, posted_to: e.target.value })}
                />
              </label>
              <label className="text-xs">
                Dataset availability
                <select
                  className={inputStyle}
                  aria-label="Dataset availability"
                  value={form.availability}
                  onChange={(e) =>
                    setForm({ ...form, availability: e.target.value as JobFilters["availability"] })
                  }
                >
                  <option value="all">All demonstration dates</option>
                  <option value="active">Active at reference date</option>
                  <option value="expired">Expired examples</option>
                  <option value="future">Future-dated examples</option>
                </select>
              </label>
            </div>
          </details>
          {options.isError && (
            <div className="mt-4">
              <ErrorNotice error={options.error} retry={() => void options.refetch()} />
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-5">
            <button className="btn-hero !py-2.5 !text-xs" type="submit">
              <Search className="h-3.5 w-3.5" />
              Search jobs
            </button>
            <button
              className="text-xs text-muted-foreground underline"
              type="button"
              onClick={reset}
            >
              Reset filters
            </button>
          </div>
        </form>
      </Panel>
      {jobs.isPending ? (
        <Panel>
          <p role="status" aria-label="Loading jobs" className="animate-pulse text-sm">
            Loading demonstration jobs…
          </p>
        </Panel>
      ) : jobs.isError ? (
        <ErrorNotice error={jobs.error} retry={() => void jobs.refetch()} />
      ) : (
        <>
          <p role="status" className="mb-4 text-xs text-muted-foreground">
            {jobs.data.total} demonstration {jobs.data.total === 1 ? "job" : "jobs"} · dataset{" "}
            {jobs.data.dataset_version} · reference date {jobs.data.reference_date}
          </p>
          {jobs.data.warnings.map((warning) => (
            <p key={warning} className="mb-4 text-xs text-accent">
              {warning}
            </p>
          ))}
          {jobs.data.items.length === 0 ? (
            <Panel className="py-12 text-center">
              <h2 className="font-display text-2xl">No demonstration jobs found.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Try fewer filters or browse the whole dataset.
              </p>
              <button className="btn-ghost mt-5 !text-xs" type="button" onClick={reset}>
                Browse all demo jobs
              </button>
            </Panel>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {jobs.data.items.map((job) => (
                <Panel key={job.id} className="min-w-0" light>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <BriefcaseBusiness className="h-4 w-4 text-accent" />
                    <span className="rounded-full border border-accent/25 px-2.5 py-1 text-[9px] text-accent">
                      Seeded / mock
                    </span>
                  </div>
                  <h2 className="font-display text-2xl">{job.title}</h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {job.company} · {job.industry}
                  </p>
                  <p className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <MapPin className="h-3.5 w-3.5 text-accent" />
                    {job.location}
                    {!job.location.includes(job.country) ? `, ${job.country}` : ""} ·{" "}
                    {human(job.work_mode)} · {human(job.employment_type)} ·{" "}
                    {human(job.experience_level)}
                  </p>
                  <p className="mt-3 text-[10px] text-accent">
                    {demoStatus(job, jobs.data.reference_date)}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {job.description ||
                      "Description intentionally omitted in this demonstration record. Review the requirements below."}
                  </p>
                  <p className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
                    Required skills
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {job.required_skills.map((skill, index) => (
                      <li
                        className="rounded-md bg-secondary px-2 py-1 text-xs"
                        key={`${skill}-${index}`}
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                  {job.preferred_skills.length > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Preferred: {job.preferred_skills.join(", ")}
                    </p>
                  )}
                  <details className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    <summary className="cursor-pointer text-accent">Role details</summary>
                    <div className="mt-3 space-y-3">
                      <p>
                        Department: {job.department || "Not specified"} · Company size:{" "}
                        {job.metadata.company_size
                          ? human(job.metadata.company_size)
                          : "Not specified"}
                      </p>
                      <p>
                        Experience: {job.experience_years_min}–{job.experience_years_max} years
                      </p>
                      <ul className="list-inside list-disc">
                        {job.responsibilities.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                      <p>Tools: {job.tools_and_technologies.join(", ") || "Not specified"}</p>
                      <p>Education: {job.education_requirements.join(" ") || "Not specified"}</p>
                      <p>Languages: {job.language_requirements.join(", ") || "Not specified"}</p>
                      {job.metadata.edge_cases.length > 0 && (
                        <p>Evaluation examples: {job.metadata.edge_cases.map(human).join(", ")}</p>
                      )}
                    </div>
                  </details>
                  <div className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
                    <p>
                      {job.employment_type === "internship" ? "Demo stipend" : "Demo salary"}:{" "}
                      {compensation(job)}
                    </p>
                    <p className="mt-1">
                      Dataset posted date: {formatDate(job.posted_date)}
                      {job.closing_date
                        ? ` · Demo closing: ${formatDate(job.closing_date)}`
                        : " · Closing not specified"}
                    </p>
                    <p className="mt-2">Applications unavailable · placeholder URL only</p>
                  </div>
                </Panel>
              ))}
            </div>
          )}
          {jobs.data.total > 0 && (
            <nav
              aria-label="Job result pages"
              className="mt-6 flex flex-wrap items-center justify-center gap-5"
            >
              <button
                className="btn-ghost !text-xs"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous page
              </button>
              <span className="text-xs">
                Page {page} of {Math.max(1, Math.ceil(jobs.data.total / jobs.data.page_size))}
              </span>
              <button
                className="btn-ghost !text-xs"
                disabled={page * jobs.data.page_size >= jobs.data.total}
                onClick={() => setPage(page + 1)}
              >
                Next page
              </button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
