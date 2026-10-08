const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const c=require(root+'core.js'),nb=require(root+'nbase.js'),v=require(root+'values.js'),f=require(root+'formatting.js');
const press=(s,n)=>c.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});
const seq=(keys,s=c.createInitialState())=>keys.reduce(press,s);
const select={2:39,5:43,8:44,16:38};
for(const radix of [2,5,8,16]){
 test('N-base '+radix+' signed ten digit boundaries and typed complement',()=>{
  const m=nb.modulus(radix),lo=-(m/2n),hi=(m-1n)/2n;
  for(const n of [lo,lo+1n,-1n,0n,1n,hi-1n,hi]){const tag=nb.typed(n,radix);v.validate(tag);assert.equal(nb.literal(nb.encode(n,radix),radix),n);assert.equal(v.toNumber(tag),Number(n));assert.equal(v.view(tag).components[0].text,nb.encode(n,radix));}
  assert.throws(()=>nb.checked(lo-1n,radix),RangeError);assert.throws(()=>nb.checked(hi+1n,radix),RangeError);
 });
 test('N-base '+radix+' arithmetic precedence parentheses and division truncation',()=>{
  const one='1',two=nb.encode(2n,radix),three=nb.encode(3n,radix);
  assert.equal(nb.evaluate('('+one+'+'+one+')*'+two,radix),4n);
  assert.equal(nb.evaluate(three+':'+two+'*'+two,radix),2n);
  assert.equal(nb.evaluate('NEG'+three+':'+two,radix),-1n);
  assert.equal(nb.evaluate('NOT0',radix),-1n);assert.equal(nb.evaluate('NEG1',radix),-1n);
  assert.throws(()=>nb.evaluate('1:0',radix),RangeError);assert.throws(()=>nb.evaluate('NEG',radix));
 });
 test('N-base '+radix+' physical selection clear ANS conversion and memory',()=>{
  let s=seq([40,3,select[radix]]);assert.equal(s.control.nbase.radix,radix);assert.equal(s.displayResult,'1');
  s=seq([2,40,43,40,48],s);assert.equal(s.answer,2);assert.equal(s.values.last.kind,'nbase');
  s=seq([28,18,2,27,18],s);assert.equal(s.lastValue,2);assert.equal(s.answer,2);assert.equal(s.values.variables.A.integer,'2');
  s=seq([43,40,48,29],s);assert.equal(s.memoryValue,3);s=seq([2,27,29],s);assert.equal(s.lastValue,3);
  const restored=c.restoreCalculator(c.snapshotCalculator(s));assert.deepEqual(restored,s);s=seq([3,48],s);assert.equal(s.control.nbase.radix,10);assert.equal(s.lastValue,3);
 });
 test('N-base '+radix+' invalid digits and unsupported decimal functions ignored',()=>{
  let s=seq([3,select[radix],2,40]);const before=s.entry;
  s=seq([46,24,25,17,32],s);assert.equal(s.entry,radix===16?before+'9':before);assert.equal(s.workflow.kind,null);
 });
 test('N-base '+radix+' complement cross-base conversions',()=>{
  let s=seq([3,select[radix],2,47,40,48]);assert.equal(s.answer,-1);
  for(const base of [16,5,8,2]){s=seq([3,select[base]],s);assert.equal(s.displayResult,nb.encode(-1n,base));assert.equal(s.lastValue,-1);}
  s=seq([3,48],s);assert.equal(s.displayResult,'-1');assert.equal(s.control.nbase.radix,10);
 });
}
for(const radix of [2,5,8,16])for(const [op,result]of [['AND',1n],['OR',1n],['XOR',0n],['XNOR',-1n]])test('N-base '+radix+' '+op+' truth table',()=>assert.equal(nb.evaluate('1'+op+'1',radix),result));
test('Native OR/AND precedence and OR/XOR left associativity',()=>{assert.equal(nb.evaluate('1OR1AND0',2),1n);assert.equal(nb.evaluate('1OR1XOR1',2),0n);});
test('HEX literal A/F and memory A remain distinct',()=>{assert.equal(nb.evaluate('A+F',16),25n);assert.equal(nb.evaluate('AAND1',16),0n);assert.equal(nb.evaluate('$A+F',16,{A:1n}),16n);const s=seq([41,3,38,18,43,23,48,3,39]);assert.equal(s.displayResult,'11001');assert.equal(s.displayExpression,'19\u2192BIN');});
test('Decimal fractional conversion truncates toward zero',()=>{let s=seq([42,39,41,48,3,38]);assert.equal(s.answer,1);s=seq([3,48,2,42,47,39,41,48,3,38]);assert.equal(s.answer,-1);});
test('N-base overflow and syntax preserve ANS and recover with ON/C',()=>{let s=seq([40,3,39,2,40,47,48]);assert.equal(s.control.errorCode,1);assert.equal(s.answer,1);let view=f.renderState(s,{physical:true});assert.match(view.expressionHtml,/Error 1/);assert.doesNotMatch(view.resultHtml,/Error/);s=seq([2,40,39,45,48],s);assert.equal(s.control.errorCode,2);assert.equal(s.control.nbase.radix,2);s=press(s,2);assert.equal(s.lifecycle,'empty');assert.equal(s.control.nbase.radix,2);});
test('40 bit HEX operations do not use 32 bit JavaScript signed coercion',()=>{assert.equal(nb.evaluate('100000000OR1',16),4294967297n);assert.equal(nb.evaluate('7FFFFFFFFFAND100000000',16),4294967296n);assert.throws(()=>nb.evaluate('7FFFFFFFFF+1',16),RangeError);});
test('N-base formulas preserve unambiguous digits, operators and memory references',()=>{let s=seq([3,38,2,18,43,23,28,8,2,27,8,48]);assert.equal(s.answer,25);assert.equal(c.semanticEditor.serialize(s.control.formulas[0]),'A+F');s=seq([3,48,2,27,8],s);assert.equal(s.control.errorCode,5);});
test('Decimal formula recall in BIN rejects unavailable functions and digits',()=>{let s=seq([41,28,8,2,3,39,2,27,8]);assert.equal(s.control.errorCode,5);s=press(s,2);assert.equal(s.control.nbase.radix,2);});
test('Snapshot 10 migrates actual schema 9 and validates base and pental tag',()=>{const snap=c.snapshotCalculator(seq([3,43,2,47,40,48]));assert.equal(snap.schemaVersion,11);assert.deepEqual(c.restoreCalculator(snap),snap.state);const old=c.snapshotCalculator(c.createInitialState());old.schemaVersion=9;delete old.state.control.nbase;assert.equal(c.restoreCalculator(old).control.nbase.radix,10);const bad=structuredClone(snap);bad.state.control.nbase.radix=3;assert.throws(()=>c.restoreCalculator(bad));const tag=nb.typed(-1n,5);tag.integer='4882813';assert.throws(()=>v.validate(tag),RangeError);});

