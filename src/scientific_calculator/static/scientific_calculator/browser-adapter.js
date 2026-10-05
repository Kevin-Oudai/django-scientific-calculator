(function(host,factory){
  const api=factory();
  if(typeof module==='object' && module.exports && typeof document==='undefined') module.exports=api;
  else host.ScientificCalculatorBrowser=api;
})(globalThis,function(){
  'use strict';
  function mount(root, core, formatting) {
    if (Object.hasOwn(root, 'scientificCalculator')) return root.scientificCalculator;
    const {createInitialState,reduceCalculator,snapshotCalculator,restoreCalculator}=core;
    const document=root.ownerDocument;
    const requestAnimationFrame=callback=>document.defaultView.requestAnimationFrame(callback);
    if (!root.hasAttribute("tabindex")) {
      root.setAttribute("tabindex", "0");
    }

    const expressionEl = root.querySelector("[data-expression]");
    const resultEl = root.querySelector("[data-result]");
    const angleLabel = root.querySelector("[data-angle-label]");
    let state = createInitialState();
    const ownsTarget = target => target?.closest('[data-scientific-calculator]') === root;
    const hasKeyboardFocus = () => ownsTarget(document.activeElement);
    const render = () => {
      const view=formatting.renderState(state);
      expressionEl.innerHTML=view.expressionHtml;
      angleLabel.textContent=view.angleLabel;
      resultEl.innerHTML=view.resultHtml;
      root.classList.toggle("is-second-active",view.secondActive);
      root.dataset.entryPhase=view.lifecycle;
      requestAnimationFrame(() => {
        expressionEl.scrollLeft = expressionEl.scrollWidth;
        resultEl.scrollLeft = resultEl.scrollWidth;
      });
    };

    const dispatch = (event) => { state = reduceCalculator(state, event); render(); };
    Object.defineProperty(root, "scientificCalculator", {
      value: Object.freeze({
        snapshot: () => snapshotCalculator(state),
        restore: (snapshot) => { state = restoreCalculator(snapshot); render(); },
        pressKey: id => dispatch({type:"physical-key", id}),
      }),
    });

    root.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || !ownsTarget(button)) return;
      dispatch({ type: "button", ...button.dataset });
    });
    root.addEventListener("pointerdown", (event) => {
      if (!ownsTarget(event.target)) return;
      if (!hasKeyboardFocus()) root.focus({ preventScroll: true });
    });
    root.addEventListener("keydown", (event) => {
      if (!hasKeyboardFocus()) return;
      if (["Enter", "=", "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) event.preventDefault();
      dispatch({ type: "keyboard", key: event.key });
    });

    render();
    return root.scientificCalculator;
  }

  return Object.freeze({mount});
});
