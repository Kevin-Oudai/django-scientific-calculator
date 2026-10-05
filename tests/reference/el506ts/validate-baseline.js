const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../../..");
const allowed = new Set(["matching", "partial", "enhanced-only", "incorrect", "missing"]);
const frozenCache = new Map();

// Read original Git objects: later refactors must not rewrite the captured facts.
function readFrozen(revision, file) {
  const key = `${revision}:${file}`;
  if (!frozenCache.has(key)) frozenCache.set(key, execFileSync("git", ["-c", `safe.directory=${root.replaceAll("\\", "/")}`, "show", key], { cwd: root }));
  return frozenCache.get(key);
}

function validateBaseline(baseline) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  check(baseline.schema_version === 1 && baseline.roadmap_item === "EL506-005", "Unsupported baseline contract");
  check(baseline.package_version === "0.3.1", "Incorrect baseline version");
  if (!/^[a-f0-9]{40}$/.test(baseline.source_revision)) return [...errors, "Missing immutable source revision"];
  const frozen = new Map();
  try {
    for (const source of baseline.source_files) {
      const bytes = readFrozen(baseline.source_revision, source.path);
      check(createHash("sha256").update(bytes).digest("hex") === source.sha256, `Source hash mismatch: ${source.path}`);
      frozen.set(source.path, bytes.toString("utf8"));
    }
  } catch (error) { return [...errors, `Cannot verify original source objects: ${error.message}`]; }
  const html = frozen.get("src/scientific_calculator/templates/scientific_calculator/calculator.html");
  const controls = [...html.matchAll(/(data-(?:second-)?(?:action|insert))="([^"]+)"/g)].map((m) => `${m[1]}:${m[2]}`);
  const features = new Map(baseline.features.map((f) => [f.id, f]));
  check(features.size === baseline.features.length, "Duplicate feature ID");
  check(controls.every((id) => features.has(id)), "Incomplete control classification");
  const refs = new Set(baseline.reference_sources.map((r) => r.id));
  for (const item of [...baseline.features, ...baseline.tests, ...baseline.capabilities, ...baseline.browser_probes]) {
    check(allowed.has(item.classification), "Invalid baseline classification");
  }
  for (const feature of baseline.features) {
    check(Boolean(feature.reason?.length), `Missing rationale: ${feature.id}`);
    check(frozen.get(feature.source.path)?.includes(feature.source.anchor), `Missing source anchor: ${feature.id}`);
    check(feature.reference_ids.length > 0 && feature.reference_ids.every((id) => refs.has(id)), `Missing feature reference: ${feature.id}`);
  }
  const expectedTests = [...frozen].flatMap(([file, text]) => file.endsWith(".spec.js")
    ? [...text.matchAll(/^test\("([^"]+)"/gm)].map((m) => `${file}:${m[1]}`) : []).sort();
  const recordedTests = baseline.tests.map((t) => `${t.path}:${t.title}`).sort();
  check(JSON.stringify(expectedTests) === JSON.stringify(recordedTests), "Incomplete original test classification");
  const ledger = JSON.parse(readFrozen(baseline.source_revision, "tests/reference/el506ts/capability-ledger.json"));
  check(JSON.stringify(ledger.capabilities.map((c) => c.id).sort()) === JSON.stringify(baseline.capabilities.map((c) => c.capability_id).sort()), "Incomplete capability classification");
  for (const capability of baseline.capabilities) {
    check(capability.feature_ids.every((id) => features.has(id)), `Unknown implementation feature: ${capability.capability_id}`);
    check(Boolean(capability.reason?.length), `Missing capability rationale: ${capability.capability_id}`);
    check(capability.classification !== "matching", "Baseline ledger must not promote full parity from partial browser evidence");
  }
  const profile = require("./simulator-profile.json");
  const runtime = profile.artifacts.find((a) => a.kind === "runtime_executable");
  check(baseline.live_session.runtime_sha256 === runtime.sha256 && baseline.live_session.build === runtime.file_version, "Incorrect live reference identity");
  check(baseline.live_session.new_key_sequence.length === 0 && baseline.live_session.limitation.length > 0, "Unverified new simulator keys must remain explicit");
  check(baseline.disagreements.every((d) => refs.has(d.selected_reference)), "Missing disagreement oracle");
  for (const probe of baseline.browser_probes) {
    check(refs.has(probe.reference_id), `Missing probe reference: ${probe.id}`);
    check(probe.application_sequence.every((s) => s.keyboard || features.has(`${s.attribute}:${s.value}`)), `Invalid legacy sequence: ${probe.id}`);
    check(typeof probe.expected.result === "string" && typeof probe.expected.expression === "string", `Missing observable result: ${probe.id}`);
  }
  return errors;
}

module.exports = { validateBaseline };
if (require.main === module) {
  const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, "baseline-0.3.1.json"), "utf8"));
  const errors = validateBaseline(baseline);
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  else console.log(`${baseline.baseline_id}: ${baseline.features.length} features, ${baseline.tests.length} original tests, ${baseline.capabilities.length} capability classifications valid`);
}
