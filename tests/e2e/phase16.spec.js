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

test('LIST native editing DEL INS and scalar division restrictions are visible through physical keys',async({page})=>{
 const r=await setup(page);await seq(r,[4,36,11,42,29,42,29,40,29,41,29,2,17,41,45]);
 await seq(r,[41,39,17,45,45,48]);await expect(r.locator('[data-expression]')).toHaveText('Error 1');
 await seq(r,[2,11,11,32,31,7]);await expect(r.locator('[data-result]')).toHaveText('9.');
 await seq(r,[3,7]);await expect(r.locator('[data-result]')).toHaveText('9.');expect((await r.evaluate(el=>el.scientificCalculator.snapshot())).state.secondActive).toBe(false);
 await seq(r,[29,8]);await expect(r.locator('[data-expression]')).toHaveText('LIST1=');await expect(r.locator('[data-result]')).toHaveText('9.');
});
test('LIST native pairwise addition subtraction multiplication division retain stored copies',async({page})=>{
 const r=await setup(page);await seq(r,[4,36,11,42,29,42,29,40,29,41,29,2,17,41,45,17,41,40]);
 for(const [operation,expected]of [[43,['6.','2.','4.']],[44,['0.','0.','0.']],[38,['9.','1.','4.']],[39,['1.','1.','1.']]]){
  await seq(r,[17,45,45,operation,17,45,40,48]);await expect(r.locator('[data-result]')).toHaveText('3.');for(const result of expected){await seq(r,[11]);await expect(r.locator('[data-result]')).toHaveText(result);}await seq(r,[2]);
 }
});

test('LIST horizontal arrows abandon pending input and undefined CHK resets the edit buffer',async({page})=>{
 const r=await setup(page);await seq(r,[4,36,11,42,29,11,32,31,9]);await expect(r.locator('[data-expression]')).toHaveText('');await expect(r.locator('[data-result]')).toHaveText('0.');await expect(r.locator('[data-expression] .scicalc__cursor')).toBeVisible();
 await seq(r,[10,11]);await expect(r.locator('[data-expression]')).toHaveText('SIZE=');await expect(r.locator('[data-result]')).toHaveText('3.');
 await seq(r,[2,17,40,41,11]);await expect(r.locator('[data-expression]')).toHaveText('SIZE=');await expect(r.locator('[data-result]')).toHaveText('1.');
});


test('LIST independently observed aggregates and magnitude shortcut',async({page})=>{
 test.setTimeout(180000);
 const r=await setup(page);await seq(r,[4,36,11,42,29,42,29,40,29,41,29,2,17,41,45]);
 for(const [choice,expected]of [[45,'1.'],[40,'3.'],[41,'2.'],[42,'2.'],[35,'6.'],[36,'6.'],[37,'1.'],[30,'1.'],[18,'3.741657387']]){
  await seq(r,[17,35,choice,17,45,45,48]);await expect(r.locator('[data-result]')).toHaveText(expected);await seq(r,[2]);
 }
});


test('LIST native sorting cumulative differences augmentation and invalid operand errors',async({page})=>{
 test.setTimeout(180000);const r=await setup(page);await seq(r,[4,36,11,42,29,42,29,40,29,41,29,2,17,41,45,17,41,40]);
 for(const [choice,expected]of [[45,['1.','2.','3.']],[40,['3.','2.','1.']],[35,['3.','4.','6.']],[36,['-2.','1.']]]){
  await seq(r,[17,42,choice,17,45,45,48]);await expect(r.locator('[data-result]')).toHaveText(String(expected.length)+'.');for(const value of expected){await seq(r,[11]);await expect(r.locator('[data-result]')).toHaveText(value);}await seq(r,[2]);
 }
 await seq(r,[17,42,37,17,45,45,3,28,17,45,40,48]);await expect(r.locator('[data-result]')).toHaveText('6.');for(const value of ['3.','1.','2.','3.','1.','2.']){await seq(r,[11]);await expect(r.locator('[data-result]')).toHaveText(value);}
 await seq(r,[2,17,41,41,17,45,45,43,17,45,41,48]);await expect(r.locator('[data-expression]')).toHaveText('Error 8');
 await seq(r,[2,13,17,45,45,48]);await expect(r.locator('[data-expression]')).toHaveText('Error 1');
 await seq(r,[2,17,45,45,20,48,11,11,11,40,39]);await expect(r.locator('[data-expression]')).toHaveText('1÷');await expect(r.locator('[data-result]')).toHaveText('0.');await expect(r.locator('[data-expression] .scicalc__cursor')).toBeVisible();
 await seq(r,[45,29]);await expect(r.locator('[data-expression]')).toHaveText('Error 2');
});


test('LIST four-slot copies isolate working edits and preserve native conversion mappings',async({page})=>{
 test.setTimeout(180000);const r=await setup(page);
 await seq(r,[4,36,11,41,29,42,29,35,29,2]);
 for(const slot of [45,40,41,42])await seq(r,[17,41,slot]);
 await seq(r,[17,40,42,11,11]);await expect(r.locator('[data-result]')).toHaveText('3.');
 await seq(r,[32,29,2,17,37,17,40,45,11]);await expect(r.locator('[data-expression]')).toHaveText('ROW=');await expect(r.locator('[data-result]')).toHaveText('2.');
 await seq(r,[11]);await expect(r.locator('[data-result]')).toHaveText('4.');
 for(const result of ['3.','3.','3.','3.','4.','4.','4.','4.']){await seq(r,[11]);await expect(r.locator('[data-result]')).toHaveText(result);}
 await seq(r,[2,17,37,17,36,17,40,42,11]);await expect(r.locator('[data-result]')).toHaveText('2.');await seq(r,[11]);await expect(r.locator('[data-result]')).toHaveText('1.');await seq(r,[11]);await expect(r.locator('[data-result]')).toHaveText('3.');await seq(r,[11]);await expect(r.locator('[data-result]')).toHaveText('4.');
});


test('LIST memory clearing and RESET preserve the native mode and prompt displays',async({page})=>{
 test.setTimeout(180000);const r=await setup(page);
 await seq(r,[4,36,11,11,30,29,2,17,41,42,3,47,45]);await expect(r.locator('[data-expression]')).toHaveText('CLR_MEMORY?');await expect(r.locator('[data-result]')).toHaveText('0.');
 await seq(r,[45,17,45,42,48]);await expect(r.locator('[data-expression]')).toHaveText('Error 10');expect((await r.evaluate(el=>el.scientificCalculator.snapshot())).state.layers.mode).toBe('LIST');
 await seq(r,[2,11,11,30,29,2,17,41,42,3,47,40]);await expect(r.locator('[data-expression]')).toHaveText('RESET?');await expect(r.locator('[data-result]')).toHaveText('0.');
 await seq(r,[45]);expect((await r.evaluate(el=>el.scientificCalculator.snapshot())).state.layers.mode).toBe('NORMAL');await expect(r.locator('[data-result]')).toHaveText('0.');
 await seq(r,[4,36,17,45,42,48]);await expect(r.locator('[data-expression]')).toHaveText('Error 10');
});
