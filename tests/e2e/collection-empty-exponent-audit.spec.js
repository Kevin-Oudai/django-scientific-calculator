const {test,expect}=require('@playwright/test');
for(const mode of ['LIST','MAT'])test('Native '+mode+' repeated and empty exponent commit',async({page})=>{
 await page.goto('/');const root=page.locator('[data-scientific-calculator]').first();await expect.poll(()=>root.evaluate(el=>!!el.scientificCalculator)).toBe(true);
 const trace=require('../reference/el506ts/experiments/'+mode.toLowerCase()+'-empty-exponent-native.json');
 if(mode==='LIST')for(const id of ['EL506-K04','EL506-K36','EL506-K11','EL506-K29'])await root.locator('[data-key-id="'+id+'"]').click();
 for(let step=1;step<=trace.sequence.length;step++){await root.locator('[data-key-id="'+trace.sequence[step-1]+'"]').click();if(step===trace.sequence.length-2||step===trace.sequence.length-1)await expect(root.locator('[data-result] sup')).toHaveText(step===trace.sequence.length-2?'00':'-00');}
 const state=(await root.evaluate(el=>el.scientificCalculator.snapshot())).state;expect(state.control.errorCode).toBe(null);expect(state.control.buffers[mode==='LIST'?'list':'matrix'].elements.map(x=>x.value)).toEqual([1]);
});
