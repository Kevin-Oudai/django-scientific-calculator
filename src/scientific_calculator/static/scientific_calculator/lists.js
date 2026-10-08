(function(host,factory){const api=factory();if(typeof module==='object'&&module.exports&&typeof document==='undefined')module.exports=api;else host.ScientificCalculatorLists=api;})(globalThis,function(){
 'use strict';
 const fail=code=>{const e=new RangeError('List error '+code);e.code=code;throw e;};
 const finite=x=>{if(!Number.isFinite(x)||Math.abs(x)>=1e100)fail(2);return Math.abs(x)<1e-99?0:x;};
 function size(n){if(!Number.isInteger(n)||n<1||n>16)fail(7);return n;}
 function list(a){size(a.length);return a.map(finite);}
 const fill=(x,n)=>Array(size(n)).fill(finite(x));
 const dimension=(a,n)=>fill(0,n);
 function pair(a,b,operation){if(a.length!==b.length)fail(8);return list(a.map((x,i)=>operation(x,b[i])));}
 const cumulative=a=>{let sum=0;return list(a.map(x=>sum=finite(sum+x)));};
 const difference=a=>{if(a.length<2)fail(7);return list(a.slice(1).map((x,i)=>x-a[i]));};
 const sort=(a,descending=false)=>list([...a].sort((x,y)=>descending?y-x:x-y));
 const augment=(a,b)=>list([...a,...b]);
 function aggregate(name,a){list(a);const sum=a.reduce((s,x)=>finite(s+x),0),mean=sum/a.length;
  if(name==='lmin')return Math.min(...a);if(name==='lmax')return Math.max(...a);if(name==='lmean')return finite(mean);if(name==='lsum')return sum;
  if(name==='lprod')return a.reduce((s,x)=>finite(s*x),1);
  if(name==='lmed'){const b=sort(a),i=Math.floor(a.length/2);return finite(a.length%2?b[i]:(b[i-1]+b[i])/2);}
  if(name==='lstd'||name==='lvar'){if(a.length<2)fail(2);const variance=finite(a.reduce((s,x)=>finite(s+finite((x-mean)**2)),0)/(a.length-1));return name==='lstd'?finite(Math.sqrt(variance)):variance;}
  if(name==='labs')return finite(Math.hypot(...a));fail(7);
 }
 const inner=(a,b)=>pair(a,b,(x,y)=>finite(x*y)).reduce((s,x)=>finite(s+x),0);
 function outer(a,b){if(a.length!==3||b.length!==3)fail(8);return list([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]);}
 function evaluate(ast,semantic,scalar,scope){return semantic.evaluate(ast,{
  number:text=>finite(Number(text)),symbol:name=>/^L[1-4]$/.test(name)?scope.lists[Number(name[1])-1]||fail(10):scalar.symbol(name,scope),
  unary:(op,a)=>Array.isArray(a)?list(a.map(x=>op==='-'?-x:x)):op==='-'?-a:a,
  binary:(op,a,b)=>{const al=Array.isArray(a),bl=Array.isArray(b);if(!al&&!bl)return finite(scalar.binary(op,a,b));if((op==='+'||op==='-')&&al!==bl||op==='/'&&!al&&bl)fail(1);const operation=(x,y)=>finite(scalar.binary(op,x,y));return al&&bl?pair(a,b,operation):list((al?a:b).map(x=>al?operation(x,b):operation(a,x)));},
  call:(name,args)=>{const [a,b]=args;if(name==='lsortA'||name==='lsortD')return sort(a,name==='lsortD');if(name==='ldim')return dimension(a,b);if(name==='lfill')return fill(a,b);if(name==='lcumul')return cumulative(a);if(name==='ldiff')return difference(a);if(name==='laug')return augment(a,b);if(name==='linner')return inner(a,b);if(name==='louter')return outer(a,b);if(['lmin','lmax','lmean','lmed','lsum','lprod','lstd','lvar','labs'].includes(name))return aggregate(name,a);return Array.isArray(a)?list(a.map(x=>finite(scalar.call(name,[x,...args.slice(1)],scope)))):finite(scalar.call(name,args,scope));}
 },scope);}
 return Object.freeze({size,list,fill,dimension,pair,cumulative,difference,sort,augment,aggregate,inner,outer,evaluate});
});
