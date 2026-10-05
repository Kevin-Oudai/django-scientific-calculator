const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { loadFixtures, runFixture } = require("./golden-runner");
const { validateGuide } = require("./validate-guide");
const root = path.resolve(__dirname, "../../..");
const read = file => JSON.parse(fs.readFileSync(path.join(__dirname, file), "utf8"));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const escape = text => String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

function generateReport() {
  const ledger = read("capability-ledger.json");
  const baseline = read("baseline-0.3.1.json");
  const guide = read("guide-examples.json");
  const guideSummary = validateGuide(guide);
  const coverage = read("report-coverage.json");
  assert.equal(coverage.schemaVersion, 1);
  const fixtures = loadFixtures();
  const replay = new Map(fixtures.map(f => [f.id, runFixture(f)]));
  const capabilityIds = new Set(ledger.capabilities.map(c => c.id));
  const testEvidence = [];
  for (const record of coverage.tests) {
    assert.ok(["unit", "browser"].includes(record.kind));
    const file = path.resolve(root, record.path);
    assert.ok(file.startsWith(root + path.sep));
    assert.ok(record.scope && record.anchor && fs.readFileSync(file, "utf8").includes(record.anchor));
    const ids = [...(record.capabilityIds || [])];
    for (const fixtureId of record.fixtureIds || []) {
      const fixture = fixtures.find(f => f.id === fixtureId);
      assert.ok(fixture && replay.get(fixtureId).frames.length, "Pending fixture cannot count as tested");
      ids.push(...fixture.capabilityIds);
    }
    assert.ok(ids.every(id => capabilityIds.has(id)));
    testEvidence.push({ ...record, capabilityIds: [...new Set(ids)] });
  }
  const rows = ledger.capabilities.map(capability => {
    const captured = baseline.capabilities.find(b => b.capability_id === capability.id);
    assert.ok(captured);
    const guides = guide.fixtures.filter(f => f.capabilityIds.includes(capability.id));
    const golden = fixtures.filter(f => f.capabilityIds.includes(capability.id));
    const completedReplay = golden.filter(f => replay.get(f.id).frames.length);
    const unit = testEvidence.filter(t => t.kind === "unit" && t.capabilityIds.includes(capability.id));
    const browser = testEvidence.filter(t => t.kind === "browser" && t.capabilityIds.includes(capability.id));
    return {
      id: capability.id, label: capability.label, family: capability.family, roadmapOwner: capability.roadmap_owner,
      documented: { status: capability.status.documented || guides.length ? "documented" : "not-recorded",
        evidence: [...capability.evidence.filter(e => ledger.sources.find(s => s.source_id === e.source_id)?.kind === "manual"), ...guides.map(f => ({ guideFixture: f.id, pages: f.pages }))],
        scope: guides.length ? "Printed guide sequence uses this physical key; no behavior parity implied." : "Ledger documentation evidence only." },
      simulatorObserved: { status: capability.status.simulator_observed ? "observed" : "pending", evidence: capability.evidence.filter(e => e.source_id.startsWith("live-")),
        scope: capability.pending_verification || "Inventory exposure only; behavior must be verified separately." },
      implemented: { status: captured.classification, evidence: captured.feature_ids, scope: captured.reason,
        sourceRevision: baseline.source_revision, policy: "Frozen baseline classification; infrastructure refactors do not promote capability parity." },
      unitTested: { status: unit.length ? "partial" : "pending", evidence: unit, scope: "Explicit mapped assertions only; unlisted coverage is unassessed." },
      goldenTested: { status: completedReplay.length ? "baseline-known-differences" : "pending",
        evidence: golden.map(f => ({ fixtureId: f.id, status: replay.get(f.id).status, assertedFrames: replay.get(f.id).frames.length })),
        scope: "Baseline characterization only; all current supported fixtures have oracle display differences." },
      browserTested: { status: browser.length ? "partial" : "pending", evidence: browser,
        scope: "Explicit canonical baseline browser replays only; legacy regression coverage is not inferred as parity." },
    };
  });
  const files = ["capability-ledger.json", "baseline-0.3.1.json", "guide-examples.json", "report-coverage.json",
    "generate-report.js", "golden-runner.js", "validate-guide.js", ...fs.readdirSync(path.join(__dirname, "golden")).filter(f => f.endsWith(".json")).map(f => `golden/${f}`),
    ...fixtures.map(f => f.reference)];
  const sources = [...new Set(files)].sort().map(file => ({ path: `tests/reference/el506ts/${file}`, sha256: digest(fs.readFileSync(path.join(__dirname, file))) }));
  for (const file of [...new Set(testEvidence.map(t => t.path))].sort()) sources.push({ path: file, sha256: digest(fs.readFileSync(path.join(root, file))) });
  const columns = ["documented", "simulatorObserved", "implemented", "unitTested", "goldenTested", "browserTested"];
  const counts = Object.fromEntries(columns.map(col => [col, rows.reduce((result, row) => { result[row[col].status] = (result[row[col].status] || 0) + 1; return result; }, {})]));
  return { schemaVersion: 1, roadmapItem: "EL506-006", ledgerId: ledger.ledger_id,
    policy: "Evidence status is independent across columns. Inventory observation, partial implementation and baseline tests do not establish full calculator parity. Test mappings identify assertions, not a new test execution record. Run npm test for verification.",
    summary: { entries: rows.length, counts, guide: guideSummary, golden: { fixtures: fixtures.length, assertedFrames: [...replay.values()].reduce((n, r) => n + r.frames.length, 0), pending: [...replay.values()].filter(r => r.status === "pending").length }, verifiedFullParity: 0 },
    sources, rows };
}

