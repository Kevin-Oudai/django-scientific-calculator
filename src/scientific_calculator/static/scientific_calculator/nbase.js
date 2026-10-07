(function(host,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports&&typeof document==='undefined')module.exports=api;
  else host.ScientificCalculatorNbase=api;
})(globalThis,function(){
  'use strict';
  const names={2:'BIN',5:'PEN',8:'OCT',10:'DEC',16:'HEX'};
  function modulus(radix){if(!Object.hasOwn(names,radix))throw new TypeError('Invalid base');return BigInt(radix)**10n;}
  function checked(n,radix){const m=modulus(radix),half=m/2n;if(n< -half||n>(m-1n)/2n)throw new RangeError('N-base overflow');return n;}
  function decode(n,radix){const m=modulus(radix);if(n<0n||n>=m)throw new RangeError('N-base digit overflow');return n>(m-1n)/2n?n-m:n;}
  function encode(n,radix){checked(n,radix);return (n<0n?n+modulus(radix):n).toString(radix).toUpperCase();}
  function typed(n,radix){checked(n,radix);return {kind:'nbase',integer:n.toString(),radix,width:Math.ceil(Math.log2(Number(modulus(radix)))),signed:true,digits:10};}
  function literal(text,radix){if(!text)throw new SyntaxError('Missing operand');if(text.length>10)throw new RangeError('N-base digit overflow');let n=0n;for(const c of text){const d=parseInt(c,16);if(!Number.isInteger(d)||d>=radix)throw new SyntaxError('Invalid digit');n=n*BigInt(radix)+BigInt(d);}return decode(n,radix);}
  const priority={OR:1,XOR:1,XNOR:1,AND:2,'+':3,'-':3,'*':4,':':4,'/':4};
  function tokens(source){const out=[];let i=0;while(i<source.length){if(/\s/.test(source[i])){i++;continue;}const rest=source.slice(i),word=rest.match(/^(XNOR|XOR|AND|OR|NOT|NEG|ans|\$[A-FXYM])/);if(word){out.push(word[0]);i+=word[0].length;continue;}if(/[0-9A-F]/.test(source[i])){let end=i+1;while(end<source.length&&/[0-9A-F]/.test(source[end])&&!/^(?:AND|OR|XOR|XNOR|NOT|NEG)/.test(source.slice(end)))end++;out.push(source.slice(i,end));i=end;continue;}if('+-*:/()'.includes(source[i])){out.push(source[i++]);continue;}throw new SyntaxError('Unavailable N-base function');}return out;}
  function evaluate(source,radix,stores={}){
    const t=tokens(source),m=modulus(radix);let i=0;
    const unsigned=n=>n<0n?n+m:n;
    function primary(){const token=t[i++];if(token==='('){const n=expression(0);if(t[i]===')')i++;else if(i<t.length)throw new SyntaxError('Missing parenthesis');return n;}if(['NOT','NEG','-','+'].includes(token)){const n=primary();return token==='NOT'?decode(m-1n-unsigned(n),radix):token==='NEG'||token==='-'?checked(-n,radix):n;}if(token==='ans'||token?.startsWith('$')){const n=stores[token==='ans'?'ANS':token.slice(1)];if(typeof n!=='bigint')throw new SyntaxError('Invalid memory');return checked(n,radix);}return literal(token,radix);}
    function implied(){let a=primary();while(t[i]==='('||t[i]?.startsWith('$')||t[i]==='ans'||t[i]==='NOT'||t[i]==='NEG')a=checked(a*primary(),radix);return a;}
    function expression(min){let a=implied();while(Object.hasOwn(priority,t[i])&&priority[t[i]]>=min){const op=t[i++],b=expression(priority[op]+1);if(op==='+')a=checked(a+b,radix);else if(op==='-')a=checked(a-b,radix);else if(op==='*')a=checked(a*b,radix);else if(op==='/'||op===':'){if(!b)throw new RangeError('Division by zero');a=checked(a/b,radix);}else {const x=unsigned(a),y=unsigned(b);a=decode(op==='AND'?x&y:op==='OR'?x|y:op==='XOR'?x^y:m-1n-(x^y),radix);}}return a;}
    const result=expression(0);if(i!==t.length)throw new SyntaxError('Unexpected input');return result;
  }
  return Object.freeze({names,modulus,checked,decode,encode,typed,literal,tokens,evaluate});
});
