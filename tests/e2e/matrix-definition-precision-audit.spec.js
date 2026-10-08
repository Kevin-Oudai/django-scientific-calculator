const {test,expect}=require('@playwright/test');
test('Native matrix dimension and cell entry punctuation',async({page})=>{
 await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const reference=require('../reference/el506ts/experiments/matrix-entry-punctuation-native.json');
 for(let step=1;step<=reference.sequence.length;step++){
  await root.locator('[data-key-id="'+reference.sequence[step-1]+'"]').click();
  const frame=reference.frames.find(x=>x.after_step===step);if(!frame)continue;
  await expect(root.locator('[data-result]')).toHaveText(frame.display.lower_line);
  await expect(root.locator('[data-expression]')).toHaveText(frame.display.upper_line);
 }
});
test('Native stored matrix definition third cancellation precision',async({page})=>{
 await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 for(const id of ['EL506-K04','EL506-K35','EL506-K11','EL506-K29','EL506-K29'])await root.locator('[data-key-id="'+id+'"]').click();
 const reference=require('../reference/el506ts/experiments/matrix-definition-division-native.json');
 for(let step=1;step<=reference.sequence.length;step++){await root.locator('[data-key-id="'+reference.sequence[step-1]+'"]').click();const frame=reference.frames.find(x=>x.after_step===step);if(!frame)continue;await expect(root.locator('[data-result]')).toHaveText(frame.display.lower_line);await expect(root.locator('[data-expression]')).toHaveText(frame.display.upper_line);}
 const state=(await root.evaluate(el=>el.scientificCalculator.snapshot())).state;expect(state.control.errorCode).toBe(null);expect(state.control.buffers.matrix.elements.map(x=>x.value)).toEqual([0]);
});
