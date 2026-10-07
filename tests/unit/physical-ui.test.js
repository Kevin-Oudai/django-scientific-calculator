const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../../src/scientific_calculator/static/scientific_calculator/core.js');
const formatting=require('../../src/scientific_calculator/static/scientific_calculator/formatting.js');
const browser=require('../../src/scientific_calculator/static/scientific_calculator/browser-adapter.js');
const catalog=require('../../src/scientific_calculator/static/scientific_calculator/physical-keys.json');
const press=(s,n)=>core.reduceCalculator(s,{type:'physical-key',id:`EL506-K${String(n).padStart(2,'0')}`});
const view=s=>formatting.renderState(s,{physical:true});
test('physical labels cover all verified positions without changing permanent IDs',()=>{
  assert.equal(catalog.keys.length,48);
  for(let row=1;row<=7;row++) assert.equal(catalog.keys.filter(k=>k.position.region==='main'&&k.position.row===row).length,[6,6,6,5,5,5,4][row-1]);
  for(const k of catalog.keys) assert.equal(typeof k.legends.primary,'string');
  assert.equal(catalog.keys[19].legends.second,'√');
  assert.equal(catalog.keys[47].legends.alpha,'ANS');
  const ledger=require('../reference/el506ts/capability-ledger.json');
  for(const row of ledger.capabilities.filter(c=>['2ndF','ALPHA'].includes(c.family))) {
    const key=catalog.keys.find(k=>k.id===row.access.key_sequence[1]);
    assert.ok(key.legends[row.family==='2ndF'?'second':'alpha'],row.label);
  }
});
test('physical display independently projects LCD lines and modifiers, formats and modes',()=>{
  const initial=core.createInitialState();
  assert.equal(view(initial).expressionHtml,'');
  for(const [name,sequence] of [['2ndF',[3]],['ALPHA',[5]],['HYP',[12]]]) {
    let s=initial;for(const n of sequence)s=press(s,n);
    assert.equal(view(s).indicators[name],true);assert.equal(view(s).resultHtml,'0');
  }
  for(const mode of ['CPLX','MAT','LIST','STAT']) {
    const s=structuredClone(initial);s.layers.mode=mode;
    assert.equal(view(s).indicators[mode],true);
  }
  for(const format of ['FIX','SCI','ENG']) {
    const s=structuredClone(initial);s.layers.settings.format=format;
    assert.equal(view(s).indicators[format],true);
  }
  for(const angle of ['DEG','RAD','GRAD']) {
    const s=structuredClone(initial);s.layers.settings.angle=angle;
    assert.equal(view(s).indicators[angle],true);
  }
  for(const [radix,label] of [[2,'BIN'],[5,'PEN'],[8,'OCT'],[10,'DEC'],[16,'HEX']]) {
    const s=structuredClone(initial);s.values.last={kind:'nbase',integer:'1',radix,signed:true,width:8};
    assert.equal(view(s).indicators[label],true);
  }
  const s=press(press(initial,40),29);assert.equal(view(s).indicators.M,true);
});
test('insert marker toggles through its canonical key and snapshots preserve it',()=>{
  let s=core.createInitialState();for(const n of [40,43,9])s=press(s,n);
  assert.match(view(s).expressionHtml,/selected-char/);
  assert.equal(view(s).cursorPosition,1); // live simulator: select the final +
  const end=press(s,10);assert.equal(view(end).cursorPosition,2);assert.match(view(end).expressionHtml,/scicalc__cursor/);
  assert.equal(press(end,9).cursor,1);
  const before=core.snapshotCalculator(s);
  s=press(press(s,3),7);assert.equal(view(s).insertMode,'overwrite');assert.equal(s.secondActive,false);
  assert.equal(before.state.layers.settings.insert,undefined);
  assert.deepEqual(core.restoreCalculator(core.snapshotCalculator(s)),s);
  s=press(press(s,3),7);assert.equal(view(s).insertMode,'insert');
});
test('all result families page through the same physical path without changing stores',()=>{
  for(const pages of [
    [{label:'x',value:2},{label:'y',value:3}],
    [{label:'real',component:'xy',value:2},{label:'imaginary',component:'i',value:3}],
    [{label:'x1',value:2},{label:'x2',value:3}],
    [{label:'A[1,1]',value:{kind:'rational',numerator:'1',denominator:'2'}},{label:'A[1,2]',value:3}],
    [{label:'L1[1]',value:2},{label:'L1[2]',value:3}],
  ]) {
    const initial=press(core.createInitialState(),30);
    let s=core.reduceCalculator(initial,{type:'workflow',command:'show-results',payload:{pages}});
    const stores=structuredClone(s.values),history=structuredClone(s.history);
    assert.equal(view(s).pageStatus,'1 / 2');assert.equal(view(s).previousPage,false);
    s=press(s,11);assert.equal(view(s).pageStatus,'2 / 2');assert.equal(view(s).nextPage,false);
    assert.equal(view(s).expressionHtml,pages[1].label);
    s=press(s,10);assert.equal(s.workflow.page,1);
    s=press(s,8);assert.equal(s.workflow.page,0);
    assert.deepEqual(s.values,stores);assert.deepEqual(s.history,history);assert.equal(s.answer,initial.answer);
  }
});
test('physical menus page and escape display text without interpreting it as markup',()=>{
  let s=press(core.createInitialState(),4);assert.equal(view(s).expressionHtml,'NORMAL   STAT');
  assert.equal(view(s).resultHtml,'0•   1');
  s=press(s,11);assert.equal(view(s).expressionHtml,'EQN   CPLX');assert.equal(s.workflow.page,1);
  s=press(s,8);assert.equal(s.workflow.page,0);
  s=core.reduceCalculator(core.createInitialState(),{type:'workflow',command:'show-results',payload:{pages:[{label:'<img>',value:'<script>alert(1)</script>'}]}});
  assert.equal(view(s).expressionHtml,'&lt;img&gt;');assert.match(view(s).resultHtml,/&lt;script&gt;/);
});
test('keyboard bindings emit fixed physical IDs and preserve host shortcuts',()=>{
  assert.equal(browser.keyboardKeyId({key:'1'}),'EL506-K40');
  assert.equal(browser.keyboardKeyId({key:'F2'}),'EL506-K03');
  assert.equal(browser.keyboardKeyId({key:'Enter'}),'EL506-K48');
  for(const options of [{ctrlKey:true},{metaKey:true},{altKey:true},{isComposing:true}])assert.equal(browser.keyboardKeyId({key:'1',...options}),null);
  assert.equal(browser.keyboardKeyId({key:'Tab'}),null);
});
