const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../../src/scientific_calculator/static/scientific_calculator/core');
const fmt=require('../../src/scientific_calculator/static/scientific_calculator/formatting');
const press=(s,n)=>core.reduceCalculator(s,{type:'physical-key',id:`EL506-K${String(n).padStart(2,'0')}`});
const seq=(keys,s=core.createInitialState())=>keys.reduce(press,s);
const shown=s=>fmt.renderState(s,{physical:true}).resultHtml;
const cases=[
 ['decimal duplicate ignored',[46,40,46,41,48],.12],
 ['scientific literal',[41,24,42,48],2000],
 ['bare Exp supplies one',[24,42,48],1000],
 ['NEG is an operand sign',[47,41,20,48],4],
 ['arithmetic precedence',[41,43,42,38,35,48],14],
 ['left associative powers',[41,19,42,19,41,48],64],
 ['implied multiplication precedes division',[37,39,41,33,40,43,41,34,48],1],
 ['automatic closing',[41,38,33,42,43,35,48],14],
 ['repeated equals is stable',[41,43,42,48,48],5],
 ['constant addition',[42,35,43,36,30,48,35,36,48],102],
 ['constant multiplication retains left operand',[41,38,42,48,35,48],8],
 ['ANS continuation',[41,43,42,48,38,35,48],20],
 ['percent increase immediate',[41,45,45,43,40,45,3,40],220],
 ['percent decrease immediate',[41,45,45,44,40,45,3,40],180],
 ['percent of immediate',[41,45,45,38,40,45,3,40],20],
 ['reverse percentage immediate',[41,45,45,39,40,45,3,40],2000],
 ['ENT after percent recomputes original',[41,45,45,43,40,45,3,40,48],210],
 ['reciprocal',[41,3,18,48],.5],
 ['cube postfix',[41,21,48],8],
 ['general power',[41,19,36,48],32],
 ['sqrt implicit argument ends at plus',[3,20,32,43,40,48],4],
 ['prefix and postfix factorial',[3,20,32,3,35,48],602.3952191045344],
 ['postfix square inside power',[41,19,42,20,48],512],
 ['postfix square inside logarithm',[22,40,45,20,48],2],
 ['general power inside logarithm',[22,40,45,19,41,48],2],
 ['explicit grouped root argument',[3,20,33,40,43,41,34,48],Math.sqrt(3)],
 ['negative general exponent',[41,19,47,42,48],.125],
 ['sqrt implied multiplication',[41,3,20,32,48],6],
 ['negative cube root',[3,21,47,31,48],-2],
 ['nth root',[42,3,19,31,48],2],
 ['logarithm implicit argument',[22,40,45,45,43,40,48],3],
 ['ten to power',[3,22,42,48],1000],
 ['natural log',[23,40,48],0],
 ['e to power',[3,23,40,48],Math.E],
 ['MATH seconds immediate',[40,45,17,41],36000],
 ['MATH minutes immediate',[41,17,42],120],
 ['engineering kilo postfix',[41,17,40,45,48],2000],
 ['factorial',[36,3,35,48],120],
 ['permutation',[36,3,37,41,48],20],
 ['combination',[36,3,36,41,48],10],
];
for(const [name,keys,value]of cases)test('NORMAL: '+name,()=>{const s=seq(keys);assert.equal(s.lifecycle,'evaluated');assert.ok(Math.abs(s.answer-value)<=Math.abs(value)*1e-13+1e-14,`${s.answer} != ${value}`);assert.equal(s.control.errorCode,null);assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(s)),s);});

