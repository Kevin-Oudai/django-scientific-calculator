const test = require('node:test');
const assert = require('node:assert/strict');
const root = '../../src/scientific_calculator/static/scientific_calculator/';
const core = require(root + 'core');
const ledger = require('../reference/el506ts/capability-ledger.json');
const catalogue = require('../reference/el506ts/phase-7-catalogue-reference.json');
const digits = [45,40,41,42,35,36,37,30,31,32];
const press = (s,n,extra={}) => core.reduceCalculator(s,{type:'physical-key',id:`EL506-K${String(n).padStart(2,'0')}`,...extra});
const seq = (keys,s=core.createInitialState()) => keys.reduce((s,n)=>press(s,n),s);
const indexKeys = n => String(n).padStart(2,'0').split('').map(n=>digits[Number(n)]);
const typedList = data => ({kind:'list',elements:data.map(value=>({kind:'scalar',value}))});
const typedMatrix = (rows,columns,data) => ({kind:'matrix',rows,columns,elements:data.map(value=>({kind:'scalar',value}))});
function expression(mode,text,{list,matrix}={}) {
  let s=seq([4,mode]);
  if(mode===40)s=press(s,45);
  if(list)s.control.lists[0]=typedList(list);
  if(matrix)s.control.matrices[0]=typedMatrix(...matrix);
  // Seed the semantic expression, then use the real physical ENT dispatcher.
  // This bypasses repetitive operand typing, not calculation or error handling.
  s.expression=text;s.cursor=text.length;
  return press(s,48);
}
function checked(s,code=null) {
  assert.equal(s.control.errorCode,code);
  assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(s)),s);
  if(code!==null){const saved=structuredClone(s.control);const recovered=press(s,2);
    assert.equal(recovered.control.errorCode,null);
    assert.deepEqual(recovered.control.variables,saved.variables);
    assert.deepEqual(recovered.control.matrices,saved.matrices);
    assert.deepEqual(recovered.control.lists,saved.lists);
  }
  return s;
}

// Each row names an accepted edge and a rejected domain/range/syntax case.
// These assert application contracts; they do not claim independent native parity.
const scalarCases = [
  ['sin','sin(0)',0,'sin(1E10)',2],
  ['cos','cos(0)',1,'cos(1E10)',2],
  ['tan','tan(0)',0,'tan(90)',2],
  ['inverse sine','asin(1)',90,'asin(1.000000001)',2],
  ['inverse cosine','acos(1)',0,'acos(1.000000001)',2],
  ['inverse tangent','atan(0)',0,'atan()',1],
  ['sin hyperbolic','sinh(0)',0,'sinh(231)',2],
  ['cos hyperbolic','cosh(0)',1,'cosh(231)',2],
  ['tan hyperbolic','tanh(0)',0,'tanh()',1],
  ['inverse sin hyperbolic','asinh(0)',0,'asinh()',1],
  ['inverse cos hyperbolic','acosh(1)',0,'acosh(0)',2],
  ['inverse tan hyperbolic','atanh(0)',0,'atanh(1)',2],
  ['log','log(1)',0,'log(0)',2],
  ['ln','ln(1)',0,'ln(0)',2],
  ['square root','sqrt(0)',0,'sqrt(-1)',2],
  ['cube root','cbrt(-8)',-2,'cbrt()',1],
  ['reciprocal','1:1',1,'1:0',2],
  ['y^x','0^1',0,'0^(-1)',2],
  ['x^2','0^2',0,'1E50^2',2],
  ['x^3','0^3',0,'1E34^3',2],
  ['nth root','root(3,-8)',-2,'root(0,1)',2],
  ['10 to power x','10^(-99)',1e-99,'10^100',2],
  ['e to power x','epow(0)',1,'epow(231)',2],
  ['factorial','fact(0)',1,'fact(-1)',2],
  ['nCr','ncr(0,0)',1,'ncr(1,2)',2],
  ['nPr','npr(0,0)',1,'npr(1,2)',2],
  ['multiply','0*1',0,'1E99*10',2],
  ['divide','0:1',0,'1:0',2],
  ['add','1E-99+0',1e-99,'9E99+9E99',2],
  ['subtract','1E-99-0',1e-99,'(-9E99)-9E99',2],
];
for(const [name,good,value,bad,code] of scalarCases)test('Ledger boundary scalar: '+name,()=>{
  const accepted=checked(expression(45,good));assert.equal(accepted.answer,value);
  checked(expression(45,bad),code);
});

