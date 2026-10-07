const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../../src/scientific_calculator/static/scientific_calculator/core');
const fmt=require('../../src/scientific_calculator/static/scientific_calculator/formatting');
const reference=require('../reference/el506ts/phase-7-catalogue-reference.json');
const digits={0:45,1:40,2:41,3:42,4:35,5:36,6:37,7:30,8:31,9:32};
const press=(s,n,randomSample)=>core.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0'),...(randomSample===undefined?{}:{randomSample})});
const seq=(keys,s=core.createInitialState())=>keys.reduce((s,n)=>press(s,n),s);
const indexKeys=i=>String(i).padStart(2,'0').split('').map(d=>digits[d]);
const text=s=>fmt.renderState(s,{physical:true}).resultHtml.replace(/<[^>]*>/g,'');
for(const row of reference.constants)test('Phase 7 historical constant '+String(row.id).padStart(2,'0')+': '+row.name,()=>{
 let s=seq([30,48,2,3,41,...indexKeys(row.id)]);
 assert.equal(s.answer,7,'selection preserves ANS');assert.equal(Number(s.entry),Number(row.value));
 assert.equal(core.catalogues.constants[row.id-1].unit,row.unit);assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(s)),s);
 s=press(s,48);assert.equal(s.lifecycle,'evaluated');assert.equal(s.answer,Number(row.value));
});
// Independent endpoint checks exercise the physical numbered command, rather
// than testing convert() against its own implementation.
const endpoints=[2.54,1/2.54,.3048,1/.3048,.9144,1/.9144,1.609344,1/1.609344,1852,1/1852,4046.8564224,1/4046.8564224,28.349523125,1/28.349523125,.45359237,1/.45359237,-155/9,33.8,3.785411784,1/3.785411784,4.54609,1/4.54609,29.5735295625,1/29.5735295625,28.4130625,1/28.4130625,1/4.184,4.184,1/4.1855,4.1855,1/4.1868,4.1868,745.69987158227,1/745.69987158227,735.49875,1/735.49875,98066.5,1/98066.5,101325,1/101325,133.32236842105,1/133.32236842105,9.80665,1/9.80665];
for(let i=1;i<=44;i++)test('Phase 7 conversion '+String(i).padStart(2,'0')+': '+reference.conversions[i-1].name,()=>{
 let s=seq([40,3,42,...indexKeys(i)]);assert.equal(s.workflow.payload.id,'CONV');assert.equal(s.answer,0);
 assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(s)),s);s=press(s,48);
 assert.equal(s.lifecycle,'evaluated');assert.ok(Math.abs(s.answer-endpoints[i-1])<Math.abs(endpoints[i-1])*1e-12+1e-12,`${s.answer} != ${endpoints[i-1]}`);
 const reverse=i%2?i+1:i-1;s=seq([3,42,...indexKeys(reverse),48],s);assert.ok(Math.abs(s.answer-1)<1e-11);
});
test('Phase 7 random menu order, pages, cursor and ENT selection follow the native menu',()=>{
 let s=seq([3,30]);assert.deepEqual(s.workflow.payload.choices,['RAND','R-DICE','R-COIN','R-INT']);
 s=seq([11,10,48],s);assert.equal(s.expression,'rint()');assert.equal(s.secondActive,false);
 const saved=structuredClone(s);s=press(s,48,.999999);assert.equal(s.answer,99);assert.equal(s.control.variables.Y,.999999);assert.deepEqual(saved.expression,'rint()');
});
for(const [index,min,max,size]of [[0,0,.999,1000],[1,1,6,6],[2,0,1,2],[3,0,99,100]])test('Phase 7 random range and distribution '+index,()=>{
 let s=seq([3,30,digits[index]]);const counts=new Array(size).fill(0),samples=6000;
 for(let n=0;n<samples;n++){s=press(s,48);assert.ok(s.answer>=min&&s.answer<=max);const bin=index===0?Math.round(s.answer*1000):s.answer-min;counts[bin]++;assert.equal(Number.isInteger(bin),true);}
 assert.equal(counts.reduce((a,b)=>a+b,0),samples);assert.ok(counts.filter(n=>n>0).length>=size*.95);
 const chi=counts.reduce((a,n)=>a+(n-samples/size)**2/(samples/size),0);assert.ok(chi<size*1.5+30,'broad distribution sanity check');
 const restored=core.restoreCalculator(core.snapshotCalculator(s));assert.deepEqual(press(restored,48),press(s,48));
});
test('Phase 7 injected random samples cover endpoints, expression reuse and Y versus ANS',()=>{
 for(const [index,low,high]of [[0,0,.999],[1,1,6],[2,0,1],[3,0,99]]){
  let s=seq([3,30,digits[index]]);s=press(s,48,0);assert.equal(s.answer,low);s=press(s,48,1-Number.EPSILON);assert.equal(s.answer,high);
  const answer=s.answer;s=seq([2,27,28],s);assert.equal(s.lastValue,1-Number.EPSILON);assert.equal(s.answer,answer);
 }
 let s=seq([41,38,3,30,45]);s=press(s,48,.57446862);assert.equal(s.answer,1.148);assert.equal(s.control.variables.Y,.57446862);s=press(s,48,.017);assert.equal(s.answer,.034);
 assert.throws(()=>press(s,48,1),/random sample/);assert.throws(()=>press(s,48,NaN),/random sample/);
});
test('Phase 7 constants and conversions compose with operators, fractions and saved values',()=>{
 let s=seq([41,43,3,41,45,42,48]);assert.equal(s.answer,11.80665);
 s=seq([40,25,41,3,42,45,40,43,40,48]);assert.equal(s.answer,2.27);assert.equal(text(s),'2.27');
 s=seq([47,35,45,3,42,40,30,48]);assert.ok(Math.abs(s.answer+40)<1e-12);
 s=seq([3,41,36,41,48,3,42,35,45,48]);assert.equal(s.answer,1);
 assert.match(fmt.renderState(s,{physical:true}).expressionHtml,/cv40/);
});
test('Phase 7 catalogue selection cancellation, invalid IDs and conversion range retain stores',()=>{
 let s=seq([30,48,2,3,41,45,45]);assert.deepEqual(s.workflow.payload.path,['0']);s=press(s,40);assert.equal(Number(s.entry),299792458);
 s=seq([2,3,41,36,42]);assert.deepEqual(s.workflow.payload.path,['5']);s=press(s,41);assert.equal(Number(s.entry),101325);
 s=seq([2,40,3,42,32,32,48],s);assert.equal(s.control.errorCode,2);assert.equal(s.answer,0);
 for(const open of [[3,30],[3,41],[40,3,42]]){s=seq(open);s=press(s,2);assert.equal(s.workflow.kind,null);assert.equal(s.entry,'');}
 s=seq([32,24,32,32,3,42,45,32,48]);assert.equal(s.control.errorCode,2);
});
test('Phase 7 availability permits scalar catalogue entry in documented modes',()=>{
 for(const [mode,keys]of [['NORMAL',[]],['STAT',[4,40,45]],['EQN',[4,41,45]],['MAT',[4,35]],['LIST',[4,36]]]){
  let s=seq([...keys,3,41,45,42]);assert.equal(s.layers.mode,mode);assert.equal(Number(s.entry),9.80665);assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(s)),s);
 }
 for(const setup of [[4,40,45],[4,35],[4,36]]){let s=seq([...setup,3,30,40]);s=press(s,48,.9);assert.equal(s.answer,6);}
 for(const setup of [[4,42],[4,41,45]]){let s=seq(setup);const workflow=structuredClone(s.workflow);s=seq([3,30],s);assert.deepEqual(s.workflow,workflow);}
 let s=seq([4,42,3,41]);assert.equal(s.workflow.kind,null);
});

