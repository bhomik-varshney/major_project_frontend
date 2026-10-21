import { test, expect, type Page } from "@playwright/test";
const base = process.env["E2E_API_BASE_URL"] || "http://localhost:8000/api/v1";
const headers = { "X-Workspace-Client": "careeros-web" };

async function start(page: Page, useAI = false, scenario = "standard") {
  await page.goto("/profile");
  await page.getByLabel("Full name", { exact: true }).fill("Application Example");
  await page.getByLabel("Email address", { exact: true }).fill("applicant@example.com");
  await page.getByLabel("Your skills", { exact: true }).fill("Python, SQL");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Your profile has been saved.");
  await page.getByLabel("I have reviewed the saved facts and confirm they are accurate.").check();
  await page.getByRole("button", { name: "Confirm profile facts" }).click();
  await expect(page.getByText("Current facts confirmed", { exact: true })).toBeVisible();
  if (scenario === "graduate") {
    const current = await (await page.request.get(`${base}/profile`, { headers })).json();
    const updated = await page.request.put(`${base}/profile`, {
      headers,
      data: {
        expected_revision: current.revision,
        name: "Application Example",
        email: "applicant@example.com",
        location: "Bengaluru, India",
        skills: ["Python", "SQL", "NLP"],
        career_objective: "Build reliable AI applications.",
        education: [
          {
            institution: "Example Engineering University",
            qualification: "B.Tech Computer Engineering",
            start_year: "2023",
            end_year: "2027",
          },
          {
            institution: "Example Senior School",
            qualification: "Senior Secondary XII",
            end_year: "2023",
          },
        ],
        experience: [
          {
            organization: "Example Software",
            role: "Developer Intern",
            description: "Built mobile components.",
            technologies: ["React Native"],
          },
          {
            organization: "Example Training",
            role: "ML Trainee",
            description: "Built a text classifier.",
            technologies: ["Python", "NLP"],
          },
        ],
        projects: [
          {
            name: "Career Helper",
            description: "Built a retrieval service.",
            technologies: ["Python", "SQL"],
            repository: "https://github.com/student/career-helper",
            deployment_url: "https://career-helper.vercel.app",
          },
        ],
        links: [
          "https://www.linkedin.com/in/student",
          "https://github.com/student",
          "https://portfolio.example.com",
          "https://kaggle.com/student",
          "https://unknown.example/article/42",
        ],
        achievements: ["Student hackathon finalist"],
        certifications: ["Machine Learning Fundamentals"],
      },
    });
    expect(updated.ok()).toBe(true);
    expect(
      (
        await page.request.post(`${base}/profile/verify`, {
          headers,
          data: { expected_revision: (await updated.json()).revision, confirmed: true },
        })
      ).ok(),
    ).toBe(true);
  }
  const result = await page.request.get(
    `${base}/jobs?category=backend&location=Bengaluru&availability=active&page_size=1`,
    { headers },
  );
  const job = (await result.json()).items[0];
  expect((await page.request.put(`${base}/matching/bookmarks/${job.id}`, { headers })).ok()).toBe(
    true,
  );
  await page.goto(`/applications?job=${job.id}`);
  await page.getByLabel("Mock form scenario", { exact: true }).selectOption(scenario);
  if (useAI)
    await page.getByLabel("Allow optional six-agent Groq review.", { exact: false }).check();
  await page.getByRole("button", { name: "Create application draft", exact: true }).click();
  await expect(page.getByLabel("Application state")).toContainText("job selected");
  await page.getByRole("button", { name: "Prepare application", exact: true }).click();
  await page.getByRole("button", { name: "Form view", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Review every populated field" })).toBeVisible({
    timeout: 45000,
  });
  const list = await (await page.request.get(`${base}/applications`, { headers })).json();
  return list.items[0] as {
    id: string;
    job_id: string;
    revision: number;
    draft: {
      fields: { id: string; value: unknown }[];
      form: { fields: { id: string; label: string; type: string }[] };
    };
  };
}

async function review(page: Page, record: Awaited<ReturnType<typeof start>>) {
  await page.getByRole("radio", { name: "Yes", exact: true }).check();
  for (const field of record.draft.fields) {
    const spec = record.draft.form.fields.find((s) => s.id === field.id)!;
    if (spec.type === "file") continue;
    if ((field.value !== null && field.value !== "") || field.id === "work_permission")
      await page.getByLabel(`Reviewed ${spec.label}`, { exact: true }).check();
  }
  await page.getByRole("button", { name: "Save reviewed application", exact: true }).click();
  await expect(
    page.getByText("Review saved locally. Your profile is unchanged.", { exact: true }),
  ).toBeVisible();
}