for(const row of catalogue.constants)test('Ledger boundary constant: '+row.id,()=>{
  let s=seq([3,41,...indexKeys(row.id),48]);checked(s);assert.equal(s.answer,Number(row.value));
  // Every constant remains usable as a denominator; zero denominator is rejected.
  s=seq([39,45,48],s);checked(s,2);assert.equal(s.answer,Number(row.value));
  const invalid=seq([3,41,32,32]);assert.notEqual(invalid.entry,String(row.value));
  assert.equal(invalid.workflow.payload.id,'CNST');
});
const conversionFactors=[2.54,1/2.54,.3048,1/.3048,.9144,1/.9144,1.609344,1/1.609344,1852,1/1852,4046.8564224,1/4046.8564224,28.349523125,1/28.349523125,.45359237,1/.45359237,5/9,9/5,3.785411784,1/3.785411784,4.54609,1/4.54609,29.5735295625,1/29.5735295625,28.4130625,1/28.4130625,1/4.184,4.184,1/4.1855,4.1855,1/4.1868,4.1868,745.69987158227,1/745.69987158227,735.49875,1/735.49875,98066.5,1/98066.5,101325,1/101325,133.32236842105,1/133.32236842105,9.80665,1/9.80665];
for(let id=1;id<=44;id++)test('Ledger boundary conversion: '+id,()=>{
  const zero=checked(seq([45,3,42,...indexKeys(id),48]));
  const expected=id===17?-160/9:id===18?32:0;
  assert.ok(Math.abs(zero.answer-expected)<1e-12);
  const large=checked(seq([32,24,32,32,3,42,...indexKeys(id),48]),conversionFactors[id-1]>10/9?2:null);
  if(large.control.errorCode===null)assert.ok(Number.isFinite(large.answer)&&Math.abs(large.answer)<1e100);
  checked(seq([33,3,42,...indexKeys(id),48]),1);
});

for(const [name,key] of [['A',18],['B',19],['C',20],['D',21],['E',22],['F',23],['X',27],['Y',28],['M',29]])test('Ledger boundary memory: '+name,()=>{
  const empty=seq([27,key]);assert.equal(empty.lastValue,0);
  let s=seq([47,40,24,32,32,28,key,2,27,key]);checked(s);assert.equal(s.lastValue,-1e99);
  const before=structuredClone(s.control.variables);
  s=seq([2,40,39,45,28,key],s);checked(s,2);assert.deepEqual(s.control.variables,before);
});

for(const cap of ledger.capabilities.filter(x=>x.family==='statistic'))test('Ledger boundary statistic: '+cap.id,()=>{
  const key=Number(cap.access.key_sequence.at(-1).slice(-2));
  const mode=key===38?41:40; // coefficient c requires QUAD; other paired quantities use LINE.
  const empty=seq([4,40,mode,27,key]);
  const sums=[45,46,47].includes(key);checked(empty,sums?null:2);
  if(sums)assert.equal(empty.lastValue,0);
  let s=seq([4,40,mode]);
  for(const [x,y] of [[1,2],[2,5],[3,10]])s=seq([digits[x],3,28,...String(y).split('').map(n=>digits[Number(n)]),29],s);
  s=seq([27,key],s);checked(s);assert.ok(Number.isFinite(s.lastValue));
  // Excess paired separators must reject atomically, for every result route.
  const rows=structuredClone(s.values.statistics.rows);
  s=seq([2,40,3,28,41,3,28,42,3,28,35,29],s);checked(s,1);assert.deepEqual(s.values.statistics.rows,rows);
});

