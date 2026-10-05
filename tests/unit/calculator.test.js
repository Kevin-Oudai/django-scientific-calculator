const test = require("node:test");
const assert = require("node:assert/strict");
// This import would fail at DOM initialization before the CommonJS test seam.
const calculator = require("../../src/scientific_calculator/static/scientific_calculator/calculator.js");
const reference = require("../reference/el506ts/experiments/unit-addition.json");
const { evaluateExpression: evaluate, evaluateExactExpression: exact, formatValue, closeOpenParentheses } = calculator;

test("pure evaluator imports in Node with no browser globals or DOM shim", () => {
  assert.equal(typeof globalThis.document, "undefined");
  assert.equal(typeof globalThis.window, "undefined");
  assert.equal(evaluate("2+3", "DEG", 0), 5);
});

test("fresh simulator addition reference agrees numerically, independently of LCD text", () => {
  assert.deepEqual(reference.sequence, ["EL506-K40", "EL506-K43", "EL506-K41", "EL506-K48"]);
  const frame = reference.frames.at(-1);
  assert.equal(evaluate("1+2", "DEG", 0), Number(frame.result.value.value));
  // Legacy formatting deliberately remains different from the reference's 3.
  assert.equal(formatValue(3), "3");
  assert.equal(frame.display.lower_line, "3.");
});

test("legacy scalar precedence, parentheses and right-associative powers", () => {
  for (const [expression, expected] of [["2+3*4", 14], ["(2+3)*4", 20], ["7.5/2.5", 3], ["2^3^2", 512], ["2(3+4)", 14]]) {
    assert.equal(evaluate(expression, "DEG", 0), expected, expression);
  }
});

test("angle mode and ANS are explicit inputs without cross-call retained state", () => {
  for (let iteration = 0; iteration < 3; iteration++) {
    assert.ok(Math.abs(evaluate("sin(30)", "DEG", 0) - 0.5) < 1e-14);
    assert.equal(evaluate("sin(pi/2)", "RAD", 0), 1);
    assert.equal(evaluate("ans*4", "DEG", 5), 20);
    assert.equal(evaluate("ans*4", "DEG", 2), 8);
  }
});

test("legacy combinatorics and nth roots preserve valid results and invalid domains", () => {
  assert.equal(evaluate("fact(5)", "DEG", 0), 120);
  assert.equal(evaluate("ncr(5,2)", "DEG", 0), 10);
  assert.equal(evaluate("npr(5,2)", "DEG", 0), 20);
  assert.equal(evaluate("root(3,27)", "DEG", 0), 3);
  assert.throws(() => evaluate("fact(-1)", "DEG", 0));
  assert.throws(() => evaluate("ncr(5,6)", "DEG", 0));
});

test("exact enhancement output is separate from the scalar numerical value", () => {
  assert.equal(exact("sqrt(24)", "DEG", 0), "2\u221a6");
  assert.equal(evaluate("sqrt(24)", "DEG", 0), Math.sqrt(24));
  assert.equal(exact("sqrt(8)+sqrt(18)", "DEG", 0), "5\u221a2");
  assert.equal(exact("sin(60)", "DEG", 0), "(\u221a3)/2");
});

test("normalizing incomplete and mixed-number entry remains legacy behavior", () => {
  assert.equal(closeOpenParentheses("sqrt(81"), "sqrt(81)");
  assert.equal(evaluate(closeOpenParentheses("2*(3+4"), "DEG", 0), 14);
  assert.equal(evaluate("1 1/2", "DEG", 0), 1.5);
  assert.throws(() => evaluate("sin(", "DEG", 0));
  assert.throws(() => evaluate("unknown(2)", "DEG", 0));
});

test("known nonfinite/error and precision policies remain characterized, not fixed", () => {
  assert.equal(evaluate("1/0", "DEG", 0), Infinity);
  assert.equal(formatValue(Infinity), "Error");
  assert.equal(formatValue(Math.PI), "3.14159265359");
  assert.equal(formatValue(1e-13), "0");
});
