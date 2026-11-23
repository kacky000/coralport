/* Main game loop — fixed timestep physics, variable render */

let lastTime = 0;
let accumulator = 0;
const FIXED_DT = 1 / 60;
const MAX_FRAME = 0.1;

export function startLoop(updateFn, renderFn) {
  function frame(time) {
    const t = time / 1000;
    let frameDt = t - lastTime;
    if (frameDt > MAX_FRAME) frameDt = MAX_FRAME;
    lastTime = t;
    accumulator += frameDt;

    while (accumulator >= FIXED_DT) {
      updateFn(FIXED_DT);
      accumulator -= FIXED_DT;
    }

    renderFn(frameDt);
    if (!window.__shotMode) requestAnimationFrame(frame);
  }

  lastTime = performance.now() / 1000;
  requestAnimationFrame(frame);
}

export const TICK_RATE = FIXED_DT;