test('HOME restores decimal grammar for N-base ANS and stored memories',()=>{let s=seq([3,38,2,18,28,18,1,5,48,43,40,48]);assert.equal(s.answer,11);s=seq([2,5,18,43,40,48],s);assert.equal(s.answer,11);});
test('Decimal 512 to BIN reproduces measured range failure without switching base',()=>{let s=seq([36,40,41,3,39]);assert.equal(s.control.errorCode,2);assert.equal(s.control.nbase.radix,10);assert.equal(f.renderState(s,{physical:true}).expressionHtml,'Error 2');assert.equal(f.renderState(s,{physical:true}).resultHtml,'');});
test('ALPHA ENT inserts N-base ANS as printed on the physical key',()=>{const s=seq([3,38,2,18,48,2,5,48,43,40,48]);assert.equal(s.answer,11);});
test('N-base recalled value continues arithmetic independently of ANS',()=>{let s=seq([3,38,2,30,28,18,2,41,48,2,27,18]);assert.equal(s.answer,2);assert.equal(s.lastValue,7);s=seq([43,40,48],s);assert.equal(s.answer,8);});
test('N-base implied multiplication supports parentheses and late-bound memories',()=>{assert.equal(nb.evaluate('2(1+1)',16),4n);assert.equal(nb.evaluate('2$A',16,{A:3n}),6n);});
test('ANS after evaluated N-base result inserts exactly one operand',()=>{const s=seq([3,38,2,18,48,5,48,43,40,48]);assert.equal(s.answer,11);});
test('N-base formula recall validates availability without executing and preserves memory symbols',()=>{let s=seq([40,39,45,28,8,1,3,38,2,27,8]);assert.equal(s.control.errorCode,null);s=press(s,48);assert.equal(s.control.errorCode,2);s=seq([1,42,28,18,2,5,18,43,40,28,8,1,3,38,2,27,8,48],s);assert.equal(s.answer,4);});
test('Selected base indicators survive ON/C and disappear on HOME',()=>{let s=seq([3,38,2]);assert.equal(f.renderState(s,{physical:true}).indicators.HEX,true);s=press(s,1);assert.equal(f.renderState(s,{physical:true}).indicators.HEX,false);assert.equal(s.control.nbase.radix,10);});
test('N-base formula store after ENT retains the expression rather than zero',()=>{let s=seq([3,38,2,18,43,23,48,28,8]);assert.equal(c.semanticEditor.serialize(s.control.formulas[0]),'A+F');s=seq([2,27,8,48],s);assert.equal(s.answer,25);});
test('Decimal RCL retains the published semantic source without N-base sentinels',()=>{const s=seq([30,28,18,2,27,18]);assert.equal(s.expression,'A=');assert.equal(c.semanticEditor.serialize(s.editor.tokens),'A');});
