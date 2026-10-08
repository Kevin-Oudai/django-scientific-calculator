const {test,expect}=require('@playwright/test');
test('Native LIST exponent entry sum and mean cancellation checkpoints',async({page})=>{
 test.setTimeout(180000);await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const reference=require('../reference/el506ts/experiments/list-sum-mean-cancellation-native.json');
 for(let step=1;step<=reference.sequence.length;step++){
  await root.locator('[data-key-id="'+reference.sequence[step-1]+'"]').click();
  if(step===9){await expect(root.locator('[data-result] sup')).toHaveText('13');}
  const frame=reference.frames.find(x=>x.after_step===step);if(!frame)continue;
  await expect(root.locator('[data-result]')).toHaveText(frame.display.lower_line);
  const state=(await root.evaluate(el=>el.scientificCalculator.snapshot())).state;
  expect(state.control.errorCode).toBe(null);expect(state.control.lists[0].elements.map(x=>x.value)).toEqual([1e13,1,-1e13]);
 }
});
test('Native LIST definition NEG changes exponent sign',async({page})=>{
 await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const trace=require('../reference/el506ts/experiments/list-negative-exponent-native.json');
 for(let step=1;step<=trace.sequence.length;step++){await root.locator('[data-key-id="'+trace.sequence[step-1]+'"]').click();if(step===7||step===9)await expect(root.locator('[data-result] sup')).toHaveText(step===7?'-00':'-13');}
 const state=(await root.evaluate(el=>el.scientificCalculator.snapshot())).state;expect(state.control.errorCode).toBe(null);expect(state.control.buffers.list.elements.map(x=>x.value)).toEqual([1e-13]);
});
