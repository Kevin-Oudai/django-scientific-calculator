const { test, expect } = require("@playwright/test");
const { loadFixtures, baseEvents } = require("../reference/el506ts/golden-runner");

for (const fixture of loadFixtures().filter(f => f.status !== "pending")) {
  test(`canonical baseline browser replay: ${fixture.id}`, async ({ page }) => {
    // Long physical transcripts include browser actionability and a state
    // assertion after every press. Allow the slower desktop engines this work.
    test.setTimeout(Math.max(60000, 20000 + fixture.sequence.length * 1000));
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(fixture.displayProfile === "physical" ? "/" : "/legacy/");
    const root = page.locator("[data-scientific-calculator]").first();
    for (let step = 0; step <= fixture.sequence.length; step++) {
      if (step) {
        if (fixture.displayProfile === "physical") {
          await root.locator(`[data-key-id="${fixture.sequence[step-1]}"]`).click();
        } else if (fixture.dispatch === "physical") {
          await root.evaluate((el,id)=>el.scientificCalculator.pressKey(id),fixture.sequence[step-1]);
        } else {
        const event = baseEvents[fixture.sequence[step - 1]];
        const selector = event.insert ? `[data-insert="${event.insert}"]` : `[data-action="${event.action}"]`;
        await root.locator(selector).click();
        }
      }
      const expected = fixture.expected[step].assertions;
      await expect(root.locator('[data-expression]')).not.toHaveText('Calculating!');
      const actual = await root.evaluate(el => el.scientificCalculator.snapshot().state);
      for (const [field, value] of Object.entries(expected)) {
        expect(field.split(".").reduce((v, k) => v[k], actual)).toEqual(value);
      }
      await expect(root.locator("[data-result]")).toHaveText(fixture.expected[step].domResultText ?? expected.displayResult);
      if (fixture.expected[step].domResultSup !== undefined) {
        await expect(root.locator("[data-result] sup")).toHaveText(fixture.expected[step].domResultSup);
      }
    }
    expect(errors).toEqual([]);
  });
}
