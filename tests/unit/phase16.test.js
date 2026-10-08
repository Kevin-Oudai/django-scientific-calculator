const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/',c=require(root+'core'),f=require(root+'formatting'),l=require(root+'lists');
const press=(s,n)=>c.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});
const seq=(keys,s=c.createInitialState())=>keys.reduce(press,s);
const stored=()=>seq([4,36,11,42,29,42,29,40,29,41,29,2,17,41,45]);
const recall=s=>seq([17,45,45],s);
const text=s=>s.replace(/<[^>]*>/g,'').replace(/[\s_]/g,'').replace(/\u2022/g,'.');
test('Function-denominator fraction markers preserve decimal evaluation and stacked numeric fractions',()=>{
 const fraction=seq([41,25,15,40,30,48]),divide=seq([41,39,15,40,30,48]);
 assert.equal(text(f.renderState(fraction,{physical:true}).expressionHtml),'2┌tan17=');
 assert.equal(f.renderState(fraction,{physical:true}).resultHtml,'6.541705237');
 assert.equal(text(f.renderState(divide,{physical:true}).expressionHtml),'2&divide;tan17=');
 assert.equal(fraction.answer,divide.answer);
 const upper={...fraction,displayExpression:'1/2+',selectionActive:false};
 assert.match(f.renderState(upper,{physical:true}).expressionHtml,/scicalc__display-fraction/);
});
test('LIST reproduces independently observed menu entry storage capacity variance and buffer-retention checkpoints',()=>{
 const n=require('../reference/el506ts/phase16-native-notes');let s=c.createInitialState(),count=0;
 for(let i=0;i<n.sequence.length;i++){s=press(s,n.sequence[i]);for(const frame of n.checkpoints.filter(x=>x.afterStep===i+1)){const v=f.renderState(s,{physical:true});if(frame.upperClipped)assert.ok(text(v.expressionHtml).startsWith(text(frame.upper)),'native visible upper prefix '+(i+1));else assert.equal(text(v.expressionHtml),text(frame.applicationUpper??frame.upper),'native upper '+(i+1));assert.equal(text(v.resultHtml),text(frame.lower),'native lower '+(i+1));count++;}}
 assert.equal(count,n.checkpoints.length);
});
test('LIST slots clone edit buffer and result cells page in original order',()=>{
 let s=stored();assert.deepEqual(s.control.lists[0].elements.map(x=>x.value),[3,1,2]);s=seq([38,17,45,45,48],recall(s));assert.deepEqual(s.control.buffers.list.elements.map(x=>x.value),[9,1,4]);assert.equal(s.workflow.payload.label,'SIZE=');
 s=seq([11,11,11],s);assert.equal(s.workflow.payload.label,'LIST3=');assert.equal(s.workflow.payload.list[2],4);assert.deepEqual(s.control.lists[0].elements.map(x=>x.value),[3,1,2]);
});
test('LIST scalar aggregates preserve buffer and scalar ANS, and scalar operations broadcast',()=>{
 let s=stored();s=seq([17,35,30,17,45,45,48],s);assert.equal(s.lastValue,1);assert.deepEqual(s.control.buffers.list.elements.map(x=>x.value),[3,1,2]);s=seq([11],s);assert.equal(s.workflow.payload.list.length,3);
 const ast=c.semanticEditor.parseTokens(c.semanticEditor.tokenize('L1*2'));const scalar={number:Number,symbol:()=>0,binary:(op,a,b)=>({'+':()=>a+b,'*':()=>a*b})[op]()};assert.deepEqual(l.evaluate(ast,c.semanticEditor,scalar,{lists:[[3,1,2],null,null,null]}),[6,2,4]);
});
test('LIST algorithms enforce bounded allocation, equal lengths, finite values and sample variance',()=>{
 const a=[3,1,2];assert.deepEqual(l.sort(a),[1,2,3]);assert.deepEqual(l.sort(a,true),[3,2,1]);assert.deepEqual(l.cumulative(a),[3,4,6]);assert.deepEqual(l.difference(a),[-2,1]);assert.deepEqual(l.augment(a,[4]),[3,1,2,4]);
 for(const [name,value]of [['lmin',1],['lmax',3],['lmean',2],['lmed',2],['lsum',6],['lprod',6],['lstd',1],['lvar',1]])assert.equal(l.aggregate(name,a),value);
 assert.equal(l.inner(a,a),14);assert.deepEqual(l.outer([1,0,0],[0,1,0]),[0,0,1]);assert.equal(l.aggregate('labs',[3,4]),5);
 assert.throws(()=>l.fill(0,1e9),e=>e.code===7);assert.throws(()=>l.list([]),e=>e.code===7);assert.throws(()=>l.pair([1],[1,2],(x,y)=>x+y),e=>e.code===8);assert.throws(()=>l.list([1e100]),e=>e.code===2);assert.throws(()=>l.aggregate('lstd',[1]),e=>e.code===2);assert.equal(l.list([1e-100])[0],0);
});
test('Snapshot 12 retains separate typed collection buffers, migrates schema 11 and rejects hostile slots',()=>{
 const s=stored(),saved=c.snapshotCalculator(s);assert.equal(saved.schemaVersion,12);assert.deepEqual(c.restoreCalculator(saved),s);
 const old=structuredClone(saved);old.schemaVersion=11;delete old.state.control.buffers;assert.deepEqual(c.restoreCalculator(old).control.buffers.list,s.values.last);
 for(const bad of [{kind:'list',elements:Array(17).fill({kind:'scalar',value:0})},{kind:'matrix',rows:1,columns:1,elements:[{kind:'scalar',value:1}]},{kind:'list',elements:[{kind:'scalar',value:Infinity}]}]){const copy=structuredClone(saved);copy.state.control.lists[0]=bad;assert.throws(()=>c.restoreCalculator(copy));}
});
test('LIST conversion menus preserve the full-manual distinction between per-slot matrices and matA columns',()=>{
 // menu-inventory.json independently records choices 5 and 6; full manual
 // page 2 describes their distinct destination mappings. Multi-slot numerical
 // simulator parity remains a separate audit, not inferred from this test.
 let s=stored();s.control.lists[1]={kind:'list',elements:[1,2,4].map(value=>({kind:'scalar',value}))};
 const separate=seq([17,36],s);assert.equal(separate.layers.mode,'MAT');assert.deepEqual(separate.control.matrices.slice(0,2).map(v=>[v.rows,v.columns,v.elements.map(x=>x.value)]),[[3,1,[3,1,2]],[3,1,[1,2,4]]]);
 const combined=seq([17,37],s);assert.deepEqual([combined.control.matrices[0].rows,combined.control.matrices[0].columns,combined.control.matrices[0].elements.map(x=>x.value)],[3,2,[3,1,1,2,2,4]]);
 const menu=seq([17,11,11,11],s);assert.equal(menu.workflow.page,3);assert.equal(f.renderState(menu,{physical:true}).expressionHtml,'list→matA');
});

