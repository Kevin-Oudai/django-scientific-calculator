const {test,expect}=require('@playwright/test');
const key=(r,n)=>r.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]');
async function seq(r,keys){for(const n of keys)await key(r,n).click();}
for(const [mode,choice,code]of [[36,36,10],[36,37,10],[35,37,7]])test(`Collection conversion error ${mode}/${choice} remains restorable and usable`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');const r=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>r.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 await seq(r,[4,mode,17,choice]);await expect(r.locator('[data-expression]')).toHaveText('Error '+code);
 const snap=await r.evaluate(el=>el.scientificCalculator.snapshot());
 expect(snap.state.workflow.kind).toBe(null);
 await r.evaluate((el,s)=>el.scientificCalculator.restore(s),snap);
 await seq(r,[2,1,41,43,42,48]);await expect(r.locator('[data-result]')).toHaveText('5.');
 expect(errors).toEqual([]);
});
