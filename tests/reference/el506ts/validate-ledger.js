const fs = require("node:fs");
const path = require("node:path");
const catalogue = require("../../../src/scientific_calculator/static/scientific_calculator/physical-keys.json");
const profile = require("./simulator-profile.json");
const panel = require("./physical-key-reference.json");
const experiment = require("./experiments/menu-inventory.json");
const { validateExperiment } = require("./validate-experiment");

// Inventory checks only. Exposure evidence must never count as passing parity.
function validateLedger(ledger) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  check(ledger.schema_version === 1, "Unsupported ledger version");
  check(ledger.roadmap_item === "EL506-001", "Incorrect ledger roadmap item");
  check(ledger.catalog_id === catalogue.catalog_id, "Physical catalogue mismatch");
  check(ledger.simulator_profile_id === profile.profile_id, "Simulator profile mismatch");
  check(validateExperiment(experiment).length === 0, "Invalid live menu experiment");
  check(panel.reference_status === "live-verified", "Panel evidence is not live verified");
  const entries = ledger.capabilities;
  if (!Array.isArray(entries) || !entries.length) return [...errors, "Missing capabilities"];
  const keys = new Set(catalogue.keys.map(({ id }) => id));
  const sources = new Map((ledger.sources ?? []).map((s) => [s.source_id, s]));
  check(sources.size === ledger.sources?.length, "Duplicate source ID");
  const frames = new Set(experiment.frames.map(({ after_step }) => after_step));
  const roadmap = fs.readFileSync(path.join(__dirname, "../../../update-plan.md"), "utf8");
  check(new Set(entries.map(({ id }) => id)).size === entries.length, "Duplicate capability ID");
  check(ledger.counting?.ledger_entries === entries.length, "Ledger count mismatch");
  check(ledger.counting?.manufacturer_advertised_functions === 470, "Missing advertised count");
  check(ledger.counting?.manufacturer_mapping_status === "unresolved", "Marketing count must remain explicitly unresolved until reconciled");
  for (const entry of entries) {
    const prefix = entry.id ?? "<missing>";
    check(/^el506\.[a-z0-9.-]+$/.test(prefix), `${prefix}: invalid stable ID`);
    check(typeof entry.label === "string" && entry.label.length > 0, `${prefix}: missing label`);
    check(typeof entry.family === "string" && entry.family.length > 0, `${prefix}: missing family`);
    check(/^EL506-\d{3}$/.test(entry.roadmap_owner) && roadmap.includes(`**${entry.roadmap_owner} -`), `${prefix}: unknown roadmap owner`);
    check(typeof entry.pending_verification === "string" && entry.pending_verification.length > 0, `${prefix}: missing pending verification`);
    check(Array.isArray(entry.access?.key_sequence) && entry.access.key_sequence.every((id) => keys.has(id)), `${prefix}: invalid physical sequence`);
    check(typeof entry.access?.context === "string" && entry.access.context.length > 0, `${prefix}: missing mode context`);
    check(Array.isArray(entry.evidence) && entry.evidence.length > 0, `${prefix}: missing evidence`);
    for (const ref of entry.evidence ?? []) {
      check(sources.has(ref.source_id), `${prefix}: unknown evidence source`);
      check(typeof ref.scope === "string" && ref.scope.length > 0, `${prefix}: missing evidence scope`);
      if (ref.source_id === "live-menu") check(frames.has(ref.after_step), `${prefix}: unknown live frame`);
      if (ref.source_id === "live-panel") check(keys.has(ref.key_id), `${prefix}: unknown panel key`);
      if (ref.source_id === "full-manual") check([1, 2].includes(ref.page) && typeof ref.section === "string", `${prefix}: missing manual location`);
    }
    const status = entry.status;
    check(status?.documented === entry.evidence?.some((r) => r.source_id === "full-manual"), `${prefix}: unsupported documented status`);
    check(status?.simulator_observed === entry.evidence?.some((r) => ["live-menu", "live-panel"].includes(r.source_id)), `${prefix}: unsupported observation status`);
    check(status?.implemented === "unassessed", `${prefix}: implementation must await baseline classification`);
    for (const field of ["unit_tested", "golden_tested", "browser_tested"]) check(status?.[field] === "pending", `${prefix}: inventory is not ${field} parity evidence`);
  }
  for (const family of ["physical-key", "base"]) {
    const rows = entries.filter((e) => e.family === family);
    check(rows.length === 48 && new Set(rows.map((e) => e.access?.key_sequence?.[0])).size === 48, `${family}: all 48 positions required`);
  }
  for (const [family, total] of [["constant", 52], ["conversion", 44]]) {
    const numbers = entries.filter((e) => e.family === family).map((e) => e.access?.catalogue_number).sort();
    const expected = Array.from({ length: total }, (_, i) => String(i + 1).padStart(2, "0"));
    check(JSON.stringify(numbers) === JSON.stringify(expected), `${family}: incomplete or duplicate numbered catalogue`);
  }
  const familySizes = {
    mode: 6, regression: 7, equation: 4, setup: 18, HYP: 6,
    "formula-memory": 4, statistic: 16, memory: 18,
    "menu.normal": 4, "menu.engineering": 9, "menu.probability": 4,
    "menu.complex": 1, "menu.matrix-root": 7, "menu.matrix-ope": 6,
    "menu.matrix-math": 2, "menu.list-root": 7, "menu.list-ope": 7,
    "menu.list-math": 11, "menu.random": 4, "menu.clear": 2,
    "matrix-slot": 4, "list-slot": 4,
  };
  for (const [family, total] of Object.entries(familySizes)) {
    check(entries.filter((e) => e.family === family).length === total, `${family}: incomplete inventory`);
  }
  for (const [family, field, modifier] of [["2ndF", "second_legend_key_ids", "EL506-K03"], ["ALPHA", "alpha_legend_key_ids", "EL506-K05"]]) {
    const rows = entries.filter((e) => e.family === family);
    const covered = rows.map((e) => e.access?.key_sequence?.[1]).sort();
    check(JSON.stringify(covered) === JSON.stringify(ledger.layer_coverage?.[field]?.slice().sort()), `${family}: layer coverage mismatch`);
    check(rows.every((e) => e.access?.key_sequence?.[0] === modifier), `${family}: incorrect modifier path`);
  }
  check(ledger.unknowns?.some((u) => u.id === "aggregate-470"), "Missing count reconciliation unknown");
  check(Array.isArray(ledger.disagreements), "Missing disagreement register");
  return errors;
}

module.exports = { validateLedger };
if (require.main === module) {
  const ledger = require("./capability-ledger.json");
  const errors = validateLedger(ledger);
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  else console.log(`${ledger.ledger_id}: ${ledger.capabilities.length} inventory entries valid; application parity unassessed`);
}
