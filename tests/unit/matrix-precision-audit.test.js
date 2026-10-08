const test=require('node:test'),assert=require('node:assert/strict');
const c=require('../../src/scientific_calculator/static/scientific_calculator/core');
const f=require('../../src/scientific_calculator/static/scientific_calculator/formatting');
for(const [name,offset] of [['matrix-intermediate-precision-native',961],['matrix-scaled-precision-native',1073],['matrix-product-precision-native',0]])test('Independent native matrix division and large-term cancellation: '+name,()=>{
 const reference=require('../reference/el506ts/experiments/'+name+'.json');
 let s=c.createInitialState();
 for(let step=1;step<=reference.sequence.length;step++){
  s=c.reduceCalculator(s,{type:'physical-key',id:reference.sequence[step-1]});
  const frame=reference.frames.find(frame=>frame.after_step===step);if(!frame)continue;
  assert.equal(s.control.errorCode,null,'native step '+(step+offset));
  assert.equal(s.layers.mode,'MAT');assert.equal(f.renderState(s,{physical:true}).resultHtml,frame.display.lower_line,'native step '+(step+offset));
  assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
 }
});
