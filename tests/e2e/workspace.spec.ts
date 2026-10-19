import { expect, test } from "@playwright/test";

test("touch devices do not activate pointer lighting", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/dashboard`);
  const panel = page.locator("[data-panel-light]").first();
  await expect(panel).toBeVisible();
  await panel.tap({ position: { x: 30, y: 30 } });
  expect(
    await panel.evaluate((element) => (element as HTMLElement).style.getPropertyValue("--panel-x")),
  ).toBe("");
  await context.close();
});

test("stale profile save offers explicit reload without overwriting another tab", async ({
  page,
  context,
}) => {
  await page.goto("/profile");
  await page.getByLabel("Full name", { exact: true }).fill("Original Name");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Your profile has been saved.");
  const other = await context.newPage();
  await other.goto("/profile");
  await other.getByLabel("Full name", { exact: true }).fill("Updated Elsewhere");
  await other.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(other.getByRole("status")).toContainText("Your profile has been saved.");
  await page.getByLabel("Full name", { exact: true }).fill("Stale Edit");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("changed in another tab");
  await page
    .getByRole("button", { name: "Reload saved profile (discard edits)", exact: true })
    .click();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("Updated Elsewhere");
  await other.close();
});

test("public landing opens the real empty dashboard", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/CareerOS/);
  await page.getByRole("link", { name: "Enter CareerOS" }).first().click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Your next chapter starts here." })).toBeVisible();
  await expect(page.getByText("A fresh start.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Check backend connection" })).toContainText(
    "Connected",
  );
  await page.screenshot({ path: "/private/tmp/careeros-dashboard-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("profile create, update, verify, and dashboard reflect durable changes", async ({ page }) => {
  await page.goto("/profile");
  await expect(page.getByText("A fresh profile, a fresh perspective.")).toBeVisible();
  await page.getByLabel("Full name", { exact: true }).fill("Aarav Example");
  await page.getByLabel("Email address", { exact: true }).fill("aarav@example.com");
  await page.getByLabel("Current location", { exact: true }).fill("Aligarh, India");
  await page.getByLabel("Experience level", { exact: true }).selectOption("student");
  await page.getByLabel("Career objective", { exact: true }).fill("Find a backend internship.");
  await page.getByLabel("Your skills", { exact: true }).fill("Python, SQL");
  await page.getByLabel("Preferred roles", { exact: true }).fill("Backend Intern");
  await page.getByLabel("Preferred locations", { exact: true }).fill("Remote");
  await page.getByRole("button", { name: "Add education" }).click();
  await page.getByLabel("Institution 1", { exact: true }).fill("Example University");
  await page.getByLabel("Qualification 1", { exact: true }).fill("B.Tech Computer Engineering");
  await page.getByRole("button", { name: "Add project" }).click();
  await page.getByLabel("Project name 1", { exact: true }).fill("Career companion");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Your profile has been saved.");
  await page.reload();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("Aarav Example");
  await page.getByLabel("I have reviewed the saved facts and confirm they are accurate.").check();
  await page.getByRole("button", { name: "Confirm profile facts" }).click();
  await expect(page.getByText("Current facts confirmed", { exact: true })).toBeVisible();
  await page.getByLabel("Full name", { exact: true }).fill("Aarav Updated");
  await expect(page.getByRole("button", { name: "Confirm profile facts" })).toBeDisabled();
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Your profile has been saved.");
  await expect(page.getByText("Current facts confirmed", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back, Aarav." })).toBeVisible();
  await expect(page.getByLabel("Profile 100% complete")).toBeVisible();
  await expect(page.getByText("Profile updated. Changes need a new review.")).toBeVisible();
});

test("documents validate, upload, persist, update summary, and remove", async ({ page }) => {
  await page.goto("/documents");
  const input = page.getByLabel("Upload document", { exact: true });
  await expect(page.getByText("A little space for your work.")).toBeVisible();
  await input.setInputFiles({
    name: "bad.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("bad"),
  });
  await expect(page.getByRole("alert")).toContainText("Choose a PDF, DOCX, or UTF-8 TXT file.");
  await input.setInputFiles({
    name: "large.txt",
    mimeType: "text/plain",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1, "a"),
  });
  await expect(page.getByRole("alert")).toContainText("smaller than 5 MB");
  await input.setInputFiles({
    name: "resume.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Student resume with Python projects"),
  });
  await expect(page.getByRole("status")).toContainText("Document saved to your library.");
  await expect(page.getByText("resume.txt", { exact: true })).toBeVisible();
  await expect(page.getByText("Extraction not started", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("resume.txt", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.getByText("Document stored. Ready for extraction and review.")).toBeVisible();
  await page.getByRole("link", { name: "Documents", exact: true }).click();
  await page.getByRole("button", { name: "Remove resume.txt" }).click();
  await page.getByRole("button", { name: "Remove permanently" }).click();
  await expect(page.getByText("A little space for your work.")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Document and its stored contents removed.");
});

test("backend unavailable is an explicit recoverable error", async ({ page }) => {
  await page.route("**/api/v1/**", (route) => route.abort());
  await page.goto("/dashboard");
  await expect(page.getByRole("alert")).toContainText("couldn’t reach your workspace");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Check backend connection" })).toContainText(
    "Offline",
  );
  await page.unroute("**/api/v1/**");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Your next chapter starts here." })).toBeVisible();
});

test("loading state is visible before summary arrives", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/dashboard/summary", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/dashboard");
  await expect(page.getByRole("status", { name: "Loading workspace" })).toBeVisible();
  release();
  await expect(page.getByRole("heading", { name: "Your next chapter starts here." })).toBeVisible();
});

test("mobile navigation and forms fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Your next chapter starts here." })).toBeVisible();
  await page.screenshot({ path: "/private/tmp/careeros-dashboard-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "My profile", exact: true }).click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Documents", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your document library." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("panel highlight responds to mouse and respects reduced motion", async ({ page }) => {
  await page.goto("/dashboard");
  const panel = page.locator("[data-panel-light]").first();
  await expect(panel).toBeVisible();
  await panel.hover({ position: { x: 30, y: 30 } });
  await expect
    .poll(() =>
      panel.evaluate((element) => (element as HTMLElement).style.getPropertyValue("--panel-x")),
    )
    .not.toBe("");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await panel.hover({ position: { x: 40, y: 40 } });
  await expect
    .poll(() =>
      panel.evaluate((element) => (element as HTMLElement).style.getPropertyValue("--panel-x")),
    )
    .toBe("");
  expect(await panel.evaluate((element) => getComputedStyle(element, "::after").display)).toBe(
    "none",
  );
});

test("future routes are labeled, sample workspace remains separate", async ({ page }) => {
  for (const route of ["/jobs", "/matches", "/skill-gaps", "/applications"]) {
    await page.goto(route);
    await expect(
      page.getByText("This feature is planned for the next implementation phase.", {
        exact: false,
      }),
    ).toBeVisible();
  }
  await page.goto("/workspace");
  await expect(
    page.getByText("This workspace is an interactive product demonstration.", { exact: false }),
  ).toBeVisible();
});
