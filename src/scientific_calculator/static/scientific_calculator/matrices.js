(function(host,factory){const api=factory();if(typeof module==='object'&&module.exports&&typeof document==='undefined')module.exports=api;else host.ScientificCalculatorMatrices=api;})(globalThis,function(){
 'use strict';
 const fail=code=>{const e=new RangeError('Matrix error '+code);e.code=code;throw e;};
 const finite=x=>{if(!Number.isFinite(x)||Math.abs(x)>=1e100)fail(2);return Math.abs(x)<1e-99?0:x;};
 function dimensions(rows,columns){if(!Number.isInteger(rows)||!Number.isInteger(columns)||rows<1||columns<1)fail(7);if(rows>4||columns>4)fail(9);}
 function matrix(rows,columns,data){dimensions(rows,columns);if(data.length!==rows*columns)fail(8);return {rows,columns,data:data.map(finite)};}
 const fill=(value,rows,columns)=>{dimensions(rows,columns);return matrix(rows,columns,Array(rows*columns).fill(finite(value)));};
 const identity=n=>{dimensions(n,n);return matrix(n,n,Array.from({length:n*n},(_,i)=>i%(n+1)===0?1:0));};
 const transpose=a=>matrix(a.columns,a.rows,Array.from({length:a.data.length},(_,i)=>a.data[(i%a.rows)*a.columns+Math.floor(i/a.rows)]));
 function add(a,b,sign=1){if(a.rows!==b.rows||a.columns!==b.columns)fail(8);return matrix(a.rows,a.columns,a.data.map((x,i)=>x+sign*b.data[i]));}
 const scale=(a,n)=>matrix(a.rows,a.columns,a.data.map(x=>x*n));
 function multiply(a,b){if(a.columns!==b.rows)fail(8);return matrix(a.rows,b.columns,Array.from({length:a.rows*b.columns},(_,i)=>{const r=Math.floor(i/b.columns),c=i%b.columns;let sum=0;for(let k=0;k<a.columns;k++)sum=finite(sum+finite(a.data[r*a.columns+k]*b.data[k*b.columns+c]));return sum;}));}
 function elimination(a,inverse=false){if(a.rows!==a.columns)fail(8);const n=a.rows,rows=Array.from({length:n},(_,i)=>a.data.slice(i*n,(i+1)*n).concat(inverse?Array.from({length:n},(_,j)=>i===j?1:0):[]));let determinant=1;
  for(let k=0;k<n;k++){let p=k;for(let i=k+1;i<n;i++)if(Math.abs(rows[i][k])>Math.abs(rows[p][k]))p=i;if(rows[p][k]===0){if(inverse)fail(2);return 0;}
   if(p!==k){[rows[p],rows[k]]=[rows[k],rows[p]];determinant=-determinant;}const pivot=rows[k][k];determinant=finite(determinant*pivot);
   if(inverse){for(let j=0;j<2*n;j++)rows[k][j]=finite(rows[k][j]/pivot);for(let i=0;i<n;i++)if(i!==k){const f=rows[i][k];for(let j=0;j<2*n;j++)rows[i][j]=finite(rows[i][j]-f*rows[k][j]);}}
   else for(let i=k+1;i<n;i++){const f=rows[i][k]/pivot;for(let j=k+1;j<n;j++)rows[i][j]=finite(rows[i][j]-f*rows[k][j]);rows[i][k]=0;}}
  return inverse?matrix(n,n,rows.flatMap(r=>r.slice(n))):determinant;
 }
 function power(a,n){if(!Number.isInteger(n)||Math.abs(n)>100000)fail(7);if(a.rows!==a.columns)fail(8);if(n<0){a=elimination(a,true);n=-n;}let result=identity(a.rows);while(n){if(n%2)result=multiply(result,a);n=Math.floor(n/2);if(n)a=multiply(a,a);}return result;}
 const dimension=(a,rows,columns)=>{dimensions(rows,columns);return matrix(rows,columns,Array.from({length:rows*columns},(_,i)=>{const r=Math.floor(i/columns),c=i%columns;return r<a.rows&&c<a.columns?a.data[r*a.columns+c]:0;}));};
 const cumulative=a=>{const sums=Array(a.columns).fill(0);return matrix(a.rows,a.columns,a.data.map((x,i)=>sums[i%a.columns]=finite(sums[i%a.columns]+x)));};
 function augment(a,b){if(a.rows!==b.rows)fail(8);return matrix(a.rows,a.columns+b.columns,Array.from({length:a.rows},(_,r)=>a.data.slice(r*a.columns,(r+1)*a.columns).concat(b.data.slice(r*b.columns,(r+1)*b.columns))).flat());}
 function evaluate(ast,semantic,scalar,scope){return semantic.evaluate(ast,{
  number:text=>finite(Number(text)),symbol:name=>/^mat[A-D]$/.test(name)?scope.matrices[name.charCodeAt(3)-65]||fail(7):scalar.symbol(name,scope),
  unary:(op,a)=>typeof a==='number'?op==='-'?-a:a:op==='-'?scale(a,-1):a,
  binary:(op,a,b)=>{const am=typeof a==='object',bm=typeof b==='object';if(!am&&!bm)return finite(scalar.binary(op,a,b));if(op==='+'||op==='-'){if(!am||!bm)fail(8);return add(a,b,op==='+'?1:-1);}if(op==='*')return am&&bm?multiply(a,b):scale(am?a:b,am?b:a);if(op==='/'&&am&&!bm){if(!b)fail(2);return scale(a,1/b);}if(op==='^'&&am&&!bm)return power(a,b);fail(8);},
  call:(name,args)=>{const [a,b,c]=args;if(name==='det')return elimination(a);if(name==='trans')return transpose(a);if(name==='identity')return identity(a);if(name==='fill')return fill(a,b,c);if(name==='dim')return dimension(a,b,c);if(name==='cumul')return cumulative(a);if(name==='aug')return augment(a,b);if(name==='rndmat'){dimensions(a,b);return matrix(a,b,Array.from({length:a*b},()=>scope.random()));}if(args.some(x=>typeof x!=='number'))fail(8);return finite(scalar.call(name,args,scope));}
 },scope);}
 return Object.freeze({matrix,fill,identity,transpose,add,scale,multiply,determinant:a=>elimination(a),inverse:a=>elimination(a,true),power,dimension,cumulative,augment,evaluate});
});
