const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const c=require(root+'core'),f=require(root+'formatting');
const reference=require('../reference/el506ts/experiments/matrix-scientific-entry-native.json');
test('Independent native MAT definition Exp stores scientific cell',()=>{
 let s=c.createInitialState();
 reference.sequence.forEach((id,i)=>{
  s=c.reduceCalculator(s,{type:'physical-key',id});
  if(i===6||i===8||i===14){const view=f.renderState(s,{physical:true});assert.equal(view.expressionHtml,'');assert.match(view.resultHtml,new RegExp('<sup>'+(i===6?'00':i===14?'-13':'13')+'</sup>'));}
 });
 assert.equal(s.control.errorCode,null);assert.deepEqual(s.control.buffers.matrix.elements.map(x=>x.value),[1e-13]);
 assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
});
