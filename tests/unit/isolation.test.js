const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../../src/scientific_calculator/static/scientific_calculator/core.js');
const key=(state,id)=>core.reduceCalculator(state,{type:'physical-key',id});
test('legacy second-layer memory events retain exact values within their own instance',()=>{
  let state=core.createInitialState();const other=core.createInitialState();
  for(const char of '1/3')state=core.reduceCalculator(state,{type:'keyboard',key:char});
  state=core.reduceCalculator(state,{type:'keyboard',key:'Enter'});
  state=core.reduceCalculator(state,{type:'button',action:'second'});
  state=core.reduceCalculator(state,{type:'button',action:'angle',secondAction:'memory-add'});
  assert.deepEqual(state.values.memory,{kind:'rational',numerator:'1',denominator:'3'});
  assert.deepEqual(other.values.memory,{kind:'scalar',value:0});
});
test('resolved physical events cannot alter shared key definitions across instances',()=>{
  const first=core.createInitialState(),second=core.createInitialState();
  core.resolvePhysicalKey(first,'EL506-K40').event.insert='9';
  assert.equal(key(second,'EL506-K40').entry,'1');
  const shifted=key(first,'EL506-K03');
  core.resolvePhysicalKey(shifted,'EL506-K13').event.insert='cos(';
  assert.equal(core.resolvePhysicalKey(key(second,'EL506-K03'),'EL506-K13').event.insert,'asin(');
});
test('three state branches isolate nested editors, menus, stores, snapshots and restores',()=>{
  const states=Array.from({length:3},()=>core.createInitialState());
  const snapshots=states.map(core.snapshotCalculator);
  let first=states[0];for(const id of ['EL506-K40','EL506-K43','EL506-K41','EL506-K48','EL506-K29'])first=key(first,id);
  let second=key(states[1],'EL506-K06');
  second.workflow.payload.choices[0]='changed';second.workflow.payload.path.push('x');
  first.history[0].expression='changed';first.editor.tokens[0].value='7';first.values.memory.value=9;
  assert.deepEqual(core.snapshotCalculator(states[2]),snapshots[2]);
  assert.deepEqual(key(states[2],'EL506-K06').workflow.payload.choices,['ANGLE','FORMAT','TAB']);
  const restored=core.restoreCalculator(snapshots[0]);restored.layers.settings.tab=9;restored.values.answer.value=99;
  assert.deepEqual(states.map(core.snapshotCalculator),snapshots);
});