test("application preparation requires confirmed facts and readiness errors recover", async ({
  page,
}) => {
  await page.route("**/applications/readiness", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "unavailable", message: "Application readiness unavailable." },
      }),
    }),
  );
  await page.goto("/applications");
  await expect(page.getByRole("alert")).toContainText("Application readiness unavailable");
  await page.unroute("**/applications/readiness");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("link", { name: "Confirm your profile first" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create application draft", exact: true }),
  ).toBeDisabled();
});

test("reviewed local application completes MCP prefill and tracks interviews and outcomes", async ({
  page,
}) => {
  test.setTimeout(90000);
  const record = await start(page);
  const before = await (await page.request.get(`${base}/profile`, { headers })).json();
  await expect(page.getByRole("radio", { name: "Yes", exact: true })).not.toBeChecked();
  await expect(page.getByLabel("Salary expectations", { exact: true })).toHaveValue("");
  await expect(page.getByRole("button", { name: "Approve prefill snapshot" })).toBeDisabled();
  await review(page, record);
  await page
    .getByLabel("I approve this exact reviewed draft and selected documents", { exact: false })
    .check();
  await page.getByRole("button", { name: "Approve prefill snapshot" }).click();
  await page.getByRole("button", { name: "Confirm action", exact: true }).click();
  await expect(page.getByLabel("Application state")).toContainText("approved for prefill");
  await page.getByRole("button", { name: "Prefill approved fields through MCP" }).click();
  await page.getByRole("button", { name: "Confirm action", exact: true }).click();
  await expect(page.getByLabel("Application state")).toContainText("prefill complete", {
    timeout: 45000,
  });
  const prefilled = await (
    await page.request.get(`${base}/applications/${record.id}`, { headers })
  ).json();
  expect(prefilled.receipt.submitted).toBe(false);
  await page.getByRole("button", { name: "I reviewed the prefilled form", exact: false }).click();
  await page.getByRole("button", { name: "Confirm action", exact: true }).click();
  await expect(page.getByRole("button", { name: "Record demo completion" })).toBeDisabled();
  await page
    .getByLabel("I completed this demo and want to record a simulated application.")
    .check();
  await page.getByRole("button", { name: "Record demo completion" }).click();
  await page.getByRole("button", { name: "Confirm action", exact: true }).click();
  await page.getByRole("button", { name: "Activate application tracking" }).click();
  await expect(page.getByLabel("Application state")).toContainText("tracking active");
  await page.getByLabel("Timeline entry", { exact: true }).selectOption("interview");
  await page.getByLabel("Due date and time", { exact: true }).fill("2027-01-15T10:00");
  await page
    .getByLabel("Note or stage details", { exact: true })
    .fill("Technical interview — synthetic example");
  await page.getByRole("button", { name: "Add timeline entry" }).click();
  await expect(page.getByLabel("Application state")).toContainText("interview");
  await expect(
    page.getByText("Technical interview — synthetic example", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Timeline entry", { exact: true }).selectOption("follow_up");
  await page.getByLabel("Due date and time", { exact: true }).fill("2027-01-22T10:00");
  await page
    .getByLabel("Note or stage details", { exact: true })
    .fill("Synthetic recruiter follow-up");
  await page.getByRole("button", { name: "Add timeline entry", exact: true }).click();
  await page.getByRole("button", { name: "Mark complete", exact: true }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: "Synthetic recruiter follow-up" }).first(),
  ).toContainText("Completed");
  for (const state of ["offer", "accepted"]) {
    await page.getByLabel("Timeline entry", { exact: true }).selectOption("status");
    await page.getByLabel("New application status", { exact: true }).selectOption(state);
    await page.getByRole("button", { name: "Add timeline entry" }).click();
    await expect(page.getByLabel("Application state")).toContainText(state);
  }
  await page.getByRole("button", { name: "Audit view", exact: true }).click();
  await page
    .getByText("A2UI messages, approval digest, receipt and validation", { exact: true })
    .click();
  await expect(page.getByLabel("Application audit data")).toContainText('"submitted": false');
  expect(await (await page.request.get(`${base}/profile`, { headers })).json()).toEqual(before);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "/private/tmp/application-mobile.png", fullPage: false });
});

