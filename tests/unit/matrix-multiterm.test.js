const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../../src/scientific_calculator/static/scientific_calculator/core');
const reference=require('../reference/el506ts/experiments/matrix-multiterm-residual-native.json');
test('MAT explicit closing parentheses permit the independently observed multiterm workflow',()=>{
 let s=core.createInitialState();
 for(const [index,id]of reference.sequence.entries()){
  s=core.reduceCalculator(s,{type:'physical-key',id});
  assert.equal(s.control.errorCode,null,'Native key step '+(index+1)+' must not create a syntax error');
 }
 assert.equal(s.workflow.payload.label,'MAT1,1=');
 assert.equal(s.workflow.payload.matrix.rows,1);assert.equal(s.workflow.payload.matrix.columns,1);
 assert.ok(Number.isFinite(s.workflow.payload.matrix.data[0]));
 assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(s)),s);
 // Native numeric zero remains an unresolved precision difference. This test
 // covers successful entry/calculation/paging, not numeric parity.
});
