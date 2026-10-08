const {test,expect}=require('@playwright/test');
const reference=require('../reference/el506ts/phase-7-catalogue-reference.json');
const key=(root,n)=>root.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]');
const digits={0:45,1:40,2:41,3:42,4:35,5:36,6:37,7:30,8:31,9:32};
const idx=i=>String(i).padStart(2,'0').split('').map(d=>digits[d]);
async function seq(root,keys){for(const n of keys)await key(root,n).click();}
async function setup(page){await page.goto('/');return page.locator('[data-scientific-calculator]').first();}
const snap=root=>root.evaluate(el=>el.scientificCalculator.snapshot());
test('Phase 7 constants prompt uses two digits, historical values, format settings and cancellation',async({page})=>{
 const root=await setup(page);await seq(root,[3,41]);await expect(root.locator('[data-result]')).toHaveText('01-52 []');
 await key(root,45).click();await expect(root.locator('[data-result]')).toHaveText('01-52 [0]');
 await key(root,41).click();await expect(root.locator('[data-result]')).toHaveText('6.67408×10-11');await key(root,48).click();
 expect((await snap(root)).state.answer).toBe(6.67408e-11);await expect(root.locator('[data-announcement]')).not.toContainText('later roadmap');
 await seq(root,[2,3,41,36,41,48]);await expect(root.locator('[data-result]')).toHaveText("101'325.");
 await seq(root,[2,3,41,45,2]);await expect(root.locator('[data-result]')).toHaveText('0.');
});
test('Phase 7 all 52 catalogue IDs survive physical dispatch, evaluation and restore in the browser',async({page})=>{
 const root=await setup(page);
 for(const row of reference.constants){
  await root.evaluate((el,keys)=>{el.scientificCalculator.reset();for(const n of keys)el.scientificCalculator.pressKey('EL506-K'+String(n).padStart(2,'0'));},[3,41,...idx(row.id),48]);
  const state=(await snap(root)).state;expect(state.lifecycle).toBe('evaluated');expect(state.answer).toBe(Number(row.value));
  await expect(root.locator('[data-result]')).not.toContainText('Error');await root.evaluate(el=>el.scientificCalculator.restore(el.scientificCalculator.snapshot()));
 }
});
test('Phase 7 conversion entry, Fahrenheit offset, fraction input and invalid index recover',async({page})=>{
 const root=await setup(page);await seq(root,[40,3,42]);await expect(root.locator('[data-expression]')).toHaveText('1→cv');
 await seq(root,[45,40,48]);await expect(root.locator('[data-expression]')).toHaveText('1→cv1=');await expect(root.locator('[data-result]')).toHaveText('2.54');
 await seq(root,[2,47,35,45,3,42,40,30,48]);await expect(root.locator('[data-result]')).toHaveText('-40.');
 await seq(root,[2,40,25,41,3,42,45,40,43,40,48]);await expect(root.locator('[data-result]')).toHaveText('2.27');
 await seq(root,[2,40,3,42,32,32,48]);await expect(root.locator('[data-expression]')).toHaveText('Error 2');await expect(root.locator('[data-result]')).toHaveText('');await key(root,2).click();await expect(root.locator('[data-result]')).toHaveText('0.');
});
test('Phase 7 all 44 conversion IDs preserve ANS for reverse conversion in the browser',async({page})=>{
 const root=await setup(page);
 for(let i=1;i<=44;i++){
  await root.evaluate((el,keys)=>{el.scientificCalculator.reset();for(const n of keys)el.scientificCalculator.pressKey('EL506-K'+String(n).padStart(2,'0'));},[40,3,42,...idx(i),48]);
  expect((await snap(root)).state.lifecycle).toBe('evaluated');await expect(root.locator('[data-result]')).not.toContainText('Error');
  await root.evaluate((el,keys)=>{for(const n of keys)el.scientificCalculator.pressKey('EL506-K'+String(n).padStart(2,'0'));},[3,42,...idx(i%2?i+1:i-1),48]);
  expect((await snap(root)).state.answer).toBeCloseTo(1,10);
 }
});
test('Phase 7 random menus repeat with ENT and expose the underlying sample in Y',async({page})=>{
 const root=await setup(page);await seq(root,[3,30]);await expect(root.locator('[data-expression]')).toHaveText('RAND R-DICE');
 await key(root,11).click();await expect(root.locator('[data-expression]')).toHaveText('R-COIN R-INT');
 await seq(root,[42,48]);let s=(await snap(root)).state;expect(s.answer).toBeGreaterThanOrEqual(0);expect(s.answer).toBeLessThanOrEqual(99);
 const samples=await root.evaluate(el=>{const outputs=[];for(let i=0;i<100;i++){el.scientificCalculator.pressKey('EL506-K48');outputs.push(el.scientificCalculator.snapshot().state.answer);}return outputs;});expect(new Set(samples).size).toBeGreaterThan(20);
 await seq(root,[2,27,28]);s=(await snap(root)).state;expect(s.lastValue).toBeGreaterThanOrEqual(0);expect(s.lastValue).toBeLessThan(1);
 for(const [index,max]of [[0,.999],[1,6],[2,1]]){await seq(root,[2,3,30,digits[index],48]);s=(await snap(root)).state;expect(s.answer).toBeGreaterThanOrEqual(index===1?1:0);expect(s.answer).toBeLessThanOrEqual(max);await expect(root.locator('[data-expression]')).toContainText(index===0?'RANDOM':index===1?'R-DICE':'R-COIN');}
});
test('Phase 7 catalogue operations remain isolated between calculator embeds',async({page})=>{
 const root=await setup(page);await root.evaluate(el=>{const other=el.cloneNode(true);el.after(other);ScientificCalculatorBrowser.mount(other,ScientificCalculatorCore,ScientificCalculatorFormatting);});
 const other=page.locator('[data-scientific-calculator]').nth(1);await seq(root,[3,30,40,48]);await seq(other,[3,41,45,42,48]);
 expect((await snap(root)).state.control.variables.Y).not.toBe(0);expect((await snap(other)).state.control.variables.Y).toBe(0);expect((await snap(other)).state.answer).toBe(9.80665);
 await root.evaluate(el=>el.scientificCalculator.restore(el.scientificCalculator.snapshot()));await expect(other.locator('[data-result]')).toHaveText('9.80665');
});

test('Phase 7 catalogue values retain precision through physical STO and RCL',async({page})=>{
 const root=await setup(page);
 await seq(root,[3,41,45,32,48,28,18,2,27,18]);
 let s=(await snap(root)).state;expect(s.lastValue).toBe(1.6021766208e-19);expect(s.displayExpression).toBe('A=');
 await root.evaluate(el=>el.scientificCalculator.restore(el.scientificCalculator.snapshot()));
 await seq(root,[2,40,3,42,45,40,48,28,28,2,27,28]);
 s=(await snap(root)).state;expect(s.lastValue).toBe(2.54);expect(s.displayExpression).toBe('Y=');
 await expect(root.locator('[data-result]')).toHaveText('2.54');
 await seq(root,[2,40,3,42,45,40,48,3,42,45,41,48,28,18,2,27,18]);
 expect((await snap(root)).state.lastValue).toBe(1);await expect(root.locator('[data-result]')).toHaveText('1.');
});