test("real MCP Apps bridge loads a stdio resource and saves local edits without permission to submit", async ({
  page,
}) => {
  test.setTimeout(90000);
  const record = await start(page);
  await page.getByRole("button", { name: "Audit view", exact: true }).click();
  await page.getByRole("button", { name: "Open MCP review app", exact: true }).click();
  const frame = page.frameLocator('iframe[title="Application MCP review app"]');
  await expect(
    frame.getByRole("heading", { name: "Application MCP review", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByText("MCP app connected · local review only", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Discovered MCP tools")).toContainText("prefill_application");
  await frame.getByRole("button", { name: "Edit fields", exact: true }).click();
  await frame.getByLabel("Email address", { exact: true }).fill("updated@example.com");
  await frame.getByRole("button", { name: "Save local draft from MCP app" }).click();
  await page.getByRole("button", { name: "Form view", exact: true }).click();
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    "updated@example.com",
  );
  const updated = await (
    await page.request.get(`${base}/applications/${record.id}`, { headers })
  ).json();
  expect(updated.approval).toEqual({});
  expect(updated.status).toBe("needs_user_review");
  expect(updated.draft.fields.find((f: { id: string }) => f.id === "contact_email").source).toBe(
    "user_input",
  );
  expect(
    (
      await page.request.post(`${base}/applications/${record.id}/mcp/call`, {
        headers,
        data: { name: "submit_application", expected_revision: updated.revision },
      })
    ).status(),
  ).toBe(422);
  await page.screenshot({ path: "/private/tmp/application-mcp-desktop.png", fullPage: false });
});

test("duplicate records, local review changes and unavailable MCP UI remain explicit", async ({
  page,
}) => {
  test.setTimeout(90000);
  const record = await start(page);
  await page.getByRole("button", { name: "Create application draft", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("already exists");
  await review(page, record);
  await page
    .getByLabel("I approve this exact reviewed draft and selected documents", { exact: false })
    .check();
  await page.getByRole("button", { name: "Approve prefill snapshot" }).click();
  await page.getByRole("button", { name: "Confirm action", exact: true }).click();
  await expect(page.getByLabel("Application state")).toContainText("approved for prefill");
  await page.getByLabel("Email address", { exact: true }).fill("corrected@example.com");
  await expect(
    page.getByRole("button", { name: "Prefill approved fields through MCP" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Save reviewed application", exact: true }).click();
  await expect(page.getByLabel("Application state")).toContainText("needs user review");
  await page.route("**/mcp/resource", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "application_app_unavailable",
          message: "MCP interface unavailable; use local review.",
        },
      }),
    }),
  );
  await page.getByRole("button", { name: "Audit view", exact: true }).click();
  await page.getByRole("button", { name: "Open MCP review app", exact: true }).click();
  await expect(page.getByRole("alert").last()).toContainText("MCP interface unavailable");
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    "corrected@example.com",
  );
});

test("optional six-agent review failure retains the draft and cancellation permits an explicit retry", async ({
  page,
}) => {
  test.setTimeout(90000);
  const record = await start(page, true);
  await page.getByRole("button", { name: "Audit view", exact: true }).click();
  await expect(
    page.getByText("Optional six-agent AI review: unavailable", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel workflow", exact: true }).click();
  await expect(page.getByLabel("Application state")).toContainText("cancelled");
  await page.getByRole("button", { name: "Retry preparation with current facts" }).click();
  await expect(page.getByLabel("Application state")).toContainText("needs user review", {
    timeout: 45000,
  });
  expect(
    (await (await page.request.get(`${base}/applications/${record.id}`, { headers })).json())
      .receipt,
  ).toEqual({});
});

test("partial stdio prefill preserves safe work and explicitly retries skipped controls", async ({
  page,
}) => {
  test.setTimeout(120000);
  const record = await start(page, false, "partial");
  await review(page, record);
  await page
    .getByLabel("I approve this exact reviewed draft and selected documents", { exact: false })
    .check();
  for (const name of ["Approve prefill snapshot", "Prefill approved fields through MCP"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("button", { name: "Confirm action", exact: true }).click();
  }
  await expect(page.getByLabel("Application state")).toContainText("partially completed", {
    timeout: 45000,
  });
  await expect(page.getByText("Partial prefill preserved.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Retry skipped prefill work", exact: true }).click();
  await page.getByRole("button", { name: "Confirm action", exact: true }).click();
  await expect(page.getByLabel("Application state")).toContainText("prefill complete", {
    timeout: 45000,
  });
  const current = await (
    await page.request.get(`${base}/applications/${record.id}`, { headers })
  ).json();
  expect(current.receipt.submitted).toBe(false);
  expect(current.milestones.submitted_by_user_at).toBeUndefined();
});

test("authentication fallback reconnects only after an explicit manual-step confirmation", async ({
  page,
}) => {
  test.setTimeout(90000);
  await start(page, false, "authentication");
  await expect(page.getByLabel("Application state")).toContainText("waiting for user");
  await expect(page.getByLabel("MCP connection status")).toContainText("local fallback");
  await page
    .getByRole("button", { name: "Reconnect after completing manual step", exact: true })
    .click();
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(page.getByLabel("Application state")).toContainText("waiting for user");
  await page
    .getByRole("button", { name: "Reconnect after completing manual step", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm action", exact: true }).click();
  await expect(page.getByLabel("Application state")).toContainText("needs user review", {
    timeout: 45000,
  });
  await expect(page.getByLabel("MCP connection status")).toContainText("connected");
});

test("opening a mock external session connects the SDK review app without marking submission", async ({
  page,
}) => {
  test.setTimeout(90000);
  const record = await start(page);
  await page.getByRole("button", { name: "Open external form session", exact: true }).click();
  await page.getByRole("button", { name: "Confirm action", exact: true }).click();
  const frame = page.frameLocator('iframe[title="Application MCP review app"]');
  await expect(
    frame.getByRole("heading", { name: "Application MCP review", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect
    .poll(
      async () =>
        (await (await page.request.get(`${base}/applications/${record.id}`, { headers })).json())
          .milestones.external_form_opened_at,
    )
    .toBeTruthy();
  const current = await (
    await page.request.get(`${base}/applications/${record.id}`, { headers })
  ).json();
  expect(current.receipt).toEqual({});
  expect(current.milestones.prefill_completed_at).toBeUndefined();
  expect(current.milestones.submitted_by_user_at).toBeUndefined();
});

test("graduate application has readable repeated cards, classified links and a verified MCP preview", async ({
  page,
}) => {
  test.setTimeout(120000);
  const record = await start(page, false, "graduate");
  await expect(page.getByLabel("Institution", { exact: true })).toHaveValue(
    "Example Engineering University",
  );
  await expect(page.getByLabel("Education", { exact: true })).not.toHaveValue(/\[\s*\{/);
  await expect(page.getByLabel("GitHub URL", { exact: true })).toHaveValue(
    "https://github.com/student",
  );
  await page.getByRole("button", { name: "Preview view", exact: true }).click();
  const preview = page.getByRole("region", { name: "Application preview", exact: true });
  await expect(preview).toContainText("Generated through local MCP");
  await expect(preview).toContainText("Example Engineering University");
  await expect(preview).toContainText("Developer Intern");
  await expect(preview).toContainText("Career Helper");
  await expect(preview).toContainText("Kaggle");
  await expect(preview).toContainText("Additional link");
  expect(await preview.innerText()).not.toMatch(
    /confirmed_profile\.|"organization"\s*:|"institution"\s*:/,
  );
  expect(
    await preview.locator('[data-testid="profile-entry-card"]').count(),
  ).toBeGreaterThanOrEqual(5);
  const current = await (
    await page.request.get(`${base}/applications/${record.id}`, { headers })
  ).json();
  expect(current.draft.preview.engine).toBe("local_mcp");
  expect(current.receipt).toEqual({});
  await preview.getByRole("heading").first().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "/private/tmp/application-readable-preview-desktop.png",
    fullPage: false,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await preview.getByRole("heading").first().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "/private/tmp/application-readable-preview-mobile.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "Audit view", exact: true }).click();
  await page
    .getByText("A2UI messages, approval digest, receipt and validation", { exact: true })
    .click();
  await expect(page.getByLabel("Application audit data")).toContainText("confirmed_profile.");
});

test("legacy presentation changes require fresh field review and keep raw values out of Form view", async ({
  page,
}) => {
  test.setTimeout(90000);
  const record = await start(page, false, "graduate");
  await page.route(`**/applications/${record.id}`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.draft.presentation_version = "";
    const education = body.draft.fields.find(
      (field: { id: string }) => field.id === "academic_background",
    );
    education.value = '[{"institution":"Old raw representation"}]';
    education.approved = true;
    const shown = body.draft.preview.sections
      .flatMap((section: { fields: { field_id: string; approved: boolean }[] }) => section.fields)
      .find((field: { field_id: string }) => field.field_id === "academic_background");
    shown.approved = false;
    await route.fulfill({ response, json: body });
  });
  await page.getByRole("button", { name: "Refresh application", exact: true }).click();
  expect(await page.getByLabel("Education", { exact: true }).inputValue()).not.toContain(
    "Old raw representation",
  );
  await expect(page.getByLabel("Reviewed Education", { exact: true })).not.toBeChecked();
  await expect(page.getByLabel("Institution", { exact: true })).toHaveValue(
    "Example Engineering University",
  );
});