test('pi uses the expression line and ten-digit result; entry limit and explicit trailing zeros',()=>{
 let s=seq([41,18]);assert.equal(s.displayExpression,'2pi');assert.equal(shown(s),'0.');assert.equal(shown(press(s,48)),'6.283185307');assert.equal(shown(seq([18,48])),'3.141592654');assert.equal(shown(seq([3,20,42,48])),'1.732050808');
 s=seq(Array(11).fill(32));assert.equal(s.entry,'9999999999');assert.equal(shown(seq([46,45,45])),'0.00');
});
test('scientific exponent rolls two digits, rejects decimal and preserves signed zero; cursor can recover',()=>{
 let s=seq([41,24,40,45,45]);assert.equal(s.stagedEntry.exponent,'00');s=press(s,47);assert.equal(s.stagedEntry.exponent,'-00');assert.deepEqual(press(s,46).stagedEntry,s.stagedEntry);assert.equal(press(s,48).answer,2);
 s=seq([41,24,42,9]);assert.equal(s.stagedEntry,null);assert.equal(s.expression,'');assert.equal(s.displayResult,'0');assert.equal(seq([10,35,48],s).answer,4);
 s=seq([36,43,41,24,42,9]);assert.equal(s.expression,'5+');assert.equal(s.displayResult,'');assert.equal(press(s,48).control.errorCode,1);
 s=seq([41,24,42,48,9,48]);assert.equal(s.answer,2000);assert.equal(s.control.errorCode,null);
});
test('syntax errors retain the previous ANS; repeated operators and omitted operands are not repaired',()=>{
 const previous=seq([30,48]);for(const keys of [[2,41,43,43,42,48],[2,41,43,48],[2,41,44,44,42,48],[2,41,19,48],[2,40,45,3,40]]){
  const s=seq(keys,previous);assert.equal(s.control.errorCode,1);assert.equal(s.answer,7);assert.equal(press(s,2).control.errorCode,null);
 }
});
test('all NORMAL domains reject invalid inputs with Error 2 and preserve stores',()=>{
 const cases=[[40,39,45,48],[45,3,18,48],[3,20,47,40,48],[45,3,19,31,48],[22,45,48],[23,45,48],[30,45,3,35,48],[36,3,35,3,35,48],[41,46,36,3,35,48],[36,3,37,37,48],[36,3,36,47,40,48],[47,41,19,46,36,48],[3,22,40,45,45,48]];
 for(const keys of cases){const s=seq(keys);assert.equal(s.control.errorCode,2,keys.join(','));assert.equal(s.answer,0);assert.equal(s.memoryValue,0);}
 assert.match(shown(seq([37,32,3,35,48])),/^1\.711224524.*10<sup>98<\/sup>$/);
 assert.equal(seq([45,3,35,48]).answer,1);assert.equal(seq([36,3,36,45,48]).answer,1);
});
test('constant state survives snapshot and new numeric entry, clears on ON/C or a new operator',()=>{
 let s=seq([37,39,42,48,32,48]);assert.equal(s.answer,3);assert.equal(s.displayExpression,'9:K=');s=core.restoreCalculator(core.snapshotCalculator(s));assert.equal(seq([35,36,48],s).answer,15);
 assert.equal(press(s,2).control.arithmetic.constant,null);assert.equal(seq([43,41,48],s).answer,5);
 const old=core.snapshotCalculator(s);old.schemaVersion=6;delete old.state.values.variables;old.state.control.formulas=old.state.control.formulas.map(core.semanticEditor.serialize);delete old.state.control.arithmetic;assert.equal(core.restoreCalculator(old).control.arithmetic.constant,null);
 const bad=core.snapshotCalculator(s);bad.state.control.arithmetic.constant.operator='eval';assert.throws(()=>core.restoreCalculator(bad));
});
test('MATH inventory has two pages, ENG has four/four/one; solver rejects an empty expression',()=>{
 let s=seq([17]);assert.deepEqual(s.workflow.payload.choices,['SOLV','ENG','→sec','→min']);assert.equal(seq([45],s).control.errorCode,1);
 s=seq([40],s);assert.deepEqual(s.workflow.payload.groups,[4,4,1]);s=press(s,11);assert.equal(s.workflow.page,1);assert.equal(press(s,11).workflow.page,2);
});
test('retained negative and scientific constants remain numeric operands',()=>{
 const negative=seq([41,43,47,42,48,35,48]);assert.equal(negative.answer,1);assert.equal(negative.displayExpression,'4+K=');
 const large=seq([40,24,32,32,38,41,48,42,48]);assert.equal(large.answer,3e99);assert.match(shown(large),/^3\..*<sup>99<\/sup>$/);assert.equal(large.displayExpression,'K*3=');
});
test('the enhanced legacy grammar remains right associative and retains its implicit precedence',()=>{
 assert.equal(core.evaluateExpression('2^3^2','DEG',0),512);assert.equal(core.evaluateExpression('6/2(1+2)','DEG',0),9);
});
