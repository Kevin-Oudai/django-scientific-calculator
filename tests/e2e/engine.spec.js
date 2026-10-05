const {test,expect}=require('@playwright/test');
test('legacy entry loads the pinned engine locally with no general evaluator API',async({page})=>{
  const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto('/');const root=page.locator('[data-scientific-calculator]');
  await expect(root).toHaveAttribute('data-entry-phase','empty');
  const result=await page.evaluate(()=>{
    const engine=ScientificCalculatorEngine.createEngine();
    return {version:ScientificCalculatorEngine.version,keys:Object.keys(engine).sort(),decimal:engine.decimalBinary('+','0.1','0.2')};
  });
  expect(result).toEqual({version:'15.2.0',keys:['binary','decimalBinary','quantize'],decimal:'0.3'});
  expect(requests.some(url=>url.endsWith('/math-engine.js'))).toBe(true);
  expect(requests.every(url=>new URL(url).hostname==='127.0.0.1')).toBe(true);
  expect(errors).toEqual([]);
});
