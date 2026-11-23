/* Police AI — spawn police cars that chase the player based on wanted level */
import * as THREE from 'three';
import { createPoliceCarModel } from '../vehicles/vehicle.js';
import { HALF } from '../world/cityLayout.js';

const POLICE_SPEED = 12;
const POLICE_CHASE_SPEED = 20;
const MAX_POLICE = [0, 2, 4, 6, 8, 10]; // per wanted level

export function createPoliceSystem(scene) {
  return {
    cars: [],
    scene,
    spawnTimer: 0,
  };
}

export function updatePolice(policeSystem, dt, wantedLevel, playerX, playerZ, playerSpeed, scene) {
  const targetCount = MAX_POLICE[wantedLevel] || 0;

  // Spawn new police if needed
  policeSystem.spawnTimer -= dt;
  if (policeSystem.cars.length < targetCount && policeSystem.spawnTimer <= 0) {
    spawnPoliceCar(policeSystem, playerX, playerZ, scene);
    policeSystem.spawnTimer = 2;
  }

  // Remove excess police
  while (policeSystem.cars.length > targetCount) {
    const car = policeSystem.cars.pop();
    scene.remove(car.mesh);
  }

  // Update each police car
  for (const cop of policeSystem.cars) {
    if (wantedLevel > 0) {
      // Chase player
      const dx = playerX - cop.x;
      const dz = playerZ - cop.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const targetAngle = Math.atan2(dx, dz);

      // Smooth turn towards player
      let angleDiff = targetAngle - cop.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      cop.angle += angleDiff * 2.5 * dt;

      const speed = dist > 30 ? POLICE_CHASE_SPEED : POLICE_SPEED;
      cop.x += Math.sin(cop.angle) * speed * dt;
      cop.z += Math.cos(cop.angle) * speed * dt;

      // Roadblock behavior at high wanted levels
      if (wantedLevel >= 3 && cop.isRoadblock) {
        // Stay still at roadblock position
        cop.x = cop.blockX;
        cop.z = cop.blockZ;
      }
    } else {
      // Patrol
      cop.patrolTimer = (cop.patrolTimer || 0) + dt;
      if (cop.patrolTimer > 5) {
        cop.angle += (Math.random() - 0.5) * 0.5;
        cop.patrolTimer = 0;
      }
      cop.x += Math.sin(cop.angle) * POLICE_SPEED * 0.5 * dt;
      cop.z += Math.cos(cop.angle) * POLICE_SPEED * 0.5 * dt;
    }

    // Bounds
    cop.x = Math.max(-HALF + 10, Math.min(HALF - 10, cop.x));
    cop.z = Math.max(-HALF + 10, Math.min(HALF - 10, cop.z));

    cop.mesh.position.set(cop.x, cop.y, cop.z);
    cop.mesh.rotation.y = cop.angle;

    // Siren lights flash
    updateSirenLights(cop, dt);
  }
}

function spawnPoliceCar(policeSystem, playerX, playerZ, scene) {
  const angle = Math.random() * Math.PI * 2;
  const dist = 80 + Math.random() * 60;
  const x = playerX + Math.cos(angle) * dist;
  const z = playerZ + Math.sin(angle) * dist;

  const mesh = createPoliceCarModel();
  mesh.position.set(x, 0.3, z);
  scene.add(mesh);

  const isRoadblock = policeSystem.cars.length >= 3 && Math.random() > 0.5;

  policeSystem.cars.push({
    x, z, y: 0.3,
    angle: Math.atan2(playerX - x, playerZ - z),
    mesh,
    isPolice: true,
    isPlayerOwned: false,
    sirenPhase: Math.random() * Math.PI * 2,
    isRoadblock,
    blockX: x,
    blockZ: z,
    speed: 0,
  });
}

function updateSirenLights(cop, dt) {
  cop.sirenPhase += dt * 8;
  const flash = Math.sin(cop.sirenPhase);
  const redLight = cop.mesh.getObjectByName('sirenRed');
  const blueLight = cop.mesh.getObjectByName('sirenBlue');
  if (redLight) {
    redLight.material.color.setHex(flash > 0 ? 0xff0000 : 0x330000);
  }
  if (blueLight) {
    blueLight.material.color.setHex(flash < 0 ? 0x0066ff : 0x000033);
  }
}

export function getPoliceCarPositions(policeSystem) {
  return policeSystem.cars;
}
