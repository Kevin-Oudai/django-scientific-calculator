const { test, expect } = require("@playwright/test");
const catalogue = require("../../src/scientific_calculator/static/scientific_calculator/physical-keys.json");
const reference = require("../reference/el506ts/physical-key-reference.json");

// Freeze the identity-to-position contract independently of catalogue array order.
// New descriptions or behavioral layers must not reassign an existing physical ID.
const physicalRows = [
  { region: "utility", row: 1, ids: ["EL506-K01", "EL506-K02"] },
  { region: "utility", row: 2, ids: ["EL506-K03", "EL506-K04"] },
  { region: "utility", row: 3, ids: ["EL506-K05", "EL506-K06", "EL506-K07"] },
  { region: "navigation", row: 1, ids: ["EL506-K08"] },
  { region: "navigation", row: 2, ids: ["EL506-K09", "EL506-K10"] },
  { region: "navigation", row: 3, ids: ["EL506-K11"] },
  { region: "main", row: 1, ids: ["EL506-K12", "EL506-K13", "EL506-K14", "EL506-K15", "EL506-K16", "EL506-K17"] },
  { region: "main", row: 2, ids: ["EL506-K18", "EL506-K19", "EL506-K20", "EL506-K21", "EL506-K22", "EL506-K23"] },
  { region: "main", row: 3, ids: ["EL506-K24", "EL506-K25", "EL506-K26", "EL506-K27", "EL506-K28", "EL506-K29"] },
  { region: "main", row: 4, ids: ["EL506-K30", "EL506-K31", "EL506-K32", "EL506-K33", "EL506-K34"] },
  { region: "main", row: 5, ids: ["EL506-K35", "EL506-K36", "EL506-K37", "EL506-K38", "EL506-K39"] },
  { region: "main", row: 6, ids: ["EL506-K40", "EL506-K41", "EL506-K42", "EL506-K43", "EL506-K44"] },
  { region: "main", row: 7, ids: ["EL506-K45", "EL506-K46", "EL506-K47", "EL506-K48"] },
];

test("preserves all 48 physical key identities and their distinct positions", () => {
  expect(catalogue.schema_version).toBe(1);
  expect(catalogue.catalog_id).toBe("el506-physical-keys-v1");
  expect(catalogue.model).toBe("EL-506TS");
  expect(catalogue.keys).toHaveLength(48);
  expect(new Set(catalogue.keys.map((key) => key.id)).size).toBe(48);
  expect(new Set(catalogue.keys.map(({ position }) =>
    `${position.region}:${position.row}:${position.slot}`
  )).size).toBe(48);

  const expectedPositions = Object.fromEntries(physicalRows.flatMap(({ region, row, ids }) =>
    ids.map((id, index) => [id, { region, row, slot: index + 1 }])
  ));
  const actualPositions = Object.fromEntries(catalogue.keys.map(({ id, position }) => [id, position]));
  expect(actualPositions).toEqual(expectedPositions);
});

test("ties every physical key to one reference transcription and a panel location", () => {
  expect(reference.catalog_id).toBe(catalogue.catalog_id);
  expect(reference.reference_status).toBe("live-verified");
  expect(reference.live_verification.status).toBe("pass");
  expect(reference.live_verification.panel_comparison.matched_key_ids.sort()).toEqual(
    catalogue.keys.map((key) => key.id).sort()
  );
  expect(reference.live_verification.display_frames.map((frame) => frame.after_key_id)).toEqual(
    reference.live_verification.key_sequence
  );
  expect(reference.live_verification.display_frames.find((frame) =>
    frame.after_key_id === "EL506-K48"
  ).lower_line).toBe("3.");
  expect(reference.panel.width_px).toBe(287);
  expect(reference.panel.height_px).toBe(577);
  expect(reference.keys).toHaveLength(catalogue.keys.length);
  expect(new Set(reference.keys.map((key) => key.key_id)).size).toBe(48);
  expect(reference.keys.map((key) => key.key_id).sort()).toEqual(catalogue.keys.map((key) => key.id).sort());
  expect(new Set(reference.keys.map((key) => key.center_px.join(":"))).size).toBe(48);

  const referenceById = new Map(reference.keys.map((key) => [key.key_id, key]));
  for (const key of catalogue.keys) {
    const observed = referenceById.get(key.id);
    expect(typeof key.reference_legend).toBe("string");
    expect(key.reference_legend.trim().length).toBeGreaterThan(0);
    expect(observed.reference_legend, key.id).toBe(key.reference_legend);
    expect(key.reference_legend, key.id).not.toMatch(/reset|capture|open image folder/i);
    expect(observed.center_px, key.id).toHaveLength(2);
    const [x, y] = observed.center_px;
    expect(Number.isFinite(x), key.id).toBe(true);
    expect(Number.isFinite(y), key.id).toBe(true);
    expect(x, key.id).toBeGreaterThanOrEqual(0);
    expect(x, key.id).toBeLessThan(reference.panel.width_px);
    expect(y, key.id).toBeGreaterThanOrEqual(0);
    expect(y, key.id).toBeLessThan(reference.panel.height_px);
  }
});

test("serves the standalone physical key catalogue at its package static path", async ({ page }) => {
  const response = await page.goto("/static/scientific_calculator/physical-keys.json");
  expect(response).not.toBeNull();
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/json");
  expect(await response.json()).toEqual(catalogue);
});
