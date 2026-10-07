const {test,expect}=require('@playwright/test');
const key=(root,n)=>root.locator(`[data-key-id="EL506-K${String(n).padStart(2,'0')}"]`);
async function setup(page){await page.goto('/');const root=page.locator('[data-scientific-calculator]');await expect(root).toHaveAttribute('data-entry-phase','empty');return root;}
async function sequence(root,keys){for(const n of keys)await key(root,n).click();}
const state=root=>root.evaluate(el=>el.scientificCalculator.snapshot().state);
test.beforeEach(async({page},info)=>{info.pageErrors=[];page.on('pageerror',e=>info.pageErrors.push(e.message));});
test.afterEach(async({},info)=>expect(info.pageErrors).toEqual([]));
test('OFF and wake blank indicators and preserve ANS and M',async({page})=>{
 const root=await setup(page);await sequence(root,[41,43,42,48,29,3,2]);await expect(root.locator('[data-physical-layout]')).toHaveAttribute('data-power','off');await expect(root.locator('[data-result]')).toHaveText('');await key(root,40).click();expect((await state(root)).control.power).toBe('off');await key(root,2).click();expect((await state(root)).memoryValue).toBe(5);expect((await state(root)).answer).toBe(5);await expect(root.locator('[data-indicator="M"]')).toBeVisible();
});
test('automatic shutdown at ten minutes uses the same power path and remains independent',async({page})=>{
 await page.clock.install();const root=await setup(page);await sequence(root,[41,43,42,48]);await page.clock.fastForward(599000);await expect(root.locator('[data-physical-layout]')).toHaveAttribute('data-power','on');await key(root,3).click();await page.clock.fastForward(599000);await expect(root.locator('[data-physical-layout]')).toHaveAttribute('data-power','on');await page.clock.fastForward(1001);await expect(root.locator('[data-physical-layout]')).toHaveAttribute('data-power','off');await key(root,2).click();expect((await state(root)).answer).toBe(5);
});
for(const [digit,mode]of [[45,'NORMAL'],[40,'STAT'],[41,'EQN'],[42,'CPLX'],[35,'MAT'],[36,'LIST']])test(`MODE selects ${mode} with its verified submenu`,async({page})=>{
 const root=await setup(page);await key(root,4).click();await key(root,digit).click();if(['STAT','EQN'].includes(mode)){await expect(root.locator('[data-expression]')).toContainText(mode==='STAT'?'SD':'2-VLE');await key(root,45).click();}expect((await state(root)).layers.mode).toBe(mode);if(mode==='STAT')await expect(root.locator('[data-expression]')).toHaveText('Stat 0');if(mode==='EQN')await expect(root.locator('[data-expression]')).toHaveText('a1?');await key(root,1).click();expect((await state(root)).layers.mode).toBe('NORMAL');
});
test('mode cursor navigation and confirmed RESET restore default settings and all stores',async({page})=>{
 const root=await setup(page);await sequence(root,[4,10,48,11,11,48]);expect((await state(root)).control.submode).toBe('INV');await sequence(root,[1,30,29,3,47,40]);await expect(root.locator('[data-expression]')).toHaveText('RESET?');await key(root,2).click();expect((await state(root)).memoryValue).toBe(7);await sequence(root,[3,47,40,48]);expect((await state(root)).memoryValue).toBe(0);await root.evaluate(el=>el.scientificCalculator.reset());expect((await state(root)).control.power).toBe('on');
});
test('selected deletion, insertion, post-result continuation and recalled editing',async({page})=>{
 const root=await setup(page);await sequence(root,[40,41,42,43,35,36,9]);await expect(root.locator('[data-result]')).toHaveText('');expect((await state(root)).cursor).toBe(3);await sequence(root,[9,7,40,10,41,48]);expect((await state(root)).answer).toBe(123);await sequence(root,[9,40,48]);expect((await state(root)).answer).toBe(142);await sequence(root,[43,41,48]);expect((await state(root)).answer).toBe(144);await sequence(root,[8,8]);expect((await state(root)).historyIndex).toBe(1);await sequence(root,[3,8]);expect((await state(root)).historyIndex).toBe(0);
});
test('ten-digit entry and atomically deletable functions do not clip or break focus',async({page})=>{
 const root=await setup(page);await sequence(root,Array(12).fill(40));expect((await state(root)).entry).toBe('1111111111');await sequence(root,[2,13,40,34,43,10,7]);expect((await state(root)).expression).toBe('1)+');await expect(root.locator('[data-expression]')).toBeVisible();
});
