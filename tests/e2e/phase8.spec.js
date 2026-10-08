const {test,expect}=require('@playwright/test');
const key=(root,n)=>root.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]');
async function seq(root,keys){for(const n of keys)await key(root,n).click();}
async function setup(page){await page.goto('/');return page.locator('[data-scientific-calculator]').first();}
const snap=root=>root.evaluate(el=>el.scientificCalculator.snapshot());
test('Phase 8 physical memories show ALPHA, insert variables and accumulate M',async({page})=>{
 const root=await setup(page);await seq(root,[30,28]);await expect(root.locator('[data-expression]')).toHaveText('');await expect(root.locator('[data-result]')).toHaveText('7.');
 await seq(root,[18,2,41,43,27,18]);await expect(root.locator('[data-expression]')).toHaveText('2+A');await expect(root.locator('[data-result]')).toHaveText('7.');
 await seq(root,[48,29]);await expect(root.locator('[data-expression]')).toHaveText('ANSM+');expect((await snap(root)).state.memoryValue).toBe(9);
 await seq(root,[2,35,3,29,2,27,29]);await expect(root.locator('[data-result]')).toHaveText('5.');expect((await snap(root)).state.answer).toBe(4);
});
test('Phase 8 editable formula memories and ALGB retain variables on repeated runs',async({page})=>{
 const root=await setup(page);await seq(root,[30,28,18,2,5,19,43,5,18,28,8]);await expect(root.locator('[data-result]')).toHaveText('F1');
 await seq(root,[2,27,8,3,17]);await expect(root.locator('[data-expression] u')).toHaveText('B');await expect(root.locator('[data-result]')).toHaveText('0.');
 await seq(root,[41,48]);await expect(root.locator('[data-expression] u')).toHaveText('A');await expect(root.locator('[data-result]')).toHaveText('7.');await key(root,48).click();await expect(root.locator('[data-result]')).toHaveText('9.');
 await seq(root,[3,17]);await expect(root.locator('[data-result]')).toHaveText('2.');await seq(root,[42,48,48]);await expect(root.locator('[data-result]')).toHaveText('10.');
 await root.evaluate(el=>el.scientificCalculator.restore(el.scientificCalculator.snapshot()));await seq(root,[2,27,8,48]);await expect(root.locator('[data-result]')).toHaveText('10.');
 await expect(root.locator('[data-announcement]')).not.toContainText('later roadmap');
});
test('Phase 8 solver renders Start and dx prompts, repeats with opposite root and recovers from Error 2',async({page})=>{
 const root=await setup(page);await seq(root,[5,27,20,44,41,17,45]);await expect(root.locator('[data-expression]')).toHaveText('Start?');await expect(root.locator('[data-result]')).toHaveText('0.');
 await seq(root,[40,48]);await expect(root.locator('[data-expression]')).toHaveText('dx?');await expect(root.locator('[data-result]')).toHaveText('0.00001');await key(root,48).click();await expect(root.locator('[data-expression]')).toHaveText('X=');await expect(root.locator('[data-result]')).toHaveText('1.414213562');
 await seq(root,[48,40,47,48,48]);await expect(root.locator('[data-result]')).toHaveText('-1.414213562');
 await seq(root,[2,5,27,20,43,40,17,45,40,48,48]);await expect(root.locator('[data-expression]')).toHaveText('Error 2');await expect(root.locator('[data-result]')).toHaveText('');
 await seq(root,[2,27,27]);await expect(root.locator('[data-result]')).toHaveText('0.');
});
test('Phase 8 keyboard numeric prompt input and cancellation preserve confirmed stores',async({page})=>{
 const root=await setup(page);await seq(root,[5,18,43,5,19,3,17]);await root.focus();await page.keyboard.type('2');await page.keyboard.press('Enter');await expect(root.locator('[data-expression] u')).toHaveText('B');
 await page.keyboard.type('3');await key(root,2).click();expect((await snap(root)).state.control.variables).toMatchObject({A:2,B:0});
 await seq(root,[5,18,43,5,19,3,17,48,35,48]);await expect(root.locator('[data-result]')).toHaveText('6.');
});
test('Phase 8 memories remain isolated between two embedded calculators',async({page})=>{
 const root=await setup(page);await root.evaluate(el=>{const copy=el.cloneNode(true);el.after(copy);ScientificCalculatorBrowser.mount(copy,ScientificCalculatorCore,ScientificCalculatorFormatting);});const other=page.locator('[data-scientific-calculator]').nth(1);
 await seq(root,[30,28,18,2,5,18,43,40,28,8]);await seq(other,[41,28,18,2,5,18,43,41,28,8]);
 await seq(root,[2,27,8,48]);await seq(other,[2,27,8,48]);await expect(root.locator('[data-result]')).toHaveText('8.');await expect(other.locator('[data-result]')).toHaveText('4.');expect((await snap(root)).schemaVersion).toBe(12);
});
