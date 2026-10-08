(function(host,factory){const api=factory();if(typeof module==='object'&&module.exports&&typeof document==='undefined')module.exports=api;else host.ScientificCalculatorStatistics=api;})(globalThis,function(){
 'use strict';
 const finite=x=>{if(!Number.isFinite(x)||Math.abs(x)>=1e100)throw new RangeError('Statistics range');return Math.abs(x)<1e-99?0:x;};
 const sum=items=>{let total=0,correction=0;for(const item of items){const y=item-correction,t=total+y;correction=(t-total)-y;total=t;}return finite(total);};
 function calculate(rows,mode='SD',options={}){
  if(!['SD','LINE','QUAD','EXP','LOG','PWR','INV'].includes(mode))throw new TypeError('Statistics submode');
  const data=rows.map(r=>{let x=r.x,y=r.y;if(!Number.isFinite(x)||!Number.isFinite(r.weight)||r.weight===0||mode!=='SD'&&!Number.isFinite(y))throw new RangeError('Invalid observation');
   if(['LOG','PWR'].includes(mode)){if(x<=0)throw new RangeError('Positive X required');x=Math.log(x);}
   if(['EXP','PWR'].includes(mode)){if(y<=0)throw new RangeError('Positive Y required');y=Math.log(y);}
   if(mode==='INV'){if(x===0)throw new RangeError('Nonzero X required');x=1/x;}
   return {x,y,w:r.weight};});
  const xSum=options.xSum||sum;
  const n=sum(data.map(r=>r.w)),sx=xSum(data.map(r=>r.w*r.x)),sxx=sum(data.map(r=>r.w*r.x*r.x));
  const out={'count-n':n,'sum-x':sx,'sum-x-squared':sxx};
  if(n===0)return out;
  out['mean-x']=finite(sx/n);
  const xx=sum(data.map(r=>r.w*(r.x-out['mean-x'])**2));
  if(xx/n>=0)out['population-deviation-x']=Math.sqrt(xx/n);
  if(n!==1&&xx/(n-1)>=0)out['sample-deviation-x']=Math.sqrt(xx/(n-1));
  if(mode==='SD')return out;
  const sy=(options.ySum||sum)(data.map(r=>r.w*r.y)),syy=sum(data.map(r=>r.w*r.y*r.y)),sxy=sum(data.map(r=>r.w*r.x*r.y));
  Object.assign(out,{'sum-y':sy,'sum-y-squared':syy,'sum-xy':sxy,'mean-y':finite(sy/n)});
  const yy=sum(data.map(r=>r.w*(r.y-out['mean-y'])**2)),xy=sum(data.map(r=>r.w*(r.x-out['mean-x'])*(r.y-out['mean-y'])));
  if(yy/n>=0)out['population-deviation-y']=Math.sqrt(yy/n);
  if(n!==1&&yy/(n-1)>=0)out['sample-deviation-y']=Math.sqrt(yy/(n-1));
  if(mode==='QUAD'){
   // Center and scale X before solving the weighted normal equations.
   const center=out['mean-x'],scale=Math.max(...data.map(r=>Math.abs(r.x-center)));
   if(!scale)return out;
   const moments=Array.from({length:5},(_,p)=>sum(data.map(r=>r.w*((r.x-center)/scale)**p)));
   const rhs=Array.from({length:3},(_,p)=>sum(data.map(r=>r.w*r.y*((r.x-center)/scale)**p)));
   const matrix=Array.from({length:3},(_,i)=>[...Array.from({length:3},(_,j)=>moments[i+j]),rhs[i]]);
   for(let k=0;k<3;k++){let pivot=k;for(let i=k+1;i<3;i++)if(Math.abs(matrix[i][k])>Math.abs(matrix[pivot][k]))pivot=i;
    if(Math.abs(matrix[pivot][k])<=Number.EPSILON*Math.max(1,Math.abs(n))*32)return out;
    [matrix[k],matrix[pivot]]=[matrix[pivot],matrix[k]];const divisor=matrix[k][k];for(let j=k;j<4;j++)matrix[k][j]/=divisor;
    for(let i=0;i<3;i++)if(i!==k){const factor=matrix[i][k];for(let j=k;j<4;j++)matrix[i][j]-=factor*matrix[k][j];}}
   const c=matrix[2][3]/scale**2,b=matrix[1][3]/scale-2*c*center,a=matrix[0][3]-matrix[1][3]*center/scale+c*center**2;
   Object.assign(out,{'coefficient-a':finite(a),'coefficient-b':finite(b),'coefficient-c':finite(c)});
  }else if(xx!==0){const b=finite(xy/xx),a=finite(out['mean-y']-b*out['mean-x']);
   Object.assign(out,{'coefficient-a':finite(['EXP','PWR'].includes(mode)?Math.exp(a):a),'coefficient-b':b});
   if(xx*yy>0)out['correlation-r']=finite(xy/Math.sqrt(xx*yy));}
  return out;
 }
 function result(rows,mode,name,options){const result=calculate(rows,mode,options);if(!Object.hasOwn(result,name))throw new RangeError('Undefined statistical result');return finite(result[name]);}
 function estimate(rows,mode,direction,value,second=false){
  const s=calculate(rows,mode),a=s['coefficient-a'],b=s['coefficient-b'],c=s['coefficient-c'];
  if(a===undefined||b===undefined)throw new RangeError('Undefined regression');
  let answer;
  if(direction==='y'){if(mode==='LINE')answer=a+b*value;else if(mode==='QUAD')answer=a+b*value+c*value**2;else if(mode==='EXP')answer=a*Math.exp(b*value);else if(mode==='LOG'){if(value<=0)throw new RangeError('Positive X required');answer=a+b*Math.log(value);}else if(mode==='PWR'){if(value<=0)throw new RangeError('Positive X required');answer=a*value**b;}else if(mode==='INV')answer=a+b/value;else throw new RangeError('Regression required');}
  else {if(b===0&&mode!=='QUAD')throw new RangeError('Constant regression');if(mode==='LINE')answer=(value-a)/b;else if(mode==='QUAD'){if(c===0){if(b===0)throw new RangeError('Constant regression');answer=(value-a)/b;}else{const discriminant=b*b-4*c*(a-value);if(discriminant<0)throw new RangeError('No real estimate');answer=(-b+(second?-1:1)*Math.sqrt(discriminant))/(2*c);}}else if(mode==='EXP'){if(value/a<=0)throw new RangeError('Positive Y required');answer=Math.log(value/a)/b;}else if(mode==='LOG')answer=Math.exp((value-a)/b);else if(mode==='PWR'){if(value/a<=0)throw new RangeError('Positive Y required');answer=(value/a)**(1/b);}else if(mode==='INV')answer=b/(value-a);else throw new RangeError('Regression required');}
  return finite(answer);
 }
 // Integrate the normal density by its convergent power series, using symmetry
 // in the tails. Probability commands expose six decimal places on the device.
 function probability(kind,t){
  if(!Number.isFinite(t))throw new RangeError('Probability argument');
  const x=Math.abs(t);let area;
  if(x>=9)area=.5;else {let term=x,total=x;for(let k=1;k<300;k++){term*=x*x/(2*k+1);total+=term;if(Math.abs(term)<Math.abs(total)*1e-16)break;}area=Math.exp(-x*x/2)*total/Math.sqrt(2*Math.PI);}
  const p=.5+(t<0?-area:area),value=kind==='P'?p:kind==='Q'?area:kind==='R'?1-p:null;
  if(value===null)throw new TypeError('Probability function');return Math.round(Math.max(0,Math.min(1,value))*1e6)/1e6;
 }
 return Object.freeze({calculate,result,estimate,probability});
});
