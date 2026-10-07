const {test,expect}=require('@playwright/test');
const key=(root,n)=>root.locator(`[data-key-id="EL506-K${String(n).padStart(2,'0')}"]`);
async function setup(page){await page.goto('/');const root=page.locator('[data-scientific-calculator]');await expect(root).toHaveAttribute('data-entry-phase','empty');return root;}
async function sequence(root,keys){for(const n of keys)await key(root,n).click();}
const state=root=>root.evaluate(el=>el.scientificCalculator.snapshot().state);
test.beforeEach(async({page},info)=>{info.errors=[];page.on('pageerror',e=>info.errors.push(e.message));});
test.afterEach(async({},info)=>expect(info.errors).toEqual([]));

test('SET UP physical menu, FSE cycling and TAB prompt use native labels and keyboard',async({page})=>{
 const root=await setup(page);await sequence(root,[6]);await expect(root.locator('[data-expression]')).toHaveText('DRG FSE TAB');await expect(root.locator('[data-result]')).toHaveText('0. 1');
 await key(root,41).click();expect((await state(root)).workflow.payload.id).toBe('SETUP');await root.focus();await page.keyboard.press('Enter');await expect(root.locator('[data-expression]')).toHaveText('DEG RAD GRAD');
 await sequence(root,[41,6,40,11]);await expect(root.locator('[data-expression]')).toHaveText('NORM1 NORM2');await key(root,11).click();await expect(root.locator('[data-expression]')).toHaveText('FIX SCI ENG');
 await sequence(root,[45,6,41]);await expect(root.locator('[data-expression]')).toHaveText('TAB(0-9)?');await expect(root.locator('[data-result]')).toHaveText('');await key(root,48).click();expect((await state(root)).workflow.kind).toBe('prompt');await key(root,41).click();await expect(root.locator('[data-result]')).toHaveText('0.00');expect((await state(root)).angleMode).toBe('GRAD');
});
test('native display formats reformat the current result without changing internal value',async({page})=>{
 const root=await setup(page);await sequence(root,[40,39,30,48]);await expect(root.locator('[data-result]')).toHaveText('0.142857142');const original=(await state(root)).values;
 await sequence(root,[6,40,45,6,41,41]);await expect(root.locator('[data-result]')).toHaveText('0.14');await sequence(root,[6,40,40]);await expect(root.locator('[data-result]')).toHaveText('1.43×10-01');await expect(root.locator('[data-result] sup')).toHaveText('-01');
 await sequence(root,[6,40,41]);await expect(root.locator('[data-result]')).toHaveText('142.86×10-03');await expect(root.locator('[data-indicator="ENG"]')).toBeVisible();expect((await state(root)).values).toEqual(original);
 await sequence(root,[6,41,45]);await expect(root.locator('[data-result]')).toHaveText('143.×10-03');expect((await state(root)).values).toEqual(original);
});
test('MDF commits rounded display and makes the verified chained calculation differ',async({page})=>{
 const root=await setup(page);await sequence(root,[6,40,45,6,41,40,36,39,32,48]);await expect(root.locator('[data-result]')).toHaveText('0.6');const original=(await state(root)).history;
 await sequence(root,[3,45]);expect((await state(root)).answer).toBe(.6);expect((await state(root)).history).toEqual(original);await sequence(root,[38,32,48]);await expect(root.locator('[data-result]')).toHaveText('5.4');
 await root.evaluate(el=>el.scientificCalculator.reset());await sequence(root,[6,40,45,6,41,40,36,39,32,48,38,32,48]);await expect(root.locator('[data-result]')).toHaveText('5.0');
});
test('NORM thresholds, grouped integers, typed entry zeros and signed rounded zero',async({page})=>{
 const root=await setup(page);await sequence(root,[40,24,32,47,48]);await expect(root.locator('[data-result]')).toHaveText('0.000000001');await sequence(root,[6,40,35]);await expect(root.locator('[data-result]')).toHaveText('1.×10-09');
 await sequence(root,[2,40,41,42,35,46,45,45]);await expect(root.locator('[data-result]')).toHaveText("1'234.00");
 await sequence(root,[2,6,40,45,6,41,40,47,40,39,40,45,45,48]);await expect(root.locator('[data-result]')).toHaveText('-0.0');
});
test('fraction displays survive NORM, FIX uses decimals, and all paged result families follow settings',async({page})=>{
 const root=await setup(page);await sequence(root,[40,25,42,48]);await expect(root.locator('[data-result] .scicalc__display-fraction')).toBeVisible();await sequence(root,[6,40,45,6,41,41]);await expect(root.locator('[data-result]')).toHaveText('0.33');
 await root.evaluate(el=>{const s=el.scientificCalculator.snapshot();s.state.workflow={kind:'multi-result',payload:{pages:[{label:'x1',value:{kind:'rational',numerator:'1',denominator:'3'}},{label:'A[1,2]',value:{kind:'scalar',value:2}}]},page:0,returnPhase:'evaluated'};s.state.lifecycle='multi-result';el.scientificCalculator.restore(s);});
 await sequence(root,[6,40,40]);await expect(root.locator('[data-expression]')).toHaveText('x1');await expect(root.locator('[data-result]')).toHaveText('3.33×10-01');await key(root,11).click();await expect(root.locator('[data-expression]')).toHaveText('A[1,2]');await expect(root.locator('[data-result]')).toHaveText('2.00×1000');
});
test('formatting settings and MDF remain independent on a multi-instance page',async({page})=>{
 const root=await setup(page);await root.evaluate(el=>{const copy=el.cloneNode(true);el.after(copy);ScientificCalculatorBrowser.mount(copy,ScientificCalculatorCore,ScientificCalculatorFormatting);});const roots=page.locator('[data-scientific-calculator]');
 const first=roots.first(),other=roots.nth(1);await first.evaluate(el=>el.scientificCalculator.pressKey('EL506-K06'));await first.evaluate(el=>{for(const n of [40,45,6,41,40,36,39,32,48,3,45])el.scientificCalculator.pressKey('EL506-K'+String(n).padStart(2,'0'));});
 expect((await state(first)).answer).toBe(.6);expect((await state(other)).layers.settings.format).toBe('NORM1');expect((await state(other)).answer).toBe(0);
});
