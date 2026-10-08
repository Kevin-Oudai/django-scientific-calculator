const {test,expect}=require('@playwright/test');
test('Native NORMAL buffer overflow recovers through the fault cursor without losing its operand',async({page})=>{
 test.setTimeout(180000);await page.goto('/');
 const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const key=n=>root.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]');
 for(const n of [...Array(25).fill(13),40,48])await key(n).click();
 await expect(root.locator('[data-expression]')).toHaveText('Error 3');
 await expect(root.locator('[data-result]')).toHaveText('');
 for(const n of [10,7,48])await key(n).click();
 await expect(root.locator('[data-result]')).toHaveText('6.383145827×10-43');
 expect((await root.evaluate(el=>el.scientificCalculator.snapshot())).state.control.errorCode).toBe(null);
 const ref=require('../reference/el506ts/experiments/formula-length-memory-errors-native.json');
 for(let i=30;i<ref.sequence.length;i++){
  await root.locator('[data-key-id="'+ref.sequence[i]+'"]').click();
  if([46,49,55].includes(i+1)){
   await expect(root.locator('[data-expression]')).toHaveText('Error '+(i+1===55?6:4));
   await expect(root.locator('[data-result]')).toHaveText('');
  }
  if([32,53].includes(i+1))await expect(root.locator('[data-result]')).toHaveText(i+1===32?'F1':'F2');
  if([56,58,60].includes(i+1))await expect(root.locator('[data-result]')).toHaveText('0.');
 }
 const saved=await root.evaluate(el=>el.scientificCalculator.snapshot());
 expect(saved.state.control.formulas[1].length).toBeGreaterThan(0);expect(saved.state.control.formulas[2]).toEqual([]);
 for(const n of [28,10,10,28,10,9,13,48,9])await key(n).click();
 const recovered=await root.evaluate(el=>el.scientificCalculator.snapshot());
 expect(recovered.state.control.errorCode).toBe(null);
 expect(recovered.state.cursor).toBe(recovered.state.expression.length-4);
 await expect(root.locator('[data-result]')).toHaveText('');
});
test('Native division error arrows restore the operand at the expression end',async({page})=>{
 await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const ref=require('../reference/el506ts/experiments/division-error-cursor-native.json');
 for(let i=0;i<ref.sequence.length;i++){
  await root.locator('[data-key-id="'+ref.sequence[i]+'"]').click();
  if([5,7].includes(i+1)){
   await expect(root.locator('[data-expression]')).toHaveText('1÷0');
   await expect(root.locator('[data-result]')).toHaveText('0.');
   const state=(await root.evaluate(el=>el.scientificCalculator.snapshot())).state;
   expect(state.cursor).toBe(state.expression.length);expect(state.control.errorCode).toBe(null);
  }
 }
});
test('Native syntax-error arrows preserve the entered operand and missing-operand position',async({page})=>{
 await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 for(const name of ['syntax-error-cursor-native','missing-operand-cursor-native']){
  await root.locator('[data-key-id="EL506-K02"]').click();
  const ref=require('../reference/el506ts/experiments/'+name+'.json');
  for(let i=0;i<ref.sequence.length;i++){
   await root.locator('[data-key-id="'+ref.sequence[i]+'"]').click();
   const frame=ref.frames.find(f=>f.after_step===i+1);if(!frame)continue;
   await expect(root.locator('[data-result]')).toHaveText(frame.display.lower_line);
   if(frame.display.cursor.value?.includes('block over')){
    const state=(await root.evaluate(el=>el.scientificCalculator.snapshot())).state;
    expect(state.expression).toBe(')1');expect(state.cursor).toBe(1);
   }else await expect(root.locator('[data-expression]')).toHaveText(frame.display.upper_line);
  }
 }
});
test('Native signed scalar boundaries preserve ANS through overflow and clamp underflow',async({page})=>{
 test.setTimeout(180000);await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 for(const name of ['scalar-underflow-native','scalar-upper-boundary-native']){
  await root.locator('[data-key-id="EL506-K02"]').click();
  const ref=require('../reference/el506ts/experiments/'+name+'.json');
  for(let i=0;i<ref.sequence.length;i++){
   await root.locator('[data-key-id="'+ref.sequence[i]+'"]').click();
   const frame=ref.frames.find(f=>f.after_step===i+1);if(!frame)continue;
   await expect.poll(async()=> (await root.locator('[data-result]').textContent()).replaceAll('−','-')).toBe(frame.display.lower_line.replace('e','×10'));
   if(frame.display.upper_line.startsWith('Error'))await expect(root.locator('[data-expression]')).toHaveText(frame.display.upper_line);
  }
 }
 expect((await root.evaluate(el=>el.scientificCalculator.snapshot())).state.answer).toBe(-9.999999999e99);
});

for(const name of ['nbase-error5-cursor-native','matrix-error7-10-cursor-native','matrix-error8-cursor-native','matrix-error9-cursor-native'])test('Native base/matrix recovery checkpoints: '+name,async({page})=>{
 test.setTimeout(180000);await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();
 await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const ref=require('../reference/el506ts/experiments/'+name+'.json');
 if(ref.initial_state.mode.value==='MAT')for(const n of [4,35])await root.locator('[data-key-id="EL506-K'+String(n).padStart(2,'0')+'"]').click();
 for(let step=1;step<=ref.sequence.length;step++){
  await root.locator('[data-key-id="'+ref.sequence[step-1]+'"]').click();const frame=ref.frames.find(f=>f.after_step===step);if(!frame)continue;
  await expect(root.locator('[data-result]')).toHaveText(frame.display.lower_line);
  const state=(await root.evaluate(el=>el.scientificCalculator.snapshot())).state;
  if(frame.display.cursor.value?.includes('block over')){expect(state.expression).toBe('matD');expect(state.cursor).toBe(0);await expect(root.locator('.scicalc__selected-char')).toBeVisible();}
  else if(frame.display.scroll_arrows.includes('left'))expect(await root.locator('[data-expression]').textContent()).toContain(frame.display.upper_line);
  else await expect(root.locator('[data-expression]')).toHaveText(frame.display.upper_line);
  if(frame.display.cursor.value?.includes('insertion')){expect(state.control.errorCode).toBe(null);expect(state.cursor).toBe(state.expression.length);await expect(root.locator('.scicalc__cursor')).toBeVisible();}
 }
});
