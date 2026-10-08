const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const core=require(root+'core'),v=require(root+'values'),cat=require(root+'catalogues'),stats=require(root+'statistics'),eq=require(root+'equations'),z=require(root+'complex'),m=require(root+'matrices'),l=require(root+'lists');
let seed=0x506;const integer=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%19-9;};
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} ≈ ${b}`);
test('Seeded arithmetic, exact fractions and conversions satisfy inverse properties',()=>{
 for(let i=0;i<100;i++){const a=integer(),b=integer()||1,d=Math.abs(integer())+1;
  near(core.evaluateExpression(`(${a}+${b})-${b}`,'DEG',0),a);
  const fraction=v.rational(String(a),String(d));assert.deepEqual(v.binary('-',v.binary('+',fraction,v.rational(String(b),'7')),v.rational(String(b),'7')),fraction);
  for(let index=1;index<=44;index+=2)near(cat.convert(cat.convert(a,index),index+1),a);
 }
});
test('Seeded weighted statistics obey translation and scale invariants',()=>{
 for(let i=0;i<100;i++){const rows=Array.from({length:5},()=>({x:integer(),y:null,weight:Math.abs(integer())+1})),offset=integer();const before=stats.calculate(rows),after=stats.calculate(rows.map(r=>({...r,x:r.x+offset})));
  near(after['mean-x'],before['mean-x']+offset);near(after['sample-deviation-x'],before['sample-deviation-x']);
  const scaled=stats.calculate(rows.map(r=>({...r,x:r.x*3})));near(scaled['sample-deviation-x'],3*before['sample-deviation-x']);
 }
});
test('Seeded polynomial roots satisfy their original equations',()=>{
 for(let i=0;i<100;i++){const a=integer(),b=integer(),c=integer();const coefficients=[1,-(a+b+c),a*b+a*c+b*c,-a*b*c];
  for(const r of eq.cubic(coefficients)){near(r.imaginary,0);near(((r.real+coefficients[1])*r.real+coefficients[2])*r.real+coefficients[3],0);}
 }
});
test('Seeded complex and matrix operations obey round trip and identity properties',()=>{
 for(let i=0;i<100;i++){const a=z.z(integer(),integer()),b=z.z(integer()||1,integer());const restored=z.divide(z.multiply(a,b),b);near(restored.real,a.real);near(restored.imaginary,a.imaginary);
  const p=z.polar(a,'DEG'),r=z.rectangular(p.radius,p.angle,'DEG');near(r.real,a.real);near(r.imaginary,a.imaginary);
  const matrix=m.matrix(2,2,Array.from({length:4},integer));assert.deepEqual(m.transpose(m.transpose(matrix)),matrix);assert.deepEqual(m.multiply(matrix,m.identity(2)),matrix);
  if(m.determinant(matrix)!==0)m.multiply(matrix,m.inverse(matrix)).data.forEach((x,k)=>near(x,k%3===0?1:0));
 }
});
test('Seeded lists preserve multisets and cumulative differences, and dot products are symmetric',()=>{
 for(let i=0;i<100;i++){const a=Array.from({length:8},integer),b=Array.from({length:8},integer);assert.deepEqual(l.sort(l.sort(a,true)),l.sort(a));assert.deepEqual(l.difference(l.cumulative(a)),a.slice(1));near(l.inner(a,b),l.inner(b,a));near(l.aggregate('lsum',a),l.aggregate('lsum',l.sort(a)));}
});
