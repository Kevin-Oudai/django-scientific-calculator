const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../../src/scientific_calculator/static/scientific_calculator/core.js');
const formatting=require('../../src/scientific_calculator/static/scientific_calculator/formatting.js');
const solver=require('../../src/scientific_calculator/static/scientific_calculator/solver.js');
const press=(s,n)=>core.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});
const seq=(keys,s=core.createInitialState())=>keys.reduce(press,s);
const text=s=>formatting.renderState(s,{physical:true});
for(const [slot,key] of Object.entries({A:18,B:19,C:20,D:21,E:22,F:23,X:27,Y:28,M:29}))test('Phase 8 STO/RCL '+slot+' overwrites and preserves ANS on recall',()=>{
 let s=seq([30,28,key]);assert.equal(slot==='M'?s.memoryValue:s.control.variables[slot],7);
 assert.equal(s.displayExpression,'7→'+slot);s=seq([2,41,28,key],s);assert.equal(slot==='M'?s.memoryValue:s.control.variables[slot],2);
 s=seq([2,35,48,2,27,key],s);assert.equal(s.lastValue,2);assert.equal(s.answer,4);assert.equal(s.displayExpression,slot+'=');
});
test('Phase 8 native memory sequence inserts a late-bound variable during entry',()=>{
 let s=seq([30,28,18,2,41,43,27]);assert.equal(text(s).indicators.ALPHA,true);assert.equal(text(s).indicators['?'],false);
 s=seq([18],s);assert.equal(s.expression,'2+A');assert.equal(s.displayResult,'7');s=press(s,48);assert.equal(s.answer,9);
 s=press(s,29);assert.equal(s.memoryValue,9);assert.equal(s.answer,9);assert.equal(text(s).indicators.M,true);
 s=seq([2,35,3,29],s);assert.equal(s.memoryValue,5);assert.equal(s.answer,4);assert.equal(s.displayResult,'4');
 s=seq([2,36,3,29],s);assert.equal(s.memoryValue,0);assert.equal(text(s).indicators.M,false);
 s=seq([2,27,18,29],s);assert.equal(s.memoryValue,7);assert.equal(s.answer,7);
});
test('Phase 8 fraction stores preserve exact tokens and rational values',()=>{
 assert.ok(text(seq([40,25,42,28])).resultHtml.includes('scicalc__display-fraction'));
 let s=seq([40,25,42,28,18]);assert.deepEqual(s.values.variables.A,{kind:'rational',numerator:'1',denominator:'3'});
 s=seq([2,5,18,43,5,18,43,5,18,48],s);assert.equal(s.answer,1);
 s=seq([2,40,25,42,29,2,40,25,42,29],s);assert.deepEqual(s.values.memory,{kind:'rational',numerator:'2',denominator:'3'});
 const saved=core.snapshotCalculator(s);assert.deepEqual(core.restoreCalculator(saved),s);
});
for(const [slot,key] of [[0,8],[1,9],[2,10],[3,11]])test('Phase 8 F'+(slot+1)+' stores, replaces, recalls and deletes editable tokens',()=>{
 let s=seq([40,43,41,28,key]);assert.equal(core.semanticEditor.serialize(s.control.formulas[slot]),'1+2');assert.equal(s.answer,0);assert.equal(text(s).resultHtml,'F'+(slot+1));
 s=seq([2,27,key,48],s);assert.equal(s.answer,3);s=seq([2,35,28,key,2,27,key],s);assert.equal(s.expression,'4');
 s=seq([7,36,48],s);assert.equal(s.answer,5);s=seq([2,28,key],s);assert.equal(core.semanticEditor.serialize(s.control.formulas[slot]),'0');s=seq([2,3,47,45,45],s);assert.deepEqual(s.control.formulas[slot],[]);
});
test('Phase 8 formula capacity is shared, replacement frees space and stores are immutable',()=>{
 let s=core.createInitialState();s.control.formulas[0]=core.semanticEditor.tokenize('1+'.repeat(64),{physical:true});s.control.formulas[1]=core.semanticEditor.tokenize('1+'.repeat(64),{physical:true});
 const saved=structuredClone(s);let next=seq([40,28,10],s);assert.equal(next.lifecycle,'error');assert.equal(next.control.errorCode,2);assert.deepEqual(s,saved);
 next=seq([28,8],s);assert.equal(core.semanticEditor.serialize(next.control.formulas[0]),'0');next=seq([2,40,28,10],next);assert.equal(next.control.errorCode,null);
 const bad=core.snapshotCalculator(next);bad.state.control.formulas[3]=[{kind:'number',value:'bad'}];assert.throws(()=>core.restoreCalculator(bad));
 const functions=core.createInitialState();functions.control.formulas[0]=core.semanticEditor.tokenize('root('.repeat(128));functions.control.formulas[1]=core.semanticEditor.tokenize('sin('.repeat(128));assert.doesNotThrow(()=>core.snapshotCalculator(functions));assert.equal(seq([40,28,10],functions).control.errorCode,2);
});
test('Phase 8 simulation discovers variables beside numeric coefficients and M overflow preserves its store',()=>{
 let s=seq([41,5,18,3,17]);assert.deepEqual(s.workflow.payload.variables,['A']);s=seq([42,48],s);assert.equal(s.answer,6);
 s=seq([2,36,24,32,32,29,2,36,24,32,32,29],s);assert.equal(s.control.errorCode,2);assert.equal(s.memoryValue,5e99);
});
test('Phase 8 native ALGB order, ignored navigation, retained values, repeat and cancellation',()=>{
 let s=seq([30,28,18,2,5,19,43,5,18,28,8,2,27,8,3,17]);assert.deepEqual(s.workflow.payload.variables,['B','A']);assert.equal(s.workflow.payload.defaultValue,0);
 assert.ok(text(s).expressionHtml.includes('<u>B</u>'));const prompt=structuredClone(s);s=seq([10,11],s);assert.deepEqual(s.workflow.payload,prompt.workflow.payload);
 s=seq([41,48],s);assert.equal(s.control.variables.B,2);assert.equal(s.workflow.payload.defaultValue,7);s=press(s,48);assert.equal(s.answer,9);
 s=seq([3,17],s);assert.equal(s.workflow.payload.defaultValue,2);s=seq([42,48,35,2],s);assert.equal(s.control.variables.B,3);assert.equal(s.control.variables.A,7);assert.equal(s.answer,9);
 s=seq([27,8,3,17,48,48],s);assert.equal(s.answer,10);
});
test('Phase 8 simulation accepts signed scientific input and retains confirmed values on errors',()=>{
 let s=seq([5,18,39,5,19,3,17,41,24,42,47,48]);assert.equal(s.control.variables.A,.002);
 s=seq([45,48],s);assert.equal(s.lifecycle,'error');assert.equal(s.control.variables.B,0);assert.equal(s.control.variables.A,.002);
 s=seq([2,5,18,3,17,40,24,48],s);assert.equal(s.control.errorCode,1);assert.equal(s.control.variables.A,.002);
});
test('Phase 8 solver native Start, dx, roots, repeat, zero start and failure recovery',()=>{
 let s=seq([5,27,20,44,41,17,45]);assert.equal(text(s).expressionHtml,'Start?');assert.equal(s.workflow.payload.defaultValue,0);assert.equal(text(s).indicators['?'],false);
 s=seq([40,48],s);assert.equal(text(s).expressionHtml,'dx?');assert.equal(s.workflow.payload.defaultValue,1e-5);
 s=press(s,48);assert.ok(Math.abs(s.answer-Math.sqrt(2))<1e-10);assert.equal(s.displayExpression,'X=');assert.equal(s.control.variables.X,s.answer);
 assert.equal(s.history.at(-1).expression,'X^2-2=');
 s=seq([48,40,47,48,48],s);assert.ok(Math.abs(s.answer+Math.sqrt(2))<1e-10);
 s=seq([48,45,48,48],s);assert.ok(s.answer<0);
 const answer=s.answer;s=seq([2,5,27,20,43,40,17,45,40,48,48],s);assert.equal(s.control.errorCode,2);assert.equal(text(s).expressionHtml,'Error 2');assert.equal(text(s).resultHtml,'');assert.equal(s.answer,answer);assert.equal(s.control.variables.X,0);
 s=seq([2,27,27],s);assert.equal(s.lastValue,0);
});
test('Phase 8 solver rejects invalid intervals and cancels without overwriting X or ANS',()=>{
 let s=seq([41,28,27,2,5,27,20,44,41,17,45,40,48]);const before=s.answer;s=press(s,2);assert.equal(s.answer,before);assert.equal(s.control.variables.X,2);
 s=seq([5,27,20,44,41,17,45,40,48,45,48],s);assert.equal(s.control.errorCode,2);assert.equal(s.control.variables.X,0);
});
test('Phase 8 Newton iteration handles multiple roots, domain errors and bounded failure',()=>{
 for(const [start,want] of [[-3,-2],[.5,1],[4,3]])assert.ok(Math.abs(solver.solve(x=>(x+2)*(x-1)*(x-3),start,1e-5)-want)<1e-9);
 assert.ok(Math.abs(solver.solve(x=>Math.cos(x)-x,1,1e-5)-.7390851332151607)<1e-10);
 assert.equal(solver.solve(x=>x*x,0,1e-5),0);
 for(const dx of [1e-3,1e-5,1e-7])assert.ok(Math.abs(solver.solve(x=>x*x-2,1,dx)-Math.sqrt(2))<1e-9);
 let calls=0;assert.throws(()=>solver.solve(()=>{calls++;return 1;},1,1e-5),RangeError);assert.ok(calls<=300);
 for(const f of [()=>1,x=>x*x+1,()=>Infinity,x=>1/x])assert.throws(()=>solver.solve(f,1,1e-5),RangeError);
 for(const dx of [0,-1,Infinity,NaN])assert.throws(()=>solver.solve(x=>x,1,dx),RangeError);
});
test('Phase 8 snapshot 9 migrates published scalar variables and string formula stores',()=>{
 let s=seq([30,28,18,2,5,18,43,40,28,8]);const old=core.snapshotCalculator(s);old.schemaVersion=8;delete old.state.values.variables;old.state.control.formulas=old.state.control.formulas.map(core.semanticEditor.serialize);
 const restored=core.restoreCalculator(old);assert.equal(restored.values.variables.A.value,7);assert.equal(core.semanticEditor.serialize(restored.control.formulas[0]),'A+1');assert.equal(core.snapshotCalculator(restored).schemaVersion,10);
});
test('Phase 8 memory and ANS policy covers every mode and structured result type',()=>{
 const v=core.valueTypes;
 const samples=[v.scalar(2),v.rational('1','3'),{kind:'dms',sign:1,degrees:1,minutes:2,seconds:3},{kind:'nbase',integer:'2',radix:2,width:32,signed:true},{kind:'complex',real:v.scalar(1),imaginary:v.scalar(2)},
 {kind:'matrix',rows:1,columns:1,elements:[v.scalar(2)]},{kind:'list',elements:[v.scalar(2)]},{kind:'equation',components:[{label:'x',value:v.scalar(2)}]},{kind:'statistics',rows:[]}];
 for(const mode of ['NORMAL','STAT','EQN','CPLX','MAT','LIST']){
  const policy=core.memoryPolicy(mode);assert.equal(policy.temporary,['NORMAL','MAT','LIST'].includes(mode));assert.equal(policy.independent,['NORMAL','CPLX'].includes(mode));assert.equal(policy.formula,policy.independent);
  for(const value of samples){const s=seq([30,48]);s.layers.mode=mode;const next=core.commitTypedResult(s,value);assert.deepEqual(next.values.last,value);assert.deepEqual(next.values.answer,mode!=='EQN'&&['scalar','rational','dms','nbase','complex'].includes(value.kind)?value:s.values.answer);assert.equal(s.answer,7);}
 }
});
test('Phase 8 complex independent memory includes imaginary values and mode changes clear imaginary M',()=>{
 const v=core.valueTypes;let s=seq([40,48]);s.layers.mode='CPLX';s.values.last={kind:'complex',real:v.scalar(0),imaginary:v.scalar(2)};s.lastValue=0;
 s=press(s,29);assert.equal(s.values.memory.imaginary.value,2);assert.equal(text(s).indicators.M,true);assert.equal(s.values.answer.kind,'complex');
 s=seq([28,29,2,27,29],s);assert.equal(s.values.last.imaginary.value,2);s=seq([4,45],s);assert.equal(s.values.memory.imaginary.value,0);assert.equal(text(s).indicators.M,false);
});
for(const [name,keys,temporary,independent,formula,answer] of [
 ['ON/C',[2],7,7,true,7],['HOME NORMAL',[1],7,7,true,7],['OFF/ON',[3,2,2],7,7,true,7],['idle/ON',[],7,7,true,7],
 ['CA',[3,4],0,7,true,0],['mode CPLX',[4,42],0,7,true,0],['mode STAT',[4,40,45],0,7,true,0],['mode EQN',[4,41,45],0,7,true,0],['mode MAT',[4,35],0,7,true,0],['mode LIST',[4,36],0,7,true,0],['HOME other',[4,42,1],0,7,true,0],['memory clear',[3,47,45,45],0,0,false,0],['reset',[3,47,40,45],0,0,false,0]
])test('Phase 8 persistence '+name,()=>{
 let s=seq([30,28,18,28,29,2,40,43,41,28,8]);
 for(const key of [19,20,21,22,23,27,28])s=seq([2,30,28,key],s);
 for(const key of [9,10,11])s=seq([2,40,43,41,28,key],s);
 s.statsValues=[2];s.values.statistics.rows=[{x:core.valueTypes.scalar(2),y:null,weight:1}];
 for(let i=0;i<4;i++){s.control.matrices[i]={kind:'matrix',rows:1,columns:1,elements:[core.valueTypes.scalar(2)]};s.control.lists[i]={kind:'list',elements:[core.valueTypes.scalar(2)]};}
 if(name==='idle/ON'){s=core.reduceCalculator(s,{type:'idle',elapsedMs:600000});s=press(s,2);}else s=seq(keys,s);
 assert.equal(s.control.variables.A,temporary);assert.equal(s.memoryValue,independent);assert.equal(Boolean(s.control.formulas[0].length),formula);assert.equal(s.answer,answer);
 for(const value of Object.values(s.control.variables))assert.equal(value,temporary);
 for(const value of Object.values(s.values.variables))assert.equal(core.valueTypes.toNumber(value),temporary);
 for(const tokens of s.control.formulas)assert.equal(Boolean(tokens.length),formula);
 assert.equal(s.statsValues.length,temporary?1:0);
 for(const value of [...s.control.matrices,...s.control.lists])assert.equal(value===null,!temporary);
});
