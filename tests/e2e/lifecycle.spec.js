const {test, expect} = require('@playwright/test');
test('browser lifecycle follows input and snapshots restore modal state', async ({page}) => {
  await page.goto('/');
  const root = page.locator('[data-scientific-calculator]');
  await expect(root).toHaveAttribute('data-entry-phase', 'empty');
  await root.focus(); await page.keyboard.press('1');
  await expect(root).toHaveAttribute('data-entry-phase', 'entering');
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-entry-phase', 'evaluated');
  await root.evaluate(el => {
    const snap = el.scientificCalculator.snapshot();
    snap.state.lifecycle = 'menu';
    snap.state.workflow = {kind:'menu', payload:{id:'MODE'}, page:0, returnPhase:'evaluated'};
    el.scientificCalculator.restore(snap);
  });
  await expect(root).toHaveAttribute('data-entry-phase', 'menu');
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-entry-phase', 'evaluated');
});