const listCases=[
  ['sortA','lsortA(L1)',[1],'lsortA(1)',1],['sortD','lsortD(L1)',[1],'lsortD(1)',1],
  ['dim(','ldim(L1,16)',[1],'ldim(L1,17)',7],['fill(','lfill(1,16)',[1],'lfill(1,17)',7],
  ['cumul','lcumul(L1)',[0],'lcumul(1)',1],['df_list','ldiff(L1)',[1,1],'ldiff(L1)',7],
  ['aug(','laug(L1,L1)',Array(8).fill(1),'laug(L1,L1)',7],
  ...[['min','lmin'],['max','lmax'],['mean','lmean'],['med','lmed'],['sum','lsum'],['prod','lprod'],['abs','labs']].map(([n,f])=>[n,`${f}(L1)`,[0],`${f}(1)`,7]),
  ['stdDv','lstd(L1)',[1,1],'lstd(L1)',2],['vari','lvar(L1)',[1,1],'lvar(L1)',2],
  ['o_prod(','louter(L1,L1)',[0,0,0],'louter(L1,L1)',8],
  ['i_prod(','linner(L1,L1)',Array(16).fill(0),'linner(L1,lfill(0,1))',8],
];
for(const [name,good,list,bad,code] of listCases)test('Ledger boundary LIST: '+name,()=>{
  const accepted=checked(expression(36,good,{list}));assert.ok(accepted.values.last);
  const invalidList=name==='df_list'||name==='stdDv'||name==='vari'?[1]:name==='aug('?Array(9).fill(1):name==='o_prod('?[0,0]:list;
  checked(expression(36,bad,{list:invalidList}),code);
});
const matrixCases=[
  ['dim(','dim(matA,4,4)','dim(matA,5,1)',7],['fill(','fill(0,4,4)','fill(0,0,1)',7],
  ['cumul','cumul(matA)','cumul(1)',1],['aug(','aug(matA,matA)','aug(matA,fill(0,1,1))',8],
  ['identity','identity(4)','identity(5)',7],['rnd_mat(','rndmat(4,4)','rndmat(5,1)',7],
  ['det','det(matA)','det(fill(0,1,2))',8],['trans','trans(matA)','trans(1)',1],
];
for(const [name,good,bad,code] of matrixCases)test('Ledger boundary MAT: '+name,()=>{
  const options={matrix:[2,2,[1,0,0,1]]};checked(expression(35,good,options));checked(expression(35,bad,options),code);
});

for(const mode of [35,36])for(let slot=0;slot<4;slot++)test(`Ledger boundary collection slot: ${mode}/${slot}`,()=>{
  checked(seq([4,mode,17,45,digits[slot],48]),10);
  let s=seq([4,mode]);const saved=mode===35?typedMatrix(4,4,Array(16).fill(1)):typedList(Array(16).fill(1));
  (mode===35?s.control.matrices:s.control.lists)[slot]=saved;
  s=seq([17,45,digits[slot],48],s);checked(s);assert.deepEqual((mode===35?s.control.matrices:s.control.lists)[slot],saved);
});

