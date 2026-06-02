document.addEventListener("DOMContentLoaded", () => {
  const panel = document.querySelector("[data-floating-calculator]");
  const handle = document.querySelector("[data-drag-handle]");

  if (!panel || !handle) {
    return;
  }

  let dragState = null;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const moveTo = (left, top) => {
    const maxLeft = window.innerWidth - panel.offsetWidth - 8;
    const maxTop = window.innerHeight - panel.offsetHeight - 8;
    panel.style.left = `${clamp(left, 8, Math.max(8, maxLeft))}px`;
    panel.style.top = `${clamp(top, 8, Math.max(8, maxTop))}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  };

  handle.addEventListener("pointerdown", (event) => {
    if (window.matchMedia("(max-width: 720px)").matches) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    dragState = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };

    panel.classList.add("is-dragging");
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener("pointermove", (event) => {
    if (!dragState) {
      return;
    }

    moveTo(event.clientX - dragState.offsetX, event.clientY - dragState.offsetY);
  });

  const endDrag = (event) => {
    if (!dragState) {
      return;
    }

    dragState = null;
    panel.classList.remove("is-dragging");

    if (handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
    }
  };

  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);

  window.addEventListener("resize", () => {
    const rect = panel.getBoundingClientRect();
    moveTo(rect.left, rect.top);
  });
});
