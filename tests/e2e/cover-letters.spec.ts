import { test, expect, type Page } from "@playwright/test";
const base = process.env["E2E_API_BASE_URL"] || "http://127.0.0.1:8004/api/v1";
const headers = { "X-Workspace-Client": "careeros-web" };
test.setTimeout(90000);

async function setup(page: Page) {
  await page.request.post(`${base}/session`, { headers });
  const p = await page.request.post(`${base}/profile`, {
    headers,
    data: {
      name: "Student Example",
      email: "student@example.com",
      phone: "+91 9000000000",
      skills: ["Python", "SQL", "NLP"],
      education: [
        { institution: "Example University", qualification: "B.Tech Computer Engineering" },
      ],
      projects: [
        {
          name: "Search Service",
          description:
            "Built a Python search service using SQL retrieval and evaluated its result quality.",
          technologies: ["Python", "SQL"],
        },
      ],
      experience: [
        {
          organization: "Example Software",
          role: "Developer Intern",
          description: "Developed a Python API and tested its query handling.",
          technologies: ["Python", "SQL"],
        },
      ],
      links: ["https://linkedin.com/in/student-example", "https://student-portfolio.example.com"],
    },
  });
  expect(p.status()).toBe(201);
  const profile = await p.json();
  expect(
    (
      await page.request.post(`${base}/profile/verify`, {
        headers,
        data: { expected_revision: profile.revision, confirmed: true },
      })
    ).ok(),
  ).toBe(true);
  const jobs = await (
    await page.request.get(
      `${base}/jobs?category=backend&location=Bengaluru&availability=active&page_size=1`,
      { headers },
    )
  ).json();
  const job = jobs.items[0];
  await page.request.put(`${base}/matching/bookmarks/${job.id}`, { headers });
  const a = await page.request.post(`${base}/applications`, { headers, data: { job_id: job.id } });
  expect(a.status()).toBe(201);
  const application = await a.json();
  await page.goto(`/cover-letters?application=${application.id}`);
  await expect(page.getByRole("heading", { name: job.title, exact: true })).toBeVisible();
  return application as { id: string; job: { title: string; company: string } };
}

async function preview(page: Page) {
  await page.getByLabel("Use a typed name only for the next render", { exact: false }).check();
  await page.getByRole("button", { name: "Generate cover letter", exact: true }).click();
  await expect(page.getByLabel("Cover letter state")).toContainText("preview ready", {
    timeout: 45000,
  });
  await expect(page.getByRole("img", { name: "Rendered cover-letter PDF page" })).toBeVisible();
}

