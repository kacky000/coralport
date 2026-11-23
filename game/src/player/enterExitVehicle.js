/* Enter/exit vehicle system — press F near a car to get in, F to get out */
import { wasPressed } from '../core/input.js';

const ENTER_RADIUS = 4.0;

export function findNearestVehicle(playerX, playerZ, vehicles) {
  let nearest = null;
  let nearestDist = ENTER_RADIUS;

  for (const v of vehicles) {
    const dx = v.x - playerX;
    const dz = v.z - playerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = v;
    }
  }
  return nearest;
}

export function handleEnterExit(gameState) {
  if (!wasPressed('KeyF')) return false;

  if (gameState.inVehicle) {
    // Exit vehicle
    exitVehicle(gameState);
    return true;
  } else {
    // Try to enter nearest vehicle
    const nearest = findNearestVehicle(
      gameState.player.x,
      gameState.player.z,
      gameState.allVehicles
    );
    if (nearest) {
      enterVehicle(gameState, nearest);
      return true;
    }
  }
  return false;
}

function enterVehicle(gameState, vehicle) {
  gameState.inVehicle = true;
  gameState.currentVehicle = vehicle;
  gameState.player.mesh.visible = false;

  // If it's a civilian car, it's now stolen — increase wanted level
  if (!vehicle.isPolice && !vehicle.isPlayerOwned) {
    if (gameState.wantedLevel < 1) {
      gameState.wantedLevel = 1;
      gameState.wantedTimer = 0;
    }
    vehicle.isPlayerOwned = true;
  }
}

function exitVehicle(gameState) {
  const vehicle = gameState.currentVehicle;
  gameState.inVehicle = false;
  gameState.currentVehicle = null;

  // Place player beside the vehicle
  gameState.player.x = vehicle.x + Math.cos(vehicle.angle) * 2.5;
  gameState.player.z = vehicle.z - Math.sin(vehicle.angle) * 2.5;
  gameState.player.y = 0.1;
  gameState.player.mesh.visible = true;
}

export function getEnterPrompt(playerX, playerZ, vehicles, inVehicle) {
  if (inVehicle) return 'Press F to exit vehicle';
  const nearest = findNearestVehicle(playerX, playerZ, vehicles);
  if (nearest) return 'Press F to enter vehicle';
  return null;
}
