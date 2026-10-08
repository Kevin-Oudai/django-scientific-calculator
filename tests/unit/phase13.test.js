const test=require('node:test'),assert=require('node:assert/strict');
const equations=require('../../src/scientific_calculator/static/scientific_calculator/equations.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const c=require('../../src/scientific_calculator/static/scientific_calculator/core.js'),f=require('../../src/scientific_calculator/static/scientific_calculator/formatting.js');
const press=(s,n)=>c.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});
const seq=(keys,s=c.createInitialState())=>keys.reduce(press,s);
const number=x=>String(Math.abs(x)).split('').map(ch=>({0:45,1:40,2:41,3:42,4:35,5:36,6:37,7:30,8:31,9:32,'.':46})[ch]).concat(x<0?[47]:[]);
const solve=(mode,coefficients)=>coefficients.reduce((s,x)=>seq([...number(x),48],s),seq([4,41,[45,40,41,42][mode]]));

test('Independent native quadratic cancellation preserves zero first root and second root paging',()=>{
 const trace=require('../reference/el506ts/experiments/quadratic-cancellation-native.json');let s=c.createInitialState();
 const plain=h=>h.replace(/<span[^>]*>&times;<\/span>10<sup>(.*?)<\/sup>/g,'E$1').replace(/<[^>]*>/g,'');
 trace.sequence.forEach((id,i)=>{
  s=c.reduceCalculator(s,{type:'physical-key',id});const frame=trace.frames.find(x=>x.after_step===i+1);if(!frame)return;
  assert.equal(s.control.errorCode,null);assert.equal(s.layers.mode,'EQN');
  const view=f.renderState(s,{physical:true});assert.equal(plain(view.expressionHtml),frame.display.upper_line);assert.equal(plain(view.resultHtml),frame.display.lower_line);
  assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
 });
 assert.deepEqual(s.workflow.payload.coefficients,[1,1e13,1]);
 assert.equal(s.workflow.payload.pages[0].value.value,0);assert.equal(s.workflow.payload.pages[1].value.value,-1e13);
 assert.equal(equations.quadratic([1,1e13,1])[0].real,-1e-13,'pure module retains stable small root');
});
test('EQN physical simultaneous entry pages solutions determinant and retained coefficient defaults',()=>{
 let s=solve(0,[1,1,3,1,-1,1]);assert.equal(s.workflow.kind,'multi-result');assert.equal(f.renderState(s,{physical:true}).expressionHtml,'x=');assert.equal(s.workflow.payload.pages[0].value.value,2);
 s=press(s,48);assert.equal(s.workflow.payload.pages[s.workflow.page].label,'y=');s=press(s,48);assert.equal(s.workflow.payload.pages[s.workflow.page].label,'det=');assert.equal(s.workflow.payload.pages[s.workflow.page].value.value,-2);
 assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);s=press(s,48);assert.equal(s.workflow.payload.label,'a1?');assert.equal(s.workflow.payload.coefficients[0],1);assert.equal(f.renderState(s,{physical:true}).resultHtml,'1.');
});
test('EQN physical three-variable and polynomial controllers solve and preserve ANS',()=>{
 const systems=[[1,[2,-1,0,0,6,0,-2,0,1,-2,-1,-6]],[2,[1,-3,2]],[3,[1,0,0,-1]]];
 for(const [mode,coefficients]of systems){const s=solve(mode,coefficients);assert.equal(s.workflow.kind,'multi-result');assert.equal(s.values.last.kind,'equation');assert.equal(s.values.answer.value,0);assert.equal(s.control.errorCode,null);}
 const s=solve(2,[1,0,1]);assert.equal(s.workflow.payload.pages[0].alternate.value,1);const imaginary=seq([3,24],s);assert.equal(imaginary.workflow.payload.pages[0].component,'i');assert.equal(imaginary.workflow.payload.pages[0].value.value,1);
});
test('EQN coefficient correction command clear internal clear singular recovery and HOME',()=>{
 let s=seq([4,41,45,41,48,42]);s=press(s,2);assert.equal(s.workflow.payload.input,'');assert.equal(s.workflow.payload.coefficients[0],2);
 s=seq([3,48],s);assert.equal(s.workflow.payload.coefficient,0);s=seq([35,48],s);assert.equal(s.workflow.payload.coefficients[0],4);
 s=seq([3,4],s);assert.equal(s.workflow.payload.coefficients.every(x=>x===0),true);
 s=solve(0,[1,2,3,2,4,6]);assert.equal(s.control.errorCode,2);s=press(s,2);assert.equal(s.lifecycle,'data-entry');assert.equal(s.control.errorCode,null);s=press(s,1);assert.equal(s.layers.mode,'NORMAL');assert.equal(s.workflow.kind,null);
});
test('Equation solver balances the guide combustion system and reports its determinant',()=>{
 const s=equations.linear([2,-1,0,0,6,0,-2,0,1,-2,-1,-6],3);assert.deepEqual(s.solutions,[{real:1,imaginary:0},{real:2,imaginary:0},{real:3,imaginary:0}]);assert.equal(s.determinant,-12);
});
test('Equation linear solve pivots zeros and rejects dependent and inconsistent systems',()=>{
 const s=equations.linear([0,2,4,3,0,9],2);assert.deepEqual(s.solutions.map(x=>x.real),[3,2]);
 for(const coefficients of [[1,2,3,2,4,6],[1,2,3,2,4,7]])assert.throws(()=>equations.linear(coefficients,2),RangeError);
});
test('Equation quadratic roots cover separated repeated and imaginary solutions',()=>{
 assert.deepEqual(equations.quadratic([1,-3,2]).map(x=>x.real),[2,1]);assert.deepEqual(equations.quadratic([1,-2,1]),[{real:1,imaginary:0},{real:1,imaginary:0}]);
 assert.deepEqual(equations.quadratic([1,0,1]),[{real:0,imaginary:1},{real:0,imaginary:-1}]);assert.throws(()=>equations.quadratic([0,2,1]),RangeError);
 const roots=equations.quadratic([1,1e8,1]);close(roots[0].real,-1e-8);close(roots[1].real,-1e8);
});
test('Equation cubic roots satisfy real and complex polynomial residuals',()=>{
 for(const coefficients of [[1,-6,11,-6],[1,0,0,-1],[1,-3,3,-1],[1,0,-3,2],[2,3,-7,4]]){
  const [a,b,c,d]=coefficients;
  for(const {real:x,imaginary:y} of equations.cubic(coefficients)){close(a*(x*x*x-3*x*y*y)+b*(x*x-y*y)+c*x+d,0);close(a*(3*x*x*y-y*y*y)+2*b*x*y+c*y,0);}}
 assert.throws(()=>equations.cubic([0,1,2,3]),RangeError);
});

test('EQN native cubic root page order for x cubed minus x',()=>{
 let s=solve(3,[1,0,-1,0]);assert.equal(f.renderState(s,{physical:true}).resultHtml,'-1.');s=press(s,48);assert.equal(f.renderState(s,{physical:true}).resultHtml,'1.');s=press(s,48);assert.equal(f.renderState(s,{physical:true}).resultHtml,'0.');
});
