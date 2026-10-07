const {test,expect}=require('@playwright/test');
test('unchanged entry loads separate local core, formatter and DOM adapter',async({page})=>{
  const requests=[],errors=[];page.on('request',r=>requests.push(new URL(r.url())));page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/legacy/');const root=page.locator('[data-scientific-calculator]');
  await expect(root).toHaveAttribute('data-entry-phase','empty');
  for(const name of ['calculator.js','core.js','formatting.js','browser-adapter.js'])expect(requests.some(url=>url.pathname.endsWith('/'+name))).toBe(true);
  expect(requests.every(url=>url.hostname==='127.0.0.1')).toBe(true);
  const rendered=await root.evaluate(el=>{
    const api=el.scientificCalculator;api.pressKey('EL506-K40');api.pressKey('EL506-K43');api.pressKey('EL506-K41');api.pressKey('EL506-K48');
    return ScientificCalculatorFormatting.renderState(api.snapshot().state);
  });
  await expect(root.locator('[data-result]')).toHaveText('3');
  expect(rendered.resultHtml).toBe('3');expect(errors).toEqual([]);
});
