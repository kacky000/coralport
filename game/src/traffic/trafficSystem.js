/* Traffic system — NPC cars that follow roads, stop at lights, avoid collisions */
import * as THREE from 'three';
import { HALF, CELL, ROAD_WIDTH, generateRoadGrid } from '../world/cityLayout.js';
import { createCarModel } from '../vehicles/vehicle.js';
import { getTrafficState } from '../world/roads.js';

const TRAFFIC_SPEED = 8;
const TRAFFIC_COUNT = 30;
const SPAWN_RADIUS = 180;
const DESPAWN_RADIUS = 250;

export function createTrafficSystem(scene) {
  const cars = [];
  const roads = generateRoadGrid();

  for (let i = 0; i < TRAFFIC_COUNT; i++) {
    const car = spawnTrafficCar(scene, roads, i, 0, 0);
    if (car) cars.push(car);
  }

  return { cars, roads };
}

function spawnTrafficCar(scene, roads, seed, playerX, playerZ) {
  const hRoads = roads.horizontal;
  const vRoads = roads.vertical;

  // Pick a random road
  const isHorizontal = (seed % 2) === 0;
  let x, z, angle;

  if (isHorizontal) {
    const roadIdx = seed % hRoads.length;
    z = hRoads[roadIdx] + (seed % 3 - 1) * 2;
    x = -HALF + (seed * 73 % 700);
    angle = (seed % 4 < 2) ? 0 : Math.PI;
    if (angle === Math.PI) z += 3; else z -= 3; // Drive on the right side
    angle = (seed % 4 < 2) ? Math.PI / 2 : -Math.PI / 2;
  } else {
    const roadIdx = seed % vRoads.length;
    x = vRoads[roadIdx] + (seed % 3 - 1) * 2;
    z = -HALF + (seed * 59 % 700);
    angle = (seed % 4 < 2) ? 0 : Math.PI;
    if (angle === 0) x += 3; else x -= 3;
  }

  const colorIdx = seed % 12;
  const mesh = createCarModel(colorIdx);
  mesh.position.set(x, 0.3, z);
  mesh.rotation.y = angle;
  scene.add(mesh);

  return {
    x, z, y: 0.3, angle, speed: TRAFFIC_SPEED * (0.7 + (seed % 5) * 0.1),
    mesh, isHorizontal, stopped: false, colorIdx,
    isPolice: false, isPlayerOwned: false,
  };
}

export function updateTraffic(traffic, dt, time, playerX, playerZ, scene) {
  for (const car of traffic.cars) {
    // Check traffic light
    const nearestIntersection = findNearestIntersection(car.x, car.z, traffic.roads);
    if (nearestIntersection) {
      const distToInter = distToPoint(car.x, car.z, nearestIntersection.x, nearestIntersection.z);
      if (distToInter < 15 && distToInter > 3) {
        const isGreen = getTrafficState(nearestIntersection.x, nearestIntersection.z, time);
        // Check if the car's direction aligns with the green light
        const isMovingHorizontal = Math.abs(Math.sin(car.angle)) > 0.5;
        const shouldStop = isMovingHorizontal ? !isGreen : isGreen;
        car.stopped = shouldStop;
      } else {
        car.stopped = false;
      }
    }

    if (!car.stopped) {
      car.x += Math.sin(car.angle) * car.speed * dt;
      car.z += Math.cos(car.angle) * car.speed * dt;
    }

    // Respawn if too far or out of bounds
    const dx = car.x - playerX;
    const dz = car.z - playerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > DESPAWN_RADIUS || Math.abs(car.x) > HALF || Math.abs(car.z) > HALF) {
      respawnCar(car, playerX, playerZ, traffic.roads);
    }

    car.mesh.position.set(car.x, car.y, car.z);
    car.mesh.rotation.y = car.angle;
  }
}

function respawnCar(car, playerX, playerZ, roads) {
  const hRoads = roads.horizontal;
  const vRoads = roads.vertical;
  const angle = Math.random() * Math.PI * 2;
  const dist = SPAWN_RADIUS * 0.7 + Math.random() * SPAWN_RADIUS * 0.3;

  // Pick nearest road to spawn point
  const spawnX = playerX + Math.cos(angle) * dist;
  const spawnZ = playerZ + Math.sin(angle) * dist;

  if (Math.random() > 0.5) {
    // Horizontal road
    let bestZ = hRoads[0];
    for (const rz of hRoads) {
      if (Math.abs(rz - spawnZ) < Math.abs(bestZ - spawnZ)) bestZ = rz;
    }
    car.z = bestZ + (Math.random() > 0.5 ? 3 : -3);
    car.x = spawnX;
    car.angle = Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
  } else {
    let bestX = vRoads[0];
    for (const rx of vRoads) {
      if (Math.abs(rx - spawnX) < Math.abs(bestX - spawnX)) bestX = rx;
    }
    car.x = bestX + (Math.random() > 0.5 ? 3 : -3);
    car.z = spawnZ;
    car.angle = Math.random() > 0.5 ? 0 : Math.PI;
  }

  car.x = Math.max(-HALF + 20, Math.min(HALF - 20, car.x));
  car.z = Math.max(-HALF + 20, Math.min(HALF - 20, car.z));
}

function findNearestIntersection(x, z, roads) {
  let best = null, bestDist = 60;
  for (const rx of roads.vertical) {
    for (const rz of roads.horizontal) {
      const d = distToPoint(x, z, rx, rz);
      if (d < bestDist) { bestDist = d; best = { x: rx, z: rz }; }
    }
  }
  return best;
}

function distToPoint(x1, z1, x2, z2) {
  return Math.sqrt((x1 - x2) ** 2 + (z1 - z2) ** 2);
}

export function getAllVehicles(trafficSystem) {
  return trafficSystem.cars;
}
