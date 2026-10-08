const test=require('node:test'),assert=require('node:assert/strict');
const c=require('../../src/scientific_calculator/static/scientific_calculator/core');
const f=require('../../src/scientific_calculator/static/scientific_calculator/formatting');
const reference=require('../reference/el506ts/experiments/complex-intermediate-precision-native.json');
test('Independent native complex cancellation and scaled intermediate results',()=>{
 let s=c.reduceCalculator(c.createInitialState(),{type:'physical-key',id:'EL506-K04'});s=c.reduceCalculator(s,{type:'physical-key',id:'EL506-K35'});
 for(let step=1;step<=reference.sequence.length;step++){
  s=c.reduceCalculator(s,{type:'physical-key',id:reference.sequence[step-1]});
  const frame=reference.frames.find(frame=>frame.after_step===step);if(!frame)continue;
  assert.equal(s.control.errorCode,null,'native step '+(step+882));
  assert.equal(s.layers.mode,'CPLX');assert.equal(f.renderState(s,{physical:true}).resultHtml,frame.display.lower_line,'native step '+(step+882));
  assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
 }
});
