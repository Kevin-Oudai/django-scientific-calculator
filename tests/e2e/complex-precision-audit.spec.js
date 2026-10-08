const {test,expect}=require('@playwright/test');
test('Native complex real and imaginary cancellation, ANS reuse and scaled residual',async({page})=>{
 test.setTimeout(180000);await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const key=id=>root.locator('[data-key-id="'+id+'"]');for(const id of ['EL506-K04','EL506-K35'])await key(id).click();
 const reference=require('../reference/el506ts/experiments/complex-intermediate-precision-native.json');
 for(let step=1;step<=reference.sequence.length;step++){
  await key(reference.sequence[step-1]).click();const frame=reference.frames.find(frame=>frame.after_step===step);if(!frame)continue;
  await expect(root.locator('[data-result]')).toHaveText(frame.display.lower_line);
  expect((await root.evaluate(el=>el.scientificCalculator.snapshot())).state.control.errorCode).toBe(null);
 }
 await expect(root.locator('[data-result]')).toHaveText('333.3');
});
