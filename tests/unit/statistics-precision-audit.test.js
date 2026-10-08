const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const c=require(root+'core'),f=require(root+'formatting'),statistics=require(root+'statistics');
const reference=require('../reference/el506ts/experiments/statistics-x-cancellation-native.json');

test('Independent native LINE Y cancellation sum and mean return zero',()=>{
 const trace=require('../reference/el506ts/experiments/statistics-y-cancellation-native.json');
 let s=c.createInitialState();
 for(let step=1;step<=trace.sequence.length;step++){
  s=c.reduceCalculator(s,{type:'physical-key',id:trace.sequence[step-1]});
  const frame=trace.frames.find(x=>x.after_step===step);if(!frame)continue;
  assert.equal(s.control.errorCode,null);assert.equal(s.layers.mode,'STAT');
  assert.equal(f.renderState(s,{physical:true}).resultHtml,frame.display.lower_line);
  assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
 }
 assert.equal(s.answer,0);
 const rows=[1e13,1,-1e13].map(y=>({x:0,y,weight:1}));
 assert.equal(statistics.result(rows,'LINE','sum-y'),1,'pure module retains default summation');
});
test('Independent native STAT X cancellation sum mean and immediate recall return zero',()=>{
 let s=['EL506-K04','EL506-K35'].reduce((s,id)=>c.reduceCalculator(s,{type:'physical-key',id}),c.createInitialState());
 for(let step=1;step<=reference.sequence.length;step++){
  s=c.reduceCalculator(s,{type:'physical-key',id:reference.sequence[step-1]});
  const frame=reference.frames.find(x=>x.after_step===step);if(!frame)continue;
  assert.equal(s.control.errorCode,null);assert.equal(s.layers.mode,'STAT');
  assert.equal(f.renderState(s,{physical:true}).resultHtml,frame.display.lower_line);
  if(frame.display.indicators.includes('ALPHA')){assert.equal(s.layers.alpha,true);assert.equal(s.secondActive,false);}
  assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
 }
 assert.deepEqual(s.statsValues,[1e12,1,-1e12]);assert.equal(s.answer,1);
 const rows=[1e13,1,-1e13].map(x=>({x,y:null,weight:1}));
 assert.equal(statistics.result(rows,'SD','sum-x'),1,'pure module retains its default mathematical summation');
});
