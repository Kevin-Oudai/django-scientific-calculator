const {test,expect}=require('@playwright/test');
const reference=require('../reference/el506ts/experiments/matrix-multiterm-residual-native.json');
test('MAT explicit closing parentheses permit multiterm calculation and recovery',async({page})=>{
 test.setTimeout(120000);await page.goto('/');const r=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>r.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 for(const id of reference.sequence)await r.locator('[data-key-id="'+id+'"]').click();
 await expect(r.locator('[data-expression]')).toHaveText('MAT1,1=');
 const snap=await r.evaluate(el=>el.scientificCalculator.snapshot());expect(snap.state.control.errorCode).toBe(null);
 await r.evaluate((el,s)=>el.scientificCalculator.restore(s),snap);
 for(const n of [2,1,41,43,42,48])await r.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]').click();
 await expect(r.locator('[data-result]')).toHaveText('5.');
});
