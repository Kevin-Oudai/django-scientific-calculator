const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const c=require(root+'core'),f=require(root+'formatting');
const reference=require('../reference/el506ts/experiments/matrix-definition-division-native.json');
test('Independent native matrix dimension and cell entry retain LCD punctuation',()=>{
 const reference=require('../reference/el506ts/experiments/matrix-entry-punctuation-native.json');
 let s=c.createInitialState();
 for(let step=0;step<=reference.sequence.length;step++){
  if(step)s=c.reduceCalculator(s,{type:'physical-key',id:reference.sequence[step-1]});
  const frame=reference.frames.find(x=>x.after_step===step);if(!frame)continue;
  const view=f.renderState(s,{physical:true});
  assert.equal(view.expressionHtml,frame.display.upper_line);
  assert.equal(view.resultHtml,frame.display.lower_line);
 }
});
test('Independent native matrix definition third retains cancellation precision',()=>{
 let s=['EL506-K04','EL506-K35','EL506-K11','EL506-K29','EL506-K29'].reduce((s,id)=>c.reduceCalculator(s,{type:'physical-key',id}),c.createInitialState());
 reference.sequence.forEach((id,i)=>{
  s=c.reduceCalculator(s,{type:'physical-key',id});const frame=reference.frames.find(x=>x.after_step===i+1);if(!frame)return;
  const view=f.renderState(s,{physical:true});assert.equal(view.resultHtml,frame.display.lower_line);assert.equal(view.expressionHtml.replace(/<[^>]*>/g,'').replaceAll('&divide;','÷'),frame.display.upper_line);
  assert.equal(s.control.errorCode,null);assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
 });assert.deepEqual(s.control.buffers.matrix.elements.map(x=>x.value),[0]);assert.ok(s.control.matrices[0].elements[0].value>0.3333333333333);
});
