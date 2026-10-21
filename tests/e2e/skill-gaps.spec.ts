import { test, expect, type Page } from "@playwright/test";
const api = process.env["E2E_API_BASE_URL"] || "http://localhost:8000/api/v1";
async function profile(page: Page) {
  await page.goto("/profile");
  await page.getByLabel("Full name", { exact: true }).fill("Skill Gap Example");
  await page.getByLabel("Your skills", { exact: true }).fill("Python, SQL, JavaScript");
  await page.getByLabel("Experience level", { exact: true }).selectOption("student");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Your profile has been saved.");
  await page.getByLabel("I have reviewed the saved facts and confirm they are accurate.").check();
  await page.getByRole("button", { name: "Confirm profile facts" }).click();
  await expect(page.getByText("Current facts confirmed", { exact: true })).toBeVisible();
}
async function target(page: Page) {
  await page.goto("/skill-gaps");
  await page.getByLabel("Analysis source").selectOption("target");
  await page.getByLabel("Target role").fill("AI");
  await page.getByLabel("Target location").fill("Bengaluru, India");
  await page.getByLabel("Target work mode").selectOption("onsite");
  await page.getByLabel("Number of target jobs").fill("3");
}
async function start(page: Page) {
  await page.getByRole("button", { name: "Analyse skill gaps", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your evidence inventory", exact: true }),
  ).toBeVisible({ timeout: 45000 });
}

test("skill gaps require confirmed facts and recover from readiness errors", async ({ page }) => {
  await page.route("**/skill-gaps/readiness", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "unavailable", message: "Skill readiness temporarily unavailable." },
      }),
    }),
  );
  await page.goto("/skill-gaps");
  await expect(page.getByRole("alert")).toContainText("Skill readiness temporarily unavailable");
  await page.unroute("**/skill-gaps/readiness");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Confirm your profile first" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Analyse skill gaps", exact: true }),
  ).toBeDisabled();
});

test("career-target analysis shows grounded gaps, impact, reviews, export and mobile audit", async ({
  page,
}) => {
  test.setTimeout(90000);
  await profile(page);
  await target(page);
  const before = await (
    await page.request.get(`${api}/profile`, { headers: { "X-Workspace-Client": "careeros-web" } })
  ).json();
  const request = page.waitForRequest(
    (r) => r.url().endsWith("/skill-gaps/runs") && r.method() === "POST",
  );
  await start(page);
  const payload = (await request).postDataJSON();
  expect(payload.mode).toBe("target");
  expect(payload.filters.location).toBe("Bengaluru, India");
  expect(payload.use_ai).toBe(false);
  await expect(page.getByText("completed · 3 jobs", { exact: false })).toBeVisible();
  const card = page.getByRole("article").first();
  await card.getByText("Evidence, affected jobs and priority calculation", { exact: true }).click();
  await expect(card.getByRole("table")).toBeVisible();
  await expect(card.getByText("Temporary score simulation", { exact: false })).toBeVisible();
  await card.getByRole("button", { name: "Mark reviewed", exact: true }).click();
  await expect(card.getByText("reviewed", { exact: true })).toBeVisible();
  await page
    .getByText("Skill gap audit · profile, requirements and agents", { exact: true })
    .click();
  await expect(
    page.getByText("Skill Gap Validation Agent · completed", { exact: true }),
  ).toBeVisible();
  await page
    .getByText("Frozen candidate and job snapshots, comparisons, frequencies and validation", {
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Skill gap source audit")).toContainText("confirmed_fields_only");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export current page summary" }).click();
  expect((await download).suggestedFilename()).toBe("skill-gap-summary.txt");
  const after = await (
    await page.request.get(`${api}/profile`, { headers: { "X-Workspace-Client": "careeros-web" } })
  ).json();
  expect(after).toEqual(before);
  await page.screenshot({ path: "/private/tmp/skill-gap-desktop.png", fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "/private/tmp/skill-gap-mobile.png", fullPage: false });
});

test("recommendation links support single, selected and top-ranked job analyses", async ({
  page,
}) => {
  test.setTimeout(120000);
  await profile(page);
  await page.goto("/matches");
  await page.getByLabel("Job category", { exact: true }).selectOption("backend");
  await page.getByLabel("Job location", { exact: true }).fill("Bengaluru, India");
  await page.getByLabel("Work mode", { exact: true }).selectOption("onsite");
  await page.getByLabel("Minimum hybrid score", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Find Matching Jobs", exact: true }).click();
  await expect(page.getByRole("article").first()).toBeVisible({ timeout: 45000 });
  await page
    .getByRole("article")
    .first()
    .getByRole("link", { name: "Analyse skill gaps for this job" })
    .click();
  await expect(page.getByLabel("Analysis source")).toHaveValue("single");
  await start(page);
  await expect(page.getByText("completed · 1 jobs", { exact: false })).toBeVisible();
  await page.getByLabel("Analysis source").selectOption("selected");
  const choices = page.locator("fieldset").getByRole("checkbox");
  await choices.nth(0).check();
  await choices.nth(1).check();
  await start(page);
  await expect(page.getByText("completed · 2 jobs", { exact: false })).toBeVisible();
  await page.getByLabel("Analysis source").selectOption("top_ranked");
  await page.getByLabel("Number of target jobs").fill("2");
  await start(page);
  await expect(page.getByText("completed · 2 jobs", { exact: false })).toBeVisible();
});

test("optional AI failure retains deterministic gaps and a retryable partial state", async ({
  page,
}) => {
  test.setTimeout(90000);
  await profile(page);
  await target(page);
  await page
    .getByRole("checkbox", { name: "Allow optional Groq guidance review.", exact: false })
    .check();
  await start(page);
  await expect(
    page.getByText("Partial analysis: deterministic results retained", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
  await page
    .getByText("Skill gap audit · profile, requirements and agents", { exact: true })
    .click();
  await expect(
    page.getByText("Recommendation Explanation Agent · partial", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Recalculate with current facts" }).click();
  await expect(
    page.getByText("Partial analysis: deterministic results retained", { exact: true }),
  ).toBeVisible({ timeout: 45000 });
});

test("empty targets are explicit and active analyses can be cancelled", async ({ page }) => {
  test.setTimeout(90000);
  await profile(page);
  await target(page);
  await page.getByLabel("Target location").fill("Atlantis");
  await start(page);
  await expect(
    page.getByRole("heading", { name: "No jobs available for this target" }),
  ).toBeVisible();
  await page.getByLabel("Target location").fill("");
  await page.getByLabel("Target work mode").selectOption("");
  await page.getByLabel("Number of target jobs").fill("30");
  await page.getByRole("button", { name: "Analyse skill gaps", exact: true }).click();
  await page.getByRole("button", { name: "Cancel analysis", exact: true }).click();
  await expect(
    page.getByText("Analysis cancelled. Your profile is unchanged.", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
});
