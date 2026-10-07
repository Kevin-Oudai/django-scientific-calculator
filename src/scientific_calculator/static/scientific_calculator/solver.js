(function(root,factory){if(typeof module==='object'&&module.exports&&typeof document==='undefined')module.exports=factory();else root.ScientificCalculatorSolver=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Bounded Newton iteration with a symmetric finite difference. The simulator
  // does not expose its private iteration limit; these bounds keep UI work finite.
  function solve(evaluate,start,dx,seed=0){
    if(!Number.isFinite(start)||!Number.isFinite(dx)||dx<=0)throw new RangeError('Solver interval');
    let x=start===0&&seed!==0?seed:start,lastStep=Infinity;
    for(let iteration=0;iteration<100;iteration++){
      const y=evaluate(x);if(!Number.isFinite(y))throw new RangeError('Solver domain');
      if(y===0||Math.abs(y)<=1e-12&&(iteration===0||lastStep<=1e-8*Math.max(1,Math.abs(x))))return x===0?0:x;
      const h=Math.max(dx,Math.abs(x)*Number.EPSILON*16);
      const derivative=(evaluate(x+h)-evaluate(x-h))/(2*h);
      if(!Number.isFinite(derivative))throw new RangeError('Solver derivative');
      if(derivative===0){x+=h;continue;}
      const candidate=x-y/derivative;
      if(!Number.isFinite(candidate)||Math.abs(candidate)>=1e100)throw new RangeError('Solver range');
      if(Math.abs(candidate-x)<=1e-12*Math.max(1,Math.abs(candidate))){
        if(Math.abs(evaluate(candidate))<=1e-9)return candidate===0?0:candidate;
        throw new RangeError('Solver did not converge');
      }
      lastStep=Math.abs(candidate-x);x=candidate;
    }
    throw new RangeError('Solver iteration limit');
  }
  return Object.freeze({solve});
});
