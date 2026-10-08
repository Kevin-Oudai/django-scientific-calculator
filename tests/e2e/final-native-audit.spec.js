const {test,expect}=require('@playwright/test');
test('Native NORMAL buffer overflow recovers through the fault cursor without losing its operand',async({page})=>{
 test.setTimeout(180000);await page.goto('/');
 const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const key=n=>root.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]');
 for(const n of [...Array(25).fill(13),40,48])await key(n).click();
 await expect(root.locator('[data-expression]')).toHaveText('Error 3');
 await expect(root.locator('[data-result]')).toHaveText('');
 for(const n of [10,7,48])await key(n).click();
 await expect(root.locator('[data-result]')).toHaveText('6.383145827×10-43');
 expect((await root.evaluate(el=>el.scientificCalculator.snapshot())).state.control.errorCode).toBe(null);
 const ref=require('../reference/el506ts/experiments/formula-length-memory-errors-native.json');
 for(let i=30;i<ref.sequence.length;i++){
  await root.locator('[data-key-id="'+ref.sequence[i]+'"]').click();
  if([46,49,55].includes(i+1)){
   await expect(root.locator('[data-expression]')).toHaveText('Error '+(i+1===55?6:4));
   await expect(root.locator('[data-result]')).toHaveText('');
  }
  if([32,53].includes(i+1))await expect(root.locator('[data-result]')).toHaveText(i+1===32?'F1':'F2');
  if([56,58,60].includes(i+1))await expect(root.locator('[data-result]')).toHaveText('0.');
 }
 const saved=await root.evaluate(el=>el.scientificCalculator.snapshot());
 expect(saved.state.control.formulas[1].length).toBeGreaterThan(0);expect(saved.state.control.formulas[2]).toEqual([]);
});
