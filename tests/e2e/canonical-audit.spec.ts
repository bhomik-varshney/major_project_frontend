import { expect, test } from "@playwright/test";
const text =
  "Mira Example\nEmail: mira@example.com\nSkills\nPython, SQL\nProjects\nCampus Tool\nTechnologies: Python, SQL\n- Built a directory.\nLeadership\nStudent coordinator";
test("connected audit exposes graph, evidence, repairs, conflicts, original file and version comparison", async ({
  page,
}) => {
  test.setTimeout(70_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/documents");
  await page
    .getByLabel("Upload document", { exact: true })
    .setInputFiles({ name: "connected.txt", mimeType: "text/plain", buffer: Buffer.from(text) });
  await page.getByRole("button", { name: "Process document", exact: true }).click();
  await expect(page.getByLabel("Extracted Full name", { exact: true })).toHaveValue(
    "Mira Example",
    { timeout: 30_000 },
  );
  const audit = page.getByRole("region", { name: "Resume processing audit" });
  await audit.getByText(/^Connected canonical representation ·/).click();
  await audit.getByText(/^identity · identity ·/).click();
  await audit
    .getByText(/^name: Mira Example/)
    .first()
    .click();
  await expect(audit.getByText("Original wording: Mira Example", { exact: true })).toBeVisible();
  await expect(
    audit.getByRole("link", { name: "Review or correct in draft" }).first(),
  ).toBeVisible();
  await audit.getByText("Canonical validation checks", { exact: true }).click();
  await expect(audit.getByText("Critical source checks passed", { exact: true })).toBeVisible();
  await audit.getByText(/^Verification and repair iterations ·/).click();
  await expect(audit.getByText("Iteration 0 · validated", { exact: false })).toBeVisible();
  await audit.getByText(/^Source conflicts ·/).click();
  await expect(
    audit.getByText("No competing readings were recorded.", { exact: false }),
  ).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await audit.getByRole("button", { name: "Download original uploaded file" }).click();
  expect((await downloadEvent).suggestedFilename()).toBe("original-resume.txt");
  await expect(
    page.getByLabel("Extracted Additional sections 1: heading", { exact: true }),
  ).toHaveValue("Leadership");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: "/private/tmp/ascendra-canonical-audit-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Reprocess with current parser", exact: true }).click();
  await page.getByRole("button", { name: "Start new extraction", exact: true }).click();
  await expect(audit.getByLabel("Inspect extraction version")).toContainText("Version 2", {
    timeout: 30_000,
  });
  await expect(page.getByLabel("Extracted Full name", { exact: true })).toHaveValue(
    "Mira Example",
    { timeout: 30_000 },
  );
  await audit.getByText("Compare extraction versions", { exact: true }).click();
  const history = await page.request.get(
    `${process.env["E2E_API_BASE_URL"] || "http://localhost:8000/api/v1"}/documents`,
    { headers: { "X-Workspace-Client": "careeros-web" } },
  );
  expect(history.ok()).toBe(true);
  const doc = (await history.json()).find(
    (d: { filename: string }) => d.filename === "connected.txt",
  );
  const runs = await (
    await page.request.get(
      `${process.env["E2E_API_BASE_URL"] || "http://localhost:8000/api/v1"}/documents/${doc.id}/runs`,
      { headers: { "X-Workspace-Client": "careeros-web" } },
    )
  ).json();
  await audit.getByLabel("Compare previous version with latest").selectOption(runs[1].id);
  await expect(audit.getByText("0 changed fields.", { exact: false })).toBeVisible();
  await audit.getByLabel("Inspect extraction version").selectOption(runs[1].id);
  await expect(
    audit.getByText("You are inspecting a historical snapshot.", { exact: false }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
