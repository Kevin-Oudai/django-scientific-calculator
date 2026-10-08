const test=require('node:test'),assert=require('node:assert/strict');
const c=require('../../src/scientific_calculator/static/scientific_calculator/core');
const f=require('../../src/scientific_calculator/static/scientific_calculator/formatting');
const reference=require('../reference/el506ts/experiments/list-intermediate-precision-native.json');
test('Independent native list division and scaled intermediate residual',()=>{
 let s=c.createInitialState();
 for(let step=1;step<=reference.sequence.length;step++){
  s=c.reduceCalculator(s,{type:'physical-key',id:reference.sequence[step-1]});
  const frame=reference.frames.find(frame=>frame.after_step===step);if(!frame)continue;
  assert.equal(s.control.errorCode,null,'native step '+(step+1009));
  assert.equal(s.layers.mode,'LIST');assert.equal(f.renderState(s,{physical:true}).resultHtml,frame.display.lower_line,'native step '+(step+1009));
  assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
 }
});
