const test = require("node:test");
const assert = require("node:assert/strict");
const { createInitialState, reduceCalculator } = require("../../src/scientific_calculator/static/scientific_calculator/calculator.js");
const key = (state, key) => reduceCalculator(state, { type: "keyboard", key });
const button = (state, action) => reduceCalculator(state, { type: "button", action });
const type = (state, text) => [...text].reduce(key, state);

test("reducer is deterministic, does not mutate its input, and isolates stores", () => {
  const initial = createInitialState();
  const saved = structuredClone(initial);
  const event = { type: "keyboard", key: "1" };
  assert.deepEqual(reduceCalculator(initial, event), reduceCalculator(initial, event));
  assert.deepEqual(initial, saved);
  const evaluated = key(type(initial, "1+2"), "Enter");
  assert.equal(evaluated.answer, 3);
  assert.equal(evaluated.displayExpression, "1+2=");
  assert.equal(evaluated.displayResult, "3");
  const memory = button(evaluated, "memory-add");
  assert.equal(memory.memoryValue, 3);
  assert.equal(initial.memoryValue, 0);
  assert.equal(evaluated.memoryValue, 0);
  assert.equal(button(memory, "clear").memoryValue, 3);
});

test("history, cursor and error paths remain observable without a DOM", () => {
  let state = key(type(createInitialState(), "12+3"), "Enter");
  state = button(state, "clear");
  state = key(state, "ArrowUp");
  assert.equal(state.expression, "12+3=");
  state = key(state, "ArrowLeft");
  assert.equal(state.selectionActive, true);
  const error = key(type(createInitialState(), "("), "Enter");
  assert.equal(error.displayResult, "Error");
  assert.equal(error.history.length, 0);
  assert.equal(button(error, "clear").displayResult, "0");
});

test("staged fraction and modifier transitions preserve independent branches", () => {
  const fraction = button(createInitialState(), "fraction");
  const numerator = type(fraction, "3");
  const denominator = type(key(numerator, "ArrowDown"), "4");
  const result = key(denominator, "Enter");
  assert.equal(result.answer, 0.75);
  assert.equal(fraction.stagedEntry.numerator, "");
  assert.equal(numerator.stagedEntry.denominator, "");
  const second = button(createInitialState(), "second");
  const radians = button(second, "angle");
  assert.equal(radians.angleMode, "RAD");
  assert.equal(second.angleMode, "DEG");
});

test("statistics and nonfinite values survive reduction without JSON coercion", () => {
  let state = button(type(createInitialState(), "2"), "stats-add");
  state = button(state, "clear");
  state = button(type(state, "4"), "stats-add");
  assert.deepEqual(state.statsValues, [2, 4]);
  assert.equal(button(state, "stats-mean").answer, 3);
  const infinite = key(type(createInitialState(), "1/0"), "Enter");
  assert.equal(infinite.answer, Infinity);
  assert.equal(key(infinite, "x").answer, Infinity);
});
