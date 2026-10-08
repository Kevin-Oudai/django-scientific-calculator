const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const c=require(root+'core'),f=require(root+'formatting'),m=require(root+'matrices');
const press=(s,id)=>c.reduceCalculator(s,{type:'physical-key',id});
for(const operation of ['determinant','transpose','dimension'])test('Independent native scalar '+operation+' reports Error 1 and preserves matrix memory',()=>{
 const reference=require('../reference/el506ts/experiments/matrix-'+operation+'-scalar-type-native.json');
 let s=['EL506-K04','EL506-K35'].reduce(press,c.createInitialState());
 const memory=structuredClone(s.control.matrices);
 for(const id of reference.sequence)s=press(s,id);
 assert.equal(s.control.errorCode,1);
 assert.equal(f.renderState(s,{physical:true}).expressionHtml,'Error 1');
 assert.deepEqual(s.control.matrices,memory);
 assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
 s=press(s,'EL506-K02');assert.equal(s.control.errorCode,null);
 assert.throws(()=>m[operation](1,1,1),e=>e.code===1);
});
