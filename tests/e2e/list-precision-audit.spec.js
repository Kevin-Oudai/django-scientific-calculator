const {test,expect}=require('@playwright/test');
test('Native list division and scaled intermediate residual',async({page})=>{
 test.setTimeout(180000);await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const reference=require('../reference/el506ts/experiments/list-intermediate-precision-native.json');
 for(let step=1;step<=reference.sequence.length;step++){
  await root.locator('[data-key-id="'+reference.sequence[step-1]+'"]').click();
  const frame=reference.frames.find(frame=>frame.after_step===step);if(!frame)continue;
  await expect(root.locator('[data-result]')).toHaveText(frame.display.lower_line);
  expect((await root.evaluate(el=>el.scientificCalculator.snapshot())).state.control.errorCode).toBe(null);
 }
});
