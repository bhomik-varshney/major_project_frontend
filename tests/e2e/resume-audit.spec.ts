import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const fixtures = path.resolve(process.cwd(), "../major_project_backend/tests/fixtures/resumes");
async function upload(page: Page, file: string) {
  await page.goto("/documents");
  await expect(page.getByLabel("Upload document", { exact: true })).toBeEnabled();
  await page
    .getByLabel("Upload document", { exact: true })
    .setInputFiles(path.join(fixtures, file));
  await expect(page.getByRole("button", { name: "Process document", exact: true })).toBeVisible();
}
async function openStep(page: Page, number: number) {
  await page
    .locator('section[aria-label="Resume processing audit"] > div > details > summary')
    .filter({ hasText: new RegExp(`^${number}\\.`) })
    .click();
}

test("audit exposes exact text, original evidence, local task activity and review decision", async ({
  page,
}) => {
  await upload(page, "objective_only.txt");
  await page.getByRole("button", { name: "Process document", exact: true }).click();
  await expect(page.getByLabel("Extracted Full name", { exact: true })).toBeVisible();
  const audit = page.getByRole("region", { name: "Resume processing audit" });
  await expect(audit).toContainText("Follow the evidence");
  await openStep(page, 2);
  await expect(audit.getByLabel("Exact text page")).toBeVisible();
  await expect(audit).toContainText("Original paragraphs · page unknown");
  await expect(audit).toContainText("01. CAREER OBJECTIVE:");
  await openStep(page, 3);
  await expect(audit).toContainText("No rendered previews");
  await openStep(page, 5);
  await expect(audit).toContainText("External image processing was not selected");
  await openStep(page, 6);
  const proof = audit
    .locator("details")
    .filter({
      has: page.locator("summary").filter({ hasText: /^6\. Structured draft and field evidence/ }),
    })
    .locator("summary")
    .filter({ hasText: /^career_objective:/ });
  await proof.click();
  await expect(audit).toContainText("Heuristic; not a calibrated probability");
  await openStep(page, 7);
  await expect(audit).toContainText("Local processing selected");
  await openStep(page, 8);
  await expect(audit).toContainText("Review decision: pending");
  await expect(page.getByRole("button", { name: "Confirm and save profile" })).toBeDisabled();
});

test("PDF page preview is privately loaded, layout regions toggle and exact page selector works", async ({
  page,
}) => {
  await upload(page, "two_column.pdf");
  await page.getByRole("button", { name: "Process document", exact: true }).click();
  await expect(page.getByLabel("Extracted Full name", { exact: true })).toBeVisible();
  await openStep(page, 2);
  await page.getByLabel("Exact text page").selectOption("1");
  await openStep(page, 3);
  const preview = page.getByRole("img", { name: "Resume page 1 preview" });
  await expect(preview).toBeVisible();
  await expect
    .poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(100);
  await expect(preview).toHaveAttribute("src", /^blob:/);
  await page.getByLabel("Show layout regions").check();
  const audit = page.getByRole("region", { name: "Resume processing audit" });
  await expect(audit).toContainText("Local text geometry only");
  await expect(audit.locator('[aria-hidden="true"]').first()).toBeVisible();
  await audit
    .locator("summary")
    .filter({ hasText: /· text · source supported/ })
    .first()
    .click();
  await expect(audit).toContainText("Source IDs:");
  await page.screenshot({ path: "/private/tmp/ascendra-audit-desktop.png", fullPage: true });
});

test("scanned PDF shows separate OCR and source labels in a responsive keyboard-accessible audit", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await upload(page, "image_resume.pdf");
  await page.getByRole("button", { name: "Process document", exact: true }).click();
  await expect(page.getByLabel("Extracted Email address", { exact: true })).toHaveValue(
    "mira@example.com",
  );
  const audit = page.getByRole("region", { name: "Resume processing audit" });
  await expect(audit).toContainText("image only");
  await openStep(page, 2);
  await expect(audit).toContainText("No selectable text was recovered");
  await openStep(page, 4);
  await expect(audit).toContainText("mira@example.com");
  await expect(audit).toContainText("Recognition");
  await expect(audit).toContainText("Page 1 · OCR completed");
  await expect(
    page
      .getByText(
        "OCR-derived evidence. Check spelling, dates and punctuation against the page preview.",
      )
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await openStep(page, 3);
  await expect(page.getByRole("img", { name: "Resume page 1 preview" })).toBeVisible();
  const summary = audit.locator("summary").filter({ hasText: /^7\./ });
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(
    audit.getByText("Local processing selected. CrewAI and external providers were not run.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await page.screenshot({ path: "/private/tmp/ascendra-audit-mobile.png", fullPage: true });
});

test("dense native PDF retains correct entries and explicitly skips unnecessary OCR", async ({
  page,
}) => {
  await upload(page, "dense_native.pdf");
  await page.getByRole("button", { name: "Process document", exact: true }).click();
  await expect(page.getByLabel("Extracted Full name", { exact: true })).toHaveValue("Mira Example");
  for (const [index, title] of [
    "Native Portal",
    "Voice Response Evaluation",
    "Health Assistant",
    "Traffic Grid",
  ].entries()) {
    await expect(
      page.getByLabel(`Extracted Projects ${index + 1}: name`, { exact: true }),
    ).toHaveValue(new RegExp(`^${title}`));
  }
  await expect(page.getByLabel("Extracted Projects 5: name", { exact: true })).toHaveCount(0);
  await openStep(page, 3);
  await expect(page.getByRole("img", { name: "Resume page 1 preview" })).toBeVisible();
  await openStep(page, 4);
  const audit = page.getByRole("region", { name: "Resume processing audit" });
  await expect(audit).toContainText("Page 1 · OCR not required");
  await expect(audit).toContainText("Page 2 · OCR not required");
  await expect(audit).toContainText("Use step 2 to inspect the extracted native text");
  await openStep(page, 5);
  await expect(audit).toContainText("0 unsupported");
  await expect(page.getByRole("button", { name: "Confirm and save profile" })).toBeDisabled();
});

test("explicit image consent reaches backend, unavailable models fall back, rejection and retry retain audit", async ({
  page,
}) => {
  await upload(page, "two_column.pdf");
  await page.getByRole("checkbox", { name: /Use optional Groq enhancement/ }).check();
  await page.getByRole("checkbox", { name: /Include visual layout analysis/ }).check();
  const request = page.waitForRequest((r) => r.url().endsWith("/process") && r.method() === "POST");
  await page.getByRole("button", { name: "Process document", exact: true }).click();
  expect((await request).postDataJSON()).toMatchObject({
    use_groq: true,
    use_vision: true,
    allow_image_processing: true,
  });
  await expect(page.getByLabel("Extracted Full name", { exact: true })).toBeVisible();
  await openStep(page, 5);
  const audit = page.getByRole("region", { name: "Resume processing audit" });
  await expect(audit).toContainText("groq not configured");
  await page.getByRole("button", { name: "Reject draft", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry extraction", exact: true })).toBeVisible();
  await openStep(page, 8);
  await expect(audit).toContainText("Review decision: rejected");
  await page.getByRole("button", { name: "Retry extraction", exact: true }).click();
  await expect(page.getByLabel("Extracted Full name", { exact: true })).toBeVisible();
  await expect(page.getByText(/Extraction 2/)).toBeVisible();
});
