(function () {
  'use strict';
  if(typeof document==='undefined') {
    module.exports=require('./core.js');
    return;
  }
  const assetBase=document.currentScript.src;
  const assetRevision=new URL(assetBase).search;
  const load=file=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    const assetUrl=new URL(file,assetBase);
    assetUrl.search=assetRevision;
    script.src=assetUrl.href;
    script.onload=resolve;
    script.onerror=()=>reject(new Error('Local calculator asset failed to load: '+file));
    document.head.append(script);
  });
  const ready=Promise.all(['matrices.js','complex.js','equations.js','statistics.js','calculus.js','nbase.js','solver.js','catalogues.js','semantic-editor.js','values.js','math-engine.js','formatting.js','browser-adapter.js'].map(load))
    .then(()=>load('numeric-model.js')).then(()=>load('core.js'));
  const initialize=()=>ready.then(()=>document.querySelectorAll('[data-scientific-calculator]').forEach(root=>
    ScientificCalculatorBrowser.mount(root,ScientificCalculatorCore,ScientificCalculatorFormatting)));
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initialize);
  else initialize();
})();
