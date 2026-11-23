/* Pedestrian system — NPCs that walk on sidewalks, flee from danger */
import * as THREE from 'three';
import { HALF, CELL, ROAD_WIDTH, mulberry32 } from '../world/cityLayout.js';

const PED_COUNT = 40;
const PED_SPEED = 2.0;
const FLEE_SPEED = 7.0;
const SPAWN_RADIUS = 120;
const DESPAWN_RADIUS = 160;

const SHIRT_COLORS = [0xcc3333, 0x3366cc, 0x33aa55, 0xdddd33, 0xffffff, 0xff6600, 0xcc44aa, 0x44cccc, 0x886644];
const PANTS_COLORS = [0x222233, 0x334455, 0x443322, 0x555566, 0x222222];
const SKIN_COLORS = [0xd4a574, 0xc69c6d, 0x8d5524, 0xe8beac, 0xa07040];

function createPedModel(seed) {
  const rng = mulberry32(seed);
  const group = new THREE.Group();
  const shirtColor = SHIRT_COLORS[Math.floor(rng() * SHIRT_COLORS.length)];
  const pantsColor = PANTS_COLORS[Math.floor(rng() * PANTS_COLORS.length)];
  const skinColor = SKIN_COLORS[Math.floor(rng() * SKIN_COLORS.length)];
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.28), shirtMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  group.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), skinMat);
  head.position.y = 1.5;
  group.add(head);

  // Legs
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.5, 0.17), pantsMat);
    leg.position.set(s * 0.12, 0.5, 0);
    group.add(leg);
  }

  // Arms
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.14), shirtMat);
    arm.position.set(s * 0.32, 1.0, 0);
    group.add(arm);
  }

  group.scale.setScalar(0.9 + rng() * 0.2);
  return group;
}

export function createPedestrianSystem(scene) {
  const peds = [];
  for (let i = 0; i < PED_COUNT; i++) {
    const ped = spawnPed(scene, i, 0, -100);
    peds.push(ped);
  }
  return { peds };
}

function spawnPed(scene, seed, playerX, playerZ) {
  const rng = mulberry32(seed * 31 + 7);
  const angle = rng() * Math.PI * 2;
  const dist = 30 + rng() * SPAWN_RADIUS;
  let x = playerX + Math.cos(angle) * dist;
  let z = playerZ + Math.sin(angle) * dist;

  // Snap to sidewalk (beside roads)
  const snapOffset = (ROAD_WIDTH / 2 + 1.5) * (rng() > 0.5 ? 1 : -1);
  if (rng() > 0.5) {
    // Along horizontal road
    const roadZ = Math.round(z / CELL) * CELL;
    z = roadZ + snapOffset;
  } else {
    const roadX = Math.round(x / CELL) * CELL;
    x = roadX + snapOffset;
  }

  x = Math.max(-HALF + 20, Math.min(HALF - 20, x));
  z = Math.max(-HALF + 20, Math.min(HALF - 20, z));

  const mesh = createPedModel(seed);
  mesh.position.set(x, 0, z);
  scene.add(mesh);

  const walkAngle = rng() * Math.PI * 2;
  return {
    x, z, y: 0,
    angle: walkAngle,
    mesh,
    fleeing: false,
    fleeTimer: 0,
    walkTimer: rng() * 10,
    seed,
  };
}

export function updatePedestrians(pedSystem, dt, time, playerX, playerZ, wantedLevel, scene) {
  for (const ped of pedSystem.peds) {
    const dx = ped.x - playerX;
    const dz = ped.z - playerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Flee from nearby danger (gunshots, speeding cars, wanted level)
    if (wantedLevel >= 2 && dist < 25) {
      ped.fleeing = true;
      ped.fleeTimer = 3;
      ped.angle = Math.atan2(dx, dz);
    }

    if (ped.fleeing) {
      ped.fleeTimer -= dt;
      if (ped.fleeTimer <= 0) ped.fleeing = false;
      const speed = FLEE_SPEED;
      ped.x += Math.sin(ped.angle) * speed * dt;
      ped.z += Math.cos(ped.angle) * speed * dt;
    } else {
      // Idle walking
      ped.walkTimer -= dt;
      if (ped.walkTimer <= 0) {
        ped.angle += (Math.random() - 0.5) * 1.0;
        ped.walkTimer = 3 + Math.random() * 5;
      }
      ped.x += Math.sin(ped.angle) * PED_SPEED * dt;
      ped.z += Math.cos(ped.angle) * PED_SPEED * dt;
    }

    // Respawn if too far
    if (dist > DESPAWN_RADIUS || Math.abs(ped.x) > HALF || Math.abs(ped.z) > HALF) {
      respawnPed(ped, playerX, playerZ);
    }

    ped.mesh.position.set(ped.x, ped.y, ped.z);
    ped.mesh.rotation.y = ped.angle;

    // Walk animation
    const bobSpeed = ped.fleeing ? 14 : 6;
    const bob = Math.sin(time * bobSpeed + ped.seed) * 0.2;
    const leftLeg = ped.mesh.children[2];
    const rightLeg = ped.mesh.children[3];
    if (leftLeg) leftLeg.rotation.x = bob;
    if (rightLeg) rightLeg.rotation.x = -bob;
  }
}

function respawnPed(ped, playerX, playerZ) {
  const angle = Math.random() * Math.PI * 2;
  const dist = SPAWN_RADIUS * 0.6 + Math.random() * SPAWN_RADIUS * 0.4;
  ped.x = playerX + Math.cos(angle) * dist;
  ped.z = playerZ + Math.sin(angle) * dist;
  ped.x = Math.max(-HALF + 20, Math.min(HALF - 20, ped.x));
  ped.z = Math.max(-HALF + 20, Math.min(HALF - 20, ped.z));
  ped.fleeing = false;
  ped.angle = Math.random() * Math.PI * 2;
}

export function scareNearbyPeds(pedSystem, x, z, radius) {
  for (const ped of pedSystem.peds) {
    const dx = ped.x - x;
    const dz = ped.z - z;
    if (dx * dx + dz * dz < radius * radius) {
      ped.fleeing = true;
      ped.fleeTimer = 4;
      ped.angle = Math.atan2(dx, dz);
    }
  }
}
