const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../../src/scientific_calculator/static/scientific_calculator/core');
const fmt=require('../../src/scientific_calculator/static/scientific_calculator/formatting');
const press=(s,n)=>core.reduceCalculator(s,{type:'physical-key',id:`EL506-K${String(n).padStart(2,'0')}`});
const sequence=(keys,s=core.createInitialState())=>keys.reduce(press,s);
const view=s=>fmt.renderState(s,{physical:true});
const number=(value,format='NORM1',tab=9)=>fmt.sharpNumber(value,{format,tab});

test('SET UP uses DRG FSE TAB; disabled TAB ignores shortcuts and ENT confirms cursor',()=>{
 let s=sequence([6]);assert.equal(view(s).expressionHtml,'DRG   FSE   TAB');assert.equal(view(s).resultHtml,'0.   1');assert.equal(s.layers.settings.tab,9);
 assert.deepEqual(press(s,41),s);s=press(s,48);assert.equal(view(s).expressionHtml,'DEG   RAD   GRAD');
 s=sequence([10,48],s);assert.equal(s.angleMode,'RAD');assert.equal(s.lifecycle,'empty');assert.equal(view(s).indicators.RAD,true);
 s=sequence([6,45,41],s);assert.equal(s.angleMode,'GRAD');assert.equal(core.restoreCalculator(core.snapshotCalculator(s)).angleMode,'GRAD');
 assert.ok(Math.abs(core.evaluateExpression('sin(100)','GRAD',0)-1)<1e-12);
});
test('FSE pages cycle; invalid choices preserve result and settings persist across ON/C',()=>{
 const result=sequence([40,39,30,48]);let s=sequence([6,40],result);assert.equal(view(s).expressionHtml,'FIX   SCI   ENG');
 s=press(s,11);assert.equal(view(s).expressionHtml,'NORM1   NORM2');s=press(s,11);assert.equal(s.workflow.page,0);s=press(s,8);assert.equal(s.workflow.page,1);
 s=press(s,32);assert.equal(s.layers.settings.format,'NORM1');s=press(s,35);assert.equal(s.layers.settings.format,'NORM2');assert.deepEqual(s.values,result.values);assert.equal(s.displayExpression,result.displayExpression);
 s=sequence([6,40,45,6,41],s);assert.equal(view(s).expressionHtml,'TAB(0-9)?');assert.equal(view(s).resultHtml,'');assert.deepEqual(press(s,48),s);
 s=press(s,41);assert.equal(view(s).resultHtml,'0.14');assert.equal(press(s,2).layers.settings.tab,2);assert.equal(view(press(s,2)).resultHtml,'0.00');
 const digits=[45,40,41,42,35,36,37,30,31,32];for(let tab=0;tab<10;tab++){const selected=sequence([6,40,45,6,41,digits[tab]]);assert.equal(selected.layers.settings.tab,tab);assert.equal(view(selected).resultHtml,'0.'+'0'.repeat(tab));}
});
test('NORM1 and NORM2 exact lower and upper boundaries, both signs',()=>{
 for(const sign of [-1,1]){
  assert.equal(number(sign*1e-9).exponent,null);assert.equal(number(sign*9.999999999e-10).exponent,-10);
  assert.equal(number(sign*.01,'NORM2').exponent,null);assert.equal(number(sign*.009999999999,'NORM2').exponent,-3);
  for(const format of ['NORM1','NORM2']){assert.equal(number(sign*9999999999,format).exponent,null);assert.equal(number(sign*9999999999.9,format).exponent,null);assert.equal(number(sign*1e10,format).exponent,10);}
 }
 assert.equal(number(1/7).text,'0.142857142');assert.equal(number(1.234e-9).text,'0.000000001');assert.equal(number(1e-99).exponent,-99);
});
test('FIX uses half-away ties and trailing zeros, including signed rounded zero',()=>{
 assert.equal(number(1.25,'FIX',1).text,'1.3');assert.equal(number(-1.25,'FIX',1).text,'-1.3');
 assert.equal(number(-.01,'FIX',1).text,'-0.0');assert.equal(number(-0,'FIX',1).text,'0.0');
 assert.equal(number(1,'FIX',9).text,'1.000000000');assert.equal(number(123456789.95,'FIX',2).text,"123'456'790.0");
 assert.equal(number(1e10,'FIX',2).text,'1.×1010');assert.equal(number(1.234e-9,'FIX',1).text,'0.0');
});
test('SCI TAB selects mantissa decimal places, carries exponent and pads two digits',()=>{
 assert.equal(number(1/3,'SCI',2).text,'3.33×10-01');assert.equal(number(1/3,'SCI',0).text,'3.×10-01');
 assert.equal(number(9.995,'SCI',2).text,'1.00×1001');assert.equal(number(-9.995,'SCI',2).text,'-1.00×1001');
 assert.equal(number(1e99,'SCI',9).text,'1.000000000×1099');assert.equal(number(9.999999999e99,'SCI',0).text,'Error 2');
});
test('ENG always advances exponents by three and caps its mantissa at ten digits',()=>{
 assert.equal(number(1/7,'ENG',2).text,'142.86×10-03');assert.equal(number(1/3,'ENG',0).text,'333.×10-03');
 assert.equal(number(999.995,'ENG',2).text,'1.00×1003');
 for(let exponent=-99;exponent<=99;exponent++){
  const shown=number(Number('1e'+exponent),'ENG',9);assert.equal(Math.abs(shown.exponent%3),0);assert.ok(shown.mantissa.replace(/\D/g,'').length<=10);assert.ok(Math.abs(Number(shown.mantissa))>=1&&Math.abs(Number(shown.mantissa))<1000);
 }
});
test('entry keeps explicit decimal zeros and grouped integers, without changing expression text',()=>{
 let s=sequence([40,41,42,35]);assert.equal(view(s).resultHtml,'1&#039;234.');assert.equal(s.entry,'1234');
 s=sequence([46,45,45],s);assert.equal(view(s).resultHtml,'1&#039;234.00');assert.equal(view(sequence([47])).resultHtml,'-0.');
 s=sequence([2,40,24,32,47],s);assert.match(view(s).resultHtml,/<sup>-09<\/sup>/);
 s.stagedEntry.exponent='-0';assert.match(view(s).resultHtml,/<sup>-00<\/sup>/);
 assert.equal(view(core.createInitialState()).resultHtml,'0.');assert.equal(fmt.renderState(core.createInitialState()).resultHtml,'0');
});
test('MDF changes current ANS to displayed value; ordinary formatting preserves precision and stores',()=>{
 const base=sequence([6,40,45,6,41,40,36,39,32,48]);assert.equal(view(base).resultHtml,'0.6');
 const original=sequence([38,32,48],base);assert.equal(view(original).resultHtml,'5.0');
 const snapshot=core.snapshotCalculator(base),modified=sequence([3,45],base);assert.equal(modified.answer,.6);assert.equal(modified.lastValue,.6);assert.deepEqual(modified.values.answer,core.valueTypes.scalar(.6));
 assert.deepEqual(modified.history,base.history);assert.deepEqual(modified.values.history,base.values.history);assert.deepEqual(core.snapshotCalculator(base),snapshot);
 assert.equal(view(sequence([38,32,48],modified)).resultHtml,'5.4');
 const eng=sequence([6,40,41,6,41,41,40,39,30,48,3,45,6,40,42,38,30,48]);assert.equal(view(eng).resultHtml,'1.00002');
 const fraction=sequence([40,25,42,48]);assert.deepEqual(sequence([3,45],fraction).values,fraction.values);assert.equal(view(sequence([3,45,38,42,48],fraction)).resultHtml,'1.');
});
test('all typed display families use settings without flattening, and N-base retains exact encoding',()=>{
 const v=core.valueTypes,settings={format:'FIX',tab:2};
 const families=[v.scalar(1/3),v.rational('1','3'),{kind:'dms',sign:-1,degrees:1,minutes:2,seconds:3.456},
  {kind:'complex',real:v.rational('1','3'),imaginary:v.scalar(-2.5)},
  {kind:'statistics',rows:[{x:v.rational('1','3'),y:v.scalar(2),weight:1}]},
  {kind:'equation',components:[{label:'<x>',value:v.rational('1','3')}]},
  {kind:'matrix',rows:1,columns:2,elements:[v.rational('1','3'),v.scalar(2)]},
  {kind:'list',elements:[v.rational('1','3'),v.scalar(2)]}];
 for(const source of families){const copy=v.copy(source);const html=fmt.formatTyped(source,settings);assert.ok(html.includes(source.kind==='dms'?'3.46':'0.33'));assert.deepEqual(source,copy);}
 assert.match(fmt.formatTyped(families[5],settings),/&lt;x&gt;/);
 assert.equal(fmt.formatTyped({kind:'nbase',integer:'-1',radix:16,width:32,signed:true},settings),'FFFFFFFF');
 assert.match(fmt.formatTyped(v.rational('1','3'),settings,{fraction:true}),/display-fraction/);
});
test('SET UP resumes paged results and coefficient entry while leaving all typed stores untouched',()=>{
 const original=sequence([40,39,42,48]);let s=core.reduceCalculator(original,{type:'workflow',command:'show-results',payload:{pages:[{label:'x1',value:core.valueTypes.rational('1','3')},{label:'x2',value:2}]}});
 s=sequence([6,40,45,6,41,41],s);assert.equal(s.lifecycle,'multi-result');assert.equal(view(s).resultHtml,'0.33');assert.deepEqual(s.values,original.values);
 s=press(s,11);assert.equal(view(s).resultHtml,'2.00');assert.equal(view(s).pageStatus,'2 / 2');
 s=sequence([1,4,41,45,6,40,40],s);assert.equal(s.lifecycle,'data-entry');assert.equal(s.workflow.payload.label,'a1?');
});
test('format selection, MDF and snapshot settings are isolated between instances',()=>{
 const other=core.createInitialState(),before=core.snapshotCalculator(other);const s=sequence([6,40,45,6,41,40,36,39,32,48,3,45]);
 assert.equal(s.layers.settings.tab,1);assert.deepEqual(core.snapshotCalculator(other),before);assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(s)),s);
 const old=core.snapshotCalculator(other);old.state.layers.settings.tab=0;assert.equal(core.restoreCalculator(old).layers.settings.tab,0);
});
