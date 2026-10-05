const {test,expect}=require('@playwright/test');
test('semantic AST and cursor survive display formatting and snapshot restoration',async({page})=>{
  const requests=[];page.on('request',r=>requests.push(r.url()));
  await page.goto('/');const root=page.locator('[data-scientific-calculator]');
  const ast=await root.evaluate(el=>{
    el.scientificCalculator.pressKey('EL506-K41');el.scientificCalculator.pressKey('EL506-K18');
    const snapshot=el.scientificCalculator.snapshot();el.scientificCalculator.restore(snapshot);
    return snapshot.state.editor.ast;
  });
  expect(ast.kind).toBe('binary');expect(ast.operator).toBe('*');expect(ast.right.name).toBe('pi');expect(ast.implied).toBe(true);
  await root.evaluate(el=>el.scientificCalculator.pressKey('EL506-K48'));
  await expect(root.locator('[data-result]')).toHaveText('6.28318530718');
  expect(requests.some(url=>url.endsWith('/semantic-editor.js'))).toBe(true);
  expect(requests.every(url=>new URL(url).hostname==='127.0.0.1')).toBe(true);
});