test("cover letters require a confirmed profile and an application", async ({ page }) => {
  await page.goto("/cover-letters");
  await expect(
    page.getByRole("link", { name: "Confirm your candidate profile first." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate cover letter", exact: true }),
  ).toBeDisabled();
});

test("waiting for signature, explicit omission, PDF approval and correct application attachment", async ({
  page,
}) => {
  const app = await setup(page);
  await page.getByRole("button", { name: "Generate cover letter", exact: true }).click();
  await expect(page.getByLabel("Cover letter state")).toContainText("waiting for signature", {
    timeout: 45000,
  });
  await expect(page.getByRole("button", { name: "Render PDF preview" })).toBeDisabled();
  await page.getByLabel("Use a typed name only for the next render", { exact: false }).check();
  await page.getByRole("button", { name: "Render PDF preview" }).click();
  await expect(page.getByLabel("Cover letter state")).toContainText("preview ready", {
    timeout: 45000,
  });
  await expect(page.getByRole("img", { name: "Rendered cover-letter PDF page" })).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  expect((await downloading).suggestedFilename()).toMatch(/cover-letter-v1.pdf/);
  await expect(page.getByRole("button", { name: "Approve PDF version" })).toBeDisabled();
  await page.getByLabel("I reviewed this PDF", { exact: false }).check();
  await page.getByRole("button", { name: "Approve PDF version" }).click();
  await expect(page.getByLabel("Cover letter state")).toContainText("approved");
  await page.getByRole("button", { name: "Attach approved PDF to this application" }).click();
  await expect(page.getByLabel("Cover letter state")).toContainText("attached");
  expect(
    (await (await page.request.get(`${base}/applications/${app.id}`, { headers })).json()).status,
  ).toBe("job_selected");
  const timeline = await (
    await page.request.get(`${base}/applications/${app.id}/timeline`, { headers })
  ).json();
  expect(
    timeline.some((event: { payload: { stage?: string } }) =>
      event.payload.stage?.includes("cover letter attached"),
    ),
  ).toBe(true);
});

test("user signature upload, rendered placement and versioned editing", async ({ page }) => {
  const app = await setup(page);
  await page.getByText("Upload or replace signature", { exact: true }).click();
  await page.getByLabel("Signer name", { exact: true }).fill("Student Example");
  await page.getByLabel("This is my signature", { exact: false }).check();
  await page
    .getByLabel("Signature image", { exact: true })
    .setInputFiles("/private/tmp/cover-letter-test-signature.png");
  await expect(page.getByRole("img", { name: "Selected user-supplied signature" })).toBeVisible();
  await page.getByLabel("I approve this signature for the next document version.").check();
  await page.getByRole("button", { name: "Generate cover letter", exact: true }).click();
  await expect(page.getByLabel("Cover letter state")).toContainText("preview ready", {
    timeout: 45000,
  });
  await expect(page.getByLabel("Signature status")).toContainText("approved signature");
  await page.screenshot({
    path: "/private/tmp/cover-letter-workspace-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Edit letter", exact: true }).click();
  await page
    .getByLabel("Edit opening paragraph", { exact: true })
    .fill(
      `Please consider my application for the ${app.job.title} position at ${app.job.company}. I would welcome the opportunity to discuss my Python project work.`,
    );
  await expect(page.getByRole("button", { name: "Save edits as new version" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Approve PDF version" })).toBeDisabled();
  await page.getByLabel("I confirm my supplied text is accurate", { exact: false }).check();
  await page.getByRole("button", { name: "Save edits as new version" }).click();
  await expect(page.getByLabel("Cover letter state")).toContainText("Version 2 · preview ready", {
    timeout: 45000,
  });
  await page.getByText("Evidence, validation and document audit", { exact: true }).click();
  await expect(page.getByText("User-supplied paragraphs:", { exact: false })).toBeVisible();
  await page.getByLabel("Version history", { exact: true }).selectOption({
    label: (
      await page.getByLabel("Version history", { exact: true }).locator("option").allTextContents()
    ).find((text) => text.startsWith("Version 1"))!,
  });
  await expect(page.getByLabel("Cover letter state")).toContainText("Version 1");
});

test("unavailable provider is labelled as fallback, with audit and a usable local preview", async ({
  page,
}) => {
  await setup(page);
  await page.getByLabel("Use the three CrewAI agents with Groq", { exact: false }).check();
  await preview(page);
  await expect(
    page.getByText("CrewAI provider/validation failed.", { exact: false }),
  ).toBeVisible();
  await page.getByText("Evidence, validation and document audit", { exact: true }).click();
  await expect(page.getByText("local_evidence_composer", { exact: false })).toBeVisible();
});

test("generation can be cancelled without an approval or application submission", async ({
  page,
}) => {
  const app = await setup(page);
  await page.getByRole("button", { name: "Generate cover letter", exact: true }).click();
  await page.getByRole("button", { name: "Cancel generation", exact: true }).click();
  await expect(page.getByLabel("Cover letter state")).toContainText("cancelled");
  expect(
    (await (await page.request.get(`${base}/applications/${app.id}`, { headers })).json()).status,
  ).toBe("job_selected");
});

test("mobile preview remains readable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await preview(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "/private/tmp/cover-letter-workspace-mobile.png", fullPage: true });
});
