/* Wanted level system — 1-5 stars, escalation, search radius, escape mechanic */

const ESCAPE_TIME = 15; // seconds to lose wanted level once out of sight
const SEARCH_RADIUS = [0, 80, 120, 160, 200, 250]; // per star level

export function createWantedState() {
  return {
    level: 0,
    escapeTimer: 0,
    inSearchRadius: false,
    flashTimer: 0,
  };
}

export function updateWantedLevel(wanted, playerX, playerZ, policeCars, dt, crimeCommitted) {
  // Increase wanted level from crimes
  if (crimeCommitted) {
    wanted.level = Math.min(5, wanted.level + 1);
    wanted.escapeTimer = 0;
  }

  if (wanted.level === 0) return;

  // Check if any police can see the player
  let seen = false;
  const searchR = SEARCH_RADIUS[wanted.level];
  for (const cop of policeCars) {
    const dx = cop.x - playerX;
    const dz = cop.z - playerZ;
    if (Math.sqrt(dx * dx + dz * dz) < searchR) {
      seen = true;
      break;
    }
  }

  wanted.inSearchRadius = seen;

  if (!seen) {
    wanted.escapeTimer += dt;
    if (wanted.escapeTimer >= ESCAPE_TIME) {
      wanted.level = Math.max(0, wanted.level - 1);
      wanted.escapeTimer = 0;
    }
  } else {
    wanted.escapeTimer = 0;
  }

  // Flashing effect timer
  wanted.flashTimer += dt;
}

export function getSearchRadius(level) {
  return SEARCH_RADIUS[level] || 0;
}
