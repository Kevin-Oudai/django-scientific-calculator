const { test, expect } = require("@playwright/test");
const baseline = require("../reference/el506ts/baseline-0.3.1.json");
const { validateBaseline } = require("../reference/el506ts/validate-baseline");

test("baseline classifications cover the frozen controls, tests and ledger", () => {
  expect(validateBaseline(baseline)).toEqual([]);
  const missing = structuredClone(baseline);
  missing.capabilities.pop();
  expect(validateBaseline(missing)).toContain("Incomplete capability classification");
  const unsupported = structuredClone(baseline);
  unsupported.features[0].classification = "passing-parity";
  expect(validateBaseline(unsupported).length).toBeGreaterThan(0);
  const wrongHash = structuredClone(baseline);
  wrongHash.source_files[0].sha256 = "0".repeat(64);
  expect(validateBaseline(wrongHash).some((e) => e.startsWith("Source hash mismatch"))).toBe(true);
  const missingTest = structuredClone(baseline);
  missingTest.tests.pop();
  expect(validateBaseline(missingTest)).toContain("Incomplete original test classification");
});

test("preserves 0.3.1 observable results and known deviations before refactoring", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  const observations = [];
  for (const probe of baseline.browser_probes) {
    await page.goto("/legacy/");
    const root = page.locator("[data-scientific-calculator]");
    for (const step of probe.application_sequence) {
      if (step.keyboard) {
        await root.focus();
        await page.keyboard.press(step.keyboard);
      } else {
        await root.locator(`button[${step.attribute}=${JSON.stringify(step.value)}]`).click();
      }
    }
    const observed = {
      expression: await root.locator("[data-expression]").innerText(),
      result: await root.locator("[data-result]").innerText(),
      angle: await root.locator("[data-angle-label]").innerText(),
      second_active: await root.evaluate((node) => node.classList.contains("is-second-active")),
    };
    expect.soft(observed, probe.id).toEqual(probe.expected);
    observations.push({ id: probe.id, observed });
  }
  expect(errors).toEqual([]);
  await testInfo.attach("baseline-observations", { body: JSON.stringify(observations, null, 2), contentType: "application/json" });
});

test("0.3.1 keyboard input remains focused and independent across two embeds", async ({ page }) => {
  // Duplicate the shipped template before its existing DOMContentLoaded initializer.
  await page.route("**/", async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    const start = html.indexOf('<div class="scicalc" data-scientific-calculator>');
    const end = html.indexOf("<script", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    await route.fulfill({ response, body: html.slice(0, end) + html.slice(start, end) + html.slice(end) });
  });
  await page.goto("/legacy/");
  const roots = page.locator("[data-scientific-calculator]");
  await expect(roots).toHaveCount(2);
  await roots.nth(0).focus();
  await page.keyboard.type("1+2");
  await page.keyboard.press("Enter");
  await expect(roots.nth(0).locator("[data-result]")).toHaveText("3");
  await expect(roots.nth(1).locator("[data-result]")).toHaveText("0");
  await roots.nth(1).focus();
  await page.keyboard.type("4+5");
  await page.keyboard.press("Enter");
  await expect(roots.nth(1).locator("[data-result]")).toHaveText("9");
  await expect(roots.nth(0).locator("[data-result]")).toHaveText("3");
  await page.locator("body").evaluate((node) => { node.tabIndex = -1; node.focus(); });
  await page.keyboard.type("777");
  await expect(roots.nth(0).locator("[data-result]")).toHaveText("3");
  await expect(roots.nth(1).locator("[data-result]")).toHaveText("9");
});