for(let digit=0;digit<10;digit++)test('Ledger boundary decimal digit: '+digit,()=>{
  const atLimit=seq([...Array(9).fill(32),digits[digit]]);
  assert.equal(atLimit.entry,'999999999'+digit);
  const rejected=press(atLimit,digits[digit]);assert.equal(rejected.entry,atLimit.entry);
  assert.equal(rejected.stagedEntry,null);checked(press(rejected,48));
});
for(let letter=0;letter<6;letter++)test('Ledger boundary hexadecimal digit: '+letter,()=>{
  const atLimit=seq([3,38,2,...Array(9).fill(23),18+letter]);
  assert.equal(atLimit.entry,'FFFFFFFFF'+'ABCDEF'[letter]);
  assert.equal(press(atLimit,18+letter).entry,atLimit.entry);checked(press(atLimit,48));
});
const engineering=[['kilo',1e3],['mega',1e6],['giga',1e9],['tera',1e12],['milli',1e-3],['micro',1e-6],['nano',1e-9],['pico',1e-12],['femto',1e-15]];
for(const [name,factor] of engineering)test('Ledger boundary engineering: '+name,()=>{
  const small=checked(expression(45,`${name}(1E-99)`));assert.equal(small.answer,factor<1?0:1e-99*factor);
  checked(expression(45,`${name}(9E99)`),factor>1?2:null);
  checked(expression(45,`${name}()`),1);
});
for(const [name,good] of [['probp',1],['probq',.5],['probr',0]])test('Ledger boundary probability: '+name,()=>{
  const s=checked(expression(40,`${name}(1E99)`));assert.equal(s.answer,good);
  checked(expression(40,`${name}()`),1);
});
test('Ledger boundary standardized observation: zero centered value and empty data',()=>{
  const data=seq([4,40,45,40,29,41,29,40,46,36,17,45,48]);checked(data);assert.equal(data.lastValue,0);
  checked(seq([4,40,45,40,17,45,48]),2);
});
test('Ledger boundary conjugation: zero and missing argument',()=>{
  checked(expression(42,'conj(0)'));checked(expression(42,'conj()'),1);
});
for(const [index,low,high] of [[0,0,.999],[1,1,6],[2,0,1],[3,0,99]])test('Ledger boundary random sample: '+index,()=>{
  const s=seq([3,30,digits[index]]);
  assert.equal(checked(press(s,48,{randomSample:0})).answer,low);
  assert.equal(checked(press(s,48,{randomSample:1-Number.EPSILON})).answer,high);
  for(const sample of [-Number.EPSILON,1,NaN,Infinity])assert.throws(()=>press(s,48,{randomSample:sample}),/random sample/);
});
const stats=require(root+'statistics');
for(const mode of ['SD','LINE','QUAD','EXP','LOG','PWR','INV'])test('Ledger boundary regression domain: '+mode,()=>{
  const rows=[1,2,3].map(x=>({x,y:x*x+1,weight:1}));
  const result=stats.calculate(rows,mode);assert.equal(result['count-n'],3);assert.ok(Number.isFinite(result['mean-x']));
  assert.throws(()=>stats.calculate([{x:NaN,y:1,weight:1}],mode),RangeError);
  if(['LOG','PWR','INV'].includes(mode))assert.throws(()=>stats.calculate([{x:0,y:1,weight:1}],mode),RangeError);
  if(['EXP','PWR'].includes(mode))assert.throws(()=>stats.calculate([{x:1,y:0,weight:1}],mode),RangeError);
});
const equations=require(root+'equations');
for(const [label,coefficients] of [['2-VLE',[1,0,0,0,1,0]],['3-VLE',[1,0,0,0,0,1,0,0,0,0,1,0]],['QUAD',[1,0,0]],['CUBIC',[1,0,0,0]]])test('Ledger boundary equation: '+label,()=>{
  let s=seq([4,41,digits[['2-VLE','3-VLE','QUAD','CUBIC'].indexOf(label)]]);
  for(const value of coefficients)s=seq([digits[value],48],s);checked(s);assert.equal(s.lastValue,0);
  if(label==='QUAD')assert.throws(()=>equations.quadratic([0,0,0]));
  else if(label==='CUBIC')assert.throws(()=>equations.cubic([0,0,0,0]));
  else assert.throws(()=>equations.linear(Array(coefficients.length).fill(0),label==='2-VLE'?2:3));
});
for(let slot=0;slot<4;slot++)test('Ledger boundary formula slot: '+slot,()=>{
  let s=core.createInitialState();const other=[0,1,2,3].filter(i=>i!==slot);
  s.control.formulas[other[0]]=core.semanticEditor.tokenize('1+'.repeat(64),{physical:true});
  s.control.formulas[other[1]]=core.semanticEditor.tokenize('1+'.repeat(63)+'1',{physical:true});
  s=seq([40,28,8+slot],s);checked(s);assert.equal(core.semanticEditor.serialize(s.control.formulas[slot]),'1');
  const before=structuredClone(s.control.formulas);
  s=seq([2,40,40,28,8+slot],s);checked(s,6);assert.deepEqual(s.control.formulas,before);
});
for(const cap of ledger.capabilities.filter(x=>x.family==='setup'))test('Ledger boundary setup choice: '+cap.id,()=>{
  const keys=cap.access.key_sequence.map(k=>Number(k.slice(-2)));
  const initial=seq(cap.label.startsWith('TAB')?[6,40,45]:[]);
  const s=checked(seq(keys,initial));
  if(cap.label.startsWith('TAB'))assert.equal(s.layers.settings.tab,Number(cap.label.slice(4)));
  else if(['DEG','RAD','GRAD'].includes(cap.label))assert.equal(s.angleMode,cap.label);
  else assert.equal(s.layers.settings.format,cap.label);
  const invalid=seq([6,45,32],s);assert.equal(invalid.workflow.payload.id,'ANGLE');
  assert.deepEqual(invalid.layers.settings,s.layers.settings);assert.deepEqual(invalid.values,s.values);
});
for(const [mode,key,confirmation] of [['NORMAL',45,[]],['STAT',40,[45]],['EQN',41,[45]],['CPLX',42,[]],['MAT',35,[]],['LIST',36,[]]])test('Ledger boundary mode choice: '+mode,()=>{
  const s=checked(seq([4,key,...confirmation]));assert.equal(s.layers.mode,mode);
  const invalid=seq([4,32],s);assert.equal(invalid.layers.mode,mode);assert.equal(invalid.workflow.payload.id,'MODE');
  assert.deepEqual(invalid.control.variables,s.control.variables);
  const cancelled=press(invalid,2);assert.equal(cancelled.layers.mode,mode);assert.equal(cancelled.control.errorCode,null);
});
for(const mode of [35,36])for(const choice of [0,1,2,3,4])test(`Ledger boundary collection menu: ${mode}/${choice}`,()=>{
  const opened=seq([4,mode,17,digits[choice]]);assert.equal(opened.workflow.kind,'menu');
  const invalid=press(opened,19);assert.deepEqual(invalid.workflow,opened.workflow);assert.deepEqual(invalid.control.buffers,opened.control.buffers);
  const cancelled=press(invalid,2);assert.equal(cancelled.workflow.kind,null);
  if(choice===2)checked(seq([digits[0]],opened),7); // STO cannot invent an absent edit buffer.
});
for(const mode of [35,36])for(const choice of [5,6])test(`Ledger boundary collection conversion: ${mode}/${choice}`,()=>{
  checked(seq([4,mode,17,digits[choice]]),mode===36?10:choice===6?7:null);
  let s=seq([4,mode]);
  if(mode===35)s.control.matrices[0]=typedMatrix(4,4,Array(16).fill(1));
  else s.control.lists[0]=typedList(Array(4).fill(1));
  checked(seq([17,digits[choice]],s));
  if(mode===36){s.control.lists[0]=typedList(Array(5).fill(1));checked(seq([17,digits[choice]],s),9);}
});
const nb=require(root+'nbase');
for(const operation of ['NOT','NEG','AND','OR','XOR','XNOR'])test('Ledger boundary N-base operation: '+operation,()=>{
  const unary=['NOT','NEG'].includes(operation);
  const good=unary?operation+'0':'0'+operation+'0';assert.equal(nb.evaluate(good,16),operation==='NOT'||operation==='XNOR'?-1n:0n);
  assert.throws(()=>nb.evaluate(unary?operation:'1'+operation,16));
  assert.throws(()=>nb.evaluate('10000000000'+(unary?'':' '+operation+'0'),16));
});
for(let key=1;key<=48;key++)test('Ledger boundary powered-off key: '+key,()=>{
  const off=seq([40,48,3,2]);assert.equal(off.control.power,'off');
  const next=press(off,key);
  if(key===2){assert.equal(next.control.power,'on');assert.equal(next.answer,1);}
  else assert.deepEqual(next,off,'a key other than ON/C must not act on a powered-off calculator');
});
test('Ledger boundary pi constant: zero product and overflowing product',()=>{
  assert.equal(checked(seq([45,18,48])).answer,0);
  checked(seq([32,24,32,32,18,48]),2);
});
test('Ledger boundary percent: zero percentage and missing operand',()=>{
  assert.equal(checked(expression(45,'pct(0)')).answer,0);checked(expression(45,'pct()'),1);
});
test('Ledger boundary ANS recall: smallest scalar and rejected division',()=>{
  let s=seq([40,24,47,32,32,48,2,5,48,48]);checked(s);assert.equal(s.answer,1e-99);
  s=seq([2,5,48,39,45,48],s);checked(s,2);assert.equal(s.answer,1e-99);
});
for(const [selector,factor] of [[41,3600],[42,60]])test('Ledger boundary time conversion: '+selector,()=>{
  assert.equal(checked(seq([45,17,selector])).answer,0);
  checked(seq([32,24,32,32,17,selector]),2);
  checked(seq([33,17,selector]),1);
  assert.equal(checked(seq([40,17,selector])).answer,factor);
});
test('Ledger boundary paired coefficient estimates: endpoint and unavailable regression',()=>{
  const rows=[{x:0,y:0,weight:1},{x:1,y:2,weight:1}];
  assert.equal(stats.estimate(rows,'LINE','x',0),0);assert.equal(stats.estimate(rows,'LINE','y',0),0);
  assert.throws(()=>stats.estimate([],'LINE','x',0),RangeError);
  assert.throws(()=>stats.estimate([],'LINE','y',0),RangeError);
});
test('Ledger boundary collection result paging: last cell clamps and rejected dimension preserves slots',()=>{
  let s=expression(36,'L1',{list:Array(16).fill(1)});
  for(let i=0;i<20;i++)s=press(s,11);checked(s);assert.equal(s.workflow.payload.index,15);
  assert.equal(press(s,11).workflow.payload.index,15);assert.equal(s.workflow.payload.list[15],1);
  checked(expression(36,'ldim(L1,0)',{list:[1]}),7);
});
test('Ledger boundary complex input: zero imaginary component and incomplete polar pair',()=>{
  const zero=checked(seq([4,42,45,25,48]));assert.equal(zero.lastValue,0);
  checked(seq([4,42,40,26,48]),1);
});
for(const [selection,name] of [[45,'MEM'],[40,'RESET']])test('Ledger boundary clearing confirmation: '+name,()=>{
  const saved=seq([30,28,18,29,2]);const pending=seq([3,47,selection],saved);
  const rejected=press(pending,41);assert.deepEqual(rejected.control.variables,pending.control.variables);assert.deepEqual(rejected.workflow,pending.workflow);
  const cancelled=press(rejected,2);assert.equal(cancelled.control.variables.A,7);assert.equal(cancelled.memoryValue,7);
  const cleared=press(pending,48);checked(cleared);assert.equal(cleared.memoryValue,0);
  if(name==='RESET')assert.deepEqual(cleared,core.createInitialState());
});
for(const [sign,key] of [[1,29],[-1,29]])test('Ledger boundary independent memory addition: '+sign,()=>{
  let s=seq([...(sign<0?[47]:[]),32,24,32,32,28,29,2,32,24,32,32]);
  s=seq(sign<0?[3,key]:[key],s);checked(s,2);assert.equal(s.memoryValue,sign*9e99);
});
test('Ledger boundary parentheses: zero group and orphan closing parenthesis',()=>{
  assert.equal(checked(expression(45,'(0)')).answer,0);checked(expression(45,')0'),1);
});

