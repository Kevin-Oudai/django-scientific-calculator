const {test,expect}=require('@playwright/test');
const key=(root,n)=>root.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]');
async function seq(root,keys){for(const n of keys)await key(root,n).click();}
async function setup(page){await page.goto('/');return page.locator('[data-scientific-calculator]').first();}
const snap=root=>root.evaluate(el=>el.scientificCalculator.snapshot());
test('N-base HEX keyboard digits, arithmetic, inline marker and binary conversion',async({page})=>{
 const root=await setup(page);await seq(root,[41,3,38]);await root.focus();await page.keyboard.type('A+F');await page.keyboard.press('Enter');await expect(root.locator('[data-result]')).toHaveText('19H');expect((await snap(root)).state.answer).toBe(25);
 await seq(root,[3,39]);await expect(root.locator('[data-expression]')).toHaveText('19\u2192BIN');await expect(root.locator('[data-result]')).toHaveText('11001b');await key(root,41).click();await expect(root.locator('[data-result]')).toHaveText('11001b');
});
test('N-base ten-digit complements stay visible in every base',async({page})=>{
 const root=await setup(page);await seq(root,[3,39,2,47,40,48]);await expect(root.locator('[data-result]')).toHaveText('1111111111b');
 for(const [key,digits,marker]of [[38,'FFFFFFFFFF','H'],[43,'4444444444','P'],[44,'7777777777','o']]){await seq(root,[3,key]);await expect(root.locator('[data-result]')).toHaveText(digits+marker);const bounds=await root.locator('[data-result]').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));expect(bounds.scroll).toBeLessThanOrEqual(bounds.client+1);}
 await key(root,1).click();await expect(root.locator('[data-result]')).toHaveText('0.');expect((await snap(root)).state.control.nbase.radix).toBe(10);
});
test('N-base logical precedence, memory and error recovery work with physical buttons',async({page})=>{
 const root=await setup(page);await seq(root,[3,39,2,40,14,40,13,45,48]);await expect(root.locator('[data-result]')).toHaveText('1b');
 await seq(root,[28,18,2,27,18]);await expect(root.locator('[data-result]')).toHaveText('1b');await seq(root,[2,40,39,45,48]);await expect(root.locator('[data-expression]')).toHaveText('Error 2');await expect(root.locator('[data-result]')).toHaveText('b');await key(root,2).click();await expect(root.locator('[data-result]')).toHaveText('0b');
});
test('N-base formula memories and snapshots preserve HEX literals',async({page})=>{
 const root=await setup(page);await seq(root,[3,38,2,18,43,23,28,8,2,27,8,48]);await expect(root.locator('[data-result]')).toHaveText('19H');const saved=await snap(root);expect(saved.schemaVersion).toBe(12);await root.evaluate((el,s)=>el.scientificCalculator.restore(s),saved);await seq(root,[3,39]);await expect(root.locator('[data-result]')).toHaveText('11001b');
});
test('N-base mode and memories stay isolated between embedded widgets',async({page})=>{const first=await setup(page);await first.evaluate(el=>{const copy=el.cloneNode(true);el.after(copy);ScientificCalculatorBrowser.mount(copy,ScientificCalculatorCore,ScientificCalculatorFormatting);});const roots=page.locator('[data-scientific-calculator]'),one=roots.nth(0),two=roots.nth(1);await seq(one,[3,38,2,18,28,18]);await seq(two,[41,48]);expect((await snap(one)).state.control.nbase.radix).toBe(16);expect((await snap(two)).state.control.nbase.radix).toBe(10);expect((await snap(two)).state.control.variables.A).toBe(0);await seq(one,[1]);await expect(one.locator('[data-indicator="HEX"]')).toBeHidden();});
