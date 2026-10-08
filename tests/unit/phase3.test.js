const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../../src/scientific_calculator/static/scientific_calculator/core.js');
const fmt=require('../../src/scientific_calculator/static/scientific_calculator/formatting.js');
const press=(s,n)=>core.reduceCalculator(s,{type:'physical-key',id:`EL506-K${String(n).padStart(2,'0')}`});
const sequence=(numbers,s=core.createInitialState())=>numbers.reduce(press,s);
function stores(){const s=sequence([41,43,42,48]);s.memoryValue=7;s.values.memory=core.valueTypes.scalar(7);s.statsValues=[2];s.control.statistics.frequencies=[false];s.values.statistics.rows=[{x:core.valueTypes.scalar(2),y:null,weight:1}];s.control.variables.A=8;s.control.formulas[0]=core.semanticEditor.tokenize('2+3',{physical:true});s.control.matrices[0]={kind:'matrix',rows:1,columns:1,elements:[core.valueTypes.scalar(1)]};return s;}
test('OFF blanks all display state, ignores other keys and ON/C wakes with retained values',()=>{
  const s=stores(),off=sequence([3,2],s),view=fmt.renderState(off,{physical:true});
  assert.equal(off.control.power,'off');assert.equal(view.resultHtml,'');assert.ok(Object.values(view.indicators).every(v=>!v));assert.deepEqual(press(off,40),off);
  const awake=press(off,2);assert.equal(awake.control.power,'on');assert.equal(awake.memoryValue,7);assert.equal(awake.answer,5);assert.equal(awake.control.variables.A,8);assert.deepEqual(awake.statsValues,[2]);
});
test('idle uses deterministic elapsed time and activity resets the ten-minute interval',()=>{
  const s=stores();let next=core.reduceCalculator(s,{type:'idle',elapsedMs:599999});assert.equal(next.control.power,'on');next=press(next,40);assert.equal(next.control.idleMs,0);
  next=core.reduceCalculator(next,{type:'idle',elapsedMs:600000});assert.equal(next.control.power,'off');assert.equal(press(next,2).answer,5);assert.throws(()=>core.reduceCalculator(s,{type:'idle',elapsedMs:-1}),TypeError);
});
test('ON/C preserves all stores while CA preserves only M and formulas',()=>{
  const s=stores();assert.equal(press(s,2).answer,5);assert.equal(press(s,2).statsValues.length,1);
  const clear=sequence([3,4],s);assert.equal(clear.answer,0);assert.equal(clear.memoryValue,7);assert.equal(clear.statsValues.length,0);assert.equal(clear.control.variables.A,0);assert.equal(clear.control.matrices[0],null);assert.equal(core.semanticEditor.serialize(clear.control.formulas[0]),'2+3');assert.equal(clear.history.length,0);
});
test('HOME in NORMAL retains ANS, HOME from another mode follows mode clearing',()=>{
  const s=stores();assert.equal(press(s,1).answer,5);s.layers.mode='STAT';assert.equal(press(s,1).answer,0);assert.equal(press(s,1).layers.mode,'NORMAL');assert.equal(press(s,1).memoryValue,7);
});
test('all six MODE choices select correctly and both submenus remain uncommitted until confirmed',()=>{
  const digit=[45,40,41,42,35,36];const names=['NORMAL','STAT','EQN','CPLX','MAT','LIST'];
  for(let index=0;index<6;index++){
    let s=sequence([4,digit[index]],stores());if(index===1||index===2){assert.equal(s.workflow.payload.id,names[index]);assert.equal(s.answer,5);s=press(s,45);}
    assert.equal(s.layers.mode,names[index]);assert.equal(s.answer,0);assert.equal(s.memoryValue,7);
  }
  for(let i=0;i<7;i++){const s=sequence([4,40,digit[i]||37]);assert.equal(s.control.submode,['SD','LINE','QUAD','EXP','LOG','PWR','INV'][i]);}
});
test('menu arrows, numeric shortcuts, invalid choices and cancellation',()=>{
  let s=sequence([4,10,48]);assert.equal(s.workflow.payload.id,'STAT');s=sequence([11,11,48],s);assert.equal(s.control.submode,'INV');
  s=sequence([4,32],stores());assert.equal(s.workflow.payload.id,'MODE');assert.equal(s.answer,5);assert.equal(press(s,2).answer,5);
});
test('M-CLR confirms with zero or ENT and reset restores settings and every store',()=>{
  const s=stores();s.layers.settings.insert=false;s.layers.settings.angle='RAD';s.angleMode='RAD';
  const pending=sequence([3,47,40],s);assert.equal(pending.workflow.payload.label,'RESET?');assert.equal(press(pending,2).memoryValue,7);
  assert.deepEqual(press(pending,48),core.createInitialState());assert.deepEqual(core.reduceCalculator(s,{type:'reset'}),core.createInitialState());
  const clear=sequence([3,47,45,45],s);assert.equal(clear.memoryValue,0);assert.deepEqual(clear.control.formulas[0],[]);assert.equal(clear.layers.settings.angle,'RAD');assert.equal(clear.layers.settings.insert,false);
});
test('modifier consumption, inverse HYP ordering and INS survive clear and mode changes',()=>{
  const s=sequence([12,3]);assert.equal(core.resolvePhysicalKey(s,'EL506-K13').name,'asinh');assert.equal(press(s,2).layers.hyp,false);
  let ins=sequence([40,43,9,3,7]);assert.equal(ins.layers.settings.insert,false);ins=press(ins,2);assert.equal(ins.layers.settings.insert,false);ins=sequence([4,42],ins);assert.equal(ins.layers.settings.insert,false);assert.equal(core.reduceCalculator(ins,{type:'reset'}).layers.settings.insert,undefined);
});
test('cursor discards unfinished lower-line entry and deletes selected digits',()=>{
  let s=sequence([40,41,42,43,35,36,9]);assert.equal(s.expression,'123+');assert.equal(s.entry,'');assert.equal(s.cursor,3);assert.equal(s.displayResult,'');
  s=sequence([9,7,40],s);assert.equal(s.expression,'121+');assert.equal(s.cursor,3);s=sequence([10,41,48],s);assert.equal(s.answer,123);
});
test('functions move and delete atomically; overwrite replaces a whole function cell',()=>{
  let s=sequence([13,40,34,43,9,9,9,9]);assert.equal(s.cursor,0);s=press(s,7);assert.equal(s.expression,'1)+');
  s=sequence([13,40,34,43,10,3,7,41]);assert.equal(s.expression,'21)+');assert.equal(s.cursor,1);
});
test('end-of-equation DEL backspaces and boundaries remain stable',()=>{
  let s=sequence([40,43,41,48,9]);assert.equal(s.cursor,3);s=press(s,7);assert.equal(s.expression,'1+');s=sequence([10,10],s);assert.equal(s.cursor,2);s=sequence([9,9,9],s);assert.equal(s.cursor,0);
});
test('recalled expressions edit and reevaluate independently of prior answers',()=>{
  let s=sequence([40,43,41,48,9,42,48]);assert.equal(s.answer,24);assert.equal(s.history.at(-1).expression,'1+23=');
});
test('playback retains ordering, oldest shortcut, boundaries and discards temporary drafts',()=>{
  let s=sequence([40,43,41,48,42,43,35,48,2,32,8]);assert.equal(s.expression,'3+4');s=press(s,8);assert.equal(s.expression,'1+2');assert.equal(press(s,8).expression,'1+2');s=sequence([11,11],s);assert.equal(s.expression,'3+4');assert.equal(s.entry,'');assert.equal(sequence([3,8],s).expression,'1+2');
});
test('history budget is 142 device characters, not an arbitrary equation count',()=>{
  let s=core.createInitialState();for(let i=0;i<80;i++)s=sequence([40,48],s);assert.equal(s.history.length,71);assert.equal(s.values.history.length,71);
});
test('digit entry stops at ten mantissa digits and exponent entry rolls through two digits',()=>{
  let s=core.createInitialState();for(let i=0;i<12;i++)s=press(s,40);assert.equal(s.entry,'1111111111');s=sequence([2,40,24,41,42,35],s);assert.equal(s.stagedEntry.exponent,'34');
});
test('physical full equation buffer and depth errors preserve the previous input for recovery',()=>{
  let s=core.createInitialState();for(let i=0;i<24;i++)s=press(s,13);s=sequence([40,48],s);assert.equal(s.control.errorCode,null);
  s=core.createInitialState();for(let i=0;i<25;i++)s=press(s,13);s=press(s,40);assert.equal(s.control.errorCode,null);assert.equal(press(s,48).control.errorCode,3);
  s=core.createInitialState();for(let i=0;i<71;i++)s=sequence([40,43],s);assert.equal(s.expression.length,142);const full=press(s,48);assert.equal(full.control.errorCode,4);assert.equal(full.expression,s.expression);assert.equal(press(full,2).lifecycle,'empty');
});
test('post-result digits start fresh, arithmetic continues from ANS, modifier preserves the result',()=>{
  const s=sequence([41,43,42,48]);assert.equal(press(s,40).entry,'1');assert.equal(sequence([43,41,48],s).answer,7);assert.equal(press(s,3).answer,5);
});
test('control snapshots migrate schema 5 and reject malformed power/storage state atomically',()=>{
  const snap=core.snapshotCalculator(stores());assert.equal(snap.schemaVersion,12);const old=structuredClone(snap);old.schemaVersion=5;delete old.state.control;assert.equal(core.restoreCalculator(old).control.power,'on');
  const bad=structuredClone(snap);bad.state.control.power='awake';assert.throws(()=>core.restoreCalculator(bad),TypeError);assert.equal(snap.state.control.power,'on');
});

test('mixed pending operators use the separate ten-value buffer',()=>{
  for(const [count,error]of [[10,null],[11,3]]){
    let s=core.createInitialState();for(let i=0;i<count;i++)s=sequence([40,43,33],s);
    s=sequence([40,48],s);assert.equal(s.control.errorCode,error);if(!error)assert.equal(s.answer,11);
  }
});
test('EQN clear retains its coefficient prompt and CPLX selection clears only imaginary M',()=>{
  let s=sequence([4,41,45,40,2]);assert.equal(s.workflow.payload.label,'a1?');assert.equal(s.entry,'');
  s=stores();s.values.memory={kind:'complex',real:core.valueTypes.scalar(7),imaginary:core.valueTypes.scalar(2)};
  s=sequence([4,42],s);assert.equal(s.values.memory.real.value,7);assert.equal(s.values.memory.imaginary.value,0);
});

test('fraction and power separator deletion retains the base and discards the lower entry',()=>{
  for(const template of [25,19]){
    let s=sequence([40,template,41,7]);assert.equal(s.stagedEntry[template===25?'denominator':'exponent'],'');
    s=sequence([9,7],s);assert.equal(s.stagedEntry,null);assert.equal(s.expression,'1');assert.equal(s.cursor,1);
  }
});
