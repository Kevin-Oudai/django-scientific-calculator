const test=require('node:test'),assert=require('node:assert/strict');
const c=require('../../src/scientific_calculator/static/scientific_calculator/core');
const press=(s,n)=>c.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});
const seq=(keys,s=c.createInitialState())=>keys.reduce(press,s);
for(const [digit,key] of [[0,45],[1,40],[2,41],[3,42],[4,35],[5,36],[6,37],[7,30],[8,31],[9,32]])test('Printed decimal digit '+digit+' enters and evaluates its positional value',()=>{
 const s=seq([key,48]);assert.equal(s.answer,digit);
 assert.equal(s.control.errorCode,null);assert.equal(s.lifecycle,'evaluated');
});
// Independent expected values follow the printed A..F/X/Y/M legends and
// operation-guide variable substitution, rather than reducer output.
for(const [symbol,key] of Object.entries({A:18,B:19,C:20,D:21,E:22,F:23,X:27,Y:28,M:29}))test('Printed ALPHA variable '+symbol+' substitutes stored7 in arithmetic and consumes modifier',()=>{
 let s=seq([30,28,key,2,5,key,43,40,48]);
 assert.equal(s.control.errorCode,null);assert.equal(s.answer,8);
 assert.equal(s.layers.alpha,false);assert.equal(s.secondActive,false);
 assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
});
test('Printed ALPHA ENT substitutes retained ANS7 in arithmetic',()=>{
 const s=seq([30,48,2,5,48,43,40,48]);assert.equal(s.answer,8);
 assert.equal(s.control.errorCode,null);assert.equal(s.layers.alpha,false);
});
for(const [digit,key,expected] of [['B',19,11],['C',20,12],['D',21,13],['E',22,14]])test('Printed HEX digit '+digit+' uses positional value '+expected+' without ALPHA',()=>{
 let s=seq([3,38,2,key,48]);assert.equal(s.control.nbase.radix,16);
 assert.equal(s.answer,expected);assert.equal(s.control.errorCode,null);
 s=seq([3,48],s);assert.equal(s.displayResult,String(expected));
 assert.equal(s.control.nbase.radix,10);
});
