// One reorder operation shared by mouse drag, touch handles and arrow buttons.
export function attachReordering(container, onMove) {
  const controller = new AbortController();
  const options = {signal: controller.signal};
  let drag = null;
  const listen = (node, type, handler, extra = {}) => node.addEventListener(type, handler, {...options, ...extra});
  const rows = () => [...container.querySelectorAll('[data-order-index]')];
  function cancel() {
    const previous = drag;
    drag = null;
    previous?.ghost?.remove();
    if (previous?.pointerId !== undefined && previous.handle.hasPointerCapture(previous.pointerId)) {
      previous.handle.releasePointerCapture(previous.pointerId);
    }
    rows().forEach(row => row.classList.remove('dragging', 'drop-before', 'drop-after'));
  }
  function mark(x, y) {
    rows().forEach(row => row.classList.remove('drop-before', 'drop-after'));
    const row = document.elementFromPoint(x, y)?.closest('[data-order-index]');
    if (!row || !container.contains(row)) return null;
    const rect = row.getBoundingClientRect();
    const target = {index: Number(row.dataset.orderIndex), after: y > rect.top + rect.height / 2};
    if (drag && target.index !== drag.from) row.classList.add(target.after ? 'drop-after' : 'drop-before');
    return target;
  }
  function drop(target) {
    const from = drag?.from;
    cancel();
    if (from === undefined || !target || target.index === from) return;
    let to = target.index + Number(target.after);
    if (to > from) to--;
    if (to !== from) onMove(from, to);
  }
  listen(container, 'dragstart', event => {
    const row = event.target.closest('[data-order-index]');
    if (!row) return;
    if (row.draggable !== true || event.target.closest('button')) { event.preventDefault(); return; }
    cancel();
    drag = {from: Number(row.dataset.orderIndex), native: true};
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(drag.from));
    row.classList.add('dragging');
  });
  listen(container, 'dragover', event => {
    if (!drag?.native) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    mark(event.clientX, event.clientY);
  });
  listen(container, 'drop', event => {
    if (!drag?.native) return;
    event.preventDefault();
    drop(mark(event.clientX, event.clientY));
  });
  listen(document, 'drop', cancel);
  listen(document, 'dragend', cancel);
  listen(container, 'pointerdown', event => {
    const handle = event.target.closest('.drag-handle');
    if (!handle || handle.disabled || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    cancel();
    drag = {handle, from: Number(handle.closest('[data-order-index]').dataset.orderIndex), pointerId: event.pointerId, x: event.clientX, y: event.clientY};
    if (event.isTrusted) handle.setPointerCapture(event.pointerId);
    handle.focus({preventScroll: true});
  });
  listen(document, 'pointermove', event => {
    if (!drag || drag.native || event.pointerId !== drag.pointerId) return;
    if (!drag.ghost && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
    event.preventDefault();
    if (!drag.ghost) {
      const row = drag.handle.closest('[data-order-index]');
      const rect = row.getBoundingClientRect();
      drag.ghost = row.cloneNode(true);
      drag.ghost.classList.add('drag-ghost');
      drag.ghost.removeAttribute('draggable');
      drag.ghost.setAttribute('aria-hidden', 'true');
      drag.ghost.style.width = `${rect.width}px`;
      drag.offsetX = drag.x - rect.left;
      drag.offsetY = drag.y - rect.top;
      document.body.append(drag.ghost);
      row.classList.add('dragging');
    }
    drag.ghost.style.left = `${event.clientX - drag.offsetX}px`;
    drag.ghost.style.top = `${event.clientY - drag.offsetY}px`;
    mark(event.clientX, event.clientY);
    if (event.clientY < 60) window.scrollBy(0, -12);
    else if (event.clientY > innerHeight - 60) window.scrollBy(0, 12);
  }, {passive: false});
  listen(document, 'pointerup', event => {
    if (drag && !drag.native && event.pointerId === drag.pointerId) drop(drag.ghost ? mark(event.clientX, event.clientY) : null);
  });
  listen(document, 'pointercancel', event => { if (event.pointerId === drag?.pointerId) cancel(); });
  listen(document, 'keydown', event => { if (event.key === 'Escape') cancel(); });
  listen(window, 'blur', cancel);
  return () => { cancel(); controller.abort(); };
}
