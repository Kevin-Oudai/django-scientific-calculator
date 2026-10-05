const {test,expect}=require('@playwright/test');
test.use({hasTouch:true});
async function threeEmbeds(page){
  await page.route('**/',async route=>{
    const response=await route.fetch(),html=await response.text();
    const start=html.indexOf('<div class="scicalc" data-scientific-calculator>'),end=html.indexOf('<script',start);
    await route.fulfill({response,body:html.slice(0,end)+html.slice(start,end).repeat(2)+html.slice(end)});
  });
  await page.goto('/');const roots=page.locator('[data-scientific-calculator]');await expect(roots).toHaveCount(3);
  await expect(roots.nth(2)).toHaveAttribute('data-entry-phase','empty');
  // Exercise ordinary embeds, outside the demo's single floating-tool shell.
  await page.evaluate(()=>{
    const roots=[...document.querySelectorAll('[data-scientific-calculator]')],host=document.createElement('section');
    host.style.cssText='display:grid;grid-template-columns:repeat(3,360px);gap:20px;position:relative;margin:20px;';
    document.body.prepend(host);roots.forEach(root=>host.append(root));
    for(const child of document.body.children) if(child!==host && child.tagName!=='SCRIPT')child.style.display='none';
  });
  return roots;
}
const snapshot=root=>root.evaluate(el=>el.scientificCalculator.snapshot());
test('three embeds isolate keyboard, pointer, touch, retained values, settings and restore',async({page})=>{
  const roots=await threeEmbeds(page),a=roots.nth(0),b=roots.nth(1),c=roots.nth(2);
  const initialB=await snapshot(b),initialC=await snapshot(c);
  await a.focus();await page.keyboard.type('1/3');await page.keyboard.press('Enter');
  await a.locator('[data-action="second"]').click();await a.locator('[data-second-action="memory-add"]').click();
  await a.locator('[data-action="second"]').click();await a.locator('[data-second-action="stats-add"]').click();
  await a.evaluate(el=>['EL506-K06','EL506-K45','EL506-K40'].forEach(id=>el.scientificCalculator.pressKey(id)));
  const savedA=await snapshot(a);expect(savedA.state.angleMode).toBe('RAD');
  expect(savedA.state.values.memory).toEqual({kind:'rational',numerator:'1',denominator:'3'});
  expect(savedA.state.statsValues).toHaveLength(1);expect(await snapshot(b)).toEqual(initialB);expect(await snapshot(c)).toEqual(initialC);
  await b.locator('[data-insert="4"]').click();await b.locator('[data-insert="+"]').click();await b.locator('[data-insert="5"]').click();await b.locator('[data-action="equals"]').click();
  const savedB=await snapshot(b);expect(savedB.state.answer).toBe(9);expect(await snapshot(a)).toEqual(savedA);
  await c.locator('[data-insert="2"]').tap();await c.locator('[data-insert="*"]').tap();await c.locator('[data-insert="3"]').tap();await c.locator('[data-action="equals"]').tap();
  expect((await snapshot(c)).state.answer).toBe(6);expect(await snapshot(a)).toEqual(savedA);expect(await snapshot(b)).toEqual(savedB);
  const savedC=await snapshot(c);
  await a.locator('[data-action="home"]').click();await a.evaluate((el,s)=>{el.scientificCalculator.restore(s);s.state.values.memory.numerator='99';s.state.layers.settings.tab=9;},savedA);
  expect(await snapshot(a)).toEqual(savedA);expect(await snapshot(b)).toEqual(savedB);expect(await snapshot(c)).toEqual(savedC);
  await b.focus();await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowLeft');
  expect((await snapshot(b)).state.selectionActive).toBe(true);expect(await snapshot(a)).toEqual(savedA);expect(await snapshot(c)).toEqual(savedC);
  const editedB=await snapshot(b);
  await page.locator('body').evaluate(el=>{el.tabIndex=-1;el.focus();});await page.keyboard.type('777');
  expect(await snapshot(a)).toEqual(savedA);expect(await snapshot(b)).toEqual(editedB);expect(await snapshot(c)).toEqual(savedC);
  await b.evaluate(el=>['EL506-K02','EL506-K05','EL506-K48','EL506-K48'].forEach(id=>el.scientificCalculator.pressKey(id)));
  expect((await snapshot(b)).state.answer).toBe(9);expect(await snapshot(a)).toEqual(savedA);expect(await snapshot(c)).toEqual(savedC);
});
test('remount is idempotent and preserves each instance and its event handlers',async({page})=>{
  const roots=await threeEmbeds(page),first=roots.nth(0);
  await first.evaluate(el=>{
    el.scientificCalculator.pressKey('EL506-K40');
    ScientificCalculatorBrowser.mount(el,ScientificCalculatorCore,ScientificCalculatorFormatting);
    ScientificCalculatorBrowser.mount(el,ScientificCalculatorCore,ScientificCalculatorFormatting);
  });
  await first.focus();await page.keyboard.type('2');await expect(first.locator('[data-result]')).toHaveText('12');
  await expect(roots.nth(1).locator('[data-result]')).toHaveText('0');
});
test('nested embeds route keyboard and clicks only to their nearest calculator',async({page})=>{
  const roots=await threeEmbeds(page);
  await page.evaluate(()=>{const roots=document.querySelectorAll('[data-scientific-calculator]');roots[0].append(roots[1]);});
  const all=page.locator('[data-scientific-calculator]');await all.nth(1).focus();await page.keyboard.type('4');
  expect((await snapshot(all.nth(0))).state.entry).toBe('');expect((await snapshot(all.nth(1))).state.entry).toBe('4');
  await all.nth(1).locator('[data-insert="5"]').click();
  expect((await snapshot(all.nth(0))).state.entry).toBe('');expect((await snapshot(all.nth(1))).state.entry).toBe('45');
});
test('reloading the compatible entry preserves mounted roots and initializes a fresh embed',async({page})=>{
  const roots=await threeEmbeds(page);await roots.nth(0).focus();await page.keyboard.type('7');
  const saved=await snapshot(roots.nth(0));const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluate(async()=>{
    const root=document.querySelector('[data-scientific-calculator]'),copy=root.cloneNode(true);root.after(copy);
    const src=[...document.scripts].find(s=>s.src.endsWith('/calculator.js')).src;
    await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.head.append(script);});
  });
  const all=page.locator('[data-scientific-calculator]');await expect.poll(()=>all.nth(1).evaluate(el=>Boolean(el.scientificCalculator))).toBe(true);
  expect(await snapshot(all.nth(0))).toEqual(saved);expect((await snapshot(all.nth(1))).state.entry).toBe('');
  await all.nth(0).focus();await page.keyboard.type('8');await expect(all.nth(0).locator('[data-result]')).toHaveText('78');expect(errors).toEqual([]);
});
