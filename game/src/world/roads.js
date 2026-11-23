/* Road network — creates road surfaces, lane markings, intersections, traffic lights */
import * as THREE from 'three';
import { CITY_SIZE, HALF, BLOCK_SIZE, ROAD_WIDTH, CELL, generateRoadGrid } from './cityLayout.js';

export function createRoads(scene) {
  const roadGroup = new THREE.Group();
  const roads = generateRoadGrid();

  // Road material — dark asphalt
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x333338,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Create horizontal roads
  for (const z of roads.horizontal) {
    const geo = new THREE.BoxGeometry(CITY_SIZE, 0.05, ROAD_WIDTH);
    const mesh = new THREE.Mesh(geo, roadMat);
    mesh.position.set(0, 0.02, z);
    mesh.receiveShadow = true;
    roadGroup.add(mesh);
  }

  // Create vertical roads
  for (const x of roads.vertical) {
    const geo = new THREE.BoxGeometry(ROAD_WIDTH, 0.05, CITY_SIZE);
    const mesh = new THREE.Mesh(geo, roadMat);
    mesh.position.set(x, 0.02, 0);
    mesh.receiveShadow = true;
    roadGroup.add(mesh);
  }

  // Lane markings (dashed center lines)
  const markingMat = new THREE.MeshBasicMaterial({ color: 0xcccc88 });
  const dashLen = 3, gapLen = 3;

  for (const z of roads.horizontal) {
    for (let x = -HALF; x < HALF; x += dashLen + gapLen) {
      const dg = new THREE.BoxGeometry(dashLen, 0.02, 0.15);
      const dm = new THREE.Mesh(dg, markingMat);
      dm.position.set(x + dashLen / 2, 0.06, z);
      roadGroup.add(dm);
    }
  }
  for (const x of roads.vertical) {
    for (let z = -HALF; z < HALF; z += dashLen + gapLen) {
      const dg = new THREE.BoxGeometry(0.15, 0.02, dashLen);
      const dm = new THREE.Mesh(dg, markingMat);
      dm.position.set(x, 0.06, z + dashLen / 2);
      roadGroup.add(dm);
    }
  }

  scene.add(roadGroup);
  return { roadGroup, roads };
}

// Traffic light system
const LIGHT_CYCLE = 8; // seconds per phase
export function createTrafficLights(scene, roads) {
  const lights = [];
  const hRoads = roads.horizontal;
  const vRoads = roads.vertical;

  for (let hi = 0; hi < hRoads.length; hi += 2) {
    for (let vi = 0; vi < vRoads.length; vi += 2) {
      const x = vRoads[vi];
      const z = hRoads[hi];
      if (Math.abs(x) > HALF - 20 || Math.abs(z) > HALF - 20) continue;
      const tl = createTrafficLight(scene, x + ROAD_WIDTH / 2 + 0.5, z + ROAD_WIDTH / 2 + 0.5, (hi + vi) % 2);
      lights.push({ mesh: tl, x, z, phase: (hi + vi) % 2 });
    }
  }
  return lights;
}

function createTrafficLight(scene, x, z, phase) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 4, 6),
    new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5 })
  );
  pole.position.set(x, 2, z);
  pole.castShadow = true;

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 1.0, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  box.position.set(x, 4.2, z);

  // Red/green indicators
  const red = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff2200 })
  );
  red.position.set(x, 4.5, z + 0.21);

  const green = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x00ff44 })
  );
  green.position.set(x, 3.9, z + 0.21);

  scene.add(pole, box, red, green);
  return { pole, box, red, green, phase };
}

export function updateTrafficLights(lights, time) {
  const cycle = time % (LIGHT_CYCLE * 2);
  for (const tl of lights) {
    const isGreen = tl.phase === 0 ? cycle < LIGHT_CYCLE : cycle >= LIGHT_CYCLE;
    tl.mesh.red.material.color.setHex(isGreen ? 0x330000 : 0xff2200);
    tl.mesh.red.material.emissive?.setHex?.(isGreen ? 0x000000 : 0xff2200);
    tl.mesh.green.material.color.setHex(isGreen ? 0x00ff44 : 0x003300);
    tl.mesh.green.material.emissive?.setHex?.(isGreen ? 0x00ff44 : 0x000000);
  }
}

// Get traffic light state at intersection
export function getTrafficState(x, z, time) {
  // Determine which phase this intersection belongs to
  const ix = Math.round((x + HALF) / CELL);
  const iz = Math.round((z + HALF) / CELL);
  const phase = (ix + iz) % 2;
  const cycle = time % (LIGHT_CYCLE * 2);
  return phase === 0 ? cycle < LIGHT_CYCLE : cycle >= LIGHT_CYCLE;
}
