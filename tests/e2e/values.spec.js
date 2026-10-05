const {test,expect}=require('@playwright/test');
test('browser retains exact typed result across formatting and restore',async({page})=>{
  await page.goto('/');const root=page.locator('[data-scientific-calculator]');
  await root.focus();await page.keyboard.type('1/3');await page.keyboard.press('Enter');
  const saved=await root.evaluate(el=>el.scientificCalculator.snapshot());
  expect(saved.state.values.answer).toEqual({kind:'rational',numerator:'1',denominator:'3'});
  await root.locator('[data-action="fraction"]').click();
  expect(await root.evaluate(el=>el.scientificCalculator.snapshot().state.resultMode)).not.toBe(saved.state.resultMode);
  expect(await root.evaluate(el=>el.scientificCalculator.snapshot().state.values.answer)).toEqual(saved.state.values.answer);
  await root.evaluate((el,s)=>el.scientificCalculator.restore(s),saved);
  expect(await root.evaluate(el=>el.scientificCalculator.snapshot())).toEqual(saved);
});
