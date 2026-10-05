const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.resolve(__dirname,'../../src/scientific_calculator/static/scientific_calculator');
const core=require(path.join(dir,'core.js')),entry=require(path.join(dir,'calculator.js')),formatting=require(path.join(dir,'formatting.js'));
test('compatible Node entry exports the same DOM-independent core and formatter',()=>{
  assert.equal(entry,core);
  assert.equal(typeof require(path.join(dir,'browser-adapter.js')).mount,'function');
  const sandbox={document:new Proxy({}, {get(){throw new Error('Unexpected DOM dependency');}}),module:{exports:{host:true}},structuredClone,
    ScientificCalculatorSemantic:core.semanticEditor,ScientificCalculatorValues:core.valueTypes,
    ScientificCalculatorEngine:require(path.join(dir,'math-engine.js')),ScientificCalculatorNumericModel:core.numericModel,ScientificCalculatorFormatting:formatting};
  vm.runInNewContext(fs.readFileSync(path.join(dir,'core.js'),'utf8'),sandbox);
  assert.deepEqual(sandbox.module.exports,{host:true});
  assert.equal(sandbox.ScientificCalculatorCore.evaluateExpression('1+2','DEG',0),3);
  assert.equal(sandbox.ScientificCalculatorCore.createInitialState().lifecycle,'empty');
  const reference=require('../reference/el506ts/experiments/module-addition.json');
  let state=core.createInitialState();
  for(const id of reference.sequence)state=core.reduceCalculator(state,{type:'physical-key',id});
  assert.equal(state.answer,Number(reference.frames.at(-1).result.value.value));
});
test('pure display projection escapes entry text and preserves state and templates',()=>{
  const state=core.createInitialState();state.displayExpression='<img src=x onerror=alert(1)>';
  const saved=structuredClone(state),view=formatting.renderState(state);
  assert.ok(view.expressionHtml.includes('&lt;'));assert.ok(!view.expressionHtml.includes('<img'));
  assert.deepEqual(state,saved);
  state.stagedEntry={type:'fraction',numerator:'1',denominator:'',part:'denominator'};
  const template=formatting.renderState(state);
  assert.ok(template.resultHtml.includes('scicalc__fraction-template-part is-active'));
  assert.ok(template.resultHtml.includes('□'));
  assert.equal(formatting.formatValue(1/3),core.formatValue(1/3));
});
