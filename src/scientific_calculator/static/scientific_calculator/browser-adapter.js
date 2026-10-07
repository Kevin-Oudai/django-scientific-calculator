(function(host,factory){
  const api=factory();
  if(typeof module==='object' && module.exports && typeof document==='undefined') module.exports=api;
  else host.ScientificCalculatorBrowser=api;
})(globalThis,function(){
  'use strict';
  const keyboardKeys=Object.freeze({
    '0':45,'1':40,'2':41,'3':42,'4':35,'5':36,'6':37,'7':30,'8':31,'9':32,
    '.':46,'+':43,'-':44,'*':38,'/':39,'(':33,')':34,
    Enter:48,'=':48,Backspace:7,Delete:7,Escape:2,Home:1,
    ArrowUp:8,ArrowLeft:9,ArrowRight:10,ArrowDown:11,F2:3,F3:5,F4:12,
  });
  function keyboardKeyId(event) {
    if(event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return null;
    const number=keyboardKeys[event.key];
    return number ? `EL506-K${String(number).padStart(2,'0')}` : null;
  }
  function mount(root, core, formatting) {
    if (Object.hasOwn(root, 'scientificCalculator')) return root.scientificCalculator;
    const {createInitialState,reduceCalculator,snapshotCalculator,restoreCalculator}=core;
    const document=root.ownerDocument;
    const requestAnimationFrame=callback=>document.defaultView.requestAnimationFrame(callback);
    if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex','0');
    const physical=root.querySelector('[data-physical-layout]');
    const expressionEl=root.querySelector('[data-expression]');
    const resultEl=root.querySelector('[data-result]');
    const angleLabel=root.querySelector('[data-angle-label]');
    const announcement=root.querySelector('[data-announcement]');
    const errorEl=root.querySelector('[data-error]');
    let state=createInitialState(), renderGeneration=0, idleTimer=null, activityAt=Date.now();
    const schedulePower=()=>{if(!physical)return;document.defaultView.clearTimeout(idleTimer);activityAt=Date.now();if(state.control.power==='on')idleTimer=document.defaultView.setTimeout(()=>{state=reduceCalculator(state,{type:'idle',elapsedMs:Date.now()-activityAt});render();},600000-state.control.idleMs);};
    const ownsTarget=target=>target?.closest('[data-scientific-calculator]')===root;
    const hasKeyboardFocus=()=>ownsTarget(document.activeElement);
    const keys=[...root.querySelectorAll('[data-key-id]')].filter(ownsTarget);
    const indicators=new Map();
    const scrollIndicators=()=>{
      if(!physical) return;
      root.querySelector('[data-upper-left]').textContent=expressionEl.scrollLeft>1?'◀':'';
      root.querySelector('[data-upper-right]').textContent=expressionEl.scrollWidth-expressionEl.clientWidth-expressionEl.scrollLeft>1?'▶':'';
      root.querySelector('[data-lower-left]').textContent=resultEl.scrollLeft>1?'◀':'';
      root.querySelector('[data-lower-right]').textContent=resultEl.scrollWidth-resultEl.clientWidth-resultEl.scrollLeft>1?'▶':'';
    };
    if(physical) {
      root.setAttribute('role','group');
      root.setAttribute('aria-label',root.querySelector('.scicalc__brand')?.textContent.trim() || 'Scientific calculator');
      physical.dataset.cursorBlink='true';
      expressionEl.addEventListener('scroll',scrollIndicators);
      resultEl.addEventListener('scroll',scrollIndicators);
      // ResizeObserver also covers embedding in a resizable host panel.
      if(document.defaultView.ResizeObserver) {
        const observer=new document.defaultView.ResizeObserver(scrollIndicators);
        observer.observe(expressionEl); observer.observe(resultEl);
      }
    }
    const render=()=>{
      const generation=++renderGeneration;
      if(physical)physical.dataset.power=state.control.power;
      const view=formatting.renderState(state,{physical:Boolean(physical)});
      expressionEl.innerHTML=view.expressionHtml;
      if(angleLabel) angleLabel.textContent=view.angleLabel;
      resultEl.innerHTML=view.resultHtml;
      root.classList.toggle('is-second-active',view.secondActive);
      root.dataset.entryPhase=view.lifecycle;
      if(physical) {
        physical.dataset.insertMode=view.insertMode;
        physical.dataset.cursorPosition=view.cursorPosition === null ? '' : String(view.cursorPosition);
        const container=root.querySelector('[data-indicators]');
        for(const [label,active] of Object.entries(view.indicators)) {
          if(!indicators.has(label)) {
            const span=document.createElement('span'); span.className='scicalc__indicator'; span.textContent=label;
            span.dataset.indicator=label; container.append(span); indicators.set(label,span);
          }
          indicators.get(label).hidden=!active;
        }
        root.querySelector('[data-component]').textContent=view.component;
        root.querySelector('[data-page-status]').textContent=`${view.previousPage?'▲ ':''}${view.nextPage?'▼ ':''}${view.pageStatus}`;
        for(const button of keys) {
          const n=Number(button.dataset.keyId.slice(-2));
          if([3,5,12].includes(n)) button.setAttribute('aria-pressed',String(n===3?state.secondActive:n===5?state.layers.alpha:state.layers.hyp));
          const {primaryName,secondName,alphaName}=button.dataset;
          const meanings=[primaryName,secondName?`2nd F: ${secondName}`:'',alphaName?`ALPHA: ${alphaName}`:''].filter(Boolean);
          const active=state.secondActive?secondName:state.layers.alpha?alphaName:'';
          button.setAttribute('aria-label',`${meanings.join('; ')}${active?`; active: ${active}`:''}`);
        }
        const status=Object.entries(view.indicators).filter(([,active])=>active).map(([label])=>label).join(', ');
        const pending=['pending','function','symbol','statistic','conversion','catalogue-selection','memory-selection'].includes(state.layers.intent?.kind) ? '. Selected operation awaits its later roadmap implementation.' : '';
        const text=state.control.power==='off'?'Calculator powered off. Press ON/C to wake.':`Equation: ${expressionEl.textContent || 'empty'}. Result: ${resultEl.textContent || 'empty'}. ${status}${view.pageStatus?`. Page ${view.pageStatus}, ${view.component}`:''}${pending}`;
        if(announcement.textContent!==text) announcement.textContent=text;
        const error=/^Error/.test(state.displayResult)?state.control.errorCode?'Error '+state.control.errorCode:state.displayResult:'';
        if(errorEl.textContent!==error) errorEl.textContent=error;
      }
      requestAnimationFrame(()=>{
        if(generation!==renderGeneration) return;
        const cursor=expressionEl.querySelector('.scicalc__selected-char,.scicalc__cursor');
        if(cursor) {
          const x=cursor.getBoundingClientRect(), viewport=expressionEl.getBoundingClientRect();
          if(x.left<viewport.left) expressionEl.scrollLeft-=viewport.left-x.left+3;
          else if(x.right>viewport.right) expressionEl.scrollLeft+=x.right-viewport.right+3;
        } else expressionEl.scrollLeft=expressionEl.scrollWidth;
        resultEl.scrollLeft=resultEl.scrollWidth;
        scrollIndicators();
      });
    };
    const dispatch=event=>{
      try { if(physical&&state.control.power==='on'&&Date.now()-activityAt>=600000)state=reduceCalculator(state,{type:'idle',elapsedMs:Date.now()-activityAt});state=reduceCalculator(state,event); render();schedulePower(); }
      catch(error) {
        // Pending later-phase operations must not throw from a DOM event.
        if(!physical || !/implementation pending/.test(error.message)) throw error;
        errorEl.textContent=error.message;
      }
    };
    Object.defineProperty(root,'scientificCalculator',{
      value:Object.freeze({
        snapshot:()=>snapshotCalculator(state),
        restore:snapshot=>{state=restoreCalculator(snapshot);render();schedulePower();},
        reset:()=>dispatch({type:'reset'}),
        pressKey:id=>dispatch({type:'physical-key',id}),
      }),
    });
    const keyButton=target=>{
      const button=target?.closest('button');
      return button && ownsTarget(button)?button:null;
    };
    root.addEventListener('click',event=>{
      const button=keyButton(event.target);
      if(!button) return;
      if(physical) {
        // Pointer keys dispatch on down, including concurrent touches. Native
        // keyboard and assistive-technology button activation dispatches here.
        if(event.detail===0 && button.dataset.keyId) dispatch({type:'physical-key',id:button.dataset.keyId});
      } else dispatch({type:'button',...button.dataset});
    });
    root.addEventListener('pointerdown',event=>{
      if(!ownsTarget(event.target) || event.button!==0) return;
      if(!hasKeyboardFocus()) root.focus({preventScroll:true});
      const button=keyButton(event.target);
      if(physical && button?.dataset.keyId) dispatch({type:'physical-key',id:button.dataset.keyId});
    });
    root.addEventListener('keydown',event=>{
      if(!hasKeyboardFocus() || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      if(physical) {
        if(event.target.closest('[data-expression],[data-result]') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        if(event.target.closest('button') && ['Enter',' '].includes(event.key)) return;
        const id=keyboardKeyId(event);
        if(!id) return;
        event.preventDefault();
        if(event.repeat && ['F2','F3','F4'].includes(event.key)) return;
        dispatch({type:'physical-key',id});
      } else {
        if(['Enter','=','Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) event.preventDefault();
        dispatch({type:'keyboard',key:event.key});
      }
    });
    render();schedulePower();
    return root.scientificCalculator;
  }
  return Object.freeze({mount,keyboardKeyId});
});
