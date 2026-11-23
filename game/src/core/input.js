/* Input manager — tracks keyboard state and mouse for Coralport */

const keys = {};
const justPressed = {};
let mouseX = 0, mouseY = 0, mouseDX = 0, mouseDY = 0;
let mouseDown = false, rightDown = false;
let pointerLocked = false;

export function initInput(canvas) {
  window.addEventListener('keydown', e => {
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  canvas.addEventListener('mousedown', e => {
    if (e.button === 0) mouseDown = true;
    if (e.button === 2) rightDown = true;
  });
  canvas.addEventListener('mouseup', e => {
    if (e.button === 0) mouseDown = false;
    if (e.button === 2) rightDown = false;
  });
  canvas.addEventListener('mousemove', e => {
    mouseDX += e.movementX || 0;
    mouseDY += e.movementY || 0;
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('click', () => {
    if (!pointerLocked) canvas.requestPointerLock?.();
  });
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === canvas;
  });
}

export function isDown(code) { return !!keys[code]; }
export function wasPressed(code) { return !!justPressed[code]; }
export function isMouseDown() { return mouseDown; }
export function isRightDown() { return rightDown; }
export function getMouseDelta() { return { x: mouseDX, y: mouseDY }; }
export function isPointerLocked() { return pointerLocked; }

export function endFrame() {
  for (const k in justPressed) delete justPressed[k];
  mouseDX = 0;
  mouseDY = 0;
}
