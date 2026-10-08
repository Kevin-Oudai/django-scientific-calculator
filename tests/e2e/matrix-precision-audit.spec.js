const {test,expect}=require('@playwright/test');
for(const name of ['matrix-intermediate-precision-native','matrix-scaled-precision-native','matrix-product-precision-native'])test('Native matrix division and large-term cancellation: '+name,async({page})=>{
 test.setTimeout(180000);await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const reference=require('../reference/el506ts/experiments/'+name+'.json');
 for(let step=1;step<=reference.sequence.length;step++){
  await root.locator('[data-key-id="'+reference.sequence[step-1]+'"]').click();
  const frame=reference.frames.find(frame=>frame.after_step===step);if(!frame)continue;
  await expect(root.locator('[data-result]')).toHaveText(frame.display.lower_line);
  expect((await root.evaluate(el=>el.scientificCalculator.snapshot())).state.control.errorCode).toBe(null);
 }
});
