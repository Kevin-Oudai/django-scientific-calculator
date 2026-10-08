const test=require('node:test'),assert=require('node:assert/strict');
const inventory=require('../reference/el506ts/list-inventory.json');
const panel=require('../../src/scientific_calculator/static/scientific_calculator/physical-keys.json');
const reference=require('../reference/el506ts/experiments/menu-inventory.json');
test('LIST inventory exhausts independently captured menu pages without promoting exposure to parity',()=>{
 const observed=reference.frames.filter(f=>f.after_step>=56&&f.after_step<=73&&f.display.indicators.includes('LIST'));
 assert.deepEqual(inventory.menus.map(p=>p.afterStep),observed.map(f=>f.after_step));
 for(const page of inventory.menus){const frame=observed.find(f=>f.after_step===page.afterStep);assert.equal(page.labels.join(' '),frame.display.upper_line);}
 assert.deepEqual(inventory.menus.filter(p=>p.menu==='LIST_OPE').flatMap(p=>p.labels),['sortA','sortD','dim(','fill(','cumul','df_list','aug(']);
 assert.deepEqual(inventory.menus.filter(p=>p.menu==='LIST_MATH').flatMap(p=>p.labels),['min','max','mean','med','sum','prod','stdDv','vari','o_prod(','i_prod(','abs']);
});
test('LIST inventory preserves all 48 positions and every modifier legend with explicit availability scope',()=>{
 assert.equal(inventory.keys.length,48);
 assert.deepEqual(inventory.keys.map(k=>({id:k.keyId,legends:k.legends})),panel.keys.map(k=>({id:k.id,legends:k.legends})));
 for(const key of inventory.keys)assert.equal(key.listAvailabilityStatus,'not asserted by exposure inventory');
 assert.ok(inventory.remainingAuditItems.includes('EL506-358'));
});
