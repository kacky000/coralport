/* Save and load system — uses localStorage to persist game state */

const SAVE_KEY = 'coralport_save';

export function saveGame(gameState) {
  const data = {
    player: {
      x: gameState.player.x,
      y: gameState.player.y,
      z: gameState.player.z,
      health: gameState.player.health,
      armor: gameState.player.armor,
      money: gameState.player.money,
    },
    wantedLevel: gameState.wantedLevel,
    completedMissions: Array.from(gameState.missionSystem?.completedIds || []),
    weaponAmmo: gameState.weaponState?.ammo ? [...gameState.weaponState.ammo] : [Infinity, 60, 120],
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function applySave(saveData, gameState) {
  if (!saveData) return;
  gameState.player.x = saveData.player.x;
  gameState.player.y = saveData.player.y;
  gameState.player.z = saveData.player.z;
  gameState.player.health = saveData.player.health;
  gameState.player.armor = saveData.player.armor;
  gameState.player.money = saveData.player.money;
  gameState.wantedLevel = saveData.wantedLevel || 0;

  if (saveData.completedMissions && gameState.missionSystem) {
    gameState.missionSystem.completedIds = new Set(saveData.completedMissions);
  }

  if (saveData.weaponAmmo && gameState.weaponState) {
    gameState.weaponState.ammo = saveData.weaponAmmo;
    // Handle Infinity deserialization
    if (gameState.weaponState.ammo[0] === null) gameState.weaponState.ammo[0] = Infinity;
  }
}
