const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../../src/scientific_calculator/static/scientific_calculator/calculator.js');
const key = (s, key) => core.reduceCalculator(s, {type: 'keyboard', key});
test('entry lifecycle follows empty, entry, evaluation, editing and error recovery', () => {
  let s = core.createInitialState();
  assert.equal(s.lifecycle, 'empty');
  s = key(s, '1'); assert.equal(s.lifecycle, 'entering');
  s = key(s, 'Enter'); assert.equal(s.lifecycle, 'evaluated');
  s = key(s, 'ArrowLeft'); assert.equal(s.lifecycle, 'editing');
  s = core.createInitialState();
  for (const k of ['1', '/', '0', 'Enter']) s = key(s, k);
  assert.equal(s.lifecycle, 'error');
  s = core.reduceCalculator(s, {type:'button', action:'clear'});
  assert.equal(s.lifecycle, 'empty');
});
test('modal workflows retain entry and round-trip every phase, paging without recalculation', () => {
  const entering = key(core.createInitialState(), '7');
  for (const [command, phase, payload] of [
    ['open-menu', 'menu', {id:'MODE'}], ['open-prompt', 'prompt', {id:'solver'}],
    ['begin-data', 'data-entry', {id:'matrix', row:0, column:0}],
    ['show-results', 'multi-result', {pages:[{label:'x', value:2}, {label:'y', value:3}]}],
  ]) {
    let s = core.reduceCalculator(entering, {type:'workflow', command, payload});
    assert.equal(s.lifecycle, phase);
    assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(s)), s);
    assert.deepEqual(key(s, '9'), s); // entry cannot bypass active prompt/menu
    assert.throws(() => core.reduceCalculator(s, {type:'workflow', command, payload}));
    if (phase === 'multi-result') {
      s = core.reduceCalculator(s, {type:'workflow', command:'page', direction:1});
      assert.equal(s.workflow.page, 1); assert.equal(s.answer, entering.answer);
    }
    assert.deepEqual(key(s, 'Escape'), entering);
  }
});
test('legacy snapshots migrate and malformed lifecycle snapshots reject atomically', () => {
  const old = core.snapshotCalculator(key(core.createInitialState(), '4'));
  old.schemaVersion = 1; delete old.state.lifecycle; delete old.state.workflow; delete old.state.layers; delete old.state.editor; delete old.state.values;
  assert.equal(core.restoreCalculator(old).lifecycle, 'entering');
  const bad = core.snapshotCalculator(core.createInitialState());
  bad.state.lifecycle = 'menu';
  assert.throws(() => core.restoreCalculator(bad), TypeError);
});
