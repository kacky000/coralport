/* Street props — palm trees, street lights, benches, dumpsters, signs */
import * as THREE from 'three';
import { HALF, CELL, ROAD_WIDTH, BLOCK_SIZE, getDistrict, DISTRICTS, mulberry32 } from './cityLayout.js';

export function createPalmTree(scene, x, z) {
  const group = new THREE.Group();

  // Trunk — slightly curved cylinder
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 8, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(0, 4, 0);
  trunk.castShadow = true;
  group.add(trunk);

  // Fronds — flat planes radiating from top
  const frondMat = new THREE.MeshStandardMaterial({
    color: 0x2d8a4e,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const frondGeo = new THREE.PlaneGeometry(1.2, 5);
    const frond = new THREE.Mesh(frondGeo, frondMat);
    frond.position.set(
      Math.cos(angle) * 1.5,
      8 + Math.sin(i * 1.3) * 0.3,
      Math.sin(angle) * 1.5
    );
    frond.rotation.set(
      -0.6 + Math.sin(i) * 0.2,
      angle,
      Math.cos(i * 2) * 0.3
    );
    frond.castShadow = true;
    group.add(frond);
  }

  // Coconuts
  const nutMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a });
  for (let i = 0; i < 3; i++) {
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), nutMat);
    nut.position.set(Math.cos(i * 2.1) * 0.4, 7.7, Math.sin(i * 2.1) * 0.4);
    group.add(nut);
  }

  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}

export function createStreetLight(scene, x, z) {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 6, 6), poleMat);
  pole.position.y = 3;
  group.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(2, 0.08, 0.08), poleMat);
  arm.position.set(1, 6, 0);
  group.add(arm);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffee88 })
  );
  lamp.position.set(2, 5.8, 0);
  group.add(lamp);

  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}

export function createProps(scene) {
  const props = [];
  let seed = 1000;

  // Palm trees along beach and boulevards
  for (let x = -HALF + 10; x < HALF - 10; x += 15) {
    const rng = mulberry32(seed++);
    // Beach palms
    if (rng() > 0.3) {
      createPalmTree(scene, x + rng() * 4, -HALF + 50 + rng() * 30);
    }
    // Boulevard palms (along main roads)
    if (Math.abs(x) < 200 && rng() > 0.5) {
      createPalmTree(scene, x + rng() * 2, -HALF + 210 + rng() * 2);
    }
  }

  // Street lights at intersections
  for (let x = -HALF + CELL; x < HALF; x += CELL * 2) {
    for (let z = -HALF + CELL; z < HALF; z += CELL * 2) {
      const rng = mulberry32(seed++);
      if (rng() > 0.3) {
        createStreetLight(scene, x + ROAD_WIDTH / 2 + 1, z - ROAD_WIDTH / 2 - 1);
      }
    }
  }

  // More boulevard palms along major horizontal roads
  for (let z = -HALF + 160; z < HALF; z += CELL * 2) {
    for (let x = -200; x < 200; x += 20) {
      const rng = mulberry32(seed++);
      if (rng() > 0.6) {
        createPalmTree(scene, x + rng() * 3, z + ROAD_WIDTH / 2 + 2);
      }
    }
  }

  // Harbor cranes
  for (let i = 0; i < 4; i++) {
    const rng = mulberry32(seed++);
    createCrane(scene, 220 + i * 50 + rng() * 20, -HALF + 180 + rng() * 40);
  }

  // Benches and dumpsters near buildings (ground-level detail)
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 0.9 });
  for (let i = 0; i < 30; i++) {
    const rng = mulberry32(seed++);
    const bx = -300 + rng() * 600;
    const bz = -300 + rng() * 600;
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.4), benchMat);
    bench.position.set(bx, 0.25, bz);
    scene.add(bench);
  }

  return props;
}

function createCrane(scene, x, z) {
  const group = new THREE.Group();
  const craneMat = new THREE.MeshStandardMaterial({ color: 0xcc4422, roughness: 0.6 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(3, 20, 3), craneMat);
  base.position.y = 10;
  base.castShadow = true;
  group.add(base);

  // Boom arm
  const boom = new THREE.Mesh(new THREE.BoxGeometry(25, 1.5, 1.5), craneMat);
  boom.position.set(10, 21, 0);
  boom.castShadow = true;
  group.add(boom);

  // Cable
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 15, 4), steelMat);
  cable.position.set(20, 13, 0);
  group.add(cable);

  group.position.set(x, 0, z);
  scene.add(group);
}
