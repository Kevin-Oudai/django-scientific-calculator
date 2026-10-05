const Ajv = require("ajv");
const { isDeepStrictEqual } = require("node:util");
const schema = require("./experiment.schema.json");
const profile = require("./simulator-profile.json");
const catalogue = require("../../../src/scientific_calculator/static/scientific_calculator/physical-keys.json");
const validateShape = new Ajv({ allErrors: true, strict: true }).compile(schema);

// Structural validation plus references that JSON Schema cannot compare.
// This validates evidence documents; it does not replay calculator inputs.
function validateExperiment(experiment) {
  if (!validateShape(experiment)) {
    return validateShape.errors.map(({ instancePath, message }) => `${instancePath}: ${message}`);
  }
  const errors = [];
  const fail = (condition, message) => { if (!condition) errors.push(message); };
  const keys = new Set(catalogue.keys.map(({ id }) => id));
  for (const id of [...experiment.initial_state.setup_sequence, ...experiment.sequence]) {
    fail(keys.has(id), `Unknown physical key: ${id}`);
  }
  const runtime = profile.artifacts.find(({ kind }) => kind === "runtime_executable");
  fail(experiment.simulator.profile_id === profile.profile_id, "Simulator profile mismatch");
  fail(experiment.simulator.build === runtime.file_version, "Simulator build mismatch");
  fail(experiment.simulator.runtime_sha256 === runtime.sha256, "Simulator fingerprint mismatch");
  const sourceIds = experiment.sources.map(({ source_id }) => source_id);
  fail(new Set(sourceIds).size === sourceIds.length, "Duplicate source ID");
  for (const id of [...experiment.capture.source_ids, experiment.oracle.selected_source_id]) {
    fail(sourceIds.includes(id), `Missing source: ${id}`);
  }
  const exceptions = new Set(profile.known_simulator_differences.map(({ id }) => id));
  for (const id of experiment.oracle.simulator_exception_ids) {
    fail(exceptions.has(id), `Unknown simulator exception: ${id}`);
  }
  for (const disagreement of experiment.oracle.disagreements) {
    fail(disagreement.source_ids.every((id) => sourceIds.includes(id)), "Disagreement refers to missing source");
    fail(disagreement.source_ids.includes(disagreement.selected_source_id), "Disagreement selects unrelated source");
  }
  const count = experiment.sequence.length;
  const frameSteps = experiment.frames.map(({ after_step }) => after_step);
  fail(frameSteps[0] === 0, "First frame must describe the initial state at step 0");
  fail(isDeepStrictEqual(experiment.frames[0].display, experiment.initial_state.display), "Initial display disagrees with step 0");
  fail(frameSteps.at(-1) === count, "Final sequence step needs a display frame");
  fail(frameSteps.every((step, i) => step <= count && (i === 0 || step > frameSteps[i - 1])), "Frame steps must be increasing and within sequence");
  const stores = [...experiment.initial_state.stores, ...experiment.stored_values.observations];
  const observations = [...experiment.frames.map(({ result }) => result), ...stores.flatMap(({ before, after }) => [before, after])];
  for (const observation of observations.filter(({ status }) => status === "observed")) {
    const { encoding, value } = observation.value;
    if (encoding === "decimal-string") {
      fail(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value), "Invalid exact decimal string");
    } else if (encoding === "rational-string") {
      fail(/^[+-]?\d+\/[1-9]\d*$/.test(value), "Invalid exact rational string");
    } else {
      try {
        const parsed = JSON.parse(value);
        fail(parsed !== null && typeof parsed === "object", "Structured value must encode an object or array");
      } catch { errors.push("Invalid structured JSON string"); }
    }
  }
  for (const store of stores) {
    fail(store.evidence_steps.every((step) => step <= count), `Store evidence outside sequence: ${store.path}`);
  }
  for (const group of [experiment.initial_state.stores, experiment.stored_values.observations]) {
    fail(new Set(group.map(({ path }) => path)).size === group.length, "Duplicate store path");
  }
  for (const error of experiment.errors) {
    const frame = experiment.frames.find(({ after_step }) => after_step === error.at_step);
    fail(Boolean(frame) && [frame?.display.upper_line, frame?.display.lower_line].includes(error.message), "Error needs a matching display frame");
    fail(error.recovery_steps.every((step, i) => step > error.at_step && step <= count && (i === 0 || step > error.recovery_steps[i - 1])), "Recovery steps must follow error in sequence order");
    fail(error.recovered_at_step === error.recovery_steps.at(-1) && frameSteps.includes(error.recovered_at_step), "Recovery needs a final display frame");
  }
  const [year, month, day] = experiment.capture.date.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  fail(date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day, "Invalid capture calendar date");
  return errors;
}

module.exports = { validateExperiment };

if (require.main === module) {
  const fs = require("node:fs");
  const path = require("node:path");
  const directory = path.join(__dirname, "experiments");
  const files = process.argv.slice(2);
  const targets = files.length ? files : fs.readdirSync(directory).filter((name) => name.endsWith(".json")).map((name) => path.join(directory, name));
  if (!targets.length) throw new Error("No experiment documents found");
  for (const file of targets) {
    const errors = validateExperiment(JSON.parse(fs.readFileSync(file, "utf8")));
    if (errors.length) {
      console.error(`${file}\n${errors.join("\n")}`);
      process.exitCode = 1;
    } else console.log(`${file}: valid`);
  }
}
