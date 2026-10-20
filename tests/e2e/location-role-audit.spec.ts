import { test, expect, type Page } from "@playwright/test";

async function prepare(page: Page) {
  await page.goto("/profile");
  await page.getByLabel("Full name", { exact: true }).fill("AI Audit Example");
  await page
    .getByLabel("Your skills", { exact: true })
    .fill("Python, PyTorch, LangGraph, QLoRA, FastAPI, Docker");
  await page.getByLabel("Experience level", { exact: true }).selectOption("student");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Your profile has been saved.");
  await page.getByLabel("I have reviewed the saved facts and confirm they are accurate.").check();
  await page.getByRole("button", { name: "Confirm profile facts" }).click();
  await expect(page.getByText("Current facts confirmed", { exact: true })).toBeVisible();
  await page.goto("/matches");
  await expect(
    page.getByText("Confirmed profile ready for matching", { exact: true }),
  ).toBeVisible();
}

test("recorded Bengaluru,India + AI + onsite case returns jobs and filter evidence", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await prepare(page);
  await page.getByLabel("Job location", { exact: true }).fill("Bengaluru,India");
  await page.getByLabel("Job category", { exact: true }).selectOption("artificial_intelligence");
  await page.getByLabel("Work mode", { exact: true }).selectOption("onsite");
  await page.getByLabel("Minimum hybrid score", { exact: true }).fill("0");
  const requestPromise = page.waitForRequest(
    (r) => r.url().endsWith("/matching/runs") && r.method() === "POST",
  );
  await page.getByRole("button", { name: "Find Matching Jobs", exact: true }).click();
  const request = await requestPromise;
  const payload = request.postDataJSON() as {
    minimum_score: number;
    filters: Record<string, string>;
  };
  expect(payload.minimum_score).toBe(0);
  expect(payload.filters["location"]).toBe("Bengaluru,India");
  expect(payload.filters["work_mode"]).toBe("onsite");
  await expect(page.getByRole("article")).toHaveCount(6, { timeout: 45_000 });
  await expect(
    page.getByText("34 results · ranked by hybrid score", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("article").first().getByText("Search location: exact city", { exact: false }),
  ).toBeVisible();
  await page.getByText("Matching audit · profile, tasks and validation", { exact: true }).click();
  await page.getByText("Search and filter diagnostics", { exact: true }).click();
  await expect(
    page.getByRole("table", { name: "Candidate counts after each filter" }),
  ).toContainText("availability");
  await page.getByText("Exact request, normalized filters and exclusions", { exact: true }).click();
  await expect(page.getByLabel("Search request audit JSON")).toContainText("Karnataka");
  await page.screenshot({ path: "/private/tmp/ai-location-corrected-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "/private/tmp/ai-location-corrected-mobile.png", fullPage: true });
});

test("saved score threshold can be lowered to zero and fractions without a new run", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await prepare(page);
  await page.getByLabel("Job location", { exact: true }).fill("Bangalore, Karnataka");
  await page.getByLabel("Role or career area", { exact: true }).fill("AI");
  await page.getByLabel("Work mode", { exact: true }).selectOption("onsite");
  await page.getByLabel("Minimum hybrid score", { exact: true }).fill("100");
  await page.getByRole("button", { name: "Find Matching Jobs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Room to explore." })).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByText("Jobs were retrieved and scored", { exact: false })).toBeVisible();
  await page.getByLabel("Narrow by minimum score", { exact: true }).fill("0");
  await expect(
    page.getByText("34 results · ranked by hybrid score", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Narrow by minimum score", { exact: true }).fill("0.5");
  const valid = await page
    .getByLabel("Narrow by minimum score", { exact: true })
    .evaluate((el) => (el as HTMLInputElement).checkValidity());
  expect(valid).toBe(true);
  await expect(page.getByRole("article")).toHaveCount(6);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(/^Page 2 of /)).toBeVisible();
  await page.getByLabel("Minimum hybrid score", { exact: true }).fill("0.5");
  expect(
    await page
      .getByLabel("Minimum hybrid score", { exact: true })
      .evaluate((el) => (el as HTMLInputElement).checkValidity()),
  ).toBe(true);
});

test("India-compatible remote roles respect the explicit work mode and country", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await prepare(page);
  await page.getByLabel("Job location", { exact: true }).fill("Bengaluru, India");
  await page.getByLabel("Role or career area", { exact: true }).fill("Artificial Intelligence");
  await page.getByLabel("Work mode", { exact: true }).selectOption("remote");
  await page.getByLabel("Minimum hybrid score", { exact: true }).fill("0");
  const responsePromise = page.waitForResponse(
    (r) => /\/matching\/runs\/[^/]+\/results\?/.test(r.url()) && r.status() === 200,
  );
  await page.getByRole("button", { name: "Find Matching Jobs", exact: true }).click();
  const body = (await (await responsePromise).json()) as {
    items: { job: { country: string; work_mode: string } }[];
  };
  expect(body.items.length).toBeGreaterThan(0);
  expect(
    body.items.every((row) => row.job.country === "India" && row.job.work_mode === "remote"),
  ).toBe(true);
  await expect(
    page
      .getByRole("article")
      .first()
      .getByText("Search location: remote compatible", { exact: false }),
  ).toBeVisible();
});

test("hard-filter emptiness is distinguished from a score-threshold failure", async ({ page }) => {
  test.setTimeout(60_000);
  await prepare(page);
  await page.getByLabel("Job location", { exact: true }).fill("Atlantis");
  await page.getByLabel("Role or career area", { exact: true }).fill("AI");
  await page.getByLabel("Minimum hybrid score", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Find Matching Jobs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Room to explore." })).toBeVisible({
    timeout: 40_000,
  });
  await expect(page.getByText("Jobs exist, but the location", { exact: false })).toBeVisible();
  await expect(page.getByText("No jobs reached scoring.", { exact: false })).toBeVisible();
  await page.getByText("Matching audit · profile, tasks and validation", { exact: true }).click();
  await page.getByText("Search and filter diagnostics", { exact: true }).click();
  await expect(
    page.getByText("The first filter to remove every remaining job was location.", {
      exact: false,
    }),
  ).toBeVisible();
});
