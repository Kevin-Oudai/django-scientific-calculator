const {test,expect}=require('@playwright/test');
test('measured numeric foundation is local and keeps the baseline profile explicit',async({page})=>{
  await page.goto('/legacy/');const root=page.locator('[data-scientific-calculator]');
  await expect(root).toHaveAttribute('data-entry-phase','empty');
  const result=await page.evaluate(()=>({
    id:ScientificCalculatorNumericModel.profile.id,
    cancellation:ScientificCalculatorNumericModel.binary('-',ScientificCalculatorNumericModel.binary('+','1e13','1'),'1e13'),
    tie:ScientificCalculatorNumericModel.fix('-1.25',1),
  }));
  expect(result).toEqual({id:'el506-measured-arithmetic-v1',cancellation:'0',tie:'-1.3'});
  await root.focus();await page.keyboard.type('10000000000000+1-10000000000000');await page.keyboard.press('Enter');
  await expect(root.locator('[data-result]')).toHaveText('1');
  expect((await root.evaluate(el=>el.scientificCalculator.snapshot())).profile).toBe('legacy-0.3.1');
});
