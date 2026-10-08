const test=require('node:test'),assert=require('node:assert/strict');
const c=require('../../src/scientific_calculator/static/scientific_calculator/core');
const press=(s,n)=>c.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});
const seq=(s,keys)=>keys.reduce(press,s);
// Independent policy: full English manual p1 clearing table, memory table,
// HOME note and playback paragraph; native phase3/8/11/15/16 traces supplement it.
// These validated typed fixtures exercise every store; they are not native captures.
function stored(mode){
 let s=seq(c.createInitialState(),[41,43,42,48]);s.layers.mode=mode;s.control.submode=mode==='STAT'?'SD':mode==='EQN'?'LINEAR2':null;
 s.angleMode=s.layers.settings.angle='GRAD';s.layers.settings.format='FIX';s.layers.settings.tab=3;s.layers.settings.insert=false;
 s.memoryValue=17;s.values.memory=c.valueTypes.scalar(17);
 for(const [i,name]of Object.keys(s.control.variables).entries()){s.control.variables[name]=i+21;s.values.variables[name]=c.valueTypes.scalar(i+21);}
 s.control.formulas=[1,2,3,4].map(n=>c.semanticEditor.tokenize(String(n)+'+1',{physical:true}));
 s.statsValues=[31];s.values.statistics.rows=[{x:c.valueTypes.scalar(31),y:null,weight:1}];s.control.statistics.frequencies=[false];
 s.control.matrices=[41,42,43,44].map(n=>({kind:'matrix',rows:1,columns:1,elements:[c.valueTypes.scalar(n)]}));
 s.control.lists=[51,52,53,54].map(n=>({kind:'list',elements:[c.valueTypes.scalar(n)]}));
 s.control.buffers={matrix:structuredClone(s.control.matrices[0]),list:structuredClone(s.control.lists[0])};
 if(mode!=='NORMAL'){s.history=[];s.values.history=[];}
 return c.restoreCalculator(c.snapshotCalculator(s));
}
const actions=[
 ['ON/C',[2],'retain'],['CA',[3,4],'internal'],['OFF/ON',[3,2,2],'retain'],
 ['MEM',[3,47,45,48],'memory'],['RESET',[3,47,40,48],'reset'],['HOME',[1],'home'],
 ...[['NORMAL',[4,45]],['STAT',[4,40,45]],['EQN',[4,41,45]],['CPLX',[4,42]],['MAT',[4,35]],['LIST',[4,36]]].map(([mode,keys])=>['MODE '+mode,keys,'internal'])
];
for(const mode of ['NORMAL','STAT','EQN','CPLX','MAT','LIST'])for(const [name,keys,policy]of actions)test('Manual persistence matrix '+mode+' / '+name,()=>{
 const before=stored(mode),original=structuredClone(before),after=seq(before,keys),retains=policy==='retain'||policy==='home'&&mode==='NORMAL';
 assert.deepEqual(before,original,'input state immutable');assert.equal(after.control.power,'on');assert.equal(after.control.errorCode,null);
 if(policy==='reset'){assert.deepEqual(after,c.createInitialState());return;}
 assert.deepEqual(after.layers.settings,before.layers.settings,'settings survive clear/power/mode');
 if(retains){
  for(const key of ['answer','memoryValue','statsValues','values','history'])assert.deepEqual(after[key],before[key],key);
  for(const key of ['variables','formulas','matrices','lists','buffers'])assert.deepEqual(after.control[key],before.control[key],key);
 }else{
  assert.equal(after.answer,0);assert.deepEqual(after.statsValues,[]);assert.deepEqual(after.values.statistics.rows,[]);assert.deepEqual(after.history,[]);
  assert.ok(Object.values(after.control.variables).every(n=>n===0));assert.ok(Object.values(after.values.variables).every(v=>v.value===0));
  assert.deepEqual(after.control.matrices,[null,null,null,null]);assert.deepEqual(after.control.lists,[null,null,null,null]);assert.deepEqual(after.control.buffers,{matrix:null,list:null});
  if(policy==='memory'){assert.equal(after.memoryValue,0);assert.deepEqual(after.control.formulas,[[],[],[],[]]);}
  else{assert.equal(after.memoryValue,17);assert.deepEqual(after.values.memory,before.values.memory);assert.deepEqual(after.control.formulas,before.control.formulas);}
 }
 assert.deepEqual(c.restoreCalculator(c.snapshotCalculator(after)),after,'post-transition snapshot validates');
});
