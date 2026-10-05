const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test("parity report displays all rows, filters evidence and loads without external assets", async ({ page }, testInfo) => {
  const html = fs.readFileSync(path.join(__dirname, "../reference/el506ts/parity-report.html"), "utf8");
  const errors = [];
  const requests = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("request", r => requests.push(r.url()));
  await page.route("**/parity-evidence", route => route.fulfill({ contentType: "text/html", body: html }));
  await page.goto("/parity-evidence");
  await expect(page.locator("tbody tr")).toHaveCount(430);
  await expect(page.locator("thead th")).toHaveCount(7);
  await page.getByRole("searchbox").fill("matrix");
  const count = await page.locator("tbody tr:visible").count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(430);
  await expect(page.locator("#count")).toHaveText(`${count} entries`);
  await page.screenshot({ path: testInfo.outputPath("parity-report.png") });
  await page.getByRole("searchbox").fill("a-capability-that-does-not-exist");
  await expect(page.locator("#count")).toHaveText("0 entries");
  expect(errors).toEqual([]);
  expect(requests).toHaveLength(1);
});
