/* HUD overlay — health, armor, money, wanted stars, weapon, ammo, mission text, district name */

let hudContainer = null;

export function createHUD() {
  const ui = document.getElementById('ui-layer');
  hudContainer = document.createElement('div');
  hudContainer.id = 'hud';
  hudContainer.innerHTML = `
    <style>
      #hud { position:fixed; inset:0; pointer-events:none; font-family:'Segoe UI',Arial,sans-serif; }
      #hud * { pointer-events:none; }
      .hud-top-right { position:absolute; top:16px; right:16px; text-align:right; }
      .hud-money { font-size:28px; font-weight:bold; color:#8deb5e; text-shadow:0 2px 8px rgba(0,0,0,0.7); }
      .hud-wanted { font-size:24px; color:#ffcc00; text-shadow:0 2px 8px rgba(0,0,0,0.7); margin-top:4px; letter-spacing:4px; }
      .hud-weapon { font-size:16px; color:#fff; text-shadow:0 1px 4px rgba(0,0,0,0.8); margin-top:8px; }
      .hud-bottom-left { position:absolute; bottom:16px; left:16px; }
      .hud-health-bar { width:180px; height:12px; background:rgba(0,0,0,0.5); border-radius:6px; overflow:hidden; margin-bottom:4px; }
      .hud-health-fill { height:100%; background:linear-gradient(90deg,#cc2222,#ff4444); border-radius:6px; transition:width 0.3s; }
      .hud-armor-bar { width:180px; height:10px; background:rgba(0,0,0,0.3); border-radius:5px; overflow:hidden; margin-bottom:6px; }
      .hud-armor-fill { height:100%; background:linear-gradient(90deg,#4488cc,#66aaff); border-radius:5px; transition:width 0.3s; }
      .hud-district { font-size:16px; color:rgba(255,255,255,0.7); text-shadow:0 1px 4px rgba(0,0,0,0.6); margin-top:6px; }
      .hud-top-center { position:absolute; top:16px; left:50%; transform:translateX(-50%); text-align:center; }
      .hud-objective { font-size:16px; color:#ffdd44; text-shadow:0 1px 6px rgba(0,0,0,0.8); background:rgba(0,0,0,0.3); padding:6px 16px; border-radius:8px; max-width:400px; }
      .hud-timer { font-size:22px; color:#ff6644; text-shadow:0 1px 6px rgba(0,0,0,0.8); margin-top:6px; }
      .hud-dialogue { position:absolute; bottom:100px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.75); border:1px solid rgba(255,255,255,0.2); border-radius:12px; padding:14px 24px; max-width:500px; text-align:center; }
      .hud-dialogue-speaker { font-size:14px; color:#f7a825; font-weight:bold; margin-bottom:4px; }
      .hud-dialogue-text { font-size:15px; color:#fff; line-height:1.4; }
      .hud-prompt { position:absolute; bottom:60px; left:50%; transform:translateX(-50%); font-size:14px; color:#ccc; text-shadow:0 1px 4px rgba(0,0,0,0.6); background:rgba(0,0,0,0.3); padding:4px 12px; border-radius:6px; }
      .hud-speed { font-size:14px; color:#aaddff; text-shadow:0 1px 4px rgba(0,0,0,0.6); margin-top:4px; }
      .hud-title-corner { position:absolute; bottom:16px; right:16px; font-size:11px; color:rgba(255,255,255,0.3); letter-spacing:2px; text-transform:uppercase; }
      .hud-crosshair { position:fixed; top:50%; left:50%; width:4px; height:4px; background:#fff; border-radius:50%; transform:translate(-50%,-50%); opacity:0.5; }
    </style>
    <div class="hud-top-right">
      <div class="hud-money" id="hud-money">$500</div>
      <div class="hud-wanted" id="hud-wanted"></div>
      <div class="hud-weapon" id="hud-weapon">Fists</div>
    </div>
    <div class="hud-bottom-left">
      <div class="hud-health-bar"><div class="hud-health-fill" id="hud-health" style="width:100%"></div></div>
      <div class="hud-armor-bar"><div class="hud-armor-fill" id="hud-armor" style="width:0%"></div></div>
      <div class="hud-district" id="hud-district">Palm Beach</div>
      <div class="hud-speed" id="hud-speed"></div>
    </div>
    <div class="hud-top-center">
      <div class="hud-objective" id="hud-objective" style="display:none"></div>
      <div class="hud-timer" id="hud-timer" style="display:none"></div>
    </div>
    <div class="hud-dialogue" id="hud-dialogue" style="display:none">
      <div class="hud-dialogue-speaker" id="hud-dialogue-speaker"></div>
      <div class="hud-dialogue-text" id="hud-dialogue-text"></div>
    </div>
    <div class="hud-prompt" id="hud-prompt" style="display:none"></div>
    <div class="hud-title-corner">CORALPORT</div>
    <div class="hud-crosshair" id="hud-crosshair"></div>
  `;
  ui.appendChild(hudContainer);
}

