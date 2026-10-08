const {test,expect}=require('@playwright/test');
test('Native MAT definition scientific entry and stored cell',async({page})=>{
 await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const reference=require('../reference/el506ts/experiments/matrix-scientific-entry-native.json');
 for(let step=1;step<=reference.sequence.length;step++){
  await root.locator('[data-key-id="'+reference.sequence[step-1]+'"]').click();
  if(step===7||step===9||step===15)await expect(root.locator('[data-result] sup')).toHaveText(step===7?'00':step===15?'-13':'13');
 }
 const state=(await root.evaluate(el=>el.scientificCalculator.snapshot())).state;
 expect(state.control.errorCode).toBe(null);expect(state.control.buffers.matrix.elements.map(x=>x.value)).toEqual([1e-13]);
});
