import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const resume = `Nisha Example
Email: nisha@example.com
Phone: +91 9876543210
Location: Aligarh, India
Summary:
Computer engineering student interested in backend services.
Skills:
Python, SQL, FastAPI
Education:
B.Tech Computer Engineering | Example University | 2023-2027
Projects:
Student Portal | Built an academic portal with Python
Preferred roles:
Backend Intern
`;

async function uploadResume(page: Page) {
  await page.goto("/documents");
  await expect(page.getByLabel("Upload document", { exact: true })).toBeEnabled();
  await page.getByLabel("Upload document", { exact: true }).setInputFiles({
    name: "student-resume.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(resume),
  });
  await expect(page.getByRole("button", { name: "Process document", exact: true })).toBeVisible();
}
async function processResume(page: Page) {
  await page.getByRole("button", { name: "Process document", exact: true }).click();
  await expect(page.getByLabel("Extracted Full name", { exact: true })).toHaveValue(
    "Nisha Example",
  );
}

test("resume upload, real processing, evidence review, correction, confirmation, and summary", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Enter CareerOS" }).first().click();
  await expect(page.getByRole("heading", { name: "Your next chapter starts here." })).toBeVisible();
  await uploadResume(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/documents/*/process", async (route) => {
    await gate;
    await route.continue();
  });
  await page.getByRole("button", { name: "Process document", exact: true }).click();
  await expect(page.getByRole("status", { name: "Processing document" })).toBeVisible();
  release();
  await expect(page.getByLabel("Extracted Full name", { exact: true })).toHaveValue(
    "Nisha Example",
  );
  await expect(page.getByLabel("Extracted Skills 1", { exact: true })).toHaveValue("Python");
  await expect(page.getByLabel("Resume agent run")).toContainText("CrewAI was not run");
  await page.getByText("Source · paragraph 1", { exact: true }).click();
  await expect(page.locator("blockquote").filter({ hasText: "Nisha Example" })).toBeVisible();
  await page.screenshot({ path: "/private/tmp/careeros-extraction-review.png", fullPage: true });
  await page.getByLabel("Extracted Full name", { exact: true }).fill("Nisha Corrected");
  await expect(
    page.getByText("Your correction · source support is not assumed.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save draft edits", exact: true }).click();
  const confirmation = page.getByLabel(
    "I reviewed the selected values and replacement choices and confirm they are accurate.",
    { exact: true },
  );
  await expect(confirmation).toBeEnabled();
  await confirmation.check();
  await page.getByRole("button", { name: "Confirm and save profile", exact: true }).click();
  await expect(
    page.getByText("Selected information saved to your profile.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open updated profile" }).click();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("Nisha Corrected");
  await expect(page.getByLabel("Your skills", { exact: true })).toHaveValue("Python, SQL, FastAPI");
  await expect(page.getByText("Reviewed sources", { exact: true })).toBeVisible();
  await expect(page.getByText("Last confirmation:", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back, Nisha." })).toBeVisible();
  await expect(page.getByText("3 reviewed from documents", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Reviewed document information saved to your profile.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Documents", exact: true }).click();
  await page.getByLabel("Upload document", { exact: true }).setInputFiles({
    name: "student-resume.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(resume),
  });
  await expect(
    page.getByText("This document is already in your library.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Selected information saved to your profile.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Process document", exact: true })).toHaveCount(0);
});

test("scanned PDF failure offers safe retry and manual entry", async ({ page }) => {
  await page.goto("/documents");
  await expect(page.getByLabel("Upload document", { exact: true })).toBeEnabled();
  await page
    .getByLabel("Upload document", { exact: true })
    .setInputFiles(path.resolve("tests/fixtures/scanned.pdf"));
  await page.getByRole("button", { name: "Process document", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Scanned PDFs need OCR");
  await page.getByRole("button", { name: "Retry extraction", exact: true }).click();
  await expect(page.getByText("Extraction 2", { exact: false })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Scanned PDFs need OCR");
  await page.getByRole("link", { name: "Enter profile manually" }).click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
});

test("request correction and rejection keep extracted facts out of the profile", async ({
  page,
}) => {
  await uploadResume(page);
  await processResume(page);
  await page.getByRole("button", { name: "Request correction", exact: true }).click();
  await expect(
    page.getByText("Needs correction — edit before confirming.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm and save profile", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Reject draft", exact: true }).click();
  await expect(page.getByText("This draft was rejected.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "My profile", exact: true }).click();
  await expect(
    page.getByText("A fresh profile, a fresh perspective.", { exact: true }),
  ).toBeVisible();
});

test("profile conflict reload requires a fresh confirmation and replacement decision", async ({
  page,
}) => {
  await uploadResume(page);
  await processResume(page);
  const existing = await page.request.post(
    `${process.env["E2E_API_BASE_URL"] || "http://localhost:8000/api/v1"}/profile`,
    {
      headers: { "X-Workspace-Client": "careeros-web" },
      data: { name: "Existing Student", skills: ["Git"] },
    },
  );
  expect(existing.ok()).toBe(true);
  const confirmation = page.getByLabel(
    "I reviewed the selected values and replacement choices and confirm they are accurate.",
    { exact: true },
  );
  await confirmation.check();
  await page.getByRole("button", { name: "Confirm and save profile", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Your profile changed");
  await page
    .getByRole("button", { name: "Reload review and current profile", exact: true })
    .click();
  await expect(page.getByText("Currently saved: Existing Student", { exact: true })).toBeVisible();
  await expect(confirmation).not.toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Apply Full name", exact: true }),
  ).not.toBeChecked();
});

test("mobile review remains usable with reduced motion and no overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await uploadResume(page);
  await processResume(page);
  await expect(page.getByLabel("Extracted Full name", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "/private/tmp/careeros-extraction-mobile.png", fullPage: true });
});

test("CrewAI fallback is visible and retry returns to local processing without profile changes", async ({
  page,
}) => {
  await uploadResume(page);
  await page.getByRole("checkbox", { name: /Use optional Groq enhancement/ }).check();
  await processResume(page);
  await expect(page.getByLabel("Resume agent run")).toContainText("Local fallback");
  await expect(page.getByLabel("Resume agent run")).toContainText("groq not configured");
  await expect(page.getByText("CrewAI fallback:", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Reject draft", exact: true }).click();
  await page.getByRole("button", { name: "Retry extraction", exact: true }).click();
  await expect(page.getByLabel("Resume agent run")).toContainText("CrewAI was not run");
  await page.getByRole("link", { name: "My profile", exact: true }).click();
  await expect(
    page.getByText("A fresh profile, a fresh perspective.", { exact: true }),
  ).toBeVisible();
});