export function updateHUD(gameState) {
  const el = (id) => document.getElementById(id);

  // Money
  el('hud-money').textContent = `$${gameState.player.money.toLocaleString()}`;

  // Wanted stars
  const stars = '★'.repeat(gameState.wantedLevel) + '☆'.repeat(5 - gameState.wantedLevel);
  el('hud-wanted').textContent = gameState.wantedLevel > 0 ? stars : '';
  el('hud-wanted').style.color = gameState.wanted?.inSearchRadius ? '#ff4444' : '#ffcc00';

  // Weapon
  const weapon = gameState.weaponState;
  if (weapon) {
    const w = gameState.weapons[weapon.currentIndex];
    const ammo = weapon.ammo[weapon.currentIndex];
    const ammoText = ammo === Infinity ? '' : ` [${ammo}]`;
    el('hud-weapon').textContent = `${w.name}${ammoText}`;
  }

  // Health and armor
  el('hud-health').style.width = `${Math.max(0, gameState.player.health)}%`;
  el('hud-armor').style.width = `${Math.max(0, gameState.player.armor)}%`;

  // District
  el('hud-district').textContent = gameState.districtName || '';

  // Speed (when in vehicle)
  if (gameState.inVehicle && gameState.currentVehicle) {
    const mph = Math.round(Math.abs(gameState.currentVehicle.speed) * 2.5);
    el('hud-speed').textContent = `${mph} mph`;
    el('hud-speed').style.display = '';
  } else {
    el('hud-speed').style.display = 'none';
  }

  // Mission objective
  const obj = gameState.missionSystem?.objectiveText;
  if (obj) {
    el('hud-objective').textContent = obj;
    el('hud-objective').style.display = '';
  } else {
    el('hud-objective').style.display = 'none';
  }

  // Mission timer
  const active = gameState.missionSystem?.activeMission;
  if (active && active.timer > 0) {
    const mins = Math.floor(active.timer / 60);
    const secs = Math.floor(active.timer % 60);
    el('hud-timer').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    el('hud-timer').style.display = '';
  } else {
    el('hud-timer').style.display = 'none';
  }

  // Dialogue
  const ms = gameState.missionSystem;
  if (ms && ms.dialogueText) {
    el('hud-dialogue').style.display = '';
    el('hud-dialogue-speaker').textContent = ms.dialogueSpeaker;
    el('hud-dialogue-text').textContent = ms.dialogueText;
  } else {
    el('hud-dialogue').style.display = 'none';
  }

  // Prompt
  if (gameState.promptText) {
    el('hud-prompt').textContent = gameState.promptText;
    el('hud-prompt').style.display = '';
  } else {
    el('hud-prompt').style.display = 'none';
  }

  // Crosshair visibility
  el('hud-crosshair').style.display = gameState.inVehicle ? 'none' : '';
}

export function hideHUD() {
  if (hudContainer) hudContainer.style.display = 'none';
}

export function showHUD() {
  if (hudContainer) hudContainer.style.display = '';
}
