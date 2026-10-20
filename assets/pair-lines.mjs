// Lines describe the learner's actual connections, never an inferred correct answer.
export function attachPairLines(container, answer) {
  const grid = container.querySelector('.pair-grid');
  if (!grid) return () => {};
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.classList.add('pair-lines'); svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible';
  grid.style.position = 'relative'; grid.prepend(svg);
  let frame = 0, disposed = false;
  function draw() {
    frame = 0;
    if (disposed) return;
    const bounds = grid.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const color = container.dataset.mode === 'learn' ? '#31ad83' : '#8c6ac5';
    const shapes = [];
    for (const [left, right] of Object.entries(answer)) {
      const first = grid.querySelector(`[data-side="left"][data-pair="${left}"]`);
      const last = grid.querySelector(`[data-side="right"][data-pair="${right}"]`);
      if (!first || !last) continue;
      const a = first.getBoundingClientRect(), b = last.getBoundingClientRect();
      const x1 = a.right - bounds.left, y1 = a.top + a.height / 2 - bounds.top;
      const x2 = b.left - bounds.left, y2 = b.top + b.height / 2 - bounds.top, middle = (x1 + x2) / 2;
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', `M${x1} ${y1} C${middle} ${y1},${middle} ${y2},${x2} ${y2}`);
      path.setAttribute('stroke', color); path.setAttribute('stroke-width', '3'); path.setAttribute('fill', 'none');
      path.dataset.linkLeft = left; shapes.push(path);
      for (const [x, y] of [[x1, y1], [x2, y2]]) {
        const dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', '4.5'); dot.setAttribute('fill', color); shapes.push(dot);
      }
    }
    svg.replaceChildren(...shapes);
  }
  function schedule() { if (!disposed && !frame) frame = requestAnimationFrame(draw); }
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  observer?.observe(grid); grid.querySelectorAll('.pair').forEach(card => observer?.observe(card));
  window.addEventListener('resize', schedule);
  document.fonts?.ready.then(schedule);
  schedule();
  return () => { disposed = true; observer?.disconnect(); window.removeEventListener('resize', schedule); cancelAnimationFrame(frame); svg.remove(); };
}
