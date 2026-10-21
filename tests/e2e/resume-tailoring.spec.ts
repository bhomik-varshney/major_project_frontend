import { test, expect, type Page } from "@playwright/test";
const base = process.env["E2E_API_BASE_URL"] || "http://127.0.0.1:8005/api/v1";
const headers = { "X-Workspace-Client": "careeros-web" };
test.setTimeout(90000);

async function setup(page: Page, complete = false) {
  await page.request.post(`${base}/session`, { headers });
  const p = await page.request.post(`${base}/profile`, {
    headers,
    data: {
      name: "Student Example",
      email: "student@example.com",
      phone: "+91 9000000000",
      location: "Bengaluru, India",
      skills: complete
        ? [
            "Python",
            "SQL",
            "NLP",
            "Git",
            "Docker",
            "React Native",
            "React",
            "TypeScript",
            "FastAPI",
            "spaCy",
            "PyTorch",
            "QLoRA",
            "PEFT",
            "BERTScore",
            "HTML",
            "JavaScript",
            "C/C++",
            "OpenCV",
            "MediaPipe",
            "Flask",
            "MCP",
            "CrewAI",
            "LangGraph",
            "Render",
            "Docker Compose",
            "Langfuse",
            "Tesseract OCR",
            "Hugging Face Transformers",
            "bitsandbytes",
            "Three.js",
            "React Three Fiber",
            "TanStack Start",
            "MCP Apps",
            "OpenAI Agents SDK",
            "Groq LLM API",
            "PostgreSQL",
          ]
        : ["Python", "SQL", "NLP", "Git", "Docker"],
      career_objective: "Develop reliable Python backend applications.",
      education: [
        {
          institution: "Example University",
          qualification: "B.Tech Computer Engineering",
          period: "2023 – 2027",
          grade: "8.2/10",
        },
      ],
      experience: [
        ...(complete
          ? [
              {
                organization: "Adobe Systems India",
                role: "React Native Developer Intern",
                period: "May 2025 – July 2025",
                location: "Remote",
                description: "Built React Native components for an internal learning system.",
                technologies: ["React Native"],
              },
            ]
          : []),
        {
          organization: "Example Software",
          role: "Developer Intern",
          period: "May 2026 – July 2026",
          description: "Built a Python API for retrieval and tested SQL query handling.",
          technologies: ["Python", "SQL"],
        },
      ],
      projects: [
        ...(complete
          ? [
              {
                name: "Mobile Learning",
                description: "Developed React Native components for a learning application.",
                technologies: ["React Native"],
              },
              {
                name: "Vision Experiment",
                description: "Built an OpenCV experiment with Python.",
                technologies: ["OpenCV", "Python"],
              },
            ]
          : []),
        {
          name: "Search Service",
          role: "Developer",
          period: "January 2026 – April 2026",
          description:
            "Developed a Python search service with SQL retrieval and evaluated its outputs.",
          technologies: ["Python", "SQL"],
          repository: "https://github.com/student/search-service",
        },
        {
          name: "Text Classifier",
          description: "Built an NLP classifier and evaluated its predictions.",
          technologies: ["Python", "NLP"],
        },
      ],
      links: [
        "https://linkedin.com/in/student-example",
        "https://github.com/student",
        "https://student-portfolio.example.com",
      ],
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
      `${base}/jobs?category=backend&keyword=Python&location=Bengaluru&availability=active&page_size=1`,
      { headers },
    )
  ).json();
  const job = jobs.items[0];
  expect(job).toBeTruthy();
  await page.request.put(`${base}/matching/bookmarks/${job.id}`, { headers });
  const result = await page.request.post(`${base}/applications`, {
    headers,
    data: { job_id: job.id },
  });
  expect(result.status()).toBe(201);
  const application = await result.json();
  await page.goto(`/resume-tailoring?application=${application.id}`);
  await expect(page.getByRole("heading", { name: job.title, exact: true })).toBeVisible();
  return application as { id: string; job: { title: string } };
}

async function generate(page: Page) {
  await page.getByRole("button", { name: "Tailor resume", exact: true }).click();
  await expect(page.getByLabel("Tailored resume state")).toContainText("needs review", {
    timeout: 45000,
  });
}

test("tailoring requires a confirmed profile and selected application", async ({ page }) => {
  await page.goto("/resume-tailoring");
  await expect(
    page.getByRole("link", { name: "Confirm your profile before tailoring" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Tailor resume", exact: true })).toBeDisabled();
});

test("one-page resume preview, comparison, approval and correct application attachment", async ({
  page,
}) => {
  const app = await setup(page);
  const before = await (await page.request.get(`${base}/profile`, { headers })).json();
  await generate(page);
  await expect(page.getByRole("heading", { name: "Example Software", exact: true })).toBeVisible();
  await expect(page.getByText("May 2026 – July 2026", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Change comparison", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Original confirmed content and tailored version" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Validation results", exact: true }).click();
  await expect(page.getByText("One-page status: Exactly one page", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "PDF preview", exact: true }).click();
  await expect(page.getByRole("img", { name: "Rendered tailored resume PDF page" })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download tailored PDF" }).click();
  expect((await download).suggestedFilename()).toBe("tailored-resume-v1.pdf");
  await page.screenshot({ path: "/private/tmp/resume-tailoring-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Application attachment", exact: true }).click();
  await expect(page.getByRole("button", { name: "Approve tailored resume" })).toBeDisabled();
  await page.getByLabel("I reviewed the tailored facts", { exact: false }).check();
  await page.getByRole("button", { name: "Approve tailored resume" }).click();
  await expect(page.getByLabel("Tailored resume state")).toContainText("approved");
  await page.getByRole("button", { name: "Attach approved resume to this application" }).click();
  await expect(page.getByLabel("Tailored resume state")).toContainText("attached");
  expect(
    (await (await page.request.get(`${base}/applications/${app.id}`, { headers })).json()).status,
  ).toBe("job_selected");
  expect(await (await page.request.get(`${base}/profile`, { headers })).json()).toEqual(before);
});

test("supported editing and section regeneration preserve prior versions; invented summary is rejected", async ({
  page,
}) => {
  await setup(page);
  await generate(page);
  await page.getByRole("button", { name: "Edit sections", exact: true }).click();
  await page
    .getByLabel("Summary wording", { exact: true })
    .selectOption({ label: "Concise summary" });
  const summary = await page.getByLabel("Edit summary", { exact: true }).inputValue();
  await page.getByRole("button", { name: "Save edits as new version" }).click();
  await expect(page.getByLabel("Tailored resume state")).toContainText("Version 2 · needs review", {
    timeout: 45000,
  });
  await page.getByLabel("Regenerate section", { exact: true }).selectOption("projects");
  await page.getByRole("button", { name: "Create another tailored version" }).click();
  await expect(page.getByLabel("Tailored resume state")).toContainText("Version 3 · needs review", {
    timeout: 45000,
  });
  await expect(page.getByText(summary, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit sections", exact: true }).click();
  await page
    .getByLabel("Edit summary", { exact: true })
    .fill("I led 200 engineers and delivered a 99% improvement.");
  await page.getByRole("button", { name: "Save edits as new version" }).click();
  await expect(page.getByLabel("Tailored resume state")).toContainText("validation failed", {
    timeout: 45000,
  });
  await expect(page.getByRole("alert")).toContainText(
    "Summary must use a supported wording variant",
  );
  await expect(page.getByRole("button", { name: "Download tailored PDF" })).toHaveCount(0);
});

test("LaTeX source is stored as passive input and never executed", async ({ page }) => {
  await setup(page);
  await page.getByLabel("Input mode", { exact: true }).selectOption("latex_source");
  await page.getByLabel("Upload LaTeX reference", { exact: true }).setInputFiles({
    name: "reference.tex",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "\\documentclass{resume}\n\\begin{document}\n\\input{/etc/passwd}\\write18{never_execute}\n\\end{document}",
    ),
  });
  await expect(page.getByRole("status")).toContainText("Source stored unchanged");
  await generate(page);
  await page.getByText("Technical and evidence audit", { exact: true }).click();
  await expect(
    page.getByText("Uploaded TeX is retained as a passive reference and never executed.", {
      exact: false,
    }),
  ).toBeVisible();
});

test("provider failure is labelled and retains a usable local one-page resume", async ({
  page,
}) => {
  await setup(page);
  await page.getByLabel("Use three CrewAI agents with Groq", { exact: false }).check();
  await generate(page);
  await expect(
    page.getByText("CrewAI generation was unavailable or rejected.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "PDF preview", exact: true }).click();
  await expect(page.getByRole("img", { name: "Rendered tailored resume PDF page" })).toBeVisible();
});

test("tailoring can be cancelled without changing application submission state", async ({
  page,
}) => {
  const app = await setup(page);
  await page.getByRole("button", { name: "Tailor resume", exact: true }).click();
  await page.getByRole("button", { name: "Cancel tailoring" }).click();
  await expect(page.getByLabel("Tailored resume state")).toContainText("cancelled");
  expect(
    (await (await page.request.get(`${base}/applications/${app.id}`, { headers })).json()).status,
  ).toBe("job_selected");
});

test("mobile tailoring and preview fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await generate(page);
  await page.getByRole("button", { name: "PDF preview", exact: true }).click();
  await expect(page.getByRole("img", { name: "Rendered tailored resume PDF page" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "/private/tmp/resume-tailoring-mobile.png", fullPage: true });
});

test("complete profile is preserved with computed relevance, readable skills and omission audit", async ({
  page,
}) => {
  await setup(page, true);
  await generate(page);
  await expect(page.getByLabel("Relevance analysis status")).toContainText(
    "Relevance analysis calculated for this tailoring run",
  );
  await expect(page.getByLabel("Relevance analysis status")).toContainText("Review recommended");
  await expect(
    page.getByRole("heading", { name: "Adobe Systems India", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No current matching explanation was supplied", { exact: false }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Tailoring plan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Preserved content", exact: true })).toBeVisible();
  await expect(page.getByText("experience: 2 of 2 preserved", { exact: true })).toBeVisible();
  await expect(page.getByText("projects: 4 of 4 preserved", { exact: true })).toBeVisible();
  await expect(page.getByText("skills: 36 of 36 preserved", { exact: true })).toBeVisible();
  await page.getByText("Omitted content and reasons", { exact: true }).click();
  await expect(
    page.getByText("No complete profile entries omitted.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Content review", exact: true }).click();
  await page.getByRole("button", { name: "Edit sections", exact: true }).click();
  await expect(page.getByLabel("Include Adobe Systems India", { exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Discard unsaved edits", exact: true }).click();
  await page.getByRole("button", { name: "Validation results", exact: true }).click();
  await expect(page.getByText("Body font: 11 pt", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "PDF preview", exact: true }).click();
  await expect(page.getByRole("img", { name: "Rendered tailored resume PDF page" })).toBeVisible();
  await page.screenshot({
    path: "/private/tmp/resume-tailoring-improvements-full-profile.png",
    fullPage: true,
  });
});
