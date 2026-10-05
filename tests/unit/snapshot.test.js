const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../../src/scientific_calculator/static/scientific_calculator/calculator.js");
const button = (s, action) => core.reduceCalculator(s, { type: "button", action });
const key = (s, key) => core.reduceCalculator(s, { type: "keyboard", key });

test("every reachable baseline template and store round trips independently", () => {
  let s = key(core.createInitialState(), "3");
  s = button(s, "memory-add");
  s = button(s, "stats-add");
  s = button(s, "angle");
  s = button(s, "second");
  for (const action of ["fraction", "power", "exp", "root", "ncr", "npr", "dms"]) {
    const staged = button(s, action);
    const snapshot = core.snapshotCalculator(staged);
    const restored = core.restoreCalculator(snapshot);
    assert.deepEqual(restored, staged, action);
    restored.statsValues.push(99);
    assert.deepEqual(snapshot.state.statsValues, staged.statsValues);
    snapshot.state.history.push({ expression: "9=", value: 9, exactDisplay: "" });
    assert.equal(staged.history.length, 0);
  }
});

test("restore resumes history, cursor, errors and nonfinite values deterministically", () => {
  let s = core.createInitialState();
  for (const k of ["1", "/", "0", "Enter", "ArrowLeft"]) s = key(s, k);
  assert.equal(s.answer, Infinity);
  const snap = core.snapshotCalculator(s);
  assert.deepEqual(key(core.restoreCalculator(snap), "Delete"), key(s, "Delete"));
  assert.equal(core.restoreCalculator(snap).displayResult, "Error");
  assert.equal(core.restoreCalculator(snap).selectionActive, true);
});

test("unsupported versions and malformed states are rejected before replacement", () => {
  const snapshot = core.snapshotCalculator(core.createInitialState());
  for (const mutate of [s => s.schemaVersion = 99, s => delete s.state.memoryValue,
    s => s.state.statsValues = ["bad"], s => s.state.cursor = -1,
    s => s.state.angleMode = "invented", s => s.state.extra = true,
    s => s.state.stagedEntry = { type: "fraction" }]) {
    const invalid = structuredClone(snapshot);
    mutate(invalid);
    assert.throws(() => core.restoreCalculator(invalid), TypeError);
  }
  assert.deepEqual(core.restoreCalculator(snapshot), core.createInitialState());
});
