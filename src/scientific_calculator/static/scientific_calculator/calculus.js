(function(host,factory){
  if(typeof module==='object'&&module.exports&&typeof document==='undefined')module.exports=factory();
  else host.ScientificCalculatorCalculus=factory();
})(globalThis,function(){
  'use strict';
  // The manual specifies a central difference and Simpson's rule (2*n panels).
  // Work is chunked by the controller so ON/C can interrupt integration.
  const MAX_N=10000, CHUNK=64;
  function finite(x){if(!Number.isFinite(x)||Math.abs(x)>=1e100)throw new RangeError('Calculus range');return Math.abs(x)<1e-99?0:x;}
  function defaultDx(x){return finite(x===0?1e-5:Number((Math.abs(x)*1e-5).toPrecision(14)));}
  function derivative(evaluate,x,dx,decimalEngine){
    finite(x);finite(dx);
    if(dx<=0||x+dx/2===x||x-dx/2===x)throw new RangeError('Unresolvable difference');
    const plus=finite(evaluate(finite(x+dx/2))),minus=finite(evaluate(finite(x-dx/2)));
    return finite(decimalEngine?Number(decimalEngine.decimalBinary('/',decimalEngine.decimalBinary('-',String(plus),String(minus)),String(dx))):(plus-minus)/dx);
  }
  function begin(a,b,n){
    finite(a);finite(b);
    if(!Number.isInteger(n)||n<1||n>MAX_N||a>b)throw new RangeError('Integration conditions');
    const h=finite((b-a)/(2*n));
    if(a!==b&&(h===0||a+h===a))throw new RangeError('Unresolvable interval');
    return {a,b,n,index:0,sum:0,compensation:0};
  }
  function validate(job){
    if(!job||Object.keys(job).sort().join(',')!=='a,b,compensation,index,n,sum')throw new TypeError('Invalid calculus job');
    begin(job.a,job.b,job.n);
    if(!Number.isInteger(job.index)||job.index<0||job.index>2*job.n+1||!Number.isFinite(job.sum)||!Number.isFinite(job.compensation))throw new TypeError('Invalid calculus progress');
  }
  function step(evaluate,previous){
    validate(previous);const job={...previous},N=2*job.n,h=(job.b-job.a)/N;
    if(job.a===job.b)return {done:true,value:0,job};
    const end=Math.min(N+1,job.index+CHUNK);
    for(;job.index<end;job.index++){
      const i=job.index,x=i===N?job.b:job.a+h*i;
      const term=finite(evaluate(x))*(i===0||i===N?1:i%2?4:2);
      // Compensated summation avoids introducing avoidable accumulated drift.
      const y=term-job.compensation,t=job.sum+y;
      job.compensation=(t-job.sum)-y;job.sum=t;
      if(!Number.isFinite(t))throw new RangeError('Integration overflow');
    }
    const done=job.index===N+1;
    return {done,job,...(done?{value:finite(job.sum*h/3)}:{})};
  }
  function condition(input,fallback){
    if(!input)return finite(fallback);
    if(!/^-?\d+(?:\.\d*)?(?:E-?\d{1,2})?(?:\/\d+(?:\.\d*)?){0,2}$/.test(input))throw new SyntaxError('Numeric condition required');
    const parts=input.split('/').map(Number);
    if(parts.slice(1).some(x=>x===0))throw new RangeError('Fraction denominator');
    return finite(parts.length===1?parts[0]:parts.length===2?parts[0]/parts[1]:(input.startsWith('-')?-1:1)*(Math.abs(parts[0])+parts[1]/parts[2]));
  }
  return Object.freeze({MAX_N,CHUNK,finite,defaultDx,derivative,begin,step,validate,condition});
});
