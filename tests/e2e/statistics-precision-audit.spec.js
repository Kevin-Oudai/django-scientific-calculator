const {test,expect}=require('@playwright/test');
test('Native LINE Y sum and mean cancellation checkpoints',async({page})=>{
 test.setTimeout(180000);await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const reference=require('../reference/el506ts/experiments/statistics-y-cancellation-native.json');
 for(let step=1;step<=reference.sequence.length;step++){
  await root.locator('[data-key-id="'+reference.sequence[step-1]+'"]').click();
  const frame=reference.frames.find(x=>x.after_step===step);if(!frame)continue;
  await expect(root.locator('[data-result]')).toHaveText(frame.display.lower_line);
  expect((await root.evaluate(el=>el.scientificCalculator.snapshot())).state.control.errorCode).toBe(null);
 }
});
test('Native STAT X sum mean and RCL cancellation checkpoints',async({page})=>{
 test.setTimeout(180000);await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const reference=require('../reference/el506ts/experiments/statistics-x-cancellation-native.json');
 for(const id of ['EL506-K04','EL506-K35'])await root.locator('[data-key-id="'+id+'"]').click();
 for(let step=1;step<=reference.sequence.length;step++){
  await root.locator('[data-key-id="'+reference.sequence[step-1]+'"]').click();
  const frame=reference.frames.find(x=>x.after_step===step);if(!frame)continue;
  await expect(root.locator('[data-result]')).toHaveText(frame.display.lower_line);
  expect((await root.evaluate(el=>el.scientificCalculator.snapshot())).state.control.errorCode).toBe(null);
 }
});
