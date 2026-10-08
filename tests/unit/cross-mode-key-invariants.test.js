const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../../src/scientific_calculator/static/scientific_calculator/core');
const formatting = require('../../src/scientific_calculator/static/scientific_calculator/formatting');
const catalog = require('../../src/scientific_calculator/static/scientific_calculator/physical-keys.json');
const press = (state, number) => core.reduceCalculator(state, {
  type: 'physical-key', id: `EL506-K${String(number).padStart(2, '0')}`,
});
const sequence = (state, numbers) => numbers.reduce(press, state);

// These are implementation invariants, not simulator-derived compatibility
// assertions. A successful sweep must never be counted as native parity.
for (const [mode, setup] of [['NORMAL', [4, 45]], ['STAT', [4, 40, 45]], ['EQN', [4, 41, 45]], ['CPLX', [4, 42]], ['MAT', [4, 35]], ['LIST', [4, 36]]]) {
  for (const [layer, prefix] of [['base', []], ['2ndF', [3]], ['ALPHA', [5]], ['HYP', [12]]]) {
    test(`${mode} ${layer}: every physical key preserves immutable, restorable state`, () => {
      const initial = sequence(core.createInitialState(), setup);
      assert.equal(initial.layers.mode, mode);
      for (const entry of [[], [30], [30, 43]]) {
        const before = sequence(initial, [...entry, ...prefix]);
        for (const key of catalog.keys) {
          const saved = core.snapshotCalculator(before);
          const event = { type: 'physical-key', id: key.id };
          const next = core.reduceCalculator(before, event);
          const label = `${mode}/${layer}/${entry.join(',')}/${key.id}`;
          assert.deepEqual(core.snapshotCalculator(before), saved, `${label}: reducer mutated its input`);
          assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(next)), next, `${label}: snapshot lost state`);
          assert.deepEqual(core.reduceCalculator(core.restoreCalculator(saved), event), next, `${label}: replay changed state`);
          const view = formatting.renderState(next, { physical: true });
          assert.equal(typeof view.expressionHtml, 'string', label);
          assert.equal(typeof view.resultHtml, 'string', label);
          // Modifying a restored branch must not affect the live state.
          const branch = core.restoreCalculator(core.snapshotCalculator(next));
          branch.control.variables.A = 987654321;
          assert.notEqual(next.control.variables.A, 987654321, label);
        }
      }
    });
  }
}
