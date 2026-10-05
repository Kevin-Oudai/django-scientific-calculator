const test = require("node:test");
const assert = require("node:assert/strict");
const guide = require("../reference/el506ts/guide-examples.json");
const { validateGuide } = require("../reference/el506ts/validate-guide");

test("guide page inventory, canonical workflows and supported golden replay are complete", () => {
  const result = validateGuide(guide);
  assert.equal(result.workflows, 52);
  assert.equal(result.replayed, 1);
  assert.equal(result.pending, 51);
  const paired = guide.fixtures.find(f => f.id === "guide-p38-paired-statistics");
  assert.equal(paired.frames.length, 21); // selection, eight records, twelve results
  assert.equal(guide.fixtures.find(f => f.id === "guide-p34-weighted-statistics").frames.length, 14);
});

test("guide validation rejects missing pages, physical IDs and premature parity claims", () => {
  for (const mutate of [g => g.pages.pop(), g => g.fixtures[0].sequence[0] = "MODE",
    g => g.fixtures[0].applicationStatus = "passing", g => g.pages[4].fixtureIds = []]) {
    const invalid = structuredClone(guide);
    mutate(invalid);
    assert.throws(() => validateGuide(invalid));
  }
});
