const {test,expect}=require('@playwright/test');
test.use({hasTouch:true});
const key=(r,n)=>r.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]');
const seq=async(r,keys)=>{for(const n of keys)await key(r,n).tap();};
const setup=async page=>{await page.goto('/');const r=page.locator('[data-scientific-calculator]').first();await expect.poll(()=>r.evaluate(el=>!!el.scientificCalculator)).toBe(true);return r;};
test('Strict script CSP and offline calculations require only bundled same-origin assets',async({page,context})=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.route('**/',async route=>{const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'"}});});
 const r=await setup(page);await context.setOffline(true);
 await seq(r,[40,43,41,48]);await expect(r.locator('[data-result]')).toHaveText('3.');
 await seq(r,[4,36,11,41,29,42,29,35,29,2,17,41,45,17,35,35,17,45,45,48]);await expect(r.locator('[data-result]')).toHaveText('7.');
 expect(errors).toEqual([]);expect(requests.every(url=>new URL(url).origin===new URL(page.url()).origin)).toBe(true);
 await expect(page.locator('script:not([src])')).toHaveCount(0);
});
for(const size of [{width:390,height:844},{width:768,height:1024}])test(`Touch and orientation retain state at ${size.width}px`,async({page})=>{
 await page.setViewportSize(size);const r=await setup(page);await seq(r,[40,25,41]);await page.setViewportSize({width:size.height,height:size.width});
 await seq(r,[48]);await expect(r.locator('[data-result] .scicalc__display-fraction')).toHaveCount(1);expect((await r.evaluate(el=>el.scientificCalculator.snapshot())).state.answer).toBe(.5);
 await expect(r.locator('[data-key-id]')).toHaveCount(48);await expect(key(r,48)).toBeInViewport();
 await page.addStyleTag({content:'.scicalc { zoom: 2; }'});await key(r,2).tap();await seq(r,[30,43,42,48]);await expect(r.locator('[data-result]')).toHaveText('10.');
 const snapshot=await r.evaluate(el=>el.scientificCalculator.snapshot());expect(snapshot.state.answer).toBe(10);
});
