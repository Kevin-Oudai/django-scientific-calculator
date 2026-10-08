const {test,expect}=require('@playwright/test');
for(const operation of ['determinant','transpose','dimension'])test('Independent scalar '+operation+' type rejection and ON/C recovery',async({page})=>{
 await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const reference=require('../reference/el506ts/experiments/matrix-'+operation+'-scalar-type-native.json');
 for(const id of ['EL506-K04','EL506-K35',...reference.sequence])await root.locator('[data-key-id="'+id+'"]').click();
 await expect(root.locator('[data-expression]')).toHaveText('Error 1');
 expect((await root.evaluate(el=>el.scientificCalculator.snapshot())).state.control.errorCode).toBe(1);
 await root.locator('[data-key-id="EL506-K02"]').click();
 expect((await root.evaluate(el=>el.scientificCalculator.snapshot())).state.control.errorCode).toBe(null);
});
