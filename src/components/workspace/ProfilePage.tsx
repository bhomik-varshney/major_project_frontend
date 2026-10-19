import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { api, ApiError } from "@/services/api/client";
import { profileQuery, summaryQuery } from "@/services/api/queries";
import type { Profile, ProfileInput } from "@/services/api/types";
import { ErrorNotice, LoadingCards, PageHeading, Panel } from "./shared";

const blank: ProfileInput = {
  name: "",
  email: "",
  location: "",
  career_objective: "",
  education: [],
  skills: [],
  experience: [],
  projects: [],
  preferred_roles: [],
  preferred_locations: [],
  experience_level: "",
  certifications: [],
  achievements: [],
};
function inputFromProfile(profile: Profile | null): ProfileInput {
  return Object.fromEntries(
    Object.keys(blank).map((key) => [
      key,
      profile ? profile[key as keyof ProfileInput] : blank[key as keyof ProfileInput],
    ]),
  ) as ProfileInput;
}
function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const id = useId();
  return (
    <label className="career-field">
      <span id={id}>{label}</span>
      {isValidElement(children)
        ? cloneElement(
            children as ReactElement<{ "aria-labelledby": string; "aria-describedby"?: string }>,
            {
              "aria-labelledby": id,
              ...(hint ? { "aria-describedby": `${id}-hint` } : {}),
            },
          )
        : children}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </label>
  );
}
function Labels({
  label,
  values,
  onChange,
  hint,
}: {
  label: string;
  values: string[];
  onChange: (value: string[]) => void;
  hint?: string;
}) {
  const [text, setText] = useState(values.join(", "));
  return (
    <Field label={label} hint={hint || "Separate entries with commas."}>
      <input
        value={text}
        maxLength={2000}
        onChange={(event) => {
          setText(event.target.value);
          onChange(
            event.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          );
        }}
      />
    </Field>
  );
}

export function ProfilePage() {
  const query = useQuery(profileQuery);
  const [notice, setNotice] = useState("");
  return (
    <>
      <PageHeading
        eyebrow="The person behind the profile"
        title="Tell your story."
        description="Start with what you know. Add your education, skills, and projects, then review the facts in your own words."
      />
      {notice && (
        <p role="status" className="career-success mb-5">
          <Check className="h-4 w-4" />
          {notice}
        </p>
      )}
      {query.isPending ? (
        <LoadingCards />
      ) : query.isError ? (
        <ErrorNotice error={query.error} retry={() => void query.refetch()} />
      ) : (
        <ProfileForm
          key={query.data?.revision || "new"}
          profile={query.data}
          onNotice={setNotice}
        />
      )}
    </>
  );
}

