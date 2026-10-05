const { test, expect } = require("@playwright/test");
const { validateLedger } = require("../reference/el506ts/validate-ledger");
const ledger = require("../reference/el506ts/capability-ledger.json");
const experiment = require("../reference/el506ts/experiments/menu-inventory.json");

test("inventory has complete numbered catalogues, layer paths and traceable evidence", () => {
  expect(validateLedger(ledger)).toEqual([]);
  expect(experiment.sequence).toHaveLength(119);
  expect(experiment.frames).toHaveLength(70);
  expect(ledger.capabilities.filter((e) => e.family === "menu.list-math").map((e) => e.label)).toEqual([
    "min", "max", "mean", "med", "sum", "prod", "stdDv", "vari", "o_prod(", "i_prod(", "abs",
  ]);
});

test("inventory rejects gaps, broken references and premature parity claims", () => {
  const mutations = [
    (l) => { l.capabilities.splice(l.capabilities.findIndex((e) => e.family === "mode"), 1); l.counting.ledger_entries--; },
    (l) => { l.capabilities[0].id = l.capabilities[1].id; },
    (l) => { l.capabilities.find((e) => e.family === "constant").access.catalogue_number = "53"; },
    (l) => { l.capabilities.find((e) => e.family === "conversion").access.catalogue_number = "45"; },
    (l) => { l.capabilities[0].access.key_sequence = ["EL506-K49"]; },
    (l) => { l.capabilities[0].evidence = []; },
    (l) => { l.capabilities[0].evidence[0].source_id = "missing"; },
    (l) => { l.capabilities.find((e) => e.family === "mode").evidence[0].after_step = 116; },
    (l) => { l.capabilities[0].roadmap_owner = "EL506-999"; },
    (l) => { l.capabilities[0].status.implemented = "matching"; },
    (l) => { l.capabilities[0].status.golden_tested = "passed"; },
    (l) => { l.capabilities[0].status.documented = true; },
    (l) => { l.capabilities.find((e) => e.family === "2ndF").access.key_sequence[0] = "EL506-K05"; },
    (l) => { l.counting.manufacturer_mapping_status = "reconciled"; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(ledger);
    mutate(copy);
    expect(validateLedger(copy).length, mutate.toString()).toBeGreaterThan(0);
  }
});

test("reference results, errors and cancellation remain independent of inventory status", () => {
  const frame = (step) => experiment.frames.find((f) => f.after_step === step);
  expect(frame(89).result.value.value).toBe("299792458");
  expect(frame(96).result.value.value).toBe("2.54");
  expect(frame(99).display.prompt).toBe("CLR_MEMORY?");
  expect(frame(103).display.prompt).toBe("RESET?");
  expect(experiment.sequence[99]).toBe("EL506-K02");
  expect(experiment.sequence[103]).toBe("EL506-K02");
  expect(experiment.errors[0].recovered_at_step).toBe(85);
  expect(ledger.capabilities.every((e) => e.status.golden_tested === "pending")).toBe(true);
});
