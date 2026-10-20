import { test, expect } from "@playwright/test";

async function createConfirmedProfile(page: import("@playwright/test").Page) {
  await page.goto("/profile");
  await page.getByLabel("Full name", { exact: true }).fill("Matching Example");
  await page.getByLabel("Your skills", { exact: true }).fill("Python, SQL, FastAPI, Docker, Git");
  await page.getByLabel("Preferred roles", { exact: true }).fill("Backend Developer");
  await page.getByLabel("Preferred locations", { exact: true }).fill("Remote, Noida");
  await page.getByLabel("Experience level", { exact: true }).selectOption("student");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Your profile has been saved.");
  await page.getByLabel("I have reviewed the saved facts and confirm they are accurate.").check();
  await page.getByRole("button", { name: "Confirm profile facts" }).click();
  await expect(page.getByText("Current facts confirmed", { exact: true })).toBeVisible();
}

test("matching blocks unconfirmed profiles and recovers from API errors", async ({ page }) => {
  await page.goto("/matches");
  await expect(page.getByRole("heading", { name: "Your matching opportunities." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Find Matching Jobs" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Review and confirm profile" })).toBeVisible();
  await page.route("**/matching/readiness", (route) => route.abort());
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("couldn’t reach your workspace");
  await page.unroute("**/matching/readiness");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText("Confirm your profile to begin", { exact: true })).toBeVisible();
});

test("full matching workflow exposes scores, evidence, bookmarks, audit, pagination and stale state", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await createConfirmedProfile(page);
  await page.goto("/matches");
  await expect(
    page.getByText("Confirmed profile ready for matching", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Minimum hybrid score", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Find Matching Jobs", exact: true }).click();
  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(6, { timeout: 40_000 });
  await expect(
    page.getByText("Semantic embeddings unavailable · TF-IDF and explicit skill evidence used.", {
      exact: false,
    }),
  ).toBeVisible();
  const first = cards.first();
  await first.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/private/tmp/retrieval-recommendations-desktop.png" });
  await expect(first.getByText("Experimental match estimate", { exact: true })).toBeVisible();
  await expect(first.getByText(/^Raw hybrid .*Baseline /)).toBeVisible();
  await first.getByText("Score breakdown", { exact: true }).click();
  await expect(first.getByText("Final = max", { exact: false })).toBeVisible();
  await expect(first.getByLabel("Independent retrieval scores")).toContainText("bm25");
  await expect(first.getByLabel("Independent retrieval scores")).toContainText(
    "word2vec: Unavailable",
  );
  await first.getByText("How the displayed percentage is calibrated", { exact: true }).click();
  await expect(
    first.locator("p").filter({ hasText: "Empirical synthetic relevance frequency" }),
  ).toBeVisible();
  await first.getByText("Why this match · evidence and considerations", { exact: true }).click();
  await expect(first.getByText("Scores are comparison heuristics", { exact: false })).toBeVisible();
  await first.getByText("Job details", { exact: true }).click();
  await expect(first.getByText("This is synthetic project data.", { exact: false })).toBeVisible();
  await first.getByText("Inspect normalized job and skill mappings", { exact: true }).click();
  await expect(
    first
      .locator("details")
      .filter({
        has: page.locator("summary", { hasText: "Inspect normalized job and skill mappings" }),
      })
      .locator("pre"),
  ).toContainText("required_skills");
  await first.getByRole("button", { name: /^Save / }).click();
  await expect(first.getByRole("button", { name: /^Unsave / })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByLabel("Saved opportunities only").check();
  await expect(cards).toHaveCount(1);
  await page.getByLabel("Saved opportunities only").uncheck();
  await expect(cards).toHaveCount(6);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(/^Page 2 of /)).toBeVisible();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page.getByText("Matching audit · profile, tasks and validation", { exact: true }).click();
  await page.getByText("Candidate data used · confirmed fields only", { exact: true }).click();
  await expect(page.locator("pre").filter({ hasText: "confirmed_facts" })).toContainText("Python");
  await page
    .getByText("Scoring configuration and model/provider metadata", { exact: true })
    .click();
  await expect(page.locator("pre").filter({ hasText: "configuration" })).toContainText(
    "score_errors",
  );
  await page.screenshot({ path: "/private/tmp/ascendra-matching-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "/private/tmp/ascendra-matching-mobile.png", fullPage: true });
  await first.scrollIntoViewIfNeeded();
  await first.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.evaluate(() => window.scrollBy(0, -80));
  await page.screenshot({ path: "/private/tmp/retrieval-recommendations-mobile.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/profile");
  await page.getByLabel("Your skills", { exact: true }).fill("Rust");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Your profile has been saved.");
  await page.goto("/matches");
  await expect(page.getByRole("alert")).toContainText("Your profile has changed since this run");
  expect(errors).toEqual([]);
});

test("empty matching run is honest and persisted", async ({ page }) => {
  test.setTimeout(60_000);
  await createConfirmedProfile(page);
  await page.goto("/matches");
  await expect(
    page.getByText("Confirmed profile ready for matching", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Job search", { exact: true }).fill("no-such-synthetic-opportunity-zzzz");
  await page.getByLabel("Allow optional Groq explanation review", { exact: false }).check();
  await page.getByRole("button", { name: "Find Matching Jobs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Room to explore." })).toBeVisible({
    timeout: 40_000,
  });
  await expect(page.getByText("AI review: skipped", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Room to explore." })).toBeVisible();
});

test("requested AI failure preserves deterministic recommendations", async ({ page }) => {
  test.setTimeout(60_000);
  await createConfirmedProfile(page);
  await page.goto("/matches");
  await expect(
    page.getByText("Confirmed profile ready for matching", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Allow optional Groq explanation review", { exact: false }).check();
  await page.getByRole("button", { name: "Find Matching Jobs", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(6, { timeout: 40_000 });
  await expect(page.getByText("Partial completion:", { exact: false })).toBeVisible();
  await page.getByText("Matching audit · profile, tasks and validation", { exact: true }).click();
  await expect(page.getByText("groq not configured", { exact: true })).toBeVisible();
});
