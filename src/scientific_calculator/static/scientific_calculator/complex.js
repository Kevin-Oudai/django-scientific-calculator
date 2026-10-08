(function(host,factory){const api=factory();if(typeof module==='object'&&module.exports&&typeof document==='undefined')module.exports=api;else host.ScientificCalculatorComplex=api;})(globalThis,function(){
 'use strict';
 const bounded=x=>{if(!Number.isFinite(x)||Math.abs(x)>=1e100)throw new RangeError('Complex range');return Math.abs(x)<1e-99?0:x;};
 const z=(real,imaginary=0)=>({real:bounded(real),imaginary:bounded(imaginary)});
 const add=(a,b)=>z(a.real+b.real,a.imaginary+b.imaginary);
 const negate=a=>z(-a.real,-a.imaginary);
 const multiply=(a,b)=>z(a.real*b.real-a.imaginary*b.imaginary,a.real*b.imaginary+a.imaginary*b.real);
 function divide(a,b){const scale=Math.max(Math.abs(b.real),Math.abs(b.imaginary));if(!scale)throw new RangeError('Complex zero divisor');const x=b.real/scale,y=b.imaginary/scale,d=x*x+y*y;return z((a.real/scale*x+a.imaginary/scale*y)/d,(a.imaginary/scale*x-a.real/scale*y)/d);}
 function power(a,b){if(b.imaginary||!Number.isInteger(b.real))throw new RangeError('Complex integer exponent');let n=b.real;if(Math.abs(n)>1e6)throw new RangeError('Complex exponent range');if(n<0){a=divide(z(1),a);n=-n;}let r=z(1);while(n){if(n%2)r=multiply(r,a);n=Math.floor(n/2);if(n)a=multiply(a,a);}return r;}
 const angleScale=mode=>mode==='RAD'?1:mode==='GRAD'?Math.PI/200:Math.PI/180;
 const polar=(a,mode)=>({radius:Math.hypot(a.real,a.imaginary),angle:Math.atan2(a.imaginary,a.real)/angleScale(mode)});
 const rectangular=(radius,angle,mode)=>{const r=angle*angleScale(mode),x=Math.cos(r),y=Math.sin(r);return z(radius*(Math.abs(x)<1e-15?0:x),radius*(Math.abs(y)<1e-15?0:y));};
 function evaluate(ast,semantic,scalar,scope){return semantic.evaluate(ast,{
  number:text=>z(Number(text)),symbol:name=>name==='i'?z(0,1):name==='ans'?scope.answer:name==='M'?scope.memory:z(scalar.symbol(name,scope)),
  unary:(op,a)=>op==='-'?negate(a):a,
  binary:(op,a,b)=>op==='+'?add(a,b):op==='-'?add(a,negate(b)):op==='*'?multiply(a,b):op==='/'?divide(a,b):power(a,b),
  call:(name,args)=>{if(name==='cpow'){if(args.some(a=>a.imaginary))throw new RangeError('Unavailable complex exponent');return z(scalar.binary('^',args[0].real,args[1].real));}if(name==='conj')return z(args[0].real,-args[0].imaginary);if(name==='polar'){if(args.some(a=>a.imaginary))throw new RangeError('Polar operand');return rectangular(args[0].real,args[1].real,scope.angleMode);}if(name==='abs')return z(Math.hypot(args[0].real,args[0].imaginary));if(args.some(a=>a.imaginary)||!['frac','dms'].includes(name))throw new TypeError('Unavailable complex function');return z(scalar.call(name,args.map(a=>a.real),scope));}
 },scope);}
 return Object.freeze({z,add,negate,multiply,divide,power,polar,rectangular,evaluate});
});
