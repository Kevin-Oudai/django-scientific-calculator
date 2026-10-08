const {test,expect}=require('@playwright/test');
test.use({hasTouch:true});
const key=(r,n)=>r.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]');
async function seq(r,keys){for(const n of keys)await key(r,n).click();}
async function setup(page){await page.goto('/');const r=page.locator('[data-scientific-calculator]').first();await expect.poll(()=>r.evaluate(el=>!!el.scientificCalculator)).toBe(true);return r;}
test('EQN coefficients solve page determinant correct retained input and recover',async({page})=>{
 const r=await setup(page);await seq(r,[4,41,45,40,48,40,48,42,48,40,48,40,47,48,40,48]);await expect(r.locator('[data-expression]')).toHaveText('x=');await expect(r.locator('[data-result]')).toHaveText('2.');await seq(r,[48]);await expect(r.locator('[data-expression]')).toHaveText('y=');await expect(r.locator('[data-result]')).toHaveText('1.');await seq(r,[48]);await expect(r.locator('[data-expression]')).toHaveText('det=');await expect(r.locator('[data-result]')).toHaveText('-2.');await seq(r,[48]);await expect(r.locator('[data-expression]')).toHaveText('a1?');await expect(r.locator('[data-result]')).toHaveText('1.');
});
test('CPLX physical imaginary entry ANS multiplication and polar component paging',async({page})=>{
 const r=await setup(page);await seq(r,[4,42,42,43,35,25,48]);await expect(r.locator('[data-result]')).toHaveText('3.');await seq(r,[3,24]);await expect(r.locator('[data-result]')).toHaveText('4. i');await seq(r,[3,31]);await expect(r.locator('[data-result]')).toHaveText('5.');await seq(r,[3,24]);await expect(r.locator('[data-result]')).toHaveText('53.13010235');await seq(r,[38,41,48]);const snapshot=await r.evaluate(el=>el.scientificCalculator.snapshot());expect(snapshot.state.values.answer.imaginary.value).toBe(8);
});
test('MAT physical dimensions DATA store recall square and cell paging',async({page})=>{
 const r=await setup(page);await seq(r,[4,35,11]);await expect(r.locator('[data-expression]')).toHaveText('ROW=');await seq(r,[41,29,41,29,40,29,41,29,42,29,35,29,2,17,41,45,17,45,45,20,48]);await expect(r.locator('[data-expression]')).toHaveText('ROW=');await expect(r.locator('[data-result]')).toHaveText('2.');await seq(r,[11,11]);await expect(r.locator('[data-expression]')).toHaveText('MAT1,1=');await expect(r.locator('[data-result]')).toHaveText('7.');await seq(r,[11]);await expect(r.locator('[data-result]')).toHaveText('10.');
});
test('EQN CPLX MAT keyboard touch theme and widget isolation share canonical dispatch',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});
 const r=await setup(page);await r.evaluate(el=>{const copy=el.cloneNode(true);el.after(copy);ScientificCalculatorBrowser.mount(copy,ScientificCalculatorCore,ScientificCalculatorFormatting);});const second=page.locator('[data-scientific-calculator]').nth(1);
 await seq(r,[4,42]);await r.focus();await page.keyboard.type('3+4');await key(r,25).tap();await r.focus();await page.keyboard.press('Enter');await expect(r.locator('[data-result]')).toHaveText('3.');
 expect((await second.evaluate(el=>el.scientificCalculator.snapshot())).state.layers.mode).toBe('NORMAL');await seq(second,[4,41,41,40,48,45,48,40,48]);await expect(second.locator('[data-expression]')).toHaveText('X1=');await expect(r.locator('[data-result]')).toHaveText('3.');expect(errors).toEqual([]);
 await page.addStyleTag({url:'/static/scientific_calculator/calculator-theme.example.css'});await expect(key(r,25)).toHaveAccessibleName(/^a b\/c/);
});

test('MAT native error codes recover at the measured input cursor and undefined CHK clears the buffer',async({page})=>{
 const r=await setup(page);await seq(r,[4,35,17,45,45,48]);await expect(r.locator('[data-expression]')).toHaveText('Error 10');
 await seq(r,[2,11,36,29]);await expect(r.locator('[data-expression]')).toHaveText('Error 7');
 await seq(r,[9]);const s=(await r.evaluate(el=>el.scientificCalculator.snapshot())).state;expect(s.expression).toBe('5');expect(s.cursor).toBe(1);
 await seq(r,[2,17,40,40,11]);await expect(r.locator('[data-expression]')).toHaveText('ROW=');await expect(r.locator('[data-result]')).toHaveText('1.');
});

test('MAT changing a dimension clears cells and non-square inverse reports Error 8',async({page})=>{
 const r=await setup(page);await seq(r,[4,35,17,42,35,35,48,11,40,29]);await expect(r.locator('[data-expression]')).toHaveText('MAT1,1=');await expect(r.locator('[data-result]')).toHaveText('0.');
 await seq(r,[2,17,41,41,17,45,41,3,18,48]);await expect(r.locator('[data-expression]')).toHaveText('Error 8');
});