test('Native LIST scalar divided by list reports Error 1 rather than broadcasting reciprocals',()=>{const s=seq([41,39,17,45,45,48],stored());assert.equal(s.control.errorCode,1);});

test('Independent LIST arithmetic and editing checkpoints match the native sequence',()=>{
 const n=require('../reference/el506ts/collection-operations-native-notes');let s=c.createInitialState(),count=0;
 const norm=x=>x.replace(/<[^>]*>/g,'').replace(/[\s_]/g,'').replace(/&divide;/g,'÷').replace(/&times;/g,'×');
 for(let i=0;i<n.sequence.length;i++){s=press(s,n.sequence[i]);for(const frame of n.checkpoints.filter(x=>x.afterStep===i+1)){const v=f.renderState(s,{physical:true});if(frame.upperClipped)assert.ok(norm(v.expressionHtml).endsWith(norm(frame.upper)));else assert.equal(norm(v.expressionHtml),norm(frame.upper),'native upper '+(i+1));assert.equal(norm(v.resultHtml),norm(frame.lower),'native lower '+(i+1));if(frame.second!==undefined)assert.equal(s.secondActive,frame.second);if(frame.cursor==='start'){assert.equal(v.cursorVisible,true);assert.equal(s.cursor,0);}count++;}}
 assert.equal(count,n.checkpoints.length-1);
});
