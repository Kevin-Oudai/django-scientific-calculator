const {test,expect}=require('@playwright/test');
const key=(r,n)=>r.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]');
async function seq(r,keys){for(const n of keys)await key(r,n).click();}
async function setup(page){await page.goto('/');const r=page.locator('[data-scientific-calculator]').first();await expect.poll(()=>r.evaluate(el=>!!el.scientificCalculator)).toBe(true);return r;}
const snap=r=>r.evaluate(el=>el.scientificCalculator.snapshot());
test('Statistics weighted DATA browse correct and delete use physical buttons',async({page})=>{
 const r=await setup(page);await seq(r,[4,40,45,40,29,41,3,28,42,29]);await expect(r.locator('[data-expression]')).toHaveText('DATA SET=');await expect(r.locator('[data-result]')).toHaveText('2.');
 await seq(r,[11,11,11]);await expect(r.locator('[data-expression]')).toHaveText('X2=');await seq(r,[32,29]);await expect(r.locator('[data-result]')).toHaveText('9.');await seq(r,[11]);await expect(r.locator('[data-expression]')).toHaveText('N2=');await expect(r.locator('[data-result]')).toHaveText('3.');await seq(r,[3,29]);await expect(r.locator('[data-result]')).toHaveText('1.');expect((await snap(r)).state.statsValues).toEqual([1]);
});
test('Statistics paired whole correction keyboard comma and frequency labels',async({page})=>{
 const r=await setup(page);await seq(r,[4,40,40]);await r.focus();await page.keyboard.type('2,4,3');await key(r,29).click();await seq(r,[11,11]);await expect(r.locator('[data-expression]')).toHaveText('Y1=');await expect(r.locator('[data-result]')).toHaveText('4.');
 await seq(r,[45,3,28,36,29,8]);await expect(r.locator('[data-expression]')).toHaveText('X1=');await expect(r.locator('[data-result]')).toHaveText('0.');await seq(r,[11,11]);await expect(r.locator('[data-expression]')).toHaveText('N1=');await expect(r.locator('[data-result]')).toHaveText('1.');
});
test('Statistics incomplete pair error recovers without deleting data',async({page})=>{
 const r=await setup(page);await seq(r,[4,40,40,41,29]);await expect(r.locator('[data-expression]')).toHaveText('Error 1');await expect(r.locator('[data-result]')).toHaveText('');await seq(r,[2,41,3,28,35,29,2,8]);await expect(r.locator('[data-expression]')).toHaveText('N1=');expect((await snap(r)).state.values.statistics.rows).toHaveLength(1);
});
test('Statistics snapshot restore and widget isolation preserve paired weights',async({page})=>{
 const r=await setup(page);await r.evaluate(el=>{const copy=el.cloneNode(true);el.after(copy);ScientificCalculatorBrowser.mount(copy,ScientificCalculatorCore,ScientificCalculatorFormatting);});const two=page.locator('[data-scientific-calculator]').nth(1);
 await seq(r,[4,40,40,41,3,28,35,3,28,42,29,11,11]);const saved=await snap(r);await seq(r,[3,4]);await r.evaluate((el,s)=>el.scientificCalculator.restore(s),saved);await expect(r.locator('[data-expression]')).toHaveText('Y1=');expect((await snap(r)).state.values.statistics.rows[0].weight).toBe(3);expect((await snap(two)).state.values.statistics.rows).toEqual([]);
});
test('Statistics fraction entry fits the physical display',async({page})=>{
 const r=await setup(page);await seq(r,[4,40,45,40,25,41]);const fit=await r.locator('[data-result]').evaluate(el=>{const r=el.getBoundingClientRect(),f=el.querySelector('.scicalc__display-fraction').getBoundingClientRect();return f.top>=r.top&&f.bottom<=r.bottom;});expect(fit).toBe(true);await key(r,29).click();await seq(r,[11]);await expect(r.locator('[data-result]')).toHaveText('0.5');
});
test('Statistics full dataset error keeps stored data and permits delete then add',async({page})=>{
 const r=await setup(page);await seq(r,[4,40,45]);
 // Restore a physically entered full dataset to focus this browser test on recovery.
 await r.evaluate(el=>{let s=ScientificCalculatorCore.createInitialState();const p=n=>s=ScientificCalculatorCore.reduceCalculator(s,{type:'physical-key',id:'EL506-K'+String(n).padStart(2,'0')});[4,40,45].forEach(p);for(let i=0;i<100;i++){p(40);p(29);}el.scientificCalculator.restore(ScientificCalculatorCore.snapshotCalculator(s));});
 await seq(r,[41,29]);await expect(r.locator('[data-expression]')).toHaveText('Error 3');expect((await snap(r)).state.statsValues).toHaveLength(100);await seq(r,[2,11,3,29,41,29]);await expect(r.locator('[data-expression]')).toHaveText('DATA SET=');expect((await snap(r)).state.statsValues).toHaveLength(100);
});
