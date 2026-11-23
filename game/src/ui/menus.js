/* Menus — start screen, pause menu, phone/map, game over */

let menuContainer = null;
let currentMenu = 'start'; // 'start', 'playing', 'paused', 'phone', 'gameover'
let onStartGame = null;
let onLoadGame = null;
let onResumeGame = null;

export function createMenus(callbacks) {
  onStartGame = callbacks.onStart;
  onLoadGame = callbacks.onLoad;
  onResumeGame = callbacks.onResume;

  menuContainer = document.createElement('div');
  menuContainer.id = 'menu-layer';
  menuContainer.style.cssText = 'position:fixed;inset:0;z-index:50;';
  document.getElementById('ui-layer').appendChild(menuContainer);

  showStartScreen();
}

function showStartScreen() {
  currentMenu = 'start';
  menuContainer.innerHTML = `
    <div style="position:fixed;inset:0;background:linear-gradient(180deg,rgba(10,12,24,0.85) 0%,rgba(26,34,64,0.75) 50%,rgba(42,26,16,0.7) 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="font-size:80px;font-weight:900;color:#f7a825;letter-spacing:10px;text-shadow:0 4px 24px rgba(247,168,37,0.5),0 0 60px rgba(247,168,37,0.2);font-family:'Segoe UI',Arial,sans-serif;">CORALPORT</div>
      <div style="font-size:18px;color:rgba(255,255,255,0.5);letter-spacing:8px;margin-top:10px;text-transform:uppercase;">An Open World Crime Game</div>
      <div style="margin-top:60px;display:flex;flex-direction:column;gap:16px;align-items:center;">
        <button id="btn-new" style="background:linear-gradient(90deg,#f7a825,#e85d3a);border:none;color:#fff;font-size:20px;padding:14px 48px;border-radius:8px;cursor:pointer;font-weight:bold;letter-spacing:2px;min-width:220px;pointer-events:auto;box-shadow:0 4px 20px rgba(232,93,58,0.4);">NEW GAME</button>
        <button id="btn-load" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#ccc;font-size:16px;padding:10px 48px;border-radius:8px;cursor:pointer;letter-spacing:2px;min-width:220px;pointer-events:auto;">CONTINUE</button>
      </div>
      <div style="position:absolute;bottom:20px;color:rgba(255,255,255,0.3);font-size:12px;">WASD to move · Mouse to look · F enter/exit vehicle · Click to shoot · ESC pause</div>
    </div>
  `;

  document.getElementById('btn-new').onclick = () => {
    hideMenu();
    onStartGame(false);
  };
  document.getElementById('btn-load').onclick = () => {
    hideMenu();
    onLoadGame?.();
  };
}

