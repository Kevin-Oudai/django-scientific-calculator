const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const lock = require('../../package-lock.json');
const allowed = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'Python-2.0', 'PSF-2.0']);
for (const [directory, entry] of Object.entries(lock.packages)) {
  if (!directory || entry.optional && !fs.existsSync(directory)) continue;
  const metadata = JSON.parse(fs.readFileSync(path.join(directory, 'package.json')));
  assert.ok(allowed.has(metadata.license), `${directory}: unreviewed license ${metadata.license}`);
  assert.equal(metadata.version, entry.version, `${directory}: differs from lockfile`);
}
// Check Python runtime dependencies, including their actual installed metadata.
const script = `import importlib.metadata as m, json
names = ['Django', 'asgiref', 'sqlparse']
print(json.dumps({n: {'license': m.metadata(n).get('License-Expression') or m.metadata(n).get('License') or ' '.join(m.metadata(n).get_all('Classifier', []))} for n in names}))`;
const python = JSON.parse(execFileSync('python', ['-c', script], {encoding: 'utf8'}));
for (const [name, metadata] of Object.entries(python)) {
  assert.ok(/BSD|MIT/.test(metadata.license), `${name}: unreviewed license`);
}
console.log('Locked JavaScript and installed Python runtime dependency licenses reviewed');
