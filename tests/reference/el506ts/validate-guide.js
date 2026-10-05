const assert = require("node:assert/strict");
const { runFixture, loadFixtures } = require("./golden-runner");
const catalog = require("../../../src/scientific_calculator/static/scientific_calculator/physical-keys.json");
const ledger = require("./capability-ledger.json");

function validateGuide(guide) {
  const ids = new Set(catalog.keys.map(k => k.id));
  assert.equal(guide.schemaVersion, 1);
  assert.equal(guide.roadmapItem, "EL506-004");
  assert.equal(guide.source.pageCount, 44);
  assert.match(guide.source.sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(guide.pages.map(p => p.page), Array.from({ length: 44 }, (_, i) => i + 1));
  const fixtureIds = new Set(guide.fixtures.map(f => f.id));
  assert.equal(fixtureIds.size, guide.fixtures.length);
  for (const page of guide.pages) {
    assert.ok(page.reviewed && page.disposition);
    assert.deepEqual(page.fixtureIds.sort(), guide.fixtures.filter(f => f.pages.includes(page.page)).map(f => f.id).sort());
  }
  for (const fixture of guide.fixtures) {
    assert.ok(fixture.pages.length && fixture.pages.every(p => p >= 1 && p <= 44));
    assert.ok(fixture.initialState && fixture.printedOperations.length);
    assert.ok(fixture.sequence.length && fixture.sequence.every(id => ids.has(id)));
    assert.ok(fixture.capabilityIds.length && fixture.capabilityIds.every(id => ledger.capabilities.some(c => c.id === id)));
    assert.ok(fixture.frames.length);
    let previous = 0;
    for (const frame of fixture.frames) {
      assert.ok(frame.afterStep >= previous && frame.afterStep <= fixture.sequence.length);
      assert.equal(frame.evidenceKind, "guide-print");
      assert.ok(typeof frame.printed === "string" && frame.printed.length);
      previous = frame.afterStep;
    }
    if (fixture.goldenFixture) {
      const golden = loadFixtures().find(f => f.id === fixture.goldenFixture);
      assert.ok(golden);
      assert.deepEqual(golden.sequence, fixture.sequence);
      runFixture(golden);
    } else {
      assert.equal(fixture.applicationStatus, "pending");
      assert.equal(fixture.simulatorStatus, "unmeasured");
    }
  }
  for (const disagreement of guide.disagreements) assert.ok(fixtureIds.has(disagreement.fixtureId));
  return { workflows: guide.fixtures.length, checkpoints: guide.fixtures.reduce((n, f) => n + f.frames.length, 0),
    replayed: guide.fixtures.filter(f => f.goldenFixture).length,
    pending: guide.fixtures.filter(f => !f.goldenFixture).length };
}

if (require.main === module) {
  const result = validateGuide(require("./guide-examples.json"));
  console.log(`44 guide pages: ${result.workflows} workflows, ${result.checkpoints} printed checkpoints; ${result.replayed} baseline replays, ${result.pending} pending`);
}
module.exports = { validateGuide };