test('Ledger boundary combined LIST conversion: unequal row counts recover atomically',()=>{
  let s=seq([4,36]);s.control.lists[0]=typedList([1]);s.control.lists[1]=typedList([1,2]);
  const saved=structuredClone(s.control.lists);s=checked(seq([17,37],s),8);
  assert.deepEqual(s.control.lists,saved);assert.equal(s.workflow.kind,null);
});

for(const [name,key] of [['A',18],['B',19],['C',20],['D',21],['E',22],['F',23],['X',27],['Y',28],['M',29]])test('Ledger boundary ALPHA variable: '+name,()=>{
  let s=seq([47,40,24,32,32,28,key,2]);
  s=checked(seq([5,key,48],s));assert.equal(s.answer,-1e99);
  const saved=structuredClone(s.control.variables);s=checked(seq([2,5,key,39,45,48],s),2);
  assert.deepEqual(s.control.variables,saved);
});

for(const cap of ledger.capabilities.filter(x=>x.family==='ALPHA'&&!/^[A-FXYM]$/.test(x.label)&&x.label!=='ANS'))test('Ledger boundary ALPHA statistic: '+cap.id,()=>{
  const key=Number(cap.id.slice(-2)),mode=key===38?41:40;
  const empty=checked(seq([4,40,mode,5,key,48]),[45,46,47].includes(key)?null:2);
  if([45,46,47].includes(key))assert.equal(empty.lastValue,0);
  let s=seq([4,40,mode]);
  for(const [x,y]of [[1,2],[2,5],[3,10]])s=seq([digits[x],3,28,...String(y).split('').map(n=>digits[Number(n)]),29],s);
  const rows=structuredClone(s.values.statistics.rows);s=checked(seq([5,key,48],s));
  assert.ok(Number.isFinite(s.lastValue));assert.deepEqual(s.values.statistics.rows,rows);
});

test('Ledger boundary coverage index includes every frozen capability and existing test anchors',()=>{
  const rows=require('../reference/el506ts/boundary-coverage').validate();
  assert.deepEqual(rows.map(r=>r.id),ledger.capabilities.map(c=>c.id));
  assert.equal(new Set(rows.map(r=>r.id)).size,430);
  for(const row of rows)assert.ok(row.evidence.anchor&&row.evidence.path);
});
