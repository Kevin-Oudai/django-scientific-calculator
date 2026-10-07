const { test, expect } = require("@playwright/test");

test("browser snapshot restores rendered state and rejects invalid versions", async ({ page }) => {
  await page.goto("/legacy/");
  const root = page.locator("[data-scientific-calculator]").first();
  await root.focus();
  await page.keyboard.type("12+3");
  await page.keyboard.press("Enter");
  await expect(root.locator("[data-result]")).toHaveText("15");
  const snapshot = await root.evaluate(el => el.scientificCalculator.snapshot());
  await page.keyboard.type("9");
  await root.evaluate((el, saved) => el.scientificCalculator.restore(saved), snapshot);
  await expect(root.locator("[data-result]")).toHaveText("15");
  await expect(root.locator("[data-expression]")).toHaveText("12+3=");
  const state = await root.evaluate(el => el.scientificCalculator.snapshot().state);
  expect(state.answer).toBe(15);
  expect(state.history).toHaveLength(1);
  const error = await root.evaluate(el => {
    try { el.scientificCalculator.restore({ schemaVersion: 99 }); }
    catch (error) { return error.name; }
  });
  expect(error).toBe("TypeError");
  await expect(root.locator("[data-result]")).toHaveText("15");
});
