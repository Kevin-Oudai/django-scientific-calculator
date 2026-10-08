// Boundary contracts are application regressions, not claims of native parity.
const ledger = require('./capability-ledger.json');
const fs = require('node:fs');
const path = require('node:path');
const local = (anchor, parameter) => ({path:'tests/unit/ledger-boundaries.test.js',anchor:'Ledger boundary '+anchor,...(parameter===undefined?{}:{parameter})});
const old = (phase, anchor) => ({path:`tests/unit/phase${phase}.test.js`,anchor});
const scalar = new Set(['sin','cos','tan','inverse sine','inverse cosine','inverse tangent','sin hyperbolic','cos hyperbolic','tan hyperbolic','inverse sin hyperbolic','inverse cos hyperbolic','inverse tan hyperbolic','log','ln','square root','cube root','reciprocal','y^x','x^2','x^3','nth root','10 to power x','e to power x','factorial','nCr','nPr','multiply','divide','add','subtract']);
const special = {
 HOME:old(3,'HOME in NORMAL retains ANS, HOME from another mode follows mode clearing'),
 'ON/C':old(3,'ON/C preserves all stores while CA preserves only M and formulas'),
 OFF:old(3,'idle uses deterministic elapsed time and activity resets the ten-minute interval'),
 CA:old(3,'ON/C preserves all stores while CA preserves only M and formulas'),
 MODE:local('mode choice: ','NORMAL'),
 'SET UP':old(4,'SET UP uses DRG FSE TAB; disabled TAB ignores shortcuts and ENT confirms cursor'),
 DEL:old(3,'end-of-equation DEL backspaces and boundaries remain stable'),
 up:old(3,'playback retains ordering, oldest shortcut, boundaries and discards temporary drafts'),
 down:old(3,'playback retains ordering, oldest shortcut, boundaries and discards temporary drafts'),
 left:old(3,'end-of-equation DEL backspaces and boundaries remain stable'),
 right:old(3,'end-of-equation DEL backspaces and boundaries remain stable'),
 '2nd F':old(3,'modifier consumption, inverse HYP ordering and INS survive clear and mode changes'),
 ALPHA:old(3,'modifier consumption, inverse HYP ordering and INS survive clear and mode changes'),
 hyp:old(3,'modifier consumption, inverse HYP ordering and INS survive clear and mode changes'),
 'arc hyp':old(3,'modifier consumption, inverse HYP ordering and INS survive clear and mode changes'),
 INS:old(3,'functions move and delete atomically; overwrite replaces a whole function cell'),
 'STAT VAR / ALPHA':old(12,'Statistics undefined recalls use Error 2 and ON/C recovers without inventing data'),
 'integral dx':old(10,'Calculus work bounds zero interval and nonfinite samples are enforced'),
 'd/dx':old(10,'Calculus singular samples syntax and unresolvable differences recover through ON/C'),
 ALGB:old(8,'Phase 8 simulation accepts signed scientific input and retains confirmed values on errors'),
 SOLV:old(8,'Phase 8 solver rejects invalid intervals and cancels without overwriting X or ANS'),
 MATH:old(5,'MATH inventory has two pages, ENG has four/five; solver rejects an empty expression'),
 ENG:old(5,'MATH inventory has two pages, ENG has four/five; solver rejects an empty expression'),
 pi:local('pi constant: zero product and overflowing product'),
 Exp:old(5,'scientific exponent rolls two digits, rejects decimal and preserves signed zero; cursor can recover'),
 'decimal point':old(5,'scientific exponent rolls two digits, rejects decimal and preserves signed zero; cursor can recover'),
 '+/-':old(5,'scientific exponent rolls two digits, rejects decimal and preserves signed zero; cursor can recover'),
 'a b/c':old(6,'Phase 6 domain: '),
 'fraction / decimal toggle':old(6,'fraction capacity10 remains rational, capacity11 falls back without changing exact value'),
 'mixed / improper toggle':old(6,'fraction capacity10 remains rational, capacity11 falls back without changing exact value'),
 DMS:old(6,'decimal to DMS carries seconds and falls back at one million degrees'),
 'to decimal degrees':old(6,'decimal to DMS carries seconds and falls back at one million degrees'),
 'rectangular to polar':old(6,'Phase 6 domain: '),
 'polar to rectangular':old(6,'Phase 6 domain: '),
 RCL:local('memory: ','A'), STO:local('memory: ','A'),
 'M+':local('independent memory addition: ',1),'M-':local('independent memory addition: ',-1),
 RANDOM:local('random sample: ',0),
 percent:local('percent: zero percentage and missing operand'),
 CNST:local('constant: ',1),CONV:local('conversion: ',1),
 MDF:old(4,'MDF changes current ANS to displayed value; ordinary formatting preserves precision and stores'),
 'DRG conversion':old(6,'DRG cycles settings, changes ANS immediately and ENT recomputes original entry'),
 'M-CLR':local('clearing confirmation: ','MEM'),
 comma:old(11,'Statistics partial and excess separators give Error 1 without dataset mutations'),
 '(':local('parentheses: zero group and orphan closing parenthesis'),
 ')':local('parentheses: zero group and orphan closing parenthesis'),
 equals:old(5,'syntax errors retain the previous ANS; repeated operators and omitted operands are not repaired'),
 ANS:local('ANS recall: smallest scalar and rejected division'),
 'estimated x':local('paired coefficient estimates: endpoint and unavailable regression'),
 'estimated y':local('paired coefficient estimates: endpoint and unavailable regression'),
 'paired coordinate separator':old(11,'Statistics partial and excess separators give Error 1 without dataset mutations'),
 'imaginary unit i':local('complex input: zero imaginary component and incomplete polar pair'),
 'complex polar angle separator':local('complex input: zero imaginary component and incomplete polar pair'),
 'confirm coefficient or data':old(11,'Statistics capacity counts explicit frequencies and paired coordinates atomically'),
 'matrix or list result element paging':local('collection result paging: last cell clamps and rejected dimension preserves slots'),
 'STAT data commit':old(11,'Statistics capacity counts explicit frequencies and paired coordinates atomically'),
 'STAT data deletion':old(11,'Statistics zero correction and shifted CD delete complete records and renumber'),
 'to seconds':local('time conversion: ',41),'to minutes':local('time conversion: ',42),
};
function evidence(c) {
 const f=c.family,l=c.label;
 if(scalar.has(l))return local('scalar: ',l);
 if(['physical-key','base'].includes(f)&&/^\d$/.test(l))return local('decimal digit: ',Number(l));
 if(f==='constant')return local('constant: ',Number(c.id.split('.').pop()));
 if(f==='conversion')return local('conversion: ',Number(c.id.split('.').pop()));
 if(f==='formula-memory')return local('formula slot: ',Number(l.slice(1))-1);
 if(f==='memory')return local('memory: ',l.split(' ').pop());
 if(f==='ALPHA'&&/^[A-FXYM]$/.test(l))return local('ALPHA variable: ',l);
 if(f==='statistic')return local('statistic: ',c.id);
 if(f==='ALPHA'&&l!=='ANS')return local('ALPHA statistic: ',c.id);
 if(f==='regression')return local('regression domain: ',l);
 if(f==='equation')return local('equation: ',l);
 if(f==='mode')return local('mode choice: ',l);
 if(f==='setup')return local('setup choice: ',c.id);
 if(f==='menu.engineering')return local('engineering: ',{k:'kilo',M:'mega',G:'giga',T:'tera',m:'milli',micro:'micro',n:'nano',p:'pico',f:'femto'}[l]);
 if(f==='menu.probability')return l==='to t'?local('standardized observation: zero centered value and empty data'):local('probability: ',{'P(':'probp','Q(':'probq','R(':'probr'}[l]);
 if(f==='menu.complex')return local('conjugation: zero and missing argument');
 if(/^menu\.matrix-(ope|math)$/.test(f))return local('MAT: ',l);
 if(/^menu\.list-(ope|math)$/.test(f))return local('LIST: ',l);
 if(f==='matrix-slot'||f==='list-slot')return local('collection slot: ',`${f==='matrix-slot'?35:36}/${f==='matrix-slot'?'ABCD'.indexOf(l.slice(-1)):Number(l.slice(1))-1}`);
 if(f==='menu.matrix-root'||f==='menu.list-root'){
   const mode=f==='menu.matrix-root'?35:36;
   const labels=mode===35?['MAT','CHK','STO','OPE','MATH','mat to list','matA to list']:['LST','CHK','STO','OPE','MATH','list to mat','list to matA'];
   const choice=labels.indexOf(l);return local(choice>=5?'collection conversion: ':'collection menu: ',`${mode}/${choice}`);
 }
 if(f==='menu.random')return local('random sample: ',['RAND','R-DICE','R-COIN','R-INT'].indexOf(l));
 if(f==='menu.clear')return local('clearing confirmation: ',l);
 if(['NOT','NEG','AND','OR','XOR','XNOR'].includes(l))return local('N-base operation: ',l);
 if(l.startsWith('hexadecimal digit '))return local('hexadecimal digit: ','ABCDEF'.indexOf(l.slice(-1)));
 if(['HEX','BIN','OCT','PEN','DEC'].includes(l))return old(9,'N-base overflow and syntax preserve ANS and recover with ON/C');
 return special[l];
}
const rows=ledger.capabilities.map(c=>({
 id:c.id,label:c.label,evidence:evidence(c),
 // Controls have no operand domain: an unavailable lifecycle is their invalid
 // context. Arithmetic/catalogue/collection rows additionally assert explicit
 // domain, range, arity, capacity or selector rejection in their evidence.
 invalidContext:['physical-key','base','2ndF'].includes(c.family)
   ?local('powered-off key: ',Number(c.access.key_sequence.at(-1).slice(-2))):undefined,
 scope:'Application boundary contract; not exhaustive mode/type combinations or independent simulator parity.',
}));
function validate() {
 const missing=rows.filter(r=>!r.evidence);if(missing.length)throw Error('Unmapped boundary contracts: '+missing.map(r=>r.label+' ('+r.id+')').join(', '));
 for(const r of rows)for(const e of [r.evidence,r.invalidContext].filter(Boolean)){
   if(!fs.readFileSync(path.resolve(__dirname,'../../..',e.path),'utf8').includes(e.anchor))throw Error('Missing test anchor: '+JSON.stringify(r));
   if(Object.hasOwn(e,'parameter')&&(e.parameter===undefined||Number.isNaN(e.parameter)))throw Error('Invalid test parameter: '+r.id);
 }
 return rows;
}
module.exports={rows,validate};
if(require.main===module){validate();console.log('430 ledger boundary contracts mapped; application evidence only.');}
