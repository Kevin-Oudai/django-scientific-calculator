const {test,expect}=require('@playwright/test');
const key=(root,n)=>root.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]');
async function start(page){await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);return root;}
test('Native MAT pending-value fault retains final operand and selects sixth plus',async({page})=>{
 test.setTimeout(180000);const root=await start(page);for(const n of [4,35])await key(root,n).click();
 const r=require('../reference/el506ts/experiments/matrix-pending-values-native.json');
 for(let step=1;step<=r.sequence.length;step++){
  await root.locator('[data-key-id="'+r.sequence[step-1]+'"]').click();
  if([20,22].includes(step)){await expect(root.locator('[data-expression]')).toHaveText('Error 3');await expect(root.locator('[data-result]')).toHaveText('');}
  if([21,23].includes(step)){const s=(await root.evaluate(el=>el.scientificCalculator.snapshot())).state;expect(s.expression).toBe('1+('.repeat(6)+'1');expect(s.cursor).toBe(16);await expect(root.locator('.scicalc__selected-char')).toHaveText('+');await expect(root.locator('[data-result]')).toHaveText('');}
 }
 await expect(root.locator('[data-result]')).toHaveText('0.');
});
test('Manual non-NORMAL value limits accept the adjacent boundary in CPLX MAT and LIST',async({page})=>{
 test.setTimeout(180000);const root=await start(page);
 for(const mode of [42,35,36]){
  for(const n of [4,mode])await key(root,n).click();
  for(let i=0;i<5;i++)for(const n of [40,43,33])await key(root,n).click();
  for(const n of [40,48])await key(root,n).click();await expect(root.locator('[data-result]')).toHaveText('6.');
 }
});
test('Manual matrix definition limit rejects a second saved value without modifying its buffer',async({page})=>{
 test.setTimeout(180000);const root=await start(page);for(const n of [4,35,11])await key(root,n).click();
 const before=(await root.evaluate(el=>el.scientificCalculator.snapshot())).state.control.buffers.matrix;
 for(const n of [40,43,33,40,43,33,40,29])await key(root,n).click();await expect(root.locator('[data-expression]')).toHaveText('Error 3');
 expect((await root.evaluate(el=>el.scientificCalculator.snapshot())).state.control.buffers.matrix).toEqual(before);
});
