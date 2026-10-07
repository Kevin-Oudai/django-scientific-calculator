const {test,expect}=require('@playwright/test');
const catalog=require('../../src/scientific_calculator/static/scientific_calculator/physical-keys.json');
const key=(root,n)=>root.locator(`[data-key-id="EL506-K${String(n).padStart(2,'0')}"]`);
const snapshot=root=>root.evaluate(el=>el.scientificCalculator.snapshot());
test.beforeEach(async({page},info)=>{
  info.physicalErrors=[];info.physicalRequests=[];
  page.on('pageerror',error=>info.physicalErrors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')info.physicalErrors.push(message.text());});
  page.on('request',request=>info.physicalRequests.push(request.url()));
});
test.afterEach(async({},info)=>{
  expect(info.physicalErrors).toEqual([]);
  expect(info.physicalRequests.every(url=>new URL(url).hostname==='127.0.0.1')).toBe(true);
});
async function setup(page){
  await page.goto('/');const root=page.locator('[data-scientific-calculator]');
  await expect(root).toHaveAttribute('data-entry-phase','empty');return root;
}
test('default physical keys match catalog ordering, labels and native button semantics',async({page})=>{
  const root=await setup(page);
  const ids=await root.locator('[data-key-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.keyId));
  expect(ids).toEqual(catalog.keys.map(k=>k.id));
  await expect(root.locator('button')).toHaveCount(48);
  for(const item of catalog.keys){
    const button=root.locator(`[data-key-id="${item.id}"]`);
    await expect(button).toBeVisible();await expect(button).toHaveAttribute('type','button');
    if(item.legends.second)await expect(button).toHaveAccessibleName(new RegExp('2nd F:'));
    if(item.legends.alpha)await expect(button).toHaveAccessibleName(new RegExp('ALPHA:'));
  }
  await key(root,3).click();await expect(key(root,3)).toHaveAttribute('aria-pressed','true');
  await expect(key(root,13)).toHaveAccessibleName(/active: sin⁻¹/);
  await key(root,13).click();await expect(key(root,3)).toHaveAttribute('aria-pressed','false');
});
test('pointer, touch, keyboard and native keyboard activation share canonical dispatch',async({page})=>{
  const root=await setup(page),initial=await snapshot(root);
  await key(root,40).click();await key(root,43).click();await key(root,41).click();await key(root,48).click();
  const pointer=await snapshot(root);expect(pointer.state.answer).toBe(3);
  await root.evaluate((el,s)=>el.scientificCalculator.restore(s),initial);
  await root.focus();await page.keyboard.type('1+2');await page.keyboard.press('Enter');
  expect(await snapshot(root)).toEqual(pointer);
  await root.evaluate((el,s)=>el.scientificCalculator.restore(s),initial);
  await key(root,40).focus();await page.keyboard.press('Enter');
  expect((await snapshot(root)).state.entry).toBe('1');
  await page.keyboard.press('Space');expect((await snapshot(root)).state.entry).toBe('11');
});
test('touch rollover accepts the second key before the first touch is released',async({browser})=>{
  const context=await browser.newContext({hasTouch:true});const page=await context.newPage();
  const root=await setup(page);const cdp=await context.newCDPSession(page);
  const first=await key(root,3).boundingBox(),second=await key(root,20).boundingBox();
  const point=(b,id)=>({x:b.x+b.width/2,y:b.y+b.height/2,id});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(first,1)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(first,1),point(second,2)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect((await snapshot(root)).state.layers.intent).toEqual({kind:'operation',event:{insert:'sqrt('}});
  await key(root,32).tap();await key(root,48).tap();expect((await snapshot(root)).state.answer).toBe(3);
  await context.close();
});
test('LCD horizontal scrolling is independent and follows a selected cursor',async({page})=>{
  const root=await setup(page);
  await root.evaluate(el=>{
    const s=el.scientificCalculator.snapshot();
    s.state.expression='1+'.repeat(50)+'1';s.state.displayExpression=s.state.expression;
    s.state.displayResult='1234567890'.repeat(8);s.state.resultDisplay=s.state.displayResult;
    s.state.cursor=0;s.state.selectionActive=true;s.state.lifecycle='editing';
    el.scientificCalculator.restore(s);
  });
  const upper=root.locator('[data-expression]'),lower=root.locator('[data-result]');
  await expect.poll(()=>upper.evaluate(el=>el.scrollLeft)).toBe(0);
  await expect.poll(()=>lower.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  await expect(root.locator('[data-upper-right]')).toHaveText('▶');
  const lowerPosition=await lower.evaluate(el=>el.scrollLeft);
  await upper.evaluate(el=>{el.scrollLeft=el.scrollWidth;});
  await expect(root.locator('[data-upper-left]')).toHaveText('◀');
  expect(await lower.evaluate(el=>el.scrollLeft)).toBe(lowerPosition);
  await root.focus();await page.keyboard.press('ArrowRight');
  await expect.poll(()=>upper.evaluate(el=>el.scrollLeft)).toBeLessThan(50);
});
test('result pages display components and boundaries without evaluation or store mutation',async({page})=>{
  const root=await setup(page);
  await root.evaluate(el=>{
    const s=el.scientificCalculator.snapshot();s.state.lifecycle='multi-result';
    s.state.workflow={kind:'multi-result',payload:{pages:[{label:'real',component:'xy',value:2},{label:'imaginary',component:'i',value:3}]},page:0,returnPhase:'empty'};
    el.scientificCalculator.restore(s);
  });
  const before=await snapshot(root);await expect(root.locator('[data-result]')).toHaveText('2');
  await key(root,11).click();await expect(root.locator('[data-result]')).toHaveText('3');
  await expect(root.locator('[data-indicator="i"]')).toBeVisible();
  await expect(root.locator('[data-announcement]')).toContainText('Page 2 / 2');
  const after=await snapshot(root);expect(after.state.values).toEqual(before.state.values);expect(after.state.answer).toBe(before.state.answer);
  await key(root,11).click();expect((await snapshot(root)).state.workflow.page).toBe(1);
  await key(root,8).click();await expect(root.locator('[data-result]')).toHaveText('2');
});
test('display errors announce and unsupported mode calculations do not produce console errors',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const root=await setup(page);await root.focus();await page.keyboard.type('1/0');await page.keyboard.press('Enter');
  await expect(root.locator('[data-error]')).toContainText('Error');
  await key(root,2).click();await key(root,4).click();await key(root,35).click();await key(root,40).click();await key(root,48).click();
  await expect(root.locator('[data-error]')).toContainText('implementation pending');expect(errors).toEqual([]);
});
for(const width of [320,390,768,1440])test(`all physical controls retain geometry at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});const root=await setup(page);
  const geometry=await root.locator('[data-key-id]').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return {id:n.dataset.keyId,x:b.x,y:b.y,w:b.width,h:b.height};}));
  for(const b of geometry){const nav=b.id>='EL506-K08'&&b.id<='EL506-K11';expect(b.w).toBeGreaterThanOrEqual(nav?24:40);expect(b.h).toBeGreaterThanOrEqual(nav?26:44);}
  for(let i=0;i<geometry.length;i++)for(let j=i+1;j<geometry.length;j++){
    const a=geometry[i],b=geometry[j];
    const overlap=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>0.5 && Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>0.5;
    expect(overlap,`${a.id} overlaps ${b.id}`).toBe(false);
  }
  const bounds=await root.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
  for(const row of [1,2,3,4,5,6,7]){
    const ids=catalog.keys.filter(k=>k.position.region==='main'&&k.position.row===row).map(k=>k.id);
    const positions=geometry.filter(k=>ids.includes(k.id));
    expect(new Set(positions.map(p=>p.y)).size).toBe(1);
    expect(positions.map(p=>p.x)).toEqual(positions.map(p=>p.x).sort((a,b)=>a-b));
  }
});
test('theme overrides change colors while preserving every key position',async({page})=>{
  const root=await setup(page);
  const geometry=()=>root.locator('[data-key-id]').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return [b.x,b.y,b.width,b.height];}));
  const before=await geometry(),color=await root.evaluate(el=>getComputedStyle(el).backgroundColor);
  await page.addStyleTag({url:'/static/scientific_calculator/calculator-theme.example.css'});
  expect(await geometry()).toEqual(before);expect(await root.evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe(color);
});
for(const theme of ['dark','example'])test(`${theme} text and functional legends meet 4.5:1 contrast`,async({page})=>{
  const root=await setup(page);
  if(theme==='example')await page.addStyleTag({url:'/static/scientific_calculator/calculator-theme.example.css'});
  const ratios=await root.evaluate(root=>{
    const luminance=color=>{
      const rgb=color.match(/[\d.]+/g).slice(0,3).map(n=>Number(n)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
      return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
    };
    const contrast=(a,b)=>{const l=luminance(a),r=luminance(b);return (Math.max(l,r)+.05)/(Math.min(l,r)+.05);};
    const entries=[];
    for(const button of root.querySelectorAll('[data-key-id]')) {
      const background=getComputedStyle(button).backgroundColor;
      for(const label of button.querySelectorAll('.scicalc__primary,.scicalc__second-legend,.scicalc__alpha-legend,.scicalc__mode-legend'))if(label.textContent.trim()){
        const style=getComputedStyle(label),labelBackground=style.backgroundColor;
        const paintedBackground=labelBackground==='rgba(0, 0, 0, 0)'||labelBackground==='transparent'?background:labelBackground;
        entries.push({key:button.dataset.keyId,text:label.textContent,ratio:contrast(style.color,paintedBackground)});
      }
    }
    return entries;
  });
  for(const item of ratios)expect(item.ratio,`${item.key} ${item.text}`).toBeGreaterThanOrEqual(4.5);
});
test('reduced motion freezes cursor and focus remains visible',async({page})=>{
  const root=await setup(page);await root.focus();await page.keyboard.type('1+');await page.keyboard.press('ArrowLeft');
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await root.locator('.scicalc__selected-char').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await key(root,13).focus();expect(await key(root,13).evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
});
test('multiple physical embeds isolate modifiers and keyboard focus',async({page})=>{
  const root=await setup(page);await root.evaluate(el=>{const copy=el.cloneNode(true);el.after(copy);ScientificCalculatorBrowser.mount(copy,ScientificCalculatorCore,ScientificCalculatorFormatting);});
  const roots=page.locator('[data-scientific-calculator]');await key(roots.nth(0),3).click();
  await roots.nth(1).focus();await page.keyboard.type('7');
  expect((await snapshot(roots.nth(0))).state.secondActive).toBe(true);expect((await snapshot(roots.nth(1))).state.entry).toBe('7');
});
test('forced colors and doubled text retain every key and native focus',async({page})=>{
  const root=await setup(page);
  await page.emulateMedia({forcedColors:'active'});
  await page.addStyleTag({content:'html {font-size: 200%;}'});
  await expect(root.locator('[data-key-id]')).toHaveCount(48);
  for(const n of [1,7,13,30,48])await expect(key(root,n)).toBeVisible();
  await key(root,40).focus();expect(await key(root,40).evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('Enter');expect((await snapshot(root)).state.entry).toBe('1');
});

for(const width of [320,768,1440]) test(`stacked fractions fit both LCD lines at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});const root=await setup(page);
  const visibleParts=async()=>{
    const parts=await root.locator('.scicalc__display-fraction > span').evaluateAll(nodes=>nodes.map(node=>{
      const line=node.closest('[data-result],[data-expression]');const part=node.getBoundingClientRect();const bounds=line.getBoundingClientRect();
      return {top:part.top,bottom:part.bottom,lineTop:bounds.top,lineBottom:bounds.top+line.clientHeight};
    }));
    expect(parts.length).toBeGreaterThanOrEqual(2);
    for(const part of parts){expect(part.top).toBeGreaterThanOrEqual(part.lineTop);expect(part.bottom).toBeLessThanOrEqual(part.lineBottom+0.5);}
  };
  await key(root,40).click();await key(root,25).click();await key(root,41).click();
  await expect(root.locator('[data-result] .scicalc__display-fraction')).toHaveCount(1);await visibleParts();
  await key(root,48).click();await visibleParts();
  // Exercise the upper-line projection without changing fraction-entry semantics.
  await root.evaluate(el=>{const saved=el.scientificCalculator.snapshot();saved.state.displayExpression='1/2+';saved.state.selectionActive=false;el.scientificCalculator.restore(saved);});
  await expect(root.locator('[data-expression] .scicalc__display-fraction')).toHaveCount(1);await visibleParts();

});
