const {test,expect}=require('@playwright/test');
// Pixel baselines are pinned to Windows Chromium. Linux CI still exercises
// all structural/interaction assertions in physical-ui.spec.js.
test.skip(process.platform!=='win32','Windows Chromium pixel baselines; verified in the windows-visual CI job');
for(const theme of ['dark','example'])for(const scenario of ['default','focus','second','alpha','menu','error','long-expression','phone','tablet']) {
  test(`visual ${theme} ${scenario}`,async({page})=>{
    await page.setViewportSize({width:scenario==='phone'?320:scenario==='tablet'?768:1440,height:1000});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/');const root=page.locator('[data-scientific-calculator]');
    await expect(root).toHaveAttribute('data-entry-phase','empty');
    if(theme==='example')await page.addStyleTag({url:'/static/scientific_calculator/calculator-theme.example.css'});
    if(scenario==='focus') {await root.focus();await page.keyboard.press('Tab');}
    if(scenario==='second')await root.locator('[data-key-id="EL506-K03"]').click();
    if(scenario==='alpha')await root.locator('[data-key-id="EL506-K05"]').click();
    if(scenario==='menu')await root.locator('[data-key-id="EL506-K04"]').click();
    if(scenario==='error') {await root.focus();await page.keyboard.type('1/0');await page.keyboard.press('Enter');}
    if(scenario==='long-expression') {await root.focus();await page.keyboard.type('123456789+123456789+123456789+123456789+');await page.keyboard.press('ArrowLeft');}
    await expect(root).toHaveScreenshot(`${theme}-${scenario}.png`,{animations:'disabled',caret:'hide',maxDiffPixelRatio:.002});
  });
}
