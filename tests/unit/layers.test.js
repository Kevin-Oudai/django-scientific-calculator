const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../../src/scientific_calculator/static/scientific_calculator/calculator.js');
const press = (s,n) => core.reduceCalculator(s,{type:'physical-key',id:`EL506-K${String(n).padStart(2,'0')}`});
test('physical modifier resolution consumes 2ndF/ALPHA/HYP without text replacement', () => {
  let s=core.createInitialState();
  for(const n of [3,12]) s=press(s,n);
  assert.equal(s.secondActive,true); assert.equal(s.layers.hyp,true);
  assert.equal(core.resolvePhysicalKey(s,'EL506-K13').name,'asinh');
  s=press(s,13); assert.equal(s.layers.intent.name,'asinh');
  assert.equal(s.layers.hyp,false); assert.equal(s.secondActive,false);
  s=press(s,2); s=press(s,5); s=press(s,48);
  assert.equal(s.layers.alpha,false); assert.equal(s.layers.intent.event.insert,'ans');
  s=press(s,3); assert.equal(core.resolvePhysicalKey(s,'EL506-K20').event.insert,'sqrt(');
  assert.throws(()=>press(s,99),TypeError);
  assert.equal(core.resolvePhysicalKey(s,'EL506-K24').kind,'conversion');
});
test('menus and memory prompts accept only their declared physical selections', () => {
  let s=press(core.createInitialState(),4);
  assert.equal(s.lifecycle,'menu'); assert.equal(s.workflow.payload.id,'MODE');
  assert.deepEqual(press(s,32),s); // digit 9 is not a mode
  s=press(s,45); assert.equal(s.layers.mode,'NORMAL'); assert.equal(s.workflow.kind,null);
  for(const n of [6,45,40]) s=press(s,n);
  assert.equal(s.angleMode,'RAD');
  s=press(s,2); assert.equal(s.layers.settings.angle,'RAD');
  s=press(s,28); assert.equal(s.lifecycle,'prompt');
  s=press(s,18); assert.deepEqual(s.layers.intent,{kind:'memory-value',operation:'STO',slot:'A'});
  for(const n of [3,41,45,40]) s=press(s,n);
  assert.deepEqual(s.layers.intent,{kind:'catalogue-value',menu:'CNST',index:1});
  assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(s)),s);
});
test('mode selection records intent and prevents unsupported mode arithmetic', () => {
  let s=core.createInitialState(); for(const n of [4,35]) s=press(s,n);
  assert.equal(s.layers.mode,'MAT');
  assert.equal(press(s,40).entry,'1');
  assert.throws(()=>press(s,48),/pending/);
  assert.equal(press(s,2).layers.mode,'MAT');
  assert.equal(press(s,1).layers.mode,'NORMAL');
});
