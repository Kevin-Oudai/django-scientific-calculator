const test=require('node:test'),assert=require('node:assert/strict'),root='../../src/scientific_calculator/static/scientific_calculator/';
const c=require(root+'core.js'),m=require(root+'matrices.js'),f=require(root+'formatting.js');
const press=(s,n)=>c.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});
const seq=(keys,s=c.createInitialState())=>keys.reduce(press,s);
const entry=()=>seq([4,35,11,41,29,41,29,40,29,41,29,42,29,35,29,2,17,41,45]);
const recall=s=>seq([17,45,45],s);
test('MAT dimensions row-major entry slots CHK correction and snapshot retain the edit buffer',()=>{
 let s=entry();assert.equal(s.control.matrices[0].rows,2);assert.deepEqual(s.control.matrices[0].elements.map(x=>x.value),[1,2,3,4]);
 s=seq([17,40,45],s);assert.equal(s.workflow.kind,null);s=seq([11],s);assert.equal(s.workflow.payload.label,'ROW=');s=seq([11,11,32,29,2,17,41,40],s);assert.equal(s.control.matrices[1].elements[0].value,9);assert.equal(s.control.matrices[0].elements[0].value,1);
 assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
});
test('MAT physical multiplication square cube inverse and result dimensions page through cells',()=>{
 const a=entry();for(const [keys,expected]of [[[20],[7,10,15,22]],[[21],[37,54,81,118]],[[3,18],[-2,1,1.5,-.5]]]){
  const s=seq([...keys,48],recall(a));assert.equal(s.workflow.payload.id,'MAT_BUFFER');assert.equal(s.workflow.payload.label,'ROW=');for(let i=0;i<4;i++)assert.ok(Math.abs(s.workflow.payload.matrix.data[i]-expected[i])<1e-12);
 }
 let s=seq([38,17,45,45,48],recall(a));assert.deepEqual(s.workflow.payload.matrix.data,[7,10,15,22]);s=seq([11,11],s);assert.equal(s.workflow.payload.label,'MAT1,1=');assert.equal(f.renderState(s,{physical:true}).resultHtml,'7.');
});
test('MAT physical OPE and MATH determinant transpose identity fill resize and list transitions',()=>{
 let s=seq([17,35,45,17,45,45,48],entry());assert.equal(s.lastValue,-2);
 s=seq([17,35,40,17,45,45,48],entry());assert.deepEqual(s.workflow.payload.matrix.data,[1,3,2,4]);
 s=seq([17,42,35,41,48],entry());assert.deepEqual(s.workflow.payload.matrix.data,[1,0,0,1]);
 s=seq([17,37],entry());assert.equal(s.layers.mode,'LIST');assert.deepEqual(s.control.lists[0].elements.map(x=>x.value),[1,3]);assert.deepEqual(s.control.lists[1].elements.map(x=>x.value),[2,4]);
});
test('MAT algorithms enforce dimension range singularity and division rules',()=>{
 const a=m.matrix(2,2,[1,2,3,4]),b=m.identity(2);assert.deepEqual(m.add(a,b).data,[2,2,3,5]);assert.deepEqual(m.add(a,b,-1).data,[0,2,3,3]);assert.deepEqual(m.scale(a,2).data,[2,4,6,8]);assert.equal(m.determinant(a),-2);
 assert.deepEqual(m.dimension(a,3,2).data,[1,2,3,4,0,0]);assert.deepEqual(m.cumulative(a).data,[1,2,4,6]);assert.deepEqual(m.augment(m.matrix(2,1,[1,2]),m.matrix(2,1,[3,4])).data,[1,3,2,4]);
 assert.throws(()=>m.multiply(a,m.matrix(1,2,[1,2])),e=>e.code===8);assert.throws(()=>m.inverse(m.fill(1,2,2)),e=>e.code===2);assert.throws(()=>m.identity(5),e=>e.code===9);assert.throws(()=>m.matrix(0,2,[]),e=>e.code===7);
});

test('MAT physical multi-argument operations use canonical comma entry and bounded allocation',()=>{
 const comma=[3,28],a=entry();
 assert.deepEqual(seq([17,42,41,17,45,45,48],a).workflow.payload.matrix.data,[1,2,4,6]);
 let s=seq([17,42,40,36,...comma,41,...comma,41,48],a);assert.deepEqual(s.workflow.payload.matrix.data,[5,5,5,5]);
 s=seq([17,42,45,17,45,45,...comma,42,...comma,41,48],a);assert.deepEqual(s.workflow.payload.matrix.data,[1,2,3,4,0,0]);
 s=seq([17,42,42,17,45,45,...comma,17,45,45,48],a);assert.deepEqual(s.workflow.payload.matrix.data,[1,2,1,2,3,4,3,4]);
 s=seq([17,42,36,41,...comma,42],a);s=c.reduceCalculator(s,{type:'physical-key',id:'EL506-K48',randomSample:.25});assert.deepEqual(s.workflow.payload.matrix.data,[.25,.25,.25,.25,.25,.25]);
 assert.throws(()=>m.fill(1,1e9,1e9),e=>e.code===9);assert.throws(()=>m.dimension(m.identity(1),1e9,1e9),e=>e.code===9);
});
test('MAT scalar results preserve edit buffers and unavailable ANS leaves slots intact',()=>{
 let s=entry();const slot=structuredClone(s.control.matrices[0]);
 s=seq([17,35,45,17,45,45,48],s);assert.equal(s.lastValue,-2);assert.deepEqual(s.control.buffers.matrix,slot);
 s=seq([2,3,48],s);assert.equal(s.expression,'');assert.equal(s.secondActive,false);assert.deepEqual(s.control.matrices[0],slot);
 assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)).control.matrices[0],slot);
 s=seq([4,35],s);assert.deepEqual(s.control.matrices,[null,null,null,null]);assert.equal(s.control.buffers.matrix,null);
});
test('MAT guide transition matrix reproduces all four independently observed result pages',()=>{
 const fixture=require('../reference/el506ts/guide-examples').fixtures.find(x=>x.id==='guide-p43-matrix');
 let s=fixture.sequence.reduce((state,id)=>c.reduceCalculator(state,{type:'physical-key',id}),c.createInitialState());
 for(const [index,expected]of ['0.83','0.34','0.17','0.66'].entries()){
  s=press(s,11);assert.equal(s.workflow.payload.label,'MAT'+(Math.floor(index/2)+1)+','+(index%2+1)+'=');assert.equal(f.renderState(s,{physical:true}).resultHtml,expected);
 }
});