test('Phase 7 constant recall preserves scientific mantissa precision and native random labels',()=>{
 let s=seq([3,41,45,41]);assert.equal(text(s),'6.67408&times;10-11');
 s=seq([3,30,40]);s=press(s,48,.5);assert.equal(fmt.renderState(s,{physical:true}).expressionHtml,'R-DICE<span class="scicalc__display-operator">=</span>');
});
test('Phase 7 EQN conversion returns to the coefficient prompt without replacing ANS',()=>{
 let s=seq([4,41,45,40,3,42,45,40,48]);assert.equal(s.layers.mode,'EQN');assert.equal(s.workflow.kind,'data-entry');assert.equal(s.entry,'2.54');assert.equal(s.answer,0);
 assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(s)),s);
});

test('Phase 7 constant and conversion values survive scalar store and recall without losing precision',()=>{
 for(const [key,slot]of [[18,'A'],[19,'B'],[20,'C'],[21,'D'],[22,'E'],[23,'F'],[27,'X'],[28,'Y'],[29,'M']]){
  let s=seq([3,41,45,32,48,28,key]);assert.equal(s.lifecycle,'evaluated');assert.equal(s.answer,1.6021766208e-19);
  s=seq([2,27,key],s);assert.equal(s.lastValue,1.6021766208e-19);assert.equal(s.answer,1.6021766208e-19);
  assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(s)),s);assert.equal(s.displayExpression,slot+'=');
  s=seq([2,40,3,42,45,40,48,28,key,2,27,key],s);assert.equal(s.lastValue,2.54);
 }
});

test('Phase 7 storing an evaluated conversion or random result preserves the result and ANS',()=>{
 let s=seq([40,3,42,45,40,48,3,42,45,41,48]);assert.equal(s.answer,1);
 s=seq([28,18,2,27,18],s);assert.equal(s.lastValue,1);assert.equal(s.answer,1);
 s=seq([2,3,30,45]);s=press(s,48,.57446862);const history=structuredClone(s.history);
 s=seq([28,18],s);assert.equal(s.answer,.574);assert.equal(s.control.variables.A,.574);assert.equal(s.control.variables.Y,.57446862);assert.deepEqual(s.history,history);
});
