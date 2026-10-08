const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const c=require(root+'core'),f=require(root+'formatting');
const press=(s,id)=>c.reduceCalculator(s,{type:'physical-key',id});
const plain=html=>html.replace(/<span[^>]*>&times;<\/span>10<sup>(.*?)<\/sup>/g,'e$1').replace(/<[^>]*>/g,'').replaceAll('&divide;','÷').replaceAll('&minus;','-');
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
for(const name of ['capacity-cursor-recovery-native','division-error-cursor-native','syntax-error-cursor-native','missing-operand-cursor-native'])test('Native error navigation retains source and measured cursor: '+name,()=>{
 const ref=require('../reference/el506ts/experiments/'+name+'.json');let s=c.createInitialState();
 for(let step=1;step<=ref.sequence.length;step++){
  s=press(s,ref.sequence[step-1]);
  for(const frame of ref.frames.filter(x=>x.after_step===step)){
   const actual=f.renderState(s,{physical:true});
   assert.equal(plain(actual.resultHtml),frame.display.lower_line,'native lower '+step);
   if(!frame.display.scroll_arrows.length&&!frame.display.cursor.value?.includes('block over'))assert.equal(plain(actual.expressionHtml),frame.display.upper_line,'native upper '+step);
   if(frame.display.cursor.value?.includes('insertion underscore')){
    assert.equal(s.cursor,s.expression.length);assert.equal(s.entry,'');assert.equal(s.control.errorCode,null);
   }
   if(frame.display.cursor.value?.includes('block over')){assert.equal(s.expression,')1');assert.equal(s.cursor,1);assert.equal(s.control.errorCode,null);}
  }
 }
 if(name==='capacity-cursor-recovery-native')assert.equal(s.cursor,s.expression.length-4,'LEFT selects final sine cell');
 else if(name==='division-error-cursor-native')assert.equal(s.expression,'1:0');
});
test('Native Error3 LEFT shares the observed RIGHT fault selection and preserves operand',()=>{
 const ref=require('../reference/el506ts/experiments/calculation-buffer-error3-native.json');
 let s=ref.sequence.slice(0,27).reduce(press,c.createInitialState());s=press(s,'EL506-K09');
 assert.equal(s.control.errorCode,null);assert.equal(s.cursor,24*4);assert.ok(s.expression.endsWith('1'));
 s=press(s,'EL506-K07');assert.equal((s.expression.match(/sin\(/g)||[]).length,24);assert.ok(s.expression.endsWith('1'));
});
test('Independent signed scalar minimum and underflow checkpoints match the native LCD',()=>{
 const ref=require('../reference/el506ts/experiments/scalar-underflow-native.json');let s=c.createInitialState();
 for(let step=1;step<=ref.sequence.length;step++){
  s=press(s,ref.sequence[step-1]);
  for(const frame of ref.frames.filter(x=>x.after_step===step)){
   const actual=f.renderState(s,{physical:true});
   assert.equal(plain(actual.expressionHtml),frame.display.upper_line,'native upper '+step);
   assert.equal(plain(actual.resultHtml),frame.display.lower_line,'native lower '+step);
  }
 }
 assert.equal(s.answer,0);assert.equal(Object.is(s.answer,-0),false);
});
test('Independent signed upper scalar limit, overflow and retained ANS match the native LCD',()=>{
 const ref=require('../reference/el506ts/experiments/scalar-upper-boundary-native.json');let s=c.createInitialState();
 for(let step=1;step<=ref.sequence.length;step++){
  s=press(s,ref.sequence[step-1]);
  for(const frame of ref.frames.filter(x=>x.after_step===step)){
   const actual=f.renderState(s,{physical:true});
   if(!frame.display.scroll_arrows.length)assert.equal(plain(actual.expressionHtml),frame.display.upper_line,'native upper '+step);
   assert.equal(plain(actual.resultHtml),frame.display.lower_line,'native lower '+step);
  }
 }
 assert.equal(s.answer,-9.999999999e99);assert.equal(s.control.errorCode,null);
});

for(const name of ['nbase-error5-cursor-native','matrix-error7-10-cursor-native','matrix-error8-cursor-native','matrix-error9-cursor-native'])test('Independent native fault recovery: '+name,()=>{
 const ref=require('../reference/el506ts/experiments/'+name+'.json');let s=c.createInitialState();
 if(ref.initial_state.mode.value==='MAT')s=[4,35].reduce((s,n)=>press(s,'EL506-K'+String(n).padStart(2,'0')),s);
 for(let step=1;step<=ref.sequence.length;step++){
  s=press(s,ref.sequence[step-1]);const frame=ref.frames.find(x=>x.after_step===step);if(!frame)continue;
  const view=f.renderState(s,{physical:true}),upper=plain(view.expressionHtml);
  assert.equal(plain(view.resultHtml),frame.display.lower_line,name+' lower '+step);
  if(frame.display.cursor.value?.includes('block over')){assert.equal(s.expression,'matD');assert.equal(s.cursor,0);assert.match(view.expressionHtml,/selected-char/);}
  else if(frame.display.scroll_arrows.includes('left'))assert.ok(upper.endsWith(frame.display.upper_line),name+' scrolled suffix '+step);
  else assert.equal(upper,frame.display.upper_line,name+' upper '+step);
  if(frame.display.cursor.status==='observed'){
   assert.equal(s.control.errorCode,null);assert.equal(view.cursorVisible,true);
   if(frame.display.cursor.value.includes('insertion'))assert.equal(s.cursor,s.expression.length);
  }
 }
 if(name.startsWith('nbase')){assert.equal(s.control.nbase.radix,2);assert.deepEqual(s.control.formulas[0],[{kind:'number',value:'2'}]);}
});

const recoveryRefs={1:'syntax-error-cursor-native',2:'division-error-cursor-native',3:'calculation-buffer-error3-native',4:'capacity-cursor-recovery-native',5:'nbase-error5-cursor-native',6:'capacity-cursor-recovery-native',7:'matrix-error7-10-cursor-native',8:'matrix-error8-cursor-native',9:'matrix-error9-cursor-native',10:'matrix-error7-10-cursor-native'};
for(const [code,name]of Object.entries(recoveryRefs))test('Manual preserved stores and ON/C clearing after native Error '+code,()=>{
 const ref=require('../reference/el506ts/experiments/'+name+'.json');let s=c.createInitialState();
 if(ref.initial_state.mode.value==='MAT')s=[4,35].reduce((s,n)=>press(s,'EL506-K'+String(n).padStart(2,'0')),s);
 const frame=ref.frames.find(f=>f.display.upper_line==='Error '+code);assert.ok(frame);
 for(let step=1;step<frame.after_step;step++)s=press(s,ref.sequence[step-1]);
 const stores=state=>({answer:state.answer,memory:state.values.memory,variables:state.control.variables,typedVariables:state.values.variables,formulas:state.control.formulas,matrices:state.control.matrices,lists:state.control.lists,buffers:state.control.buffers,statistics:state.values.statistics,history:state.history});
 const before=structuredClone(stores(s));s=press(s,ref.sequence[frame.after_step-1]);assert.equal(s.control.errorCode,Number(code));assert.deepEqual(stores(s),before,'failed operation leaves stored values intact');
 const failed=structuredClone(s),cleared=press(s,'EL506-K02');assert.deepEqual(s,failed,'input immutable');assert.deepEqual(stores(cleared),before,'manual ON/C retains stores');
 assert.equal(cleared.control.errorCode,null);assert.equal(cleared.expression,'');assert.equal(cleared.entry,'');assert.equal(cleared.layers.mode,s.layers.mode);assert.equal(cleared.control.nbase.radix,s.control.nbase.radix);
 assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(cleared)),cleared);
});
