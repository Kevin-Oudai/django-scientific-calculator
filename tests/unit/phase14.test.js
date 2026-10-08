const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/',c=require(root+'core.js'),f=require(root+'formatting.js'),z=require(root+'complex.js');
const press=(s,n)=>c.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});
const seq=(keys,s=c.createInitialState())=>keys.reduce(press,s),entry=()=>seq([4,42,42,43,35,25,48]);
test('CPLX rectangular entry pages components and carries a tagged ANS through arithmetic',()=>{
 let s=entry();assert.equal(s.values.answer.kind,'complex');assert.equal(f.renderState(s,{physical:true}).resultHtml,'3.');
 s=seq([3,24],s);assert.equal(f.renderState(s,{physical:true}).resultHtml,'4. <i>i</i>');assert.equal(f.renderState(s,{physical:true}).indicators.i,true);
 s=seq([38,41,48],s);assert.equal(s.values.last.real.value,6);assert.equal(s.values.last.imaginary.value,8);assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
});
test('CPLX polar conversion respects DEG RAD GRAD and rectangular return',()=>{
 let s=seq([3,31],entry());assert.equal(f.renderState(s,{physical:true}).resultHtml,'5.');s=seq([3,24],s);assert.equal(f.renderState(s,{physical:true}).resultHtml,'53.13010235');
 s=seq([6,45,40],s);assert.ok(f.renderState(s,{physical:true}).resultHtml.startsWith('0.927295'));s=seq([3,32],s);assert.equal(f.renderState(s,{physical:true}).resultHtml,'3.');
});
test('CPLX menu exposes CONJ and conjugation division powers and singular errors',()=>{
 let s=press(entry(),17);assert.deepEqual(s.workflow.payload.choices,['CONJ']);s=seq([45,48],s);assert.equal(s.values.last.imaginary.value,-4);
 assert.deepEqual(z.multiply(z.z(3,4),z.z(3,-4)),z.z(25));assert.deepEqual(z.divide(z.z(3,4),z.z(3,4)),z.z(1));assert.deepEqual(z.power(z.z(0,1),z.z(4)),z.z(1));assert.throws(()=>z.divide(z.z(1),z.z(0)),RangeError);
 s=seq([39,45,48],entry());assert.equal(s.control.errorCode,2);s=press(s,2);assert.equal(s.control.errorCode,null);
});
test('CPLX independent memory stores both components and mode exit clears imaginary memory',()=>{
 let s=seq([28,29],entry());assert.equal(s.values.memory.kind,'complex');assert.equal(s.values.memory.imaginary.value,4);s=press(s,1);assert.equal(s.values.memory.imaginary.value,0);
});

test('CPLX native polar separator pure-imaginary paging and unsupported general powers',()=>{
 let s=seq([4,42,36,26,32,45,48]);assert.equal(s.control.errorCode,null);assert.equal(s.values.last.imaginary.value,5);assert.equal(f.renderState(s,{physical:true}).resultHtml,'5. <i>i</i>');assert.equal(f.renderState(s,{physical:true}).expressionHtml.replace(/<[^>]+>/g,''),'5\u222090=');
 s=seq([19,41,48],s);assert.equal(s.control.errorCode,2);
 s=seq([2,25,20,48],s);assert.equal(s.values.last.value,-1);
 s=seq([2,41,19,42,48],s);assert.equal(s.values.last.value,8);
 s=seq([2,42,43,35,25,29],s);assert.equal(s.values.memory.imaginary.value,4);
});

test('CPLX unevaluated STO and RCL operands retain imaginary memory',()=>{
 let s=seq([4,42,42,43,35,25,28,29]);assert.equal(s.control.errorCode,null);assert.equal(s.values.memory.imaginary.value,4);
 s=seq([2,40,43,27,29,48],s);assert.equal(s.control.errorCode,null);assert.equal(s.values.last.real.value,4);assert.equal(s.values.last.imaginary.value,4);
});
