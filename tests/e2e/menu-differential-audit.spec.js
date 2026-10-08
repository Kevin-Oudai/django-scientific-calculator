const {test,expect}=require('@playwright/test');
const ref=require('../reference/el506ts/experiments/menu-inventory.json');
const text=x=>String(x).replace(/\s+/g,' ').replaceAll('μ','µ').trim();
const digits=x=>text(x).replace(/[^0-9A-F]/g,'');
test('Independent native menu pages and entered combination operand',async({page})=>{
 test.setTimeout(240000);await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const press=async n=>await root.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]').click();
 for(let step=1;step<=ref.sequence.length;step++){
  await root.locator('[data-key-id="'+ref.sequence[step-1]+'"]').click();
  const frame=ref.frames.find(frame=>frame.after_step===step);if(!frame||[81,83].includes(step))continue;
  expect(text(await root.locator('[data-expression]').innerText())).toBe(text(frame.display.upper_line));
  expect(digits(await root.locator('[data-result]').innerText())).toBe(digits(frame.display.lower_line));
 }
 // Reset the inherited FIX setting before the independently measured entry.
 for(const n of [2,6,40,42,2,17,40,11])await press(n);
 await expect(root.locator('[data-expression]')).toHaveText('m µ n p f');
 await press(11);await expect(root.locator('[data-expression]')).toHaveText('k M G T');
 for(const n of [2,3,36])await press(n);
 await expect(root.locator('[data-expression]')).toHaveText('0C');await expect(root.locator('[data-result]')).toHaveText('0.');
 await press(40);await expect(root.locator('[data-expression]')).toHaveText('0C');await expect(root.locator('[data-result]')).toHaveText('1.');
 await press(48);expect((await root.evaluate(el=>el.scientificCalculator.snapshot())).state.control.errorCode).toBe(2);
});
