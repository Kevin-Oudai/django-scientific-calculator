const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const c=require(root+'core.js'),calc=require(root+'calculus.js'),f=require(root+'formatting.js');
const press=(s,n)=>c.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});
const seq=(keys,s=c.createInitialState())=>keys.reduce(press,s);
function finish(s){let steps=0;while(s.workflow.payload?.stage==='calculating'){assert.ok(++steps<400);s=c.reduceCalculator(s,{type:'calculus-step'});}return s;}
const square=[5,27,20],guide=[3,20,33,40,44,5,27,20,34];
test('Calculus measured derivative prompts default interval and native polynomial result',()=>{
 let s=seq([...square,3,16]);assert.equal(f.renderState(s,{physical:true}).expressionHtml,'X?');
 s=seq([41,48],s);assert.equal(s.workflow.payload.defaultValue,.00002);assert.equal(f.renderState(s,{physical:true}).expressionHtml,'dx?');
 s=press(s,48);assert.equal(s.answer,4);assert.equal(s.displayExpression,'d/dx=');assert.equal(f.renderState(s,{physical:true}).resultHtml,'4.');
 s=press(s,48);assert.equal(s.workflow.payload.conditions.x,2);s=seq([42,48,48],s);assert.equal(s.answer,6);
});
test('Calculus measured Simpson prompts default n and polynomial integral',()=>{
 let s=seq([...square,16,48,40,48]);assert.equal(s.workflow.payload.stage,'n');assert.equal(s.workflow.payload.defaultValue,100);
 s=finish(press(s,48));assert.ok(Math.abs(s.answer-1/3)<1e-12);assert.equal(s.displayExpression,'\u222bdx=');assert.equal(f.renderState(s,{physical:true}).resultHtml,'0.333333333');
 s=seq([48,48],s);assert.equal(s.workflow.payload.stage,'b');assert.equal(s.workflow.payload.defaultValue,1);
});
test('Simpson uses exactly 2*n panels and fixed weights rather than analytic integration',()=>{
 let count=0,j=calc.begin(0,1,1),r=calc.step(x=>{count++;return x**4;},j);assert.equal(r.done,true);assert.equal(count,3);assert.equal(r.value,5/24);
 count=0;j=calc.begin(0,1,100);do{r=calc.step(x=>{count++;return x*x;},j);j=r.job;}while(!r.done);assert.equal(count,201);assert.ok(Math.abs(r.value-1/3)<1e-15);
});
test('Central difference evaluates the two documented half-interval sample points',()=>{
 const points=[];assert.equal(calc.derivative(x=>{points.push(x);return x*x;},2,.5),4);assert.deepEqual(points,[2.25,1.75]);assert.equal(calc.defaultDx(0),1e-5);assert.equal(calc.defaultDx(-2),.00002);
});
test('Calculus numeric conditions accept negative fractions mixed values and exponent editing',()=>{
 assert.equal(calc.condition('-1/2',0),-.5);assert.equal(calc.condition('-1/1/2',0),-1.5);assert.equal(calc.condition('2E-2',0),.02);
 assert.equal(calc.condition('-0/1/2',0),-.5);
 let s=seq([...square,3,16,47,40,25,41]);assert.equal(s.workflow.payload.input,'-01/2');s=press(s,48);assert.equal(s.workflow.payload.conditions.x,-.5);
 s=seq([40,24,47,36,7,35,48],s);assert.equal(s.answer,-1);
 assert.throws(()=>calc.condition('2*pi',0),SyntaxError);assert.throws(()=>calc.condition('1/0',0),RangeError);
});
test('Guide integrand uses Simpson default and matches independently observed derivative rounding',()=>{
 let s=finish(seq([...guide,16,45,48,40,48,48]));assert.equal(f.renderState(s,{physical:true}).resultHtml,'0.785357562');
 s=seq([...guide,3,16,47,40,25,41,48,48]);assert.equal(s.answer,.577350268);assert.equal(f.renderState(s,{physical:true}).resultHtml,'0.577350268');
});
test('Calculus evaluation clears X preserves other memories and updates ANS only on success',()=>{
 let s=seq([32,28,27,2,42,28,18,2,40,29,2,...square,3,16,41,48,48]);assert.equal(s.control.variables.X,0);assert.equal(s.control.variables.A,3);assert.equal(s.memoryValue,1);assert.equal(s.values.answer.kind,'scalar');assert.equal(s.answer,4);
 const answer=s.answer;s=seq([48,48,45,48],s);assert.equal(s.control.errorCode,2);assert.equal(s.answer,answer);assert.equal(f.renderState(s,{physical:true}).resultHtml,'');s=press(s,2);assert.equal(s.lifecycle,'empty');assert.equal(s.answer,answer);
});
test('Calculus angle modes constants variables and independent memory remain in sample scope',()=>{
 for(const [angle,expected] of [['DEG',Math.PI/180],['RAD',1],['GRAD',Math.PI/200]]){
  let s=seq([13,5,27,34,3,16]);s.angleMode=angle;s.layers.settings.angle=angle;s=seq([48,48],s);assert.ok(Math.abs(s.answer-expected)<1e-8);
 }
 let s=seq([42,28,18,2,41,29,2,5,18,38,5,27,43,5,29,3,16,41,48,48]);assert.equal(s.answer,3);assert.equal(s.memoryValue,2);
 s=seq([18,38,5,27,16,48,40,48,48]);s=finish(s);assert.ok(Math.abs(s.answer-Math.PI/2)<1e-12);
});
test('Integration cancellation discards progress without overwriting ANS or unrelated stores',()=>{
 let s=seq([30,48,2,...square,16,48,40,48,40,45,45,45,45,48]);assert.equal(s.workflow.payload.stage,'calculating');assert.equal(s.control.variables.X,0);
 s=c.reduceCalculator(s,{type:'calculus-step'});assert.equal(s.workflow.payload.job.index,64);assert.equal(s.answer,7);s=press(s,2);assert.equal(s.lifecycle,'empty');assert.equal(s.answer,7);assert.equal(c.reduceCalculator(s,{type:'calculus-step'}),s);
});
test('Integration jobs serialize restore resume deterministically and isolate widget state',()=>{
 const s=seq([...square,16,48,40,48,48]),saved=c.snapshotCalculator(s),restored=c.restoreCalculator(saved);
 assert.deepEqual(finish(s),finish(restored));assert.equal(saved.state.workflow.payload.job.index,0);assert.equal(c.createInitialState().workflow.kind,null);
 for(const mutate of [p=>p.job.index=-1,p=>p.job.n=10001,p=>p.conditions.a=1,p=>p.stage='bad',p=>p.input='x'.repeat(41)]){const bad=structuredClone(saved);mutate(bad.state.workflow.payload);assert.throws(()=>c.restoreCalculator(bad));}
});
test('Calculus singular samples syntax and unresolvable differences recover through ON/C',()=>{
 let s=finish(seq([40,39,5,27,16,48,40,48,48]));assert.equal(s.control.errorCode,2);assert.equal(s.control.variables.X,0);s=seq([2,41,48],s);assert.equal(s.answer,2);
 s=seq([2,...square,43,16],s);assert.equal(s.control.errorCode,1);
 s=seq([5,27,19,40,45,45,45,3,16,41,48,48]);assert.equal(s.control.errorCode,2);
 s=seq([5,27,19,35,3,16,41,48,48]);assert.equal(s.answer,32.0000005);assert.equal(f.renderState(s,{physical:true}).resultHtml,'32.0000005');assert.equal(s.layers.intent.source,'X^4');
 assert.throws(()=>calc.derivative(x=>x,1,1e-20),RangeError);assert.throws(()=>calc.derivative(x=>x,0,0),RangeError);
});
test('Calculus work bounds zero interval and nonfinite samples are enforced',()=>{
 for(const [a,b,n] of [[1,0,100],[0,1,0],[0,1,1.5],[0,1,10001],[0,Infinity,100]])assert.throws(()=>calc.begin(a,b,n),RangeError);
 assert.equal(calc.step(()=>{throw Error('must not sample');},calc.begin(1,1,100)).value,0);
 assert.throws(()=>calc.step(()=>Infinity,calc.begin(0,1,100)),RangeError);assert.throws(()=>calc.step(()=>NaN,calc.begin(0,1,100)),RangeError);
});
test('Calculus preserves normal source editing before opening prompts and ignores unrelated condition keys',()=>{
 let s=seq([...square,9,10,3,16,18,33,43,5]);assert.equal(s.workflow.payload.input,'');s=seq([41,7,42,48,48],s);assert.equal(s.answer,6);
 s=seq([3,39,2,40,16]);assert.equal(s.control.nbase.radix,2);assert.notEqual(s.workflow.payload?.id,'INTEGRAL');
});
test('Calculus snapshots reject mismatched ASTs and invalid result conditions',()=>{
 const prompt=c.snapshotCalculator(seq([...square,3,16]));prompt.state.workflow.payload.ast={kind:'number',decimal:'999'};assert.throws(()=>c.restoreCalculator(prompt));
 const result=c.snapshotCalculator(seq([...square,3,16,41,48,48]));result.state.layers.intent.conditions.dx=0;assert.throws(()=>c.restoreCalculator(result));
 let s=seq([...square,3,16,41,48,48,43,40,16]);assert.notEqual(s.workflow.payload.source,'X^2');assert.match(s.workflow.payload.source,/ans/);
});
