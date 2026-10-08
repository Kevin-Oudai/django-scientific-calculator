(function(host,factory){const api=factory();if(typeof module==='object'&&module.exports&&typeof document==='undefined')module.exports=api;else host.ScientificCalculatorEquations=api;})(globalThis,function(){
 'use strict';
 const bounded=x=>{if(!Number.isFinite(x)||Math.abs(x)>=1e100)throw new RangeError('Equation range');return Math.abs(x)<1e-99?0:x;};
 const complex=(real,imaginary=0)=>({real:bounded(real),imaginary:bounded(imaginary)});
 function linear(coefficients,size){
  if(![2,3].includes(size)||!Array.isArray(coefficients)||coefficients.length!==size*(size+1))throw new TypeError('Linear coefficients');coefficients.forEach(bounded);
  const a=Array.from({length:size},(_,i)=>coefficients.slice(i*(size+1),(i+1)*(size+1))),scale=a.map(row=>Math.max(...row.slice(0,size).map(Math.abs)));
  let determinant=1;
  for(let k=0;k<size;k++){let p=k;for(let i=k+1;i<size;i++)if((Math.abs(a[i][k])/(scale[i]||1))>(Math.abs(a[p][k])/(scale[p]||1)))p=i;
   if(a[p][k]===0)throw new RangeError('Singular equation');
   if(p!==k){[a[k],a[p]]=[a[p],a[k]];[scale[k],scale[p]]=[scale[p],scale[k]];determinant=-determinant;}
   const diagonal=a[k][k];determinant=bounded(determinant*diagonal);
   for(let i=k+1;i<size;i++){const factor=a[i][k]/diagonal;for(let j=k+1;j<=size;j++)a[i][j]=bounded(a[i][j]-factor*a[k][j]);a[i][k]=0;}}
  const result=Array(size).fill(0);for(let i=size-1;i>=0;i--){let right=a[i][size];for(let j=i+1;j<size;j++)right=bounded(right-a[i][j]*result[j]);result[i]=bounded(right/a[i][i]);}
  if(determinant===0)throw new RangeError('Zero determinant');return {solutions:result.map(x=>complex(x)),determinant};
 }
 function quadratic([a,b,c]){
  [a,b,c].forEach(bounded);if(a===0)throw new RangeError('Zero leading coefficient');
  const discriminant=bounded(bounded(b*b)-bounded(4*a*c));
  if(discriminant<0){const real=-b/(2*a),imaginary=Math.sqrt(-discriminant)/(2*Math.abs(a));return [complex(real,imaginary),complex(real,-imaginary)];}
  const root=Math.sqrt(discriminant),q=-.5*(b+(b<0?-root:root));
  if(root===0)return [complex(-b/(2*a)),complex(-b/(2*a))];
  const first=q/a,second=c/q;return (b<0?[first,second]:[second,first]).map(x=>complex(x));
 }
 function cubic([a,b,c,d]){
  [a,b,c,d].forEach(bounded);if(a===0)throw new RangeError('Zero leading coefficient');
  const A=bounded(b/a),B=bounded(c/a),C=bounded(d/a),p=bounded(B-A*A/3),q=bounded(2*A**3/27-A*B/3+C),discriminant=bounded((q/2)**2+(p/3)**3),offset=A/3;
  let roots;
  if(discriminant>0){const u=Math.cbrt(-q/2+Math.sqrt(discriminant)),v=u!==0?-p/(3*u):Math.cbrt(-q/2-Math.sqrt(discriminant)),real=u+v;
   roots=[complex(real-offset),complex(-real/2-offset,Math.sqrt(3)/2*(u-v)),complex(-real/2-offset,-Math.sqrt(3)/2*(u-v))];}
  else if(p===0){const root=Math.cbrt(-q)-offset;roots=[complex(root),complex(root),complex(root)];}
  else if(discriminant===0){const u=Math.cbrt(-q/2);roots=[complex(2*u-offset),complex(-u-offset),complex(-u-offset)];}
  else {const angle=Math.acos(Math.max(-1,Math.min(1,-q/(2*Math.sqrt(-((p/3)**3)))))),radius=2*Math.sqrt(-p/3);roots=Array.from({length:3},(_,k)=>complex(radius*Math.cos((angle+2*[1,0,2][k]*Math.PI)/3)-offset));}
  // Refine isolated real roots; repeated and complex roots keep their analytic values.
  for(const r of roots)if(r.imaginary===0){for(let i=0;i<3;i++){const derivative=(3*a*r.real+2*b)*r.real+c;if(derivative===0)break;const residual=((a*r.real+b)*r.real+c)*r.real+d;const next=r.real-residual/derivative;if(!Number.isFinite(next))break;r.real=bounded(next);}}
  return roots;
 }
 return Object.freeze({linear,quadratic,cubic});
});
