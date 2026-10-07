const {test,expect}=require('@playwright/test');
const key=(root,n)=>root.locator(`[data-key-id="EL506-K${String(n).padStart(2,'0')}"]`);
async function setup(page){await page.goto('/');return page.locator('[data-scientific-calculator]').first();}
async function seq(root,keys){for(const n of keys)await key(root,n).click();}
const snapshot=root=>root.evaluate(el=>el.scientificCalculator.snapshot());
test('Phase 6 angle setup, DRG immediate cycle and recompute follow physical keys',async({page})=>{
 const root=await setup(page);await seq(root,[42,45,3,46]);await expect(root.locator('[data-result]')).toHaveText('0.523598775');await expect(root.locator('[data-expression]')).toContainText('RAD');
 await seq(root,[3,46]);await expect(root.locator('[data-result]')).toHaveText('33.33333333');await seq(root,[3,46]);await expect(root.locator('[data-result]')).toHaveText('30.');
 await seq(root,[2,6,45,41,13,40,45,45,48]);await expect(root.locator('[data-result]')).toHaveText('1.');expect((await snapshot(root)).state.angleMode).toBe('GRAD');
 await seq(root,[2,6,45,40,3,15,40,48]);await expect(root.locator('[data-result]')).toHaveText('0.785398163');
});
test('Phase 6 trigonometry, inverse and hyperbolic modifiers consume once and recover errors',async({page})=>{
 const root=await setup(page);for(const [keys,shown]of [[[13,42,45,48],'0.5'],[[2,3,14,45,48],'90.'],[[2,12,13,40,48],'1.175201194'],[[2,3,12,13,40,48],'0.881373587'],[[2,15,32,45,48],'Error 2'],[[2,3,12,15,40,48],'Error 2']]){await seq(root,keys);await expect(root.locator('[data-result]')).toHaveText(shown);}
 await key(root,2).click();await root.focus();await page.keyboard.type('2+3');await page.keyboard.press('Enter');await expect(root.locator('[data-result]')).toHaveText('5.');expect((await snapshot(root)).state.layers.hyp).toBe(false);await seq(root,[2,3,12,13,40,48]);await expect(root.locator('[data-announcement]')).not.toContainText('later roadmap');
});
test('Phase 6 mixed fractions retain exact value across decimal/improper and snapshot views',async({page})=>{
 const root=await setup(page);await seq(root,[41,25,40,25,42]);await expect(root.locator('[data-result] .scicalc__display-fraction')).toHaveCount(1);await key(root,48).click();await expect(root.locator('[data-result]')).toHaveText('213');await expect(root.locator('[data-announcement]')).toContainText('Result: 2 1 over 3');
 await seq(root,[3,25]);await expect(root.locator('[data-result]')).toHaveText('73');await key(root,25).click();await expect(root.locator('[data-result]')).toHaveText('2.333333333');await key(root,25).click();await expect(root.locator('[data-result]')).toHaveText('213');
 await root.evaluate(el=>el.scientificCalculator.restore(el.scientificCalculator.snapshot()));expect((await snapshot(root)).state.values.last).toEqual({kind:'rational',numerator:'7',denominator:'3'});
 await seq(root,[2,40,25,41,43,40,25,42,48]);await expect(root.locator('[data-result]')).toHaveText('56');expect((await snapshot(root)).state.values.answer.numerator).toBe('5');
});
test('Phase 6 fraction capacity and DMS carry, decimal view and minute grammar',async({page})=>{
 const root=await setup(page);await seq(root,[40,41,42,35,36,25,37,30,31,32,40,48]);await expect(root.locator('[data-result]')).toHaveText('0.181835589');
 await seq(root,[2,40,26,30,45,26,31,45,48]);await expect(root.locator('[data-result]')).toHaveText('2°11′20″');await seq(root,[3,26]);await expect(root.locator('[data-result]')).toHaveText('2.188888889');await seq(root,[3,26]);await expect(root.locator('[data-result]')).toHaveText('2°11′20″');
 await seq(root,[2,47,40,26,42,45,26,45,48]);await expect(root.locator('[data-result]')).toHaveText('-1°30′0″');
});
test('Phase 6 coordinate commands evaluate immediately and expose native X/Y recall without result paging',async({page})=>{
 const root=await setup(page);await seq(root,[42,3,28,35,3,31]);await expect(root.locator('[data-expression]')).toHaveText('r=');await expect(root.locator('[data-result]')).toHaveText('5.');await seq(root,[27,28]);await expect(root.locator('[data-expression]')).toHaveText('Y=');await expect(root.locator('[data-result]')).toHaveText('53.13010235');expect((await snapshot(root)).state.answer).toBe(5);
 await seq(root,[2,36,3,28,42,45,3,32]);await expect(root.locator('[data-result]')).toHaveText('4.330127019');await seq(root,[27,28]);await expect(root.locator('[data-result]')).toHaveText('2.5');await seq(root,[2,45,3,28,45,3,31]);await expect(root.locator('[data-result]')).toHaveText('Error 2');
});
test('Phase 6 coordinate and fraction state remain isolated on two calculators with clear and restore',async({page})=>{
 const root=await setup(page);await root.evaluate(el=>{const copy=el.cloneNode(true);el.after(copy);ScientificCalculatorBrowser.mount(copy,ScientificCalculatorCore,ScientificCalculatorFormatting);});const other=page.locator('[data-scientific-calculator]').nth(1);
 await seq(root,[42,3,28,35,3,31]);await other.evaluate(el=>{for(const n of [41,25,40,25,42,48])el.scientificCalculator.pressKey('EL506-K'+String(n).padStart(2,'0'));});
 expect((await snapshot(other)).state.control.variables.X).toBe(0);expect((await snapshot(root)).state.control.variables.X).toBe(5);await seq(root,[2,27,27]);await expect(root.locator('[data-result]')).toHaveText('5.');expect((await snapshot(other)).state.values.last.numerator).toBe('7');
});
