const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { generateReport, artifacts, renderReport, normalizeText } = require("../reference/el506ts/generate-report");

test("generated report is deterministic, current and has independent evidence for every capability", () => {
  const report = generateReport();
  assert.deepEqual(generateReport(), report);
  assert.equal(report.rows.length, 430);
  assert.equal(new Set(report.rows.map(r => r.id)).size, 430);
  assert.equal(report.summary.verifiedFullParity, 0);
  assert.equal(report.summary.guide.pending, 51);
  const power = report.rows.find(r => r.id === "el506.key.el506-k19");
  assert.equal(power.documented.status, "documented");
  assert.equal(power.simulatorObserved.status, "observed");
  assert.equal(power.implemented.status, "partial");
  assert.equal(power.unitTested.status, "pending");
  assert.equal(power.goldenTested.status, "baseline-known-differences");
  assert.equal(power.browserTested.status, "partial");
  const mode = report.rows.find(r => r.id === "el506.key.el506-k04");
  assert.equal(mode.goldenTested.status, "pending");
  assert.equal(mode.browserTested.status, "pending");
  assert.equal(mode.goldenTested.evidence[0].assertedFrames, 0);
  for (const [file, text] of Object.entries(artifacts())) {
    assert.equal(normalizeText(fs.readFileSync(path.join(__dirname, "../reference/el506ts", file), "utf8")), text);
    assert.equal(normalizeText(text.replace(/\n/g, "\r\n")), text);
  }
});

test("report rendering escapes source labels and evidence instead of executing them", () => {
  const report = generateReport();
  report.rows[0].label = '<img src=x onerror="alert(1)">';
  report.rows[0].documented.scope = "</p><script>unsafe()</script>";
  const html = renderReport(report);
  assert.ok(html.includes("&lt;img src=x"));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<script>unsafe()'));
});
