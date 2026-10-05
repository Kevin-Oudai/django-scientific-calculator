const { test, expect } = require("@playwright/test");
const { validateExperiment } = require("../reference/el506ts/validate-experiment");
const example = require("../reference/el506ts/experiments/error-recovery.json");
const schema = require("../reference/el506ts/experiment.schema.json");
const catalogue = require("../../src/scientific_calculator/static/scientific_calculator/physical-keys.json");

test("validates live evidence and freezes canonical sequence notation", () => {
  expect(validateExperiment(example)).toEqual([]);
  expect(schema.definitions.key.enum).toEqual(catalogue.keys.map(({ id }) => id));
  const reordered = structuredClone(example);
  reordered.initial_state.display = Object.fromEntries(Object.entries(reordered.initial_state.display).reverse());
  expect(validateExperiment(reordered)).toEqual([]);
});

test("rejects incomplete evidence, labels, host controls, and incorrect references", () => {
  const mutations = [
    (e) => { delete e.initial_state; },
    (e) => { delete e.frames[1].display.indicators; },
    (e) => { e.sequence[0] = "1"; },
    (e) => { e.sequence[0] = "RESET"; },
    (e) => { e.sequence[0] = "EL506-K49"; },
    (e) => { e.initial_state.setup_sequence = ["MODE"]; },
    (e) => { e.sequence[0] = { key_id: "EL506-K40" }; },
    (e) => { e.simulator.runtime_sha256 = "0".repeat(64); },
    (e) => { e.capture.source_ids = ["missing"]; },
    (e) => { e.oracle.simulator_exception_ids = ["invented"]; },
    (e) => { e.frames[2].after_step = 99; },
    (e) => { e.frames[2].after_step = 1; },
    (e) => { e.frames.pop(); },
    (e) => { e.initial_state.display.lower_line = "1."; },
    (e) => { e.errors[0].at_step = 3; },
    (e) => { e.errors[0].recovery_steps = [3]; },
    (e) => { e.errors[0].recovered_at_step = 4; },
    (e) => { e.capture.date = "2026-02-30"; },
    (e) => { e.frames[0].unexpected = true; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(example);
    mutate(copy);
    expect(validateExperiment(copy).length, mutate.toString()).toBeGreaterThan(0);
  }
});

test("preserves exact values separately from displays and makes unknown state explicit", () => {
  const copy = structuredClone(example);
  const exact = { status: "observed", value: { encoding: "decimal-string", value: "12345678901234567890.125", basis: "recall-probe" } };
  copy.stored_values.observations = [{ path: "memory.M", before: { status: "unknown", reason: "Not read before setup" }, after: exact, evidence_steps: [5] }];
  expect(validateExperiment(copy)).toEqual([]);
  const roundTrip = JSON.parse(JSON.stringify(copy));
  expect(roundTrip.stored_values.observations[0].after.value.value).toBe("12345678901234567890.125");
  copy.stored_values.observations[0].after.value.value = "not a number";
  expect(validateExperiment(copy).length).toBeGreaterThan(0);
  copy.stored_values.observations[0].after = { status: "observed", value: { encoding: "rational-string", value: "7/0", basis: "recall-probe" } };
  expect(validateExperiment(copy).length).toBeGreaterThan(0);
  copy.stored_values.observations[0].after.value.value = "7/3";
  expect(validateExperiment(copy)).toEqual([]);
  copy.stored_values.observations[0].after.value = { encoding: "structured-json-string", value: '{"real":"1","imaginary":"2"}', basis: "recall-probe" };
  expect(validateExperiment(copy)).toEqual([]);
  copy.stored_values.observations[0].after.value.value = "null";
  expect(validateExperiment(copy).length).toBeGreaterThan(0);
  copy.stored_values.observations[0].after.value.value = 123;
  expect(validateExperiment(copy).length).toBeGreaterThan(0);
  copy.stored_values.observations[0].after = { status: "unknown" };
  expect(validateExperiment(copy).length).toBeGreaterThan(0);
  copy.stored_values.observations[0].after = { status: "unknown", reason: "Not probed", value: "0" };
  expect(validateExperiment(copy).length).toBeGreaterThan(0);
});
