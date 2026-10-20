import { expect, test } from "@playwright/test";

const resume = `Nisha Example
Objective:
To build accessible student services.
Seeking practical backend experience.
Skills:
Python, SQL, python
Projects:
Campus Tool | React | 2025
Technologies: React
- Built a campus directory.
Budget Tool: Tracks student spending.
Technologies: Python, SQLite
- Added monthly charts.
`;

test("Objective, separate projects, technology evidence, multi-skill editing and persistence", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Enter Ascendra" }).first().click();
  await expect(page.getByRole("button", { name: "Check backend connection" })).toContainText(
    "Connected",
  );
  await page.getByRole("link", { name: "Documents", exact: true }).click();
  await page.getByLabel("Upload document", { exact: true }).setInputFiles({
    name: "objective-projects.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(resume),
  });
  await page.getByRole("button", { name: "Process document", exact: true }).click();
  await expect(
    page.getByLabel("Extracted Profile Summary / Objective", { exact: true }),
  ).toHaveValue("To build accessible student services.\nSeeking practical backend experience.");
  await expect(
    page.getByText("Original heading: Objective · objective", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Extracted Projects 1: name", { exact: true })).toHaveValue(
    "Campus Tool",
  );
  await expect(page.getByLabel("Extracted Projects 2: name", { exact: true })).toHaveValue(
    "Budget Tool",
  );
  await expect(page.getByLabel("Extracted Projects 1: technologies", { exact: true })).toHaveValue(
    "React",
  );
  await expect(page.getByLabel("Extracted Projects 2: technologies", { exact: true })).toHaveValue(
    "Python\nSQLite",
  );
  await page
    .getByLabel("Extracted Projects 1: description", { exact: true })
    .fill("Built an accessible campus directory.");
  await page.getByRole("button", { name: "Save draft edits", exact: true }).click();
  await page
    .getByLabel(
      "I reviewed the selected values and replacement choices and confirm they are accurate.",
      { exact: true },
    )
    .check();
  await page.getByRole("button", { name: "Confirm and save profile", exact: true }).click();
  await page.getByRole("link", { name: "Open updated profile" }).click();
  await expect(page.getByLabel("Career objective", { exact: true })).toHaveValue(
    "To build accessible student services.\nSeeking practical backend experience.",
  );
  await expect(page.getByLabel("Project description 1", { exact: true })).toHaveValue(
    "Built an accessible campus directory.",
  );
  const rows = page.getByRole("list", { name: "Editable profile skills" });
  await expect(rows.getByRole("listitem")).toHaveCount(4);
  await expect(rows.getByRole("listitem").filter({ hasText: "Python" })).toContainText(
    "Resume-derived · Confirmed",
  );
  await page.getByRole("button", { name: "Add Skill", exact: true }).click();
  const input = page.getByLabel("Skill name", { exact: true });
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Enter a skill name");
  await input.fill("Docker");
  await input.press("Enter");
  await expect(rows.getByRole("listitem").filter({ hasText: "Docker" })).toContainText(
    "Manually added · Needs confirmation",
  );
  await input.fill("docker");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("already in your profile");
  await input.fill("TypeScript");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Edit skill TypeScript", exact: true }).click();
  await page.getByLabel("Edit skill name", { exact: true }).fill("JavaScript");
  await page.getByRole("button", { name: "Save skill", exact: true }).click();
  await page.getByRole("button", { name: "Remove skill SQL", exact: true }).click();
  await expect(rows.getByRole("listitem")).toHaveCount(5);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/profile", async (route) => {
    if (route.request().method() === "PUT") await gate;
    await route.continue();
  });
  const request = page.waitForRequest(
    (req) => req.url().endsWith("/api/v1/profile") && req.method() === "PUT",
  );
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("button", { name: "Saving…", exact: true })).toBeVisible();
  release();
  expect((await request).postDataJSON().skills).toEqual(
    ["Python", "React", "SQLite", "Docker", "JavaScript"].map((name) => ({
      name,
      source: "manual",
      verified: false,
    })),
  );
  await expect(page.getByText("Your profile has been saved.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(rows.getByRole("listitem")).toHaveCount(5);
  await expect(rows.getByRole("listitem").filter({ hasText: "Docker" })).toContainText(
    "Needs confirmation",
  );
  await page
    .getByLabel("I have reviewed the saved facts and confirm they are accurate.", { exact: true })
    .check();
  await page.getByRole("button", { name: "Confirm profile facts", exact: true }).click();
  await expect(rows.getByRole("listitem").filter({ hasText: "Docker" })).toContainText("Confirmed");
  await page
    .locator(".career-panel")
    .filter({ has: rows })
    .screenshot({ path: "/private/tmp/careeros-skills-desktop.png" });
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.getByText("3 reviewed from documents", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Documents", exact: true }).click();
  await page.getByRole("button", { name: "Review objective-projects.txt", exact: true }).click();
  await page.getByRole("button", { name: "Reprocess with current parser", exact: true }).click();
  await expect(
    page.getByText("This creates a new extraction version", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start new extraction", exact: true }).click();
  await expect(page.getByLabel("Extracted Projects 1: description", { exact: true })).toHaveValue(
    "Built a campus directory.",
  );
  const saved = await page.request.get(
    `${process.env["E2E_API_BASE_URL"] || "http://localhost:8000/api/v1"}/profile`,
    { headers: { "X-Workspace-Client": "careeros-web" } },
  );
  expect(saved.ok()).toBe(true);
  expect((await saved.json()).projects[0].description).toBe(
    "Built an accessible campus directory.",
  );
});

test("mobile skill controls, failed save recovery and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/profile");
  await page.getByLabel("Full name", { exact: true }).fill("Nisha Example");
  await page.getByRole("button", { name: "Add Skill", exact: true }).click();
  await page.getByLabel("Skill name", { exact: true }).fill("Python");
  await page.getByLabel("Skill name", { exact: true }).press("Enter");
  await page.getByLabel("Skill name", { exact: true }).fill("React");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Remove skill React", exact: true }).click();
  await page.route("**/api/v1/profile", async (route) => {
    if (route.request().method() === "POST") await route.abort();
    else await route.continue();
  });
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("couldn’t reach your workspace");
  await expect(page.getByLabel("Your skills", { exact: true })).toHaveValue("Python");
  await page.unroute("**/api/v1/profile");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByText("Your profile has been saved.", { exact: true })).toBeVisible();
  const skills = page.getByRole("list", { name: "Editable profile skills" });
  await skills.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page
    .locator(".career-panel")
    .filter({ has: skills })
    .screenshot({ path: "/private/tmp/careeros-skills-mobile.png" });
});
