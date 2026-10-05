const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../../src/scientific_calculator/static/scientific_calculator/calculator.js');
const {numericModel:model,semanticEditor:semantic}=core;
const evidence=name=>require('../reference/el506ts/experiments/numeric-'+name+'.json');
const displayed=(name,step)=>evidence(name).frames.find(f=>f.after_step===step).result.value.value;
const ast=source=>semantic.parseTokens(semantic.tokenize(source));
test('simulator numerical golden cancellation frames select per-operation decimal quantization',()=>{
  for(const exponent of [11,12,13,14]){
    const scale='1'+'0'.repeat(exponent);
    assert.equal(model.evaluateAst(ast(scale+'+1-'+scale),semantic),displayed('precision-'+exponent,12));
  }
  for(const digit of [5,6])assert.equal(model.evaluateAst(ast('10000000000000+'+digit+'-10000000000000'),semantic),displayed('intermediate-'+digit,12));
  assert.equal(core.evaluateExpression('10000000000000+1-10000000000000','DEG',0),1,'legacy profile remains characterized separately');
  assert.throws(()=>model.evaluateAst(ast('sin(1)'),semantic),/later numerical probes/);
});
test('simulator range, underflow and evaluated zero frames select bounded decimal normalization',()=>{
  assert.equal(Number(model.normalize('1e99')),Number(displayed('overflow',5)));
  assert.throws(()=>model.binary('*','1e99','10'),e=>e.code==='EL506-ERROR-2');
  assert.equal(model.normalize('1e-99'),displayed('underflow-zero',6));
  assert.equal(model.binary('/','1e-99','10'),displayed('underflow-zero',10));
  assert.equal(model.normalize('-0'),displayed('underflow-zero',12));
  assert.throws(()=>model.binary('/','1','0'),e=>e.code==='EL506-ERROR-2');
});
test('simulator NORM truncation and signed FIX ties use different display quantization',()=>{
  const seventh=model.binary('/','1','7');
  assert.equal(model.normMeasured(seventh),displayed('display-ties',4));
  assert.equal(model.fix(seventh,9),displayed('display-ties',7));
  assert.equal(model.fix(seventh,1),displayed('display-ties',10));
  assert.equal(model.fix(model.binary('/','5','4'),1),displayed('display-ties',14));
  assert.equal(model.fix(model.binary('/','-5','4'),1),displayed('display-ties',19));
  assert.equal(model.normMeasured('0'),'0.');
  assert.equal(model.normMeasured('10'),'10.');
  assert.throws(()=>model.normMeasured('1e99'),/later probes/);
  assert.throws(()=>model.fix('1',100),RangeError);
});
test('unmeasured error recovery is explicit rather than fabricated',()=>{
  const {validateExperiment}=require('../reference/el506ts/validate-experiment');
  const reference=structuredClone(evidence('overflow'));
  assert.deepEqual(validateExperiment(reference),[]);
  reference.errors[0].recovery_steps=[9];
  assert.ok(validateExperiment(reference).some(s=>s.includes('Unmeasured recovery')));
});
