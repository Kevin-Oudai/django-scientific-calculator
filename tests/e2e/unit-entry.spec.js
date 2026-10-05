const { test, expect } = require("@playwright/test");

test("existing browser entry initializes even when the host defines a CommonJS module global", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => { window.module = { exports: {} }; });
  await page.goto("/");
  const root = page.locator("[data-scientific-calculator]");
  for (const value of ["1", "+", "2"]) await root.locator(`button[data-insert=${JSON.stringify(value)}]`).click();
  await root.locator('button[data-action="equals"]').click();
  await expect(root.locator("[data-result]")).toHaveText("3");
  expect(errors).toEqual([]);
});
