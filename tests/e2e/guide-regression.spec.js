const {test,expect}=require('@playwright/test');
const guide=require('../reference/el506ts/guide-examples');
for(const id of ['guide-p23-formula-memory','guide-p26-side-x','guide-p26-side-y','guide-p29-coordinates','guide-p41-complex']){
 test('Guide physical buttons: '+id,async({page})=>{
  const fixture=guide.fixtures.find(x=>x.id===id),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
  const root=page.locator('[data-scientific-calculator]').first();
  await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
  for(const key of fixture.sequence)await root.locator('[data-key-id="'+key+'"]').click();
  const printed=fixture.frames.at(-1).printed,expected=printed.includes('=')?printed.split('=')[1]:printed;
  await expect(root.locator('[data-result]')).toHaveText(expected);
  expect(errors).toEqual([]);
 });
}
test('Guide transition matrix pages all four simulator-observed results',async({page})=>{
 await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 for(const id of guide.fixtures.find(x=>x.id==='guide-p43-matrix').sequence)await root.locator('[data-key-id="'+id+'"]').click();
 for(const [label,value]of [['MAT1,1=','0.83'],['MAT1,2=','0.34'],['MAT2,1=','0.17'],['MAT2,2=','0.66']]){
  await root.locator('[data-key-id="EL506-K11"]').click();await expect(root.locator('[data-expression]')).toHaveText(label);await expect(root.locator('[data-result]')).toHaveText(value);
 }
});
