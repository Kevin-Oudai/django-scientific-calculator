const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../../src/scientific_calculator/static/scientific_calculator/calculator.js'),v=core.valueTypes;
const samples=[v.scalar(-0),v.rational('2','6'),{kind:'dms',sign:-1,degrees:12,minutes:34,seconds:56.7},
  {kind:'complex',real:v.rational('1','3'),imaginary:v.scalar(2)},
  {kind:'nbase',integer:'-1',radix:16,width:32,signed:true},
  {kind:'statistics',rows:[{x:v.rational('1','3'),y:v.scalar(2),weight:3}]},
  {kind:'equation',components:[{label:'x',value:v.rational('1','3')},{label:'y',value:v.scalar(2)}]},
  {kind:'matrix',rows:1,columns:2,elements:[v.scalar(1),v.rational('1','3')]},
  {kind:'list',elements:[v.scalar(1),v.rational('1','3')]}];
test('all typed families survive evaluation identity, snapshot and display conversion without flattening',()=>{
  for(const value of samples){
    const saved=v.copy(value),result=core.evaluateTypedAst({kind:'symbol',name:'A'},{variables:{A:value}});
    assert.deepEqual(result,value);assert.notEqual(result,value);
    const view=v.view(value,'decimal');assert.equal(view.sourceKind,value.kind);assert.ok(view.components.length);
    assert.deepEqual(value,saved);
    const state=core.createInitialState();state.values.answer=value;
    assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(state)).values.answer,value);
  }
  assert.equal(v.view(samples[4]).components[0].text,'FFFFFFFF');
  assert.equal(v.view(samples[7]).components[1].label,'1,2');
  assert.equal(Object.is(v.copy(samples[0]).value,-0),true);
  const huge=10n**400n;
  assert.equal(v.toNumber(v.rational((huge+1n).toString(),huge.toString())),1);
});
test('rational AST arithmetic stays exact across evaluation, result rotation and memory',()=>{
  const ast=core.semanticEditor.parseTokens(core.semanticEditor.tokenize('1/3+1/6'));
  assert.deepEqual(core.evaluateTypedAst(ast),v.rational('1','2'));
  let s=core.createInitialState();for(const key of ['1','/','3','Enter'])s=core.reduceCalculator(s,{type:'keyboard',key});
  assert.deepEqual(s.values.answer,v.rational('1','3'));
  const mode=s.resultMode;
  s=core.reduceCalculator(s,{type:'button',action:'fraction'});assert.notEqual(s.resultMode,mode);assert.deepEqual(s.values.answer,v.rational('1','3'));
  s=core.reduceCalculator(s,{type:'button',action:'memory-add'});assert.deepEqual(s.values.memory,v.rational('1','3'));
  assert.deepEqual(s.values.history,[v.rational('1','3')]);
});
test('invalid tagged values, fixed-width overflow and implicit structured coercion reject',()=>{
  for(const bad of [{kind:'rational',numerator:'1',denominator:'0'},{kind:'matrix',rows:2,columns:2,elements:[]},
    {kind:'dms',sign:1,degrees:1,minutes:60,seconds:0},{kind:'nbase',integer:'128',radix:2,width:8,signed:true},
    {kind:'scalar',value:1,html:'unsafe'}])assert.throws(()=>v.copy(bad));
  assert.throws(()=>v.toNumber(samples[7]),/cannot be coerced/);
  assert.throws(()=>core.evaluateTypedAst(core.semanticEditor.parseTokens(core.semanticEditor.tokenize('A+1')),{variables:{A:samples[7]}}),/pending/);
});
test('typed history keeps each value when the bounded legacy history rolls over',()=>{
  let s=core.createInitialState();
  for(let n=1;n<=30;n++){
    s=core.reduceCalculator(s,{type:'button',action:'clear'});
    for(const key of `${n}/3`)s=core.reduceCalculator(s,{type:'keyboard',key});
    s=core.reduceCalculator(s,{type:'keyboard',key:'Enter'});
  }
  assert.equal(s.values.history.length,25);
  for(let i=0;i<25;i++)assert.deepEqual(s.values.history[i],v.rational(String(i+6),'3'));
});
