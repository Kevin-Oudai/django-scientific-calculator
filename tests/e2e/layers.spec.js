const {test,expect}=require('@playwright/test');
test('canonical physical API retains modifiers and menu state independently of labels',async({page})=>{
  await page.goto('/legacy/'); const root=page.locator('[data-scientific-calculator]');
  const state=await root.evaluate(el=>{
    const api=el.scientificCalculator;
    api.pressKey('EL506-K03');api.pressKey('EL506-K12');api.pressKey('EL506-K13');
    const hyp=api.snapshot().state.layers.intent;
    api.pressKey('EL506-K02');api.pressKey('EL506-K04');
    return {hyp,menu:api.snapshot().state.workflow.payload.id};
  });
  expect(state).toEqual({hyp:{kind:'function',name:'asinh'},menu:'MODE'});
  await expect(root).toHaveAttribute('data-entry-phase','menu');
});
