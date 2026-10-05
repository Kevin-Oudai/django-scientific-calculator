(function(host,factory){
  if(typeof module==='object' && module.exports && typeof document==='undefined') module.exports=factory(require('./math-engine.js'));
  else host.ScientificCalculatorNumericModel=factory(host.ScientificCalculatorEngine);
})(globalThis,function(bundle){
  'use strict';
  const engine=bundle.createEngine({precision:64});
  const profile=Object.freeze({id:'el506-measured-arithmetic-v1',intermediateDigits:13,intermediateRounding:'truncate',minExponent:-99,maxExponent:99,negativeZero:'normalize-after-evaluation',fixRounding:'half-up'});
  const numericError=()=>{const error=new RangeError('EL506 Error 2');error.code='EL506-ERROR-2';return error;};
  function normalize(text) {
    const value=engine.quantize(text,13,'truncate');
    const magnitude=Math.abs(Number(value));
    if(!Number.isFinite(magnitude) || magnitude>=1e100) throw numericError();
    if(magnitude<1e-99) return '0';
    return value==='-0'?'0':value;
  }
  function binary(op,left,right) {
    if(!['+','-','*','/'].includes(op)) throw new TypeError('Unmeasured numerical operation');
    left=normalize(left);right=normalize(right);
    if(op==='/' && Number(right)===0) throw numericError();
    return normalize(engine.decimalBinary(op,left,right));
  }
  function evaluateAst(ast,semantic,scope={}) {
    return semantic.evaluate(ast,{
      number:normalize,
      symbol:name=>{if(!Object.hasOwn(scope,name))throw new TypeError('Unmeasured numeric binding');return normalize(scope[name]);},
      unary:(op,value)=>normalize(op==='-'?engine.decimalBinary('*',value,'-1'):value),
      binary,
      call:()=>{throw new TypeError('Function accuracy requires its later numerical probes');},
    });
  }
  function fix(text,places) {return engine.decimalPlaces(normalize(text),places,'half-up');}
  function normMeasured(text) {
    text=normalize(text);const magnitude=Math.abs(Number(text));
    if(magnitude && (magnitude<0.1 || magnitude>=1e10)) throw new TypeError('NORM scientific formatting requires its later probes');
    const integerDigits=magnitude<1?1:Math.floor(Math.log10(magnitude))+1;
    const value=engine.decimalPlaces(text,10-integerDigits,'truncate').replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,'');
    return value.includes('.')?value:value+'.';
  }
  return Object.freeze({profile,normalize,binary,evaluateAst,fix,normMeasured});
});
