const {test,expect}=require('@playwright/test');
const key=(root,n)=>root.locator(`[data-key-id="EL506-K${String(n).padStart(2,'0')}"]`);
async function setup(page){await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();await expect(root).toHaveAttribute('data-entry-phase','empty');return root;}
async function sequence(root,keys){for(const n of keys)await key(root,n).click();}
test('NORMAL measured precedence, prefix arguments and engineering units',async({page})=>{
 const root=await setup(page);
 for(const [keys,result]of [[[41,19,42,19,41,48],'64.'],[[2,37,39,41,33,40,43,41,34,48],'1.'],[[2,3,20,32,43,40,48],'4.'],[[2,41,17,40,45,48],"2'000."]]){await sequence(root,keys);await expect(root.locator('[data-result]')).toHaveText(result);}
 await expect(root.locator('[data-expression]')).toHaveText('2k=');
});
test('contextual percent evaluates immediately, ENT recomputes and constant K survives snapshot',async({page})=>{
 const root=await setup(page);await sequence(root,[41,45,45,43,40,45,3,40]);await expect(root.locator('[data-result]')).toHaveText('220.');await expect(root.locator('[data-expression]')).toHaveText('200+10%');
 await key(root,48).click();await expect(root.locator('[data-result]')).toHaveText('210.');
 await sequence(root,[2,42,35,43,36,30,48,35,36,48]);await expect(root.locator('[data-result]')).toHaveText('102.');await expect(root.locator('[data-expression]')).toHaveText('45+K=');
 await root.evaluate(el=>el.scientificCalculator.restore(el.scientificCalculator.snapshot()));await root.focus();await page.keyboard.type('5');await page.keyboard.press('Enter');await expect(root.locator('[data-result]')).toHaveText('62.');
});
test('scientific literal exponent and factorial domains use physical display and recoverable errors',async({page})=>{
 const root=await setup(page);await sequence(root,[24,42,48]);await expect(root.locator('[data-result]')).toHaveText("1'000.");await expect(root.locator('[data-expression]')).toHaveText('1E03=');
 await sequence(root,[2,41,24,40,45,45,47,48]);await expect(root.locator('[data-result]')).toHaveText('2.');
 await sequence(root,[2,30,45,3,35,48]);await expect(root.locator('[data-expression]')).toHaveText('Error 2');await expect(root.locator('[data-result]')).toHaveText('');await key(root,2).click();await sequence(root,[36,3,35,48]);await expect(root.locator('[data-result]')).toHaveText('120.');await expect(root.locator('[data-expression]')).toHaveText('5!=');
});
test('pi route and separate retained constants on two instances',async({page})=>{
 const root=await setup(page);await sequence(root,[41,18]);await expect(root.locator('[data-expression]')).toContainText('2π');await expect(root.locator('[data-result]')).toHaveText('0.');await key(root,48).click();await expect(root.locator('[data-result]')).toHaveText('6.283185307');
 await root.evaluate(el=>{const copy=el.cloneNode(true);el.after(copy);ScientificCalculatorBrowser.mount(copy,ScientificCalculatorCore,ScientificCalculatorFormatting);});const other=page.locator('[data-scientific-calculator]').nth(1);
 await sequence(root,[2,41,43,42,48]);await other.evaluate(el=>{for(const n of [35,38,36,48])el.scientificCalculator.pressKey('EL506-K'+String(n).padStart(2,'0'));});
 await sequence(root,[35,48]);await expect(root.locator('[data-result]')).toHaveText('7.');await expect(other.locator('[data-result]')).toHaveText('20.');
});
