import { expect, test } from "@playwright/test";

test("seeded jobs search, filters, pagination and mobile layout", async ({ page }) => {
  await page.goto("/jobs");
  await expect(page.getByText("Seeded demonstration jobs", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("10000 demonstration jobs");
  await expect(page.getByText("Page 1 of 1667", { exact: true })).toBeVisible();
  await expect(page.getByText("Seeded / mock", { exact: true })).toHaveCount(6);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 2 of 1667", { exact: true })).toBeVisible();
  await expect(page.getByText("Seeded / mock", { exact: true })).toHaveCount(6);
  await page.getByText("More filters", { exact: true }).click();
  await page.getByLabel("Company", { exact: true }).fill("Demo River Systems");
  await page.getByLabel("Category", { exact: true }).selectOption("backend");
  await page.getByLabel("Keyword", { exact: true }).fill("backend");
  await page.getByLabel("Skills", { exact: true }).fill("Python, SQL");
  await page.getByRole("button", { name: "Search jobs", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("1 demonstration job");
  await expect(
    page.getByRole("heading", { name: "Backend Developer Intern", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Work arrangement").selectOption("remote");
  await page.getByRole("button", { name: "Search jobs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No demonstration jobs found." })).toBeVisible();
  await page.getByRole("button", { name: "Browse all demo jobs" }).click();
  await expect(page.getByRole("status")).toContainText("10000 demonstration jobs");
  await page.getByLabel("Company", { exact: true }).fill("Demo River Systems");
  await page.getByLabel("Category", { exact: true }).selectOption("backend");
  await page.getByLabel("Location", { exact: true }).fill("Noida");
  await page.getByLabel("Experience", { exact: true }).selectOption("student");
  await page.getByRole("button", { name: "Search jobs", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("1 demonstration job");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "/private/tmp/careeros-jobs-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByRole("status")).toContainText("10000 demonstration jobs");
  await page.screenshot({ path: "/private/tmp/careeros-jobs-desktop.png", fullPage: true });
  await expect(page.getByRole("link", { name: /apply/i })).toHaveCount(0);
});

test("jobs loading and recoverable error states keep demo labeling", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/jobs?**", async (route) => {
    await gate;
    await route.abort();
  });
  await page.goto("/jobs");
  await expect(page.getByRole("status", { name: "Loading jobs" })).toBeVisible();
  await expect(page.getByText("Seeded demonstration jobs", { exact: true })).toBeVisible();
  release();
  await expect(page.getByRole("alert")).toContainText("couldn’t reach your workspace");
  await page.unroute("**/api/v1/jobs?**");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("status")).toContainText("10000 demonstration jobs");
});

test("expanded categories, hybrid roles, employment, country and dataset date filters", async ({
  page,
}) => {
  await page.goto("/jobs");
  await expect(page.getByRole("status")).toContainText("10000 demonstration jobs");
  await expect(page.getByLabel("Category", { exact: true }).locator("option")).toHaveCount(57);
  await page.getByLabel("Category", { exact: true }).selectOption("embedded");
  await page.getByRole("button", { name: "Search jobs", exact: true }).click();
  await expect(page.getByRole("status")).not.toContainText("10000 demonstration jobs");
  await expect(page.getByRole("heading", { level: 2 }).first()).toContainText("Embedded");
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Work arrangement").selectOption("hybrid");
  await page.getByText("More filters", { exact: true }).click();
  await page.getByLabel("Employment type").selectOption("full_time");
  await page.getByLabel("Country", { exact: true }).selectOption("India");
  await page.getByRole("button", { name: "Search jobs", exact: true }).click();
  await expect(page.getByText("Seeded / mock", { exact: true })).toHaveCount(6);
  await expect(page.getByRole("heading", { name: "No demonstration jobs found." })).toHaveCount(0);
  const cards = page
    .locator("section")
    .filter({ has: page.getByText("Seeded / mock", { exact: true }) });
  for (const card of await cards.all()) await expect(card).toContainText("Hybrid · Full Time");
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Dataset availability").selectOption("future");
  await page.getByLabel("Posted from").fill("2026-10-20");
  await page.getByLabel("Posted to").fill("2026-11-10");
  await page.getByRole("button", { name: "Search jobs", exact: true }).click();
  await expect(page.getByText("Future-dated demo", { exact: true })).toHaveCount(6);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Dataset availability").selectOption("expired");
  await page.getByRole("button", { name: "Search jobs", exact: true }).click();
  await expect(page.getByText("Expired demo", { exact: true })).toHaveCount(6);
  await page.getByText("Role details", { exact: true }).first().click();
  await expect(page.getByText("Experience:", { exact: false }).first()).toBeVisible();
});