export function showPauseMenu() {
  currentMenu = 'paused';
  menuContainer.style.display = '';
  menuContainer.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="font-size:48px;font-weight:bold;color:#f7a825;letter-spacing:4px;margin-bottom:40px;">PAUSED</div>
      <button id="btn-resume" style="background:linear-gradient(90deg,#f7a825,#e85d3a);border:none;color:#fff;font-size:18px;padding:12px 40px;border-radius:8px;cursor:pointer;font-weight:bold;min-width:200px;margin-bottom:12px;pointer-events:auto;">RESUME</button>
      <button id="btn-save" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#ccc;font-size:15px;padding:10px 40px;border-radius:8px;cursor:pointer;min-width:200px;margin-bottom:12px;pointer-events:auto;">SAVE GAME</button>
      <button id="btn-quit" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#ccc;font-size:15px;padding:10px 40px;border-radius:8px;cursor:pointer;min-width:200px;pointer-events:auto;">QUIT TO MENU</button>
      <div style="margin-top:30px;color:rgba(255,255,255,0.3);font-size:13px;">Controls: WASD move · Shift run · Space jump · F enter/exit vehicle · 1-3 weapons · M map · ESC resume</div>
    </div>
  `;

  document.getElementById('btn-resume').onclick = () => {
    hideMenu();
    onResumeGame?.();
  };
  document.getElementById('btn-save').onclick = () => {
    if (window.__saveGame) {
      window.__saveGame();
      document.getElementById('btn-save').textContent = 'SAVED!';
      setTimeout(() => {
        const btn = document.getElementById('btn-save');
        if (btn) btn.textContent = 'SAVE GAME';
      }, 1500);
    }
  };
  document.getElementById('btn-quit').onclick = () => {
    showStartScreen();
  };
}

export function showPhoneScreen(mapCanvas, gameState) {
  currentMenu = 'phone';
  menuContainer.style.display = '';

  const missions = gameState.missionSystem?.missions || [];
  let missionList = '';
  for (const m of missions) {
    const completed = gameState.missionSystem.completedIds.has(m.id);
    const status = completed ? '✓' : '○';
    const color = completed ? '#8deb5e' : '#ffdd44';
    missionList += `<div style="color:${color};margin:4px 0;font-size:14px;">${status} ${m.title} — $${m.reward}</div>`;
  }

  menuContainer.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;gap:40px;">
      <div style="border:2px solid rgba(255,255,255,0.2);border-radius:16px;overflow:hidden;width:400px;height:400px;position:relative;">
        <canvas id="full-map" width="400" height="400" style="width:100%;height:100%;"></canvas>
        <div style="position:absolute;top:8px;left:8px;color:#f7a825;font-size:14px;font-weight:bold;">MAP OF CORALPORT</div>
        <div style="position:absolute;bottom:8px;right:8px;color:rgba(255,255,255,0.4);font-size:11px;">Press M or ESC to close</div>
      </div>
      <div style="width:260px;">
        <div style="font-size:22px;color:#f7a825;font-weight:bold;margin-bottom:16px;">MISSIONS</div>
        ${missionList || '<div style="color:#888;font-size:14px;">No missions yet</div>'}
        <div style="margin-top:24px;font-size:14px;color:#ccc;">Money: <span style="color:#8deb5e;">$${gameState.player.money.toLocaleString()}</span></div>
        <div style="font-size:14px;color:#ccc;margin-top:4px;">Health: ${Math.round(gameState.player.health)}%</div>
      </div>
    </div>
  `;

  // Draw map
  const fmCanvas = document.getElementById('full-map');
  if (fmCanvas && mapCanvas) {
    const ctx = fmCanvas.getContext('2d');
    ctx.drawImage(mapCanvas, 0, 0, 400, 400);

    // Player marker
    const px = ((gameState.player.x + 400) / 800) * 400;
    const pz = ((gameState.player.z + 400) / 800) * 400;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, pz, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // District labels
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('Palm Beach', 200, 60);
    ctx.fillText('Downtown', 200, 175);
    ctx.fillText('Harbor', 330, 175);
    ctx.fillText('Canal District', 70, 175);
    ctx.fillText('Coral Heights', 200, 340);
  }
}

export function showGameOver() {
  currentMenu = 'gameover';
  menuContainer.style.display = '';
  menuContainer.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(100,0,0,0.8);display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="font-size:56px;font-weight:bold;color:#ff4444;letter-spacing:4px;">WASTED</div>
      <div style="font-size:16px;color:#ccc;margin-top:16px;">You have been taken down.</div>
      <button id="btn-respawn" style="margin-top:40px;background:linear-gradient(90deg,#f7a825,#e85d3a);border:none;color:#fff;font-size:18px;padding:12px 40px;border-radius:8px;cursor:pointer;font-weight:bold;pointer-events:auto;">RESPAWN</button>
    </div>
  `;
  document.getElementById('btn-respawn').onclick = () => {
    hideMenu();
    if (window.__respawnPlayer) window.__respawnPlayer();
  };
}

export function hideMenu() {
  currentMenu = 'playing';
  menuContainer.style.display = 'none';
}

export function getMenuState() { return currentMenu; }
export function isMenuOpen() { return currentMenu !== 'playing'; }
