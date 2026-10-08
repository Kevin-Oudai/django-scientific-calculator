const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const c=require(root+'core.js'),f=require(root+'formatting.js'),stats=require(root+'statistics.js');
const press=(s,n)=>c.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});
const seq=(keys,s=c.createInitialState())=>keys.reduce(press,s);
const mode=(n=0)=>seq([4,40,[45,40,41,42,35,36,37][n]]);
const close=(actual,expected,tolerance=1e-10)=>assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);
const data=rows=>rows.map(([x,y=null,weight=1])=>({x,y,weight}));
test('Statistics every printed weighted correction and paired guide checkpoint reproduces display precision',()=>{
 const guide=require('../reference/el506ts/guide-examples.json');
 const text=html=>html.replace(/<[^>]*>/g,'').replace(/&#039;/g,'').replace(/&[^;]+;/g,'');
 for(const fixture of guide.fixtures.filter(x=>/p34|p36|p38/.test(x.id))){let s=c.createInitialState();for(let i=0;i<fixture.sequence.length;i++){s=c.reduceCalculator(s,{type:'physical-key',id:fixture.sequence[i]});for(const frame of fixture.frames.filter(x=>x.afterStep===i+1)){const v=f.renderState(s,{physical:true}),printed=frame.printed;assert.equal(s.control.errorCode,null);if(/^\d/.test(printed))assert.equal(Number(text(v.resultHtml)),Number(printed),fixture.id+' step '+(i+1));else if(printed.includes(';'))assert.equal(text(v.expressionHtml)+'; '+text(v.resultHtml),printed);else assert.equal(text(v.expressionHtml)+text(v.resultHtml),printed);}}}
});
const digits=text=>String(text).split('').map(ch=>({0:45,1:40,2:41,3:42,4:35,5:36,6:37,7:30,8:31,9:32,'.':46,'-':47})[ch]);
function enter(rows,paired=false,submode=paired?1:0){let s=mode(submode);for(const [x,y,weight]of rows){const parts=paired?[x,y]:[x];if(weight!==undefined)parts.push(weight);for(let i=0;i<parts.length;i++){s=seq(digits(parts[i]),s);if(i<parts.length-1)s=seq([3,28],s);}s=press(s,29);}return s;}
test('Statistics RCL evaluates immediately and ALPHA inserts a live expression without losing observations',()=>{
 const s=seq([40,29,41,29,42,29],mode());
 let r=seq([27,35],s);assert.equal(r.displayExpression,'x\u0305=');assert.equal(r.lastValue,2);assert.equal(r.values.statistics.rows.length,3);
 r=seq([5,36,38,41,48],r);assert.equal(r.lastValue,2);assert.equal(r.values.statistics.rows.length,3);assert.ok(r.displayExpression.startsWith('sx*2'));
 r=seq([27,37],s);close(r.lastValue,Math.sqrt(2/3));assert.equal(f.renderState(r,{physical:true}).resultHtml,'0.81649658');
 assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(r)),r);
});
test('Statistics weighted guide examination results match displayed precision',()=>{
 const rows=data([[30,null,2],[40,null,4],[50,null,5],[60,null,7],[70,null,12],[80,null,10],[90,null,8],[100,null,2]]);
 const s=stats.calculate(rows);assert.equal(s['mean-x'],69);assert.equal(s['count-n'],50);assert.equal(s['sum-x'],3450);assert.equal(s['sum-x-squared'],253500);
 close(s['sample-deviation-x'],17.75686128,1e-9);close(s['population-deviation-x'],17.57839583,1e-9);
});
test('Statistics paired guide temperature results match all twelve quantities',()=>{
 const s=stats.calculate(data([[6.2,13],[7,9],[6.8,11],[8.7,5],[7.9,7],[6.5,12],[6.1,15],[8.2,7]]),'LINE');
 for(const [key,value] of Object.entries({'mean-x':7.175,'sample-deviation-x':.973579551,'population-deviation-x':.91070028,'mean-y':9.875,'sample-deviation-y':3.440826313,'population-deviation-y':3.218598297,'count-n':8,'sum-x':57.4,'sum-x-squared':418.48,'sum-xy':544.1,'sum-y':79,'sum-y-squared':863}))close(s[key],value,1e-9);
});
test('Statistics all six regressions recover coefficients and inverse estimates',()=>{
 const examples=[['LINE',x=>2+3*x],['QUAD',x=>2+3*x+4*x*x],['EXP',x=>2*Math.exp(.3*x)],['LOG',x=>2+3*Math.log(x)],['PWR',x=>2*x**3],['INV',x=>2+3/x]];
 for(const [mode,fn] of examples){const rows=data([1,2,3,4].map(x=>[x,fn(x)])),s=stats.calculate(rows,mode);close(s['coefficient-a'],2);close(s['coefficient-b'],mode==='EXP'?.3:3);if(mode==='QUAD'){close(s['coefficient-c'],4);assert.equal(s['correlation-r'],undefined);}else close(s['correlation-r'],1);close(stats.estimate(rows,mode,'y',2.5),fn(2.5));close(stats.estimate(rows,mode,'x',fn(2.5)),2.5);}
});
test('Statistics transformed modes expose transformed means sums and deviations',()=>{
 const rows=data([[1,2],[2,4],[4,8]]);
 close(stats.result(rows,'LOG','mean-x'),Math.log(2));close(stats.result(rows,'EXP','mean-y'),Math.log(4));close(stats.result(rows,'PWR','sum-x'),Math.log(8));close(stats.result(rows,'INV','sum-x'),1.75);
});
test('Statistics quadratic inverse switches roots and rejects an unattainable Y',()=>{
 const rows=data([[-2,4],[-1,1],[0,0],[1,1],[2,4]]);
 close(stats.estimate(rows,'QUAD','x',4),2);close(stats.estimate(rows,'QUAD','x',4,true),-2);assert.throws(()=>stats.estimate(rows,'QUAD','x',-1),RangeError);
});
test('Statistics degenerate samples and transformed domain errors preserve supported sums',()=>{
 assert.equal(stats.result([],'SD','count-n'),0);assert.throws(()=>stats.result([],'SD','mean-x'),RangeError);
 assert.equal(stats.result(data([[2]]),'SD','population-deviation-x'),0);assert.throws(()=>stats.result(data([[2]]),'SD','sample-deviation-x'),RangeError);
 assert.throws(()=>stats.result(data([[1,2],[1,3]]),'LINE','coefficient-a'),RangeError);
 for(const [mode,rows] of [['LOG',[[0,2]]],['PWR',[[-1,2]]],['EXP',[[1,0]]],['INV',[[0,1]]]])assert.throws(()=>stats.calculate(data(rows),mode),RangeError);
 assert.throws(()=>stats.calculate(data([[1e99],[9e99]])),RangeError);
});
test('Statistics probability functions follow native six-place output and symmetry',()=>{
 assert.equal(stats.probability('P',1),.841345);assert.equal(stats.probability('Q',1),.341345);assert.equal(stats.probability('R',1),.158655);
 assert.equal(stats.probability('P',-1),.158655);assert.equal(stats.probability('Q',-1),.341345);assert.equal(stats.probability('R',-1),.841345);assert.equal(stats.probability('P',0),.5);assert.equal(stats.probability('R',10),0);
 const s=seq([17,40,40,48],mode());assert.equal(s.lastValue,.841345);assert.equal(s.workflow.kind,null);assert.equal(s.layers.mode,'STAT');
});
test('Statistics undefined recalls use Error 2 and ON/C recovers without inventing data',()=>{
 let s=seq([27,35],mode());assert.equal(s.control.errorCode,2);assert.equal(f.renderState(s,{physical:true}).expressionHtml,'Error 2');s=seq([2,41,29,27,35],s);assert.equal(s.lastValue,2);assert.equal(s.values.statistics.rows.length,1);
});
test('Statistics native shifted estimates evaluate immediately and ENT evaluates the original operand',()=>{
 const data=seq([40,3,28,41,29,41,3,28,35,29],mode(1));
 let s=seq([42,3,34],data);assert.equal(s.lastValue,6);assert.equal(s.displayExpression,'3y\u0302');assert.equal(s.expression,'3');assert.equal(s.secondActive,false);
 s=press(s,48);assert.equal(s.lastValue,3);assert.equal(s.values.statistics.rows.length,2);
 s=seq([35,3,33],data);assert.equal(s.lastValue,2);assert.equal(s.displayExpression,'4x\u0302');
 s=seq([17],data);assert.deepEqual(s.workflow.payload.choices,['\u2192t','P(','Q(','R(']);
});
test('Statistics guide workflows recall every physical result selector at displayed precision',()=>{
 const sd=enter([[30,null,2],[40,null,4],[50,null,5],[60,null,7],[70,null,12],[80,null,10],[90,null,8],[100,null,2]]);
 for(const [key,display] of [[35,'69.'],[36,'17.75686128'],[37,'17.57839583'],[45,'50.'],[46,'3&#039;450.'],[47,'253&#039;500.']])assert.equal(f.renderState(seq([27,key],sd),{physical:true}).resultHtml,display);
 let standardized=seq([30,45,17,45],sd);assert.equal(standardized.lifecycle,'entering');assert.equal(standardized.lastValue,0);standardized=press(standardized,48);assert.equal(f.renderState(standardized,{physical:true}).resultHtml,'0.056888012');
 const line=enter([[6.2,13],[7,9],[6.8,11],[8.7,5],[7.9,7],[6.5,12],[6.1,15],[8.2,7]],true);
 for(const [key,display] of [[35,'7.175'],[36,'0.973579551'],[37,'0.91070028'],[30,'9.875'],[31,'3.440826313'],[32,'3.218598297'],[45,'8.'],[46,'57.4'],[47,'418.48'],[40,'544.1'],[41,'79.'],[42,'863.']])assert.equal(f.renderState(seq([27,key],line),{physical:true}).resultHtml,display);
});
