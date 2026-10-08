const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const c=require(root+'core'),f=require(root+'formatting'),lists=require(root+'lists');
const reference=require('../reference/el506ts/experiments/list-sum-mean-cancellation-native.json');
test('Independent native LIST exponent entry sum and mean cancellation',()=>{
 let s=c.createInitialState();
 reference.sequence.forEach((id,i)=>{
  s=c.reduceCalculator(s,{type:'physical-key',id});
  if(i===8){const view=f.renderState(s,{physical:true});assert.equal(view.expressionHtml,'');assert.match(view.resultHtml,/<sup>13<\/sup>/);assert.equal(view.cursorVisible,false);}
  const frame=reference.frames.find(x=>x.after_step===i+1);if(!frame)return;
  assert.equal(s.control.errorCode,null);assert.equal(s.layers.mode,'LIST');
  assert.equal(f.renderState(s,{physical:true}).resultHtml,frame.display.lower_line);
  assert.deepEqual(s.control.lists[0].elements.map(x=>x.value),[1e13,1,-1e13]);
  assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
 });
 assert.equal(s.answer,0);
 assert.equal(lists.aggregate('lsum',[1e13,1,-1e13]),1,'pure module keeps its default arithmetic');
});
test('Independent native LIST definition NEG changes exponent sign',()=>{
 const trace=require('../reference/el506ts/experiments/list-negative-exponent-native.json');let s=c.createInitialState();
 trace.sequence.forEach((id,i)=>{s=c.reduceCalculator(s,{type:'physical-key',id});if(i===6||i===8){const view=f.renderState(s,{physical:true});assert.equal(view.expressionHtml,'');assert.match(view.resultHtml,new RegExp('<sup>'+(i===6?'-00':'-13')+'</sup>'));}});
 assert.equal(s.control.errorCode,null);assert.deepEqual(s.control.buffers.list.elements.map(x=>x.value),[1e-13]);assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
});
