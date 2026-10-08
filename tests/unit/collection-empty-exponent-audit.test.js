const test=require('node:test'),assert=require('node:assert/strict');
const root='../../src/scientific_calculator/static/scientific_calculator/';
const c=require(root+'core'),f=require(root+'formatting');
for(const mode of ['LIST','MAT'])test('Independent native '+mode+' repeated and empty exponent commit',()=>{
 const trace=require('../reference/el506ts/experiments/'+mode.toLowerCase()+'-empty-exponent-native.json');
 let s=c.createInitialState();if(mode==='LIST')s=['EL506-K04','EL506-K36','EL506-K11','EL506-K29'].reduce((s,id)=>c.reduceCalculator(s,{type:'physical-key',id}),s);
 trace.sequence.forEach((id,i)=>{s=c.reduceCalculator(s,{type:'physical-key',id});if(i===trace.sequence.length-3){assert.equal(s.workflow.payload.input,'1E');assert.match(f.renderState(s,{physical:true}).resultHtml,/<sup>00<\/sup>/);}if(i===trace.sequence.length-2){assert.equal(s.workflow.payload.input,'1E-');assert.match(f.renderState(s,{physical:true}).resultHtml,/<sup>-00<\/sup>/);}});
 assert.equal(s.control.errorCode,null);assert.deepEqual(s.control.buffers[mode==='LIST'?'list':'matrix'].elements.map(x=>x.value),[1]);assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(s)),s);
});
