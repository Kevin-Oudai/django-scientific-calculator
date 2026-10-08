const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runner = require("../reference/el506ts/golden-runner");
const core = require("../../src/scientific_calculator/static/scientific_calculator/calculator.js");

test("canonical golden replay asserts every supported baseline frame and reports gaps", () => {
  const results = runner.loadFixtures().map(runner.runFixture);
  assert.equal(results.filter(r => r.status === "known-differences").length, 22);
  assert.equal(results.filter(r => r.status === "pending").length, 1);
  assert.equal(results.reduce((n, r) => n + r.frames.length, 0), 335);
});

test("golden assertions fail on state regressions, new differences and invalid physical IDs", () => {
  const fixture = runner.loadFixtures()[0];
  for (const mutate of [f => f.expected[4].assertions.answer = 99,
    f => f.knownDifferences.pop(), f => f.sequence[0] = "1",
    f => f.expected[2].assertions["invented.prompt"] = null]) {
    const changed = structuredClone(fixture);
    mutate(changed);
    assert.throws(() => runner.runFixture(changed));
  }
  assert.throws(() => runner.canonicalEvent(core.createInitialState(), "EL506-K04"), /Pending/);
  const second = core.reduceCalculator(core.createInitialState(), { type: "button", action: "second" });
  assert.throws(() => runner.canonicalEvent(second, "EL506-K13"), /Pending modifier/);
});

test("reference JSON is valid UTF-8 and retains mathematical glyphs", () => {
  for (const file of fs.readdirSync(path.join(__dirname, "../reference/el506ts/experiments"))) {
    const bytes = fs.readFileSync(path.join(__dirname, "../reference/el506ts/experiments", file));
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    JSON.parse(text);
  }
  const error = require("../reference/el506ts/experiments/error-recovery.json");
  assert.equal(error.frames.find(f => f.after_step === 2).display.upper_line, "1\u00f7");
});
