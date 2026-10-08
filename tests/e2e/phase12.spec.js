const {test,expect}=require('@playwright/test');
const key=(r,n)=>r.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]');
async function seq(r,keys){for(const n of keys)await key(r,n).click();}
async function setup(page){await page.goto('/');const r=page.locator('[data-scientific-calculator]').first();await expect.poll(()=>r.evaluate(el=>!!el.scientificCalculator)).toBe(true);return r;}
test('Statistics result recall expression use and probability use physical keys',async({page})=>{
 const r=await setup(page);await seq(r,[4,40,45,40,29,41,29,42,29,27,35]);await expect(r.locator('[data-expression]')).toHaveText('x\u0305=');await expect(r.locator('[data-result]')).toHaveText('2.');
 await seq(r,[5,36,38,41,48]);await expect(r.locator('[data-expression]')).toHaveText('Sx\u00d72=');await expect(r.locator('[data-result]')).toHaveText('2.');
 await seq(r,[17,40,40,48]);await expect(r.locator('[data-result]')).toHaveText('0.841345');expect((await r.evaluate(el=>el.scientificCalculator.snapshot())).state.statsValues).toEqual([1,2,3]);
});
test('Statistics shifted regression estimate preserves dataset and evaluates original operand on ENT',async({page})=>{
 const r=await setup(page);await seq(r,[4,40,40,40,3,28,41,29,41,3,28,35,29,42,3,34]);await expect(r.locator('[data-expression]')).toHaveText('3y\u0302');await expect(r.locator('[data-result]')).toHaveText('6.');await seq(r,[48]);await expect(r.locator('[data-result]')).toHaveText('3.');await seq(r,[27,34]);await expect(r.locator('[data-expression]')).toHaveText('b=');await expect(r.locator('[data-result]')).toHaveText('2.');
});
test('Statistics empty-result error recovers and retains live snapshot results',async({page})=>{
 const r=await setup(page);await seq(r,[4,40,45,27,35]);await expect(r.locator('[data-expression]')).toHaveText('Error 2');await seq(r,[2,41,29,27,35]);const saved=await r.evaluate(el=>el.scientificCalculator.snapshot());await seq(r,[3,4]);await r.evaluate((el,s)=>el.scientificCalculator.restore(s),saved);await expect(r.locator('[data-result]')).toHaveText('2.');
});