function renderReport(report) {
  const columns = ["documented", "simulatorObserved", "implemented", "unitTested", "goldenTested", "browserTested"];
  const labels = ["Documented", "Simulator observed", "Implemented", "Unit tested", "Golden tested", "Browser tested"];
  const rows = report.rows.map(row => `<tr><td>${escape(row.id)}<br><strong>${escape(row.label)}</strong><br>${escape(row.family)} / ${escape(row.roadmapOwner)}</td>${columns.map(col => `<td><strong>${escape(row[col].status)}</strong><details><summary>Evidence and scope</summary><p>${escape(row[col].scope)}</p><pre>${escape(JSON.stringify(row[col].evidence, null, 2))}</pre></details></td>`).join("")}</tr>`).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EL-506TS parity evidence report</title><style>body{font:16px system-ui;margin:2rem;color:#162130;background:#f5f7fa}main{max-width:1600px;margin:auto}table{border-collapse:collapse;width:100%;background:white}th,td{padding:12px;border:1px solid #b7c2d0;text-align:left;vertical-align:top}th{background:#163858;color:white}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}input{font:inherit;padding:10px;min-width:280px}details{margin-top:8px}summary{cursor:pointer}a{color:#174d80}.scroll{overflow:auto}caption{text-align:left;padding:12px 0;font-weight:bold}</style></head><body><main><h1>EL-506TS parity evidence</h1><p>${report.summary.entries} ledger entries. Full verified parity: ${report.summary.verifiedFullParity}.</p><p>${escape(report.policy)}</p><p>Guide: ${report.summary.guide.workflows} workflows; ${report.summary.guide.replayed} baseline replay; ${report.summary.guide.pending} pending. Golden: ${report.summary.golden.assertedFrames} asserted frames; ${report.summary.golden.pending} pending fixture.</p><details><summary>Column totals</summary><pre>${escape(JSON.stringify(report.summary.counts, null, 2))}</pre></details><p><label for="filter">Filter by capability, family, owner or evidence status</label><br><input id="filter" type="search" placeholder="For example: matrix or EL506-146"><span id="count" aria-live="polite"> ${report.summary.entries} entries</span></p><div class="scroll"><table><caption>Independent status and scoped evidence</caption><thead><tr><th>Capability</th>${labels.map(l => `<th>${l}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div><p>Generated from repository reference artifacts. Regenerate with npm run report:parity. JSON: parity-report.json.</p></main><script>const filter=document.getElementById('filter');const rows=[...document.querySelectorAll('tbody tr')];filter.addEventListener('input',()=>{const query=filter.value.toLowerCase();let count=0;for(const row of rows){row.hidden=!row.textContent.toLowerCase().includes(query);if(!row.hidden)count++;}document.getElementById('count').textContent=' '+count+' entries';});</script></body></html>\n`;
}

function artifacts() {
  const report = generateReport();
  return { "parity-report.json": JSON.stringify(report, null, 2) + "\n", "parity-report.html": renderReport(report) };
}

if (require.main === module) {
  const outputs = artifacts();
  for (const [file, text] of Object.entries(outputs)) {
    const target = path.join(__dirname, file);
    if (process.argv.includes("--check")) assert.equal(fs.readFileSync(target, "utf8"), text, `${file} is stale; run npm run report:parity`);
    else fs.writeFileSync(target, text);
  }
  console.log(`Parity report ${process.argv.includes("--check") ? "current" : "generated"}: 430 independent ledger rows`);
}
module.exports = { generateReport, renderReport, artifacts };
