const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/',c=require(root+'core.js'),f=require(root+'formatting.js');
const native=require('../reference/el506ts/phase12-native-notes.json');
// Compare the independent native transcript to visible DOM text, separately
// from implementation-generated golden state frames. Normalize only glyph
// encodings, cursor blink marks and the LCD's separate imaginary indicator.
const text=s=>s.replace(/<[^>]*>/g,'').replace(/&#039;/g,"'").replace(/&times;/g,'\u00d7').replace(/&divide;/g,'\u00f7').replace(/&minus;/g,'-').replace(/[\s_]/g,'').replace(/\u2212/g,'-').replace(/\u2022/g,'.').replace(/\u00b2/g,'2').normalize('NFD').replace(/\u0304/g,'\u0305');
test('Phases 12 to 15 reproduce all 111 independently observed native LCD checkpoints',()=>{
 let s=c.createInitialState(),count=0;
 for(let i=0;i<native.sequence.length;i++){
  s=c.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(native.sequence[i]).padStart(2,'0')});
  for(const checkpoint of native.checkpoints.filter(x=>x.step===i+1)){
   const v=f.renderState(s,{physical:true});assert.equal(text(v.expressionHtml),text(checkpoint.upper),'native upper step '+(i+1));
   assert.equal(text(v.resultHtml).replace(/i$/,''),text(checkpoint.lower).replace(/i$/,''),'native lower step '+(i+1));count++;
  }
 }
 assert.equal(count,111);
});
