const {test,expect}=require('@playwright/test');
const key=(root,n)=>root.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]');
async function seq(root,keys){for(const n of keys)await key(root,n).click();}
async function setup(page){await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);return root;}
const snap=root=>root.evaluate(el=>el.scientificCalculator.snapshot());

test('Calculus independent guide and quartic native rounding agree exactly',async({page})=>{
 test.setTimeout(180000);
 const root=await setup(page);
 await seq(root,[3,20,33,40,44,5,27,20,34,3,16,47,40,25,41,48,48]);
 await expect(root.locator('[data-result]')).toHaveText('0.577350268');
 await seq(root,[2,5,27,19,35,3,16,41,48,48]);
 await expect(root.locator('[data-result]')).toHaveText('32.0000005');
});
test('Calculus physical derivative prompts editing and repeat produce native display',async({page})=>{
 const root=await setup(page);await seq(root,[5,27,20,3,16]);await expect(root.locator('[data-expression]')).toHaveText('X?');await seq(root,[41,48]);await expect(root.locator('[data-expression]')).toHaveText('dx?');await expect(root.locator('[data-result]')).toHaveText('0.00002');await key(root,48).click();await expect(root.locator('[data-expression]')).toHaveText('d/dx=');await expect(root.locator('[data-result]')).toHaveText('4.');await seq(root,[48,42,48,48]);await expect(root.locator('[data-result]')).toHaveText('6.');
});
test('Calculus integration guide and repeated conditions use real buttons',async({page})=>{
 const root=await setup(page);await seq(root,[3,20,33,40,44,5,27,20,34,16]);await expect(root.locator('[data-expression]')).toHaveText('a?');await seq(root,[48,40,48]);await expect(root.locator('[data-expression]')).toHaveText('n?');await expect(root.locator('[data-result]')).toHaveText('100.');await key(root,48).click();await expect(root.locator('[data-expression]')).toHaveText('\u222bdx=');await expect(root.locator('[data-result]')).toHaveText('0.785357562');await seq(root,[48,48]);await expect(root.locator('[data-result]')).toHaveText('1.');
});
test('Calculus fraction conditions fit the display and accept keyboard Enter',async({page})=>{
 const root=await setup(page);await seq(root,[5,27,20,3,16,47,40,25,41]);await expect(root.locator('[data-result] .scicalc__display-fraction')).toHaveCount(1);
 const bounds=await root.locator('[data-result]').evaluate(el=>{const r=el.getBoundingClientRect(),fraction=el.querySelector('.scicalc__display-fraction').getBoundingClientRect();return {fits:fraction.top>=r.top&&fraction.bottom<=r.bottom};});expect(bounds.fits).toBe(true);
 await root.focus();await page.keyboard.press('Enter');await page.keyboard.press('Enter');await expect(root.locator('[data-result]')).toHaveText('-1.');
});
test('Calculus chunked job cancels and stale work cannot change ANS',async({page})=>{
 const root=await setup(page);await seq(root,[30,48,2,5,27,20,16,48,40,48,40,45,45,45,45,48]);await expect(root.locator('[data-expression]')).toHaveText('Calculating!');await key(root,2).click();await expect(root.locator('[data-expression]')).toHaveText('');expect((await snap(root)).state.answer).toBe(7);await seq(root,[41,48]);await expect(root.locator('[data-result]')).toHaveText('2.');expect((await snap(root)).state.answer).toBe(2);
});
test('Calculus errors preserve ANS and recover with ON/C',async({page})=>{
 const root=await setup(page);await seq(root,[30,48,2,5,27,20,16,48,40,48,45,48]);await expect(root.locator('[data-expression]')).toHaveText('Error 2');await expect(root.locator('[data-result]')).toHaveText('');expect((await snap(root)).state.answer).toBe(7);await seq(root,[2,41,48]);await expect(root.locator('[data-result]')).toHaveText('2.');
});
test('Calculus jobs resume from snapshots and remain isolated between widgets',async({page})=>{
 const root=await setup(page);await root.evaluate(el=>{const copy=el.cloneNode(true);el.after(copy);ScientificCalculatorBrowser.mount(copy,ScientificCalculatorCore,ScientificCalculatorFormatting);});const two=page.locator('[data-scientific-calculator]').nth(1);
 await seq(root,[5,27,20,16,48,40,48,40,45,45,45,45,48]);const saved=await snap(root);await key(root,2).click();await root.evaluate((el,s)=>el.scientificCalculator.restore(s),saved);await expect(root.locator('[data-result]')).toHaveText('0.333333333',{timeout:45000});expect((await snap(two)).state.answer).toBe(0);expect((await snap(two)).state.workflow.kind).toBe(null);
});
test('Calculus jobs advance when animation frames are suspended',async({page})=>{
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 const root=await setup(page);
 // Real pointer actionability also needs animation frames. Use the public
 // canonical physical-key API to isolate the scheduler in this regression.
 await root.evaluate(el=>{for(const n of [5,27,20,16,48,40,48,40,45,45,45,45,48])el.scientificCalculator.pressKey('EL506-K'+String(n).padStart(2,'0'));});
 await expect(root.locator('[data-result]')).toHaveText('0.333333333',{timeout:45000});
 expect((await snap(root)).state.workflow.payload?.stage).not.toBe('calculating');
});
