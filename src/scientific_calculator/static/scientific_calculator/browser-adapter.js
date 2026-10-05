(function(host,factory){
  const api=factory();
  if(typeof module==='object' && module.exports && typeof document==='undefined') module.exports=api;
  else host.ScientificCalculatorBrowser=api;
})(globalThis,function(){
  'use strict';
  function mount(root, core, formatting) {
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
    const hasKeyboardFocus = () => root.contains(document.activeElement);
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
      if (!button || !root.contains(button)) return;
      dispatch({ type: "button", ...button.dataset });
    });
    root.addEventListener("pointerdown", () => {
      if (!hasKeyboardFocus()) root.focus({ preventScroll: true });
    });
    document.addEventListener("keydown", (event) => {
      if (!hasKeyboardFocus()) return;
      if (["Enter", "=", "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) event.preventDefault();
      dispatch({ type: "keyboard", key: event.key });
    });

    render();
  }

  return Object.freeze({mount});
});
