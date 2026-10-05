const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const core = require("../../../src/scientific_calculator/static/scientific_calculator/calculator.js");
const catalog = require("../../../src/scientific_calculator/static/scientific_calculator/physical-keys.json");
const { validateExperiment } = require("./validate-experiment");
const ids = new Set(catalog.keys.map(k => k.id));

// Bootstrap adapter for implemented NORMAL base operations only. This maps
// physical intent into legacy reducer events; unsupported modes/layers must
// remain pending, never silently become a conventional calculator shortcut.
const baseEvents = Object.freeze(Object.fromEntries([
  [1, { action: "home" }], [2, { action: "clear" }], [3, { action: "second" }],
  [7, { action: "delete" }], [8, { action: "history-up" }], [9, { action: "cursor-left" }],
  [10, { action: "cursor-right" }], [11, { action: "history-down" }],
  [13, { insert: "sin(" }], [14, { insert: "cos(" }], [15, { insert: "tan(" }],
  [18, { insert: "pi" }], [19, { action: "power" }], [20, { insert: "^2" }],
  [22, { insert: "log(" }], [23, { insert: "ln(" }], [24, { action: "exp" }],
  [25, { action: "fraction" }], [26, { action: "dms" }], [29, { action: "memory-add" }],
  ...[[30,"7"],[31,"8"],[32,"9"],[33,"("],[34,")"],[35,"4"],[36,"5"],[37,"6"],
    [38,"*"],[39,"/"],[40,"1"],[41,"2"],[42,"3"],[43,"+"],[44,"-"],[45,"0"],[46,"."]]
    .map(([n, insert]) => [n, { insert }]),
  [47, { action: "sign" }], [48, { action: "equals" }],
].map(([n, event]) => [`EL506-K${String(n).padStart(2, "0")}`, Object.freeze({ type: "button", ...event })])));

function canonicalEvent(state, id) {
  if (!ids.has(id)) throw new TypeError(`Unknown physical key: ${id}`);
  if (state.secondActive && id !== "EL506-K03") throw new Error(`Pending modifier dispatch: ${id}`);
  if (!baseEvents[id]) throw new Error(`Pending physical key dispatch: ${id}`);
  return baseEvents[id];
}

function valueAt(state, dottedPath) {
  let value = state;
  for (const part of dottedPath.split(".")) {
    if (["__proto__", "constructor", "prototype"].includes(part)
      || value === null || !Object.hasOwn(value, part)) throw new TypeError(`Unknown observable path: ${dottedPath}`);
    value = value[part];
  }
  return value;
}

function runFixture(fixture) {
  assert.equal(fixture.schemaVersion, 1);
  assert.ok(typeof fixture.id === "string" && fixture.id.length);
  assert.ok(Array.isArray(fixture.sequence) && fixture.sequence.length);
  assert.ok(fixture.sequence.every(id => ids.has(id)), "canonical physical IDs required");
  assert.ok(Array.isArray(fixture.capabilityIds));
  const ledger = require("./capability-ledger.json");
  assert.ok(fixture.capabilityIds.every(id => ledger.capabilities.some(c => c.id === id)));
  const referencePath = path.resolve(__dirname, fixture.reference);
  assert.ok(referencePath.startsWith(__dirname + path.sep), "reference must remain local");
  const reference = JSON.parse(fs.readFileSync(referencePath, "utf8"));
  assert.deepEqual(validateExperiment(reference), []);
  assert.deepEqual(fixture.sequence, reference.sequence);
  if (fixture.status === "pending") {
    assert.ok(fixture.reason?.length);
    return { id: fixture.id, status: "pending", frames: [] };
  }
  assert.equal(fixture.status, "baseline-characterization");
  assert.equal(fixture.expected.length, fixture.sequence.length + 1);
  let state = core.createInitialState();
  const frames = [];
  for (let step = 0; step <= fixture.sequence.length; step++) {
    if (step) state = core.reduceCalculator(state, canonicalEvent(state, fixture.sequence[step - 1]));
    const expected = fixture.expected[step];
    assert.equal(expected.afterStep, step);
    assert.ok(Object.keys(expected.assertions).length > 0);
    for (const [field, value] of Object.entries(expected.assertions)) {
      assert.deepEqual(valueAt(state, field), value, `${fixture.id} step ${step}: ${field}`);
    }
    frames.push(core.snapshotCalculator(state));
  }
  // Oracle differences are data, not passing parity. Assert their exact set so
  // new differences cannot be concealed by a broad tolerance or an allowlist.
  const differences = [];
  for (const frame of reference.frames) {
    const actual = frames[frame.after_step].state;
    for (const [field, expected] of [["displayExpression", frame.display.upper_line], ["displayResult", frame.display.lower_line]]) {
      if (actual[field] !== expected) differences.push({ afterStep: frame.after_step, field, expected, actual: actual[field] });
    }
  }
  assert.deepEqual(differences, fixture.knownDifferences);
  return { id: fixture.id, status: differences.length ? "known-differences" : "baseline-only", frames, differences };
}

function loadFixtures() {
  return fs.readdirSync(path.join(__dirname, "golden")).filter(f => f.endsWith(".json")).sort()
    .map(f => JSON.parse(fs.readFileSync(path.join(__dirname, "golden", f), "utf8")));
}

if (require.main === module) {
  for (const fixture of loadFixtures()) {
    const result = runFixture(fixture);
    console.log(`${result.id}: ${result.status}; ${result.frames.length} asserted frames`);
  }
}
module.exports = { baseEvents, canonicalEvent, valueAt, runFixture, loadFixtures };
