const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const c=require(root+'core'),f=require(root+'formatting');
const press=(s,id)=>c.reduceCalculator(s,{type:'physical-key',id});
const plain=html=>html.replace(/<span[^>]*>&times;<\/span>10<sup>(.*?)<\/sup>/g,'e$1').replace(/<[^>]*>/g,'');
function finish(s){while(s.workflow.payload?.stage==='calculating')s=c.reduceCalculator(s,{type:'calculus-step'});return s;}
for(const name of ['phase10-calculus','calculus-power-comparison-native'])test('Native calculus LCD checkpoints match exactly: '+name,()=>{
 const ref=require('../reference/el506ts/experiments/'+name+'.json');let s=c.createInitialState(),count=0;
 for(let step=0;step<=ref.sequence.length;step++){
  if(step)s=finish(press(s,ref.sequence[step-1]));
  for(const frame of ref.frames.filter(x=>x.after_step===step)){
   const actual=f.renderState(s,{physical:true});
   assert.equal(plain(actual.expressionHtml),frame.display.upper_line,'native upper '+step);
   assert.equal(plain(actual.resultHtml),frame.display.lower_line,'native lower '+step);count++;
  }
 }
 assert.equal(count,ref.frames.length);
});
test('Independent quartic derivative display is reproduced without an endpoint tolerance',()=>{
 const ref=require('../reference/el506ts/experiments/calculus-polynomial-native.json');
 // Native step 453 enters NORMAL with blank 0.; the following nine keys
 // supply X^4, x=2 and default dx independently of prior retained stores.
 const s=ref.sequence.slice(453,462).reduce(press,c.createInitialState());
 assert.equal(plain(f.renderState(s,{physical:true}).resultHtml),ref.frames.find(x=>x.after_step===462).display.lower_line);
 assert.equal(s.answer,32.0000005);
});
test('Native buffer Error 3 preserves operand and recovers to the 24-function boundary',()=>{
 const ref=require('../reference/el506ts/experiments/calculation-buffer-error3-native.json');let s=c.createInitialState();
 for(let step=1;step<=ref.sequence.length;step++){
  s=press(s,ref.sequence[step-1]);
  if(step===27){assert.equal(s.control.errorCode,3);assert.equal(plain(f.renderState(s,{physical:true}).expressionHtml),'Error 3');}
  if(step===29){assert.equal((s.expression.match(/sin\(/g)||[]).length,24);assert.ok(s.expression.endsWith('1'));}
 }
 assert.equal(s.control.errorCode,null);assert.equal((s.expression.match(/sin\(/g)||[]).length,24);
 assert.equal(plain(f.renderState(s,{physical:true}).resultHtml),ref.frames.find(x=>x.after_step===30).display.lower_line);
 assert.ok(s.answer>0,'small nonzero angles must survive exact-quadrant handling');
});
test('Native expression and formula-memory errors retain the independently observed adjacent storage boundary',()=>{
 const ref=require('../reference/el506ts/experiments/formula-length-memory-errors-native.json');let s=c.createInitialState();
 for(let step=1;step<=ref.sequence.length;step++){
  s=press(s,ref.sequence[step-1]);
  for(const frame of ref.frames.filter(x=>x.after_step===step)){
   const actual=f.renderState(s,{physical:true});assert.equal(plain(actual.resultHtml),frame.display.lower_line,'native lower '+step);
   if(!frame.display.scroll_arrows.length)assert.equal(plain(actual.expressionHtml),frame.display.upper_line,'native upper '+step);
  }
  if(step===53){assert.ok(s.control.formulas[1].length);assert.equal(s.control.formulas[2].length,0);}
  if(step===55){assert.equal(s.control.errorCode,6);assert.equal(s.control.formulas[2].length,0);}
 }
 assert.ok(s.expression.length);assert.ok(s.control.formulas[1].length);assert.equal(s.control.formulas[2].length,0);
});
test('Every documented error number has an independently observed matching native LCD frame',()=>{
 const catalogue=require('../reference/el506ts/error-catalogue.json');
 assert.deepEqual(catalogue.errors.map(e=>e.number),[1,2,3,4,5,6,7,8,9,10]);
 for(const error of catalogue.errors){
  assert.equal(error.nativeStatus,'observed in listed scopes');assert.ok(error.nativeEvidence.length);
  for(const evidence of error.nativeEvidence){const ref=require('../reference/el506ts/'+evidence.experiment);const frame=ref.frames.find(f=>f.after_step===evidence.afterStep);assert.ok(frame);assert.equal(frame.display.upper_line,error.display);}
 }
});
