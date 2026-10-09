const {test,expect}=require('@playwright/test');
test('black calculator title drags the compact panel and ALPHA legends do not overlap',async({page})=>{
 await page.goto('/');const panel=page.locator('[data-floating-calculator]');
 await expect(page.locator('.floating-tool__bar')).toHaveCount(0);
 const handle=panel.locator('.scicalc__brand[data-drag-handle]');await expect(handle).toHaveText('Scientific Calculator');
 const before=await panel.boundingBox(),header=await handle.boundingBox();
 await page.mouse.move(header.x+30,header.y+8);await page.mouse.down();
 await page.mouse.move(header.x-90,header.y+48,{steps:8});await page.mouse.up();
 const after=await panel.boundingBox();expect(after.x).toBeLessThan(before.x-80);
 const alpha=panel.locator('[data-key-id="EL506-K05"]');
 const primary=await alpha.locator('.scicalc__primary').boundingBox(),second=await alpha.locator('.scicalc__second-legend').boundingBox();
 expect(primary.y).toBeGreaterThan(second.y+second.height);
 for(const n of [41,43,42,48])await panel.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]').click();
 await expect(panel.locator('[data-result]')).toHaveText('5.');
});
