(() => {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const isSmallViewport = window.matchMedia("(max-width: 760px)").matches;
  const interactive = !prefersReducedMotion && !isCoarsePointer && !isSmallViewport;

  const SPACING = 64;
  const PULL_RADIUS = 170;
  const PULL_STRENGTH = 0.34;
  const SPRING = 0.045;
  const DAMPING = 0.82;

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let cols = 0;
  let rows = 0;
  let points = [];
  let pointer = { x: -9999, y: -9999, active: false };
  let rafId = null;

  function buildGrid() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(width / SPACING) + 2;
    rows = Math.ceil(height / SPACING) + 2;
    const offsetX = (width - (cols - 1) * SPACING) / 2;
    const offsetY = (height - (rows - 1) * SPACING) / 2;

    points = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const x0 = offsetX + c * SPACING;
        const y0 = offsetY + r * SPACING;
        row.push({ x0, y0, x: x0, y: y0, vx: 0, vy: 0 });
      }
      points.push(row);
    }
  }

  function drawGrid() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p = points[r][c];
        const isDim = (r + c) % 9 === 0;
        ctx.strokeStyle = isDim ? "rgba(201, 162, 75, 0.07)" : "rgba(201, 162, 75, 0.14)";

        if (c < cols - 1) {
          const right = points[r][c + 1];
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(right.x, right.y);
          ctx.stroke();
        }
        if (r < rows - 1) {
          const down = points[r + 1][c];
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(down.x, down.y);
          ctx.stroke();
        }
      }
    }
  }

  function step() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p = points[r][c];

        let targetX = p.x0;
        let targetY = p.y0;

        if (pointer.active) {
          const dx = pointer.x - p.x0;
          const dy = pointer.y - p.y0;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < PULL_RADIUS) {
            const pull = (1 - dist / PULL_RADIUS) * PULL_STRENGTH;
            targetX = p.x0 + dx * pull;
            targetY = p.y0 + dy * pull;
          }
        }

        p.vx = (p.vx + (targetX - p.x) * SPRING) * DAMPING;
        p.vy = (p.vy + (targetY - p.y) * SPRING) * DAMPING;
        p.x += p.vx;
        p.y += p.vy;
      }
    }

    drawGrid();
    rafId = requestAnimationFrame(step);
  }

  function onPointerMove(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }

  function onPointerLeave() {
    pointer.active = false;
  }

  let resizeTimeout = null;
  function onResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      buildGrid();
      if (!interactive) drawGrid();
    }, 150);
  }

  buildGrid();
  drawGrid();

  if (interactive) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    rafId = requestAnimationFrame(step);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!rafId) {
        rafId = requestAnimationFrame(step);
      }
    });
  }

  window.addEventListener("resize", onResize);
})();