function ProfileForm({
  profile,
  onNotice,
}: {
  profile: Profile | null;
  onNotice: (message: string) => void;
}) {
  const client = useQueryClient();
  const [draft, setDraft] = useState<ProfileInput>(() => inputFromProfile(profile));
  const [confirmed, setConfirmed] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(inputFromProfile(profile));
  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => {
    onNotice("");
    setDraft((previous) => ({ ...previous, [key]: value }));
  };
  const refresh = (saved: Profile, message: string) => {
    client.setQueryData(profileQuery.queryKey, saved);
    void client.invalidateQueries({ queryKey: summaryQuery.queryKey });
    onNotice(message);
  };
  const save = useMutation({
    mutationFn: () => api.saveProfile(draft, profile?.revision),
    onSuccess: (saved) => refresh(saved, "Your profile has been saved."),
  });
  const verify = useMutation({
    mutationFn: () => api.verifyProfile(profile!.revision),
    onSuccess: (saved) => refresh(saved, "Your current profile facts are confirmed."),
  });
  const busy = save.isPending || verify.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={submit} className="min-w-0 space-y-5" aria-label="Candidate profile">
        {!profile && (
          <div className="rounded-xl border border-accent/20 bg-primary/10 px-5 py-4">
            <p className="text-sm">A fresh profile, a fresh perspective.</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Your name is enough to start. You can return to everything else as your story grows.
            </p>
          </div>
        )}
        <fieldset disabled={busy} className="min-w-0 space-y-5 disabled:opacity-70">
          <Panel>
            <div className="mb-6 flex items-center gap-3">
              <span className="career-section-number">01</span>
              <h2 className="font-display text-2xl">The essentials</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  required
                  maxLength={120}
                  autoComplete="name"
                  value={draft.name}
                  onChange={(event) => set("name", event.target.value)}
                  placeholder="Your full name"
                />
              </Field>
              <Field label="Email address">
                <input
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={draft.email}
                  onChange={(event) => set("email", event.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Current location">
                <input
                  maxLength={160}
                  value={draft.location}
                  onChange={(event) => set("location", event.target.value)}
                  placeholder="City, country"
                />
              </Field>
              <Field label="Experience level">
                <select
                  value={draft.experience_level}
                  onChange={(event) =>
                    set("experience_level", event.target.value as ProfileInput["experience_level"])
                  }
                >
                  <option value="">Choose when ready</option>
                  <option value="student">Student</option>
                  <option value="graduate">Recent graduate</option>
                  <option value="early_career">Early career</option>
                  <option value="experienced">Experienced</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Career objective"
                  hint="Describe what you want to explore. This is a preference, not an eligibility filter."
                >
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={draft.career_objective}
                    onChange={(event) => set("career_objective", event.target.value)}
                    placeholder="I’m looking for an internship where I can…"
                  />
                </Field>
              </div>
            </div>
          </Panel>
          <Panel>
            <div className="mb-6 flex items-center gap-3">
              <span className="career-section-number">02</span>
              <h2 className="font-display text-2xl">Skills & direction</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Labels
                  label="Your skills"
                  values={draft.skills}
                  onChange={(value) => set("skills", value)}
                  hint="Add skills you can support with your work. Separate entries with commas."
                />
              </div>
              <Labels
                label="Preferred roles"
                values={draft.preferred_roles}
                onChange={(value) => set("preferred_roles", value)}
              />
              <Labels
                label="Preferred locations"
                values={draft.preferred_locations}
                onChange={(value) => set("preferred_locations", value)}
              />
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              These are soft preferences. Hard eligibility constraints and matching will be added
              with job discovery.
            </p>
          </Panel>
          <Panel>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="career-section-number">03</span>
                <h2 className="font-display text-2xl">Education</h2>
              </div>
              <button
                type="button"
                className="career-add"
                disabled={draft.education.length >= 20}
                onClick={() =>
                  set("education", [
                    ...draft.education,
                    { institution: "", qualification: "", period: "" },
                  ])
                }
              >
                <Plus className="h-3 w-3" />
                Add education
              </button>
            </div>
            {draft.education.length === 0 && (
              <p className="career-form-empty">
                Where have you been learning? Add a degree or current course.
              </p>
            )}
            <div className="space-y-5">
              {draft.education.map((item, index) => (
                <fieldset key={index} className="career-entry">
                  <legend className="sr-only">Education {index + 1}</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={`Institution ${index + 1}`}>
                      <input
                        required
                        maxLength={160}
                        value={item.institution}
                        onChange={(event) =>
                          set(
                            "education",
                            draft.education.map((entry, i) =>
                              i === index ? { ...entry, institution: event.target.value } : entry,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field label={`Qualification ${index + 1}`}>
                      <input
                        required
                        maxLength={160}
                        value={item.qualification}
                        onChange={(event) =>
                          set(
                            "education",
                            draft.education.map((entry, i) =>
                              i === index ? { ...entry, qualification: event.target.value } : entry,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field label={`Education period ${index + 1}`}>
                      <input
                        maxLength={80}
                        placeholder="e.g. 2023–2027, or leave unknown"
                        value={item.period}
                        onChange={(event) =>
                          set(
                            "education",
                            draft.education.map((entry, i) =>
                              i === index ? { ...entry, period: event.target.value } : entry,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    className="career-remove mt-4"
                    aria-label={`Remove education ${index + 1}`}
                    onClick={() =>
                      set(
                        "education",
                        draft.education.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </fieldset>
              ))}
            </div>
          </Panel>
          <Panel>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="career-section-number">04</span>
                <h2 className="font-display text-2xl">Experience</h2>
              </div>
              <button
                type="button"
                className="career-add"
                disabled={draft.experience.length >= 20}
                onClick={() =>
                  set("experience", [
                    ...draft.experience,
                    { organization: "", role: "", description: "", period: "" },
                  ])
                }
              >
                <Plus className="h-3 w-3" />
                Add experience
              </button>
            </div>
            {draft.experience.length === 0 && (
              <p className="career-form-empty">
                Internships, part-time work, or volunteering. It’s okay to be starting out.
              </p>
            )}
            <div className="space-y-5">
              {draft.experience.map((item, index) => (
                <fieldset key={index} className="career-entry">
                  <legend className="sr-only">Experience {index + 1}</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(["organization", "role", "period"] as const).map((field) => (
                      <Field
                        key={field}
                        label={`${field === "organization" ? "Organization" : field === "role" ? "Role" : "Work period"} ${index + 1}`}
                      >
                        <input
                          required={field !== "period"}
                          maxLength={field === "period" ? 80 : 160}
                          value={item[field]}
                          onChange={(event) =>
                            set(
                              "experience",
                              draft.experience.map((entry, i) =>
                                i === index ? { ...entry, [field]: event.target.value } : entry,
                              ),
                            )
                          }
                        />
                      </Field>
                    ))}
                    <div className="sm:col-span-2">
                      <Field label={`Experience description ${index + 1}`}>
                        <textarea
                          rows={2}
                          maxLength={2000}
                          value={item.description}
                          onChange={(event) =>
                            set(
                              "experience",
                              draft.experience.map((entry, i) =>
                                i === index ? { ...entry, description: event.target.value } : entry,
                              ),
                            )
                          }
                        />
                      </Field>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="career-remove mt-4"
                    aria-label={`Remove experience ${index + 1}`}
                    onClick={() =>
                      set(
                        "experience",
                        draft.experience.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </fieldset>
              ))}
            </div>
          </Panel>
          <Panel>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="career-section-number">05</span>
                <h2 className="font-display text-2xl">Projects & achievements</h2>
              </div>
              <button
                type="button"
                className="career-add"
                disabled={draft.projects.length >= 30}
                onClick={() =>
                  set("projects", [...draft.projects, { name: "", description: "", url: "" }])
                }
              >
                <Plus className="h-3 w-3" />
                Add project
              </button>
            </div>
            {draft.projects.length === 0 && (
              <p className="career-form-empty mb-5">
                Show something you’ve built, explored, or contributed to.
              </p>
            )}
            <div className="space-y-5">
              {draft.projects.map((item, index) => (
                <fieldset key={index} className="career-entry">
                  <legend className="sr-only">Project {index + 1}</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={`Project name ${index + 1}`}>
                      <input
                        required
                        maxLength={160}
                        value={item.name}
                        onChange={(event) =>
                          set(
                            "projects",
                            draft.projects.map((entry, i) =>
                              i === index ? { ...entry, name: event.target.value } : entry,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field label={`Project URL ${index + 1}`}>
                      <input
                        type="url"
                        maxLength={500}
                        value={item.url}
                        onChange={(event) =>
                          set(
                            "projects",
                            draft.projects.map((entry, i) =>
                              i === index ? { ...entry, url: event.target.value } : entry,
                            ),
                          )
                        }
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label={`Project description ${index + 1}`}>
                        <textarea
                          rows={2}
                          maxLength={2000}
                          value={item.description}
                          onChange={(event) =>
                            set(
                              "projects",
                              draft.projects.map((entry, i) =>
                                i === index ? { ...entry, description: event.target.value } : entry,
                              ),
                            )
                          }
                        />
                      </Field>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="career-remove mt-4"
                    aria-label={`Remove project ${index + 1}`}
                    onClick={() =>
                      set(
                        "projects",
                        draft.projects.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </fieldset>
              ))}
              <Labels
                label="Certifications"
                values={draft.certifications}
                onChange={(value) => set("certifications", value)}
              />
              <Labels
                label="Achievements"
                values={draft.achievements}
                onChange={(value) => set("achievements", value)}
              />
            </div>
          </Panel>
        </fieldset>
        {save.isError && (
          <div className="space-y-3">
            <ErrorNotice error={save.error} />
            {save.error instanceof ApiError &&
              ["revision_conflict", "profile_exists"].includes(save.error.code) && (
                <button
                  type="button"
                  className="btn-ghost !text-xs"
                  onClick={() => void client.fetchQuery({ ...profileQuery, staleTime: 0 })}
                >
                  Reload saved profile (discard edits)
                </button>
              )}
          </div>
        )}
        <div className="career-savebar">
          <p className="text-[11px] text-muted-foreground">
            {dirty
              ? "You have unsaved changes."
              : profile
                ? `Saved revision ${profile.revision}`
                : "Your profile is ready for a first step."}
          </p>
          <button
            type="submit"
            className="btn-hero !py-3 !text-xs"
            disabled={busy || (!!profile && !dirty)}
          >
            <Save className="h-3.5 w-3.5" />
            {save.isPending ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
      <aside className="space-y-5 xl:sticky xl:top-24">
        <Panel className="border-accent/20">
          <ShieldCheck className="h-6 w-6 text-accent" />
          <h2 className="mt-5 font-display text-2xl">Facts you stand behind.</h2>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Saving keeps your information. Confirming means you’ve reviewed it and believe it is
            accurate.
          </p>
          {profile?.verification_state === "verified" && !dirty ? (
            <p className="career-success mt-5">
              <Check className="h-4 w-4" />
              Current facts confirmed
            </p>
          ) : (
            <>
              <label className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[var(--rose)]"
                  checked={confirmed}
                  disabled={!profile || dirty || busy}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                <span>I have reviewed the saved facts and confirm they are accurate.</span>
              </label>
              <button
                type="button"
                className="btn-ghost mt-5 w-full !text-xs"
                disabled={!profile || dirty || !confirmed || busy}
                onClick={() => verify.mutate()}
              >
                {verify.isPending ? "Confirming…" : "Confirm profile facts"}
              </button>
              {(!profile || dirty) && (
                <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                  Save your changes before confirming your profile.
                </p>
              )}
            </>
          )}
          {verify.isError && (
            <div className="mt-4">
              <ErrorNotice error={verify.error} />
            </div>
          )}
          <div className="mt-5 border-t border-border pt-4 text-[10px] leading-relaxed text-muted-foreground">
            Confirmation is your review, not independent certification. Future edits require a new
            review.
          </div>
        </Panel>
        <Panel>
          <p className="eyebrow !text-[9px]">A little guidance</p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Concrete details help: what you built, the tools you used, and your contribution. Leave
            unknown dates and details empty.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Your information stays in this local workspace. Nothing is sent to an AI provider.
          </p>
        </Panel>
      </aside>
    </div>
  );
}
