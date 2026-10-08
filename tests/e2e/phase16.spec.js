const {test,expect}=require('@playwright/test');
test.use({hasTouch:true});
const key=(r,n)=>r.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]');
async function seq(r,a){for(const n of a)await key(r,n).click();}
async function setup(page){await page.goto('/');const r=page.locator('[data-scientific-calculator]').first();await expect.poll(()=>r.evaluate(el=>!!el.scientificCalculator)).toBe(true);return r;}
test('LIST physical entry storage pairwise arithmetic and result paging',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const r=await setup(page);
 await seq(r,[4,36,11,42,29,42,29,40,29,41,29,2,17,41,45,17,45,45,38,17,45,45,48]);await expect(r.locator('[data-expression]')).toHaveText('SIZE=');await expect(r.locator('[data-result]')).toHaveText('3.');
 await seq(r,[11]);await expect(r.locator('[data-result]')).toHaveText('9.');await seq(r,[11]);await expect(r.locator('[data-result]')).toHaveText('1.');await seq(r,[11]);await expect(r.locator('[data-result]')).toHaveText('4.');expect(errors).toEqual([]);
});
test('LIST keyboard touch capacity error recovery and two-widget isolation',async({page})=>{
 const r=await setup(page);await r.evaluate(el=>{const copy=el.cloneNode(true);el.after(copy);ScientificCalculatorBrowser.mount(copy,ScientificCalculatorCore,ScientificCalculatorFormatting);});const second=page.locator('[data-scientific-calculator]').nth(1);
 await seq(r,[4,36]);await r.focus();await page.keyboard.press('ArrowDown');await page.keyboard.type('17');await key(r,29).tap();await expect(r.locator('[data-error]')).toContainText('Error 7');
 await seq(r,[2,11]);await expect(r.locator('[data-expression]')).toHaveText('SIZE=');await expect(r.locator('[data-result]')).toHaveText('1.');for(const indicator of await second.locator('[data-indicator="LIST"]').all())await expect(indicator).not.toBeVisible();
 const saved=await r.evaluate(el=>el.scientificCalculator.snapshot());expect(saved.schemaVersion).toBe(12);await r.evaluate((el,s)=>el.scientificCalculator.restore(s),saved);await expect(r.locator('[data-expression]')).toHaveText('SIZE=');
});
