const test=require('node:test'),assert=require('node:assert/strict');
const c=require('../../src/scientific_calculator/static/scientific_calculator/core');
const press=(s,n)=>c.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});
const seq=(s,keys)=>keys.reduce(press,s);
// Independent oracle: full English manual p2 errors, specifications, STAT data,
// Matrix/List definitions; p1 formula/playback memory paragraphs. Native adjacent
// Error3/4/6 and Matrix/List boundaries are separately captured in experiments.
for(const [mode,key,maximum]of [['NORMAL',45,10],['CPLX',42,5],['MAT',35,5],['LIST',36,5]])for(const count of [maximum,maximum+1])test('Manual pending numeric capacity '+mode+' / '+count,()=>{
 let s=seq(c.createInitialState(),[4,key]);for(let i=0;i<count;i++)s=seq(s,[40,43,33]);s=press(s,40);const before=structuredClone(s);s=press(s,48);
 assert.equal(s.control.errorCode,count>maximum?3:null);if(count>maximum){assert.equal(s.expression,before.expression);assert.equal(s.entry,before.entry);assert.equal(s.answer,before.answer);assert.deepEqual(s.control.buffers,before.control.buffers);}else assert.equal(s.answer,count+1);
});
for(const [mode,key]of [['CPLX',42],['MAT',35],['LIST',36]])for(const count of [24,25])test('Manual pending calculation capacity '+mode+' / '+count,()=>{
 let s=seq(c.createInitialState(),[4,key]);for(let i=0;i<count;i++)s=press(s,33);s=seq(s,[40,48]);assert.equal(s.control.errorCode,count>24?3:null);if(count===24)assert.equal(s.answer,1);
});
for(const [mode,key]of [['NORMAL',45],['CPLX',42],['MAT',35],['LIST',36]])for(const count of [70,71])test('Manual equation length including ENT '+mode+' / '+count,()=>{
 let s=seq(c.createInitialState(),[4,key]);for(let i=0;i<count;i++)s=seq(s,[40,43]);s=seq(s,[40,48]);assert.equal(s.control.errorCode,count===71?4:null);
});
for(const [mode,key]of [['MAT',35],['LIST',36]])for(const count of [1,2])test('Manual definition input single pending-value slot '+mode+' / '+count,()=>{
 let s=seq(c.createInitialState(),[4,key,11]);for(let i=0;i<count;i++)s=seq(s,[40,43,33]);s=press(s,40);const before=structuredClone(s);s=press(s,29);
 assert.equal(s.control.errorCode,count>1?3:null);if(count>1){assert.deepEqual(s.control.buffers,before.control.buffers);assert.equal(s.workflow.kind,null);assert.deepEqual(s.layers.intent.workflow,before.workflow);assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);}
});

test('Native MAT six-value overflow selects the sixth plus with either arrow',()=>{
 const r=require('../reference/el506ts/experiments/matrix-pending-values-native.json');let s=seq(c.createInitialState(),[4,35]);
 for(let step=1;step<=r.sequence.length;step++){
  s=c.reduceCalculator(s,{type:'physical-key',id:r.sequence[step-1]});
  if([20,22].includes(step))assert.equal(s.control.errorCode,3);
  if([21,23].includes(step)){assert.equal(s.expression,'1+('.repeat(6)+'1');assert.equal(s.cursor,16);assert.equal(s.expression[s.cursor],'+');assert.equal(s.displayResult,'');assert.equal(s.control.errorCode,null);}
 }
 assert.equal(s.layers.mode,'MAT');assert.equal(s.expression,'');assert.equal(s.control.errorCode,null);
});

for(const count of [5,6])test('Manual STAT DAT pending-value limit / '+count,()=>{
 let s=seq(c.createInitialState(),[4,40,45]);for(let i=0;i<count;i++)s=seq(s,[40,43,33]);s=seq(s,[40,29]);assert.equal(s.control.errorCode,count===6?3:null);assert.equal(s.values.statistics.rows.length,count===6?0:1);
});
test('Manual formula capacity accepts exactly256 device characters and rejects the next atom atomically',()=>{
 let s=c.createInitialState();s.control.formulas[0]=c.semanticEditor.tokenize('1+'.repeat(64),{physical:true});s.control.formulas[1]=c.semanticEditor.tokenize('1+'.repeat(63)+'1',{physical:true});s=c.restoreCalculator(c.snapshotCalculator(s));
 s=seq(s,[40,28,11]);assert.equal(s.control.errorCode,null);assert.equal(c.semanticEditor.serialize(s.control.formulas[3]),'1');
 s=seq(s,[2,40,28,10]);assert.equal(s.control.errorCode,6);assert.deepEqual(s.control.formulas[2],[]);assert.equal(c.semanticEditor.serialize(s.control.formulas[3]),'1');
});

test('Manual playback uses142 shared characters rather than an arbitrary record count',()=>{
 let s=c.createInitialState();for(let i=0;i<71;i++)s=seq(s,[2,40,48]);
 assert.equal(s.history.length,71);assert.equal(s.values.history.length,71);
 assert.ok(s.history.every(h=>h.expression==='1='&&h.value===1));
 s=seq(s,[2,41,48]);assert.equal(s.history.length,71);assert.equal(s.history.at(-1).expression,'2=');assert.equal(s.values.history.at(-1).value,2);
 assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
});
test('Manual playback evicts complete oldest equations and keeps typed results aligned',()=>{
 let s=seq(c.createInitialState(),[40,43,40,48]);for(let i=0;i<69;i++)s=seq(s,[2,40,48]);
 assert.equal(s.history.length,70);assert.equal(s.history[0].expression,'1+1=');
 s=seq(s,[2,42,48]);assert.equal(s.history.length,70);assert.equal(s.history[0].expression,'1=');assert.equal(s.history.at(-1).expression,'3=');
 assert.equal(s.values.history.length,70);assert.equal(s.values.history[0].value,1);assert.equal(s.values.history.at(-1).value,3);
});
for(const submit of [8,11,48])for(const count of [5,6])test('Manual EQN pending-value limit through physical submission '+submit+' / '+count,()=>{
 let s=seq(c.createInitialState(),[4,41,45]);for(let i=0;i<count;i++)s=seq(s,[40,43,33]);s=press(s,40);const before=structuredClone(s);s=press(s,submit);
 assert.equal(s.control.errorCode,count===6?3:null);assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
 if(count===6){assert.deepEqual(s.layers.intent.workflow,before.workflow);s=press(s,2);assert.equal(s.workflow.kind,'data-entry');assert.equal(s.workflow.payload.input,'');assert.deepEqual(s.workflow.payload.coefficients,before.workflow.payload.coefficients);}
 else assert.equal(s.workflow.payload.coefficients[0],6);
});
