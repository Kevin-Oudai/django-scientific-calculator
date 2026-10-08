const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const core=require(root+'core'),format=require(root+'formatting');
const guide=require('../reference/el506ts/guide-examples');
const plain=html=>html.replace(/<span[^>]*>&times;<\/span>10<sup>(.*?)<\/sup>/g,'e$1').replace(/<[^>]*>/g,'').replace(/&#0?39;|&#39;|&nbsp;/g,'').replace(/&deg;/g,'deg').replace(/&#8242;/g,'min').replace(/&#8243;/g,'sec').replace(/\s/g,'');
// Printed guide expectations are independent of the application. These are
// application regressions, not a claim that all simulator sequences match.
for(const fixture of guide.fixtures)test('Guide application regression: '+fixture.id,()=>{
 let state=core.createInitialState(),checked=0;
 for(let i=0;i<fixture.sequence.length;i++){
  state=core.reduceCalculator(state,{type:'physical-key',id:fixture.sequence[i]});
  let work=0;while(state.workflow.payload?.stage==='calculating'){assert.ok(++work<400);state=core.reduceCalculator(state,{type:'calculus-step'});}
  for(const frame of fixture.frames.filter(x=>x.afterStep===i+1)){
   const rendered=format.renderState(state,{physical:true}),upper=plain(rendered.expressionHtml),lower=plain(rendered.resultHtml),expected=frame.printed;
   const context=fixture.id+' step '+(i+1)+' '+expected;
   assert.notEqual(state.lifecycle,'error',context);
   if(expected==='0 or 1')assert.ok([0,1].includes(Number(lower)),context);
   else if(expected.startsWith('0.***'))assert.ok(/^0\.\d{3}$/.test(lower)&&Number(lower)<1,context);
   else if(expected.startsWith('integer ')){const [lo,hi]=expected.slice(8).split('..').map(Number);assert.ok(Number.isInteger(Number(lower))&&Number(lower)>=lo&&Number(lower)<=hi,context);}
   else if(expected==='internal 0.6')assert.equal(state.lastValue,0.6,context);
   else if(expected==='F1'){assert.equal(lower,'F1',context);assert.equal(core.semanticEditor.serialize(state.control.formulas[0]),'piY^2',context);}
   else if(expected.startsWith('DEG RAD')){assert.equal(upper,'DEGRADGRAD',context);assert.equal(lower,'0.12',context);}
   else if(expected==='2-VLE 3-VLE menu'){assert.equal(upper,'2-VLE3-VLE',context);assert.equal(lower.replace(/\u2022/g,'.'),'0.1',context);}
   else if(expected.startsWith('result cells:')){
    const cells=JSON.parse(expected.slice(13));assert.equal(state.values.last.kind,'matrix',context);assert.deepEqual([state.values.last.rows,state.values.last.columns],[cells.length,cells[0].length],context);
    assert.deepEqual(state.values.last.elements.map(x=>Number(x.value.toPrecision(10))),cells.flat(),context);
   }
   else if(expected==='4 3/14'||expected==='59/14'){
    assert.deepEqual(state.values.last,{kind:'rational',numerator:'59',denominator:'14'},context);
    assert.equal(lower,expected==='59/14'?'5914':'4314',context);
   }
   else if(expected.includes('deg'))assert.equal(lower,expected,context);
   else if(expected==='matA^2; 0.'){assert.equal(upper,'matA2',context);assert.equal(Number(lower),0,context);}
   else if(expected.includes(';')){const [label,result]=expected.split(';').map(x=>x.trim());assert.equal(upper,label.replace(/\s/g,''),context);assert.equal(Number(lower),Number(result),context);}
   else if(expected==='0. MAT'){assert.equal(state.layers.mode,'MAT',context);assert.equal(Number(lower),0,context);}
   else {
    const split=expected.indexOf('='),numeric=split<0?expected:expected.slice(split+1);
    if(split>=0&&!['real','imag','r','angle','theta','x','y'].includes(expected.slice(0,split)))assert.equal(upper,expected.slice(0,split+1).replace(/\s/g,''),context);
    if(fixture.id==='guide-p31-derivative'){
     // Independently recorded native display, asserted without tolerance.
     assert.equal(expected,'0.577350268');assert.equal(lower,expected);
    }else if(/ [HbPo]$/.test(expected))assert.equal(lower,expected.replace(/\s/g,''),context);
    else assert.equal(Number(lower.replace(/i$/,'')),Number(numeric.replace(/(?:RAD|GRAD|DEG|H|b|P|o|%)$/,'').trim()),context);
   }
   checked++;
  }
 }
 assert.equal(checked,fixture.frames.length);
});
