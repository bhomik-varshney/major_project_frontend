import { expect, test } from "@playwright/test";
import { formatDate } from "../../src/lib/workspace-date";

test("calendar dates and stored timestamps render safely in the browser", async ({ page }) => {
  for (const value of [
    "2026-10-01",
    "2026-10-01T00:00:00",
    "2026-10-01T00:00:00Z",
    "2026-10-01T05:30:00+05:30",
    "2026-09-30T20:00:00-04:00",
  ]) {
    expect(await page.evaluate(formatDate, value)).toBe("1 Oct");
  }
  for (const value of ["", "not a date", "2026-99-99"]) {
    expect(await page.evaluate(formatDate, value)).toBe("Date unavailable");
  }
});
