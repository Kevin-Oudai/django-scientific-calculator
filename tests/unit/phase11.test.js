const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const c=require(root+'core.js'),f=require(root+'formatting.js');
const press=(s,n)=>c.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});
const seq=(keys,s=c.createInitialState())=>keys.reduce(press,s);
const mode=(n=0)=>seq([4,40,[45,40,41,42,35,36,37][n]]);
const rows=s=>s.values.statistics.rows;
const view=s=>f.renderState(s,{physical:true});
test('Statistics seven native submodes and indicators exclude three-variable STAT',()=>{
 for(const [i,name] of ['SD','LINE','QUAD','EXP','LOG','PWR','INV'].entries()){
  const s=mode(i);assert.equal(s.control.submode,name);assert.equal(view(s).indicators.STAT,true);assert.equal(view(s).expressionHtml,'Stat '+i);
 }
 const m=seq([4,40]);assert.deepEqual(m.workflow.payload.choices,['SD','LINE','QUAD','EXP','LOG','PWR','INV']);
 assert.ok(!m.workflow.payload.choices.includes('3-VLE'));
});
test('Statistics DATA stores independent observations and explicit signed weights',()=>{
 let s=seq([40,29,41,3,28,42,29,42,3,28,41,47,29],mode());
 assert.deepEqual(rows(s).map(r=>[r.x.value,r.y,r.weight]),[[1,null,1],[2,null,3],[3,null,-2]]);
 assert.deepEqual(s.control.statistics.frequencies,[false,true,true]);assert.equal(view(s).expressionHtml,'DATA SET=');assert.equal(view(s).resultHtml,'3.');assert.equal(s.answer,0);
 s=seq([2,35,3,28,45,29],s);assert.equal(rows(s).length,3);
});
test('Statistics paired separators store X Y and optional frequency in every regression submode',()=>{
 for(let n=1;n<7;n++){
  let s=seq([41,3,28,35,29,42,3,28,37,3,28,36,29],mode(n));
  assert.deepEqual(rows(s).map(r=>[r.x.value,r.y.value,r.weight]),[[2,4,1],[3,6,5]]);assert.deepEqual(s.control.statistics.frequencies,[false,true]);c.snapshotCalculator(s);
 }
});
test('Statistics oldest DOWN newest UP browse values frequencies and indexed hidden data',()=>{
 const data=seq([40,29,41,29],mode());let s=seq([11],data);assert.equal(s.displayExpression,'X1=');assert.equal(view(s).previousPage,false);assert.equal(view(s).nextPage,true);
 s=seq([11,11],s);assert.equal(s.displayExpression,'X2=');s=press(s,11);assert.equal(s.displayExpression,'N2=');assert.equal(view(s).nextPage,false);assert.equal(press(s,11).displayExpression,'N2=');
 s=press(data,8);assert.equal(s.displayExpression,'N2=');s=press(s,8);assert.equal(s.displayExpression,'X2=');
 const pair=seq([41,3,28,35,29,11,11],mode(1));assert.equal(pair.displayExpression,'Y1=');assert.equal(view(pair).previousPage,true);assert.equal(view(pair).nextPage,true);
});
test('Statistics single-field correction requires DATA and ENT only evaluates',()=>{
 let s=seq([40,29,11,11,41,48],mode());assert.equal(rows(s)[0].weight,1);assert.equal(s.answer,2);
 s=press(s,29);assert.equal(rows(s)[0].weight,2);assert.equal(s.displayExpression,'N1=');assert.equal(s.answer,2);
 s=seq([8,32,29],s);assert.equal(rows(s)[0].x.value,9);assert.equal(rows(s)[0].weight,2);assert.equal(s.displayExpression,'X1=');
});
test('Statistics whole-record correction from any field keeps selected field and replaces record',()=>{
 let s=seq([41,3,28,35,29,11,11,45,3,28,36,29],mode(1));
 assert.deepEqual(rows(s).map(r=>[r.x.value,r.y.value,r.weight]),[[0,5,1]]);assert.equal(s.displayExpression,'Y1=');
 s=seq([40,3,28,42,3,28,35,29],s);assert.deepEqual(rows(s).map(r=>[r.x.value,r.y.value,r.weight]),[[1,3,4]]);
});
test('Statistics zero correction and shifted CD delete complete records and renumber',()=>{
 let s=seq([40,29,41,29,42,29,11,11,11,3,29],mode());assert.deepEqual(s.statsValues,[1,3]);assert.equal(s.displayExpression,'DATA SET=');
 s=seq([8,45,29],s);assert.deepEqual(s.statsValues,[1]);s=seq([2,35,29,11,11,11],s);assert.equal(s.displayExpression,'X2=');assert.equal(s.displayResult,'4');
});
test('Statistics ON/C power snapshot keep records while CA mode HOME and RESET erase them',()=>{
 const data=seq([41,3,28,42,29,11,35],mode());
 for(const keys of [[2],[3,2,2]]){const s=seq(keys,data);assert.equal(rows(s).length,1);assert.equal(s.control.statistics.cursor,null);assert.deepEqual(s.control.statistics.parts,[]);}
 for(const keys of [[3,4],[1],[4,40,45]])assert.equal(rows(seq(keys,data)).length,0);
 assert.equal(rows(c.reduceCalculator(data,{type:'reset'})).length,0);
 const restored=c.restoreCalculator(c.snapshotCalculator(data));assert.deepEqual(restored,data);assert.deepEqual(press(restored,29),press(data,29));assert.equal(rows(mode()).length,0);
});
test('Statistics partial and excess separators give Error 1 without dataset mutations',()=>{
 let s=seq([41,29],mode(1));assert.equal(s.control.errorCode,1);assert.equal(rows(s).length,0);assert.equal(view(s).expressionHtml,'Error 1');assert.equal(view(s).resultHtml,'');
 s=seq([2,40,3,28,41,3,28],mode());assert.equal(s.control.errorCode,1);assert.equal(rows(s).length,0);
 s=seq([2,40,43,29],s);assert.equal(s.control.errorCode,1);s=seq([2,41,29],s);assert.equal(rows(s).length,1);
});
test('Statistics capacity counts explicit frequencies and paired coordinates atomically',()=>{
 for(const [paired,weighted,maximum] of [[false,false,100],[false,true,50],[true,false,50],[true,true,33]]){
  let s=mode(paired?1:0);const keys=[40,...(paired?[3,28,41]:[]),...(weighted?[3,28,42]:[]),29];
  for(let i=0;i<maximum;i++)s=seq(keys,s);
  assert.equal(rows(s).length,maximum);const before=structuredClone(rows(s));s=seq(keys,s);assert.equal(s.control.errorCode,3);assert.deepEqual(rows(s),before);c.snapshotCalculator(s);
  s=seq([2,11,3,29,...keys],s);assert.equal(s.control.errorCode,null);assert.equal(rows(s).length,maximum);
 }
});
test('Statistics frequency expansion at capacity fails without changing record',()=>{
 let s=mode();for(let i=0;i<100;i++)s=seq([40,29],s);s=seq([11,11,41,29],s);assert.equal(s.control.errorCode,3);assert.equal(rows(s)[0].weight,1);assert.equal(s.control.statistics.frequencies[0],false);
});
test('Statistics supports numeric expressions fractions exponent range and correction editing',()=>{
 let s=seq([40,43,41,29,40,25,41,29,41,3,28,40,46,36,29],mode());assert.deepEqual(rows(s).map(r=>[r.x.value,r.weight]),[[3,1],[.5,1],[2,1.5]]);
 s=seq([40,24,32,32,29],s);assert.equal(rows(s).at(-1).x.value,1e99);s=seq([2,32,24,32,32,38,32,29],s);assert.equal(s.control.errorCode,2);assert.equal(rows(s).length,4);
 s=seq([2,11,36,7,37,29],s);assert.equal(rows(s)[0].x.value,6);
});
test('Statistics schema 11 validates metadata and migrates schema 10 without inventing observations',()=>{
 const saved=c.snapshotCalculator(seq([41,3,28,42,29,11],mode()));assert.equal(saved.schemaVersion,11);
 for(const mutate of [p=>p.cursor=99,p=>p.parts=['1','2','3'],p=>p.parts=[null],p=>p.frequencies=[],p=>p.editing='yes']){const bad=structuredClone(saved);mutate(bad.state.control.statistics);assert.throws(()=>c.restoreCalculator(bad));}
 const old=c.snapshotCalculator(seq([40,29],mode()));old.schemaVersion=10;delete old.state.control.statistics;assert.deepEqual(c.restoreCalculator(old).control.statistics,{parts:[],cursor:null,editing:false,frequencies:[false]});
});
test('Statistics entry keeps NORMAL-only calculus and simulation unavailable',()=>{
 const s=seq([41,16,3,16,3,17],mode());assert.equal(s.workflow.kind,null);assert.equal(s.entry,'2');assert.equal(s.control.statistics.parts.length,0);
});
test('Legacy enhanced data stores keep their existing capacity outside physical STAT',()=>{
 let s=c.createInitialState();s.statsValues=Array(101).fill(1);s.values.statistics.rows=s.statsValues.map(x=>({x:c.valueTypes.scalar(x),y:null,weight:1}));s.control.statistics.frequencies=Array(101).fill(false);assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
});
