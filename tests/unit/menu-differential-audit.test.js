const test=require('node:test'),assert=require('node:assert/strict');
const c=require('../../src/scientific_calculator/static/scientific_calculator/core');
const f=require('../../src/scientific_calculator/static/scientific_calculator/formatting');
const ref=require('../reference/el506ts/experiments/menu-inventory.json');
const text=x=>String(x).replace(/<[^>]*>/g,'').replace(/\s+/g,' ').replaceAll('μ','µ').trim();
const digits=x=>text(x).replace(/[^0-9A-F]/g,'');
test('Independent native119-key menu inventory reproduces67 unambiguous LCD checkpoints',()=>{
 let s=c.createInitialState(),asserted=0;
 for(let step=1;step<=ref.sequence.length;step++){
  s=c.reduceCalculator(s,{type:'physical-key',id:ref.sequence[step-1]});
  const frame=ref.frames.find(frame=>frame.after_step===step);if(!frame)continue;
  // The original exposure transcript used editorial [nCr] placeholders.
  // Fresh exact0C measurements are covered separately, without rewriting it.
  if([81,83].includes(step))continue;
  const view=f.renderState(s,{physical:true});
  assert.equal(text(view.expressionHtml),text(frame.display.upper_line),'native step '+step);
  assert.equal(digits(view.resultHtml),digits(frame.display.lower_line),'native index/digit sequence '+step);
  assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);asserted++;
 }
 assert.equal(asserted,67); //70 frames include initial step0 and the two editorial placeholders.
});
test('Fresh native engineering wrap and empty-left combination entry',()=>{
 let s=c.createInitialState();const press=n=>s=c.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});
 for(const n of [17,40,11])press(n);
 assert.equal(text(f.renderState(s,{physical:true}).expressionHtml),'m µ n p f');
 assert.equal(s.workflow.page,1);assert.equal(f.renderState(s,{physical:true}).nextPage,false);
 press(11);assert.equal(s.workflow.page,0);assert.equal(text(f.renderState(s,{physical:true}).expressionHtml),'k M G T');
 for(const n of [2,3,36])press(n);
 assert.equal(text(f.renderState(s,{physical:true}).expressionHtml),'0C');assert.equal(f.renderState(s,{physical:true}).resultHtml,'0.');
 press(40);assert.equal(text(f.renderState(s,{physical:true}).expressionHtml),'0C');assert.equal(f.renderState(s,{physical:true}).resultHtml,'1.');
 press(48);assert.equal(s.control.errorCode,2);
});
