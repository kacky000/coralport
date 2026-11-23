/* Player on foot — walk, run, jump, third-person character with procedural model */
import * as THREE from 'three';
import { isDown, wasPressed, isMouseDown } from '../core/input.js';
import { getYaw } from '../core/camera.js';
import { getBuildingCollisions } from '../world/buildings.js';

const WALK_SPEED = 5;
const RUN_SPEED = 10;
const JUMP_FORCE = 8;
const GRAVITY = 20;

export function createPlayerModel() {
  const group = new THREE.Group();

  // Body
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334455 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x222233 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x443322 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.35), bodyMat);
  torso.position.y = 1.2;
  torso.castShadow = true;
  group.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), skinMat);
  head.position.y = 1.75;
  head.castShadow = true;
  group.add(head);

  // Hair
  const hair = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.15, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  );
  hair.position.y = 1.9;
  group.add(hair);

  // Arms
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), bodyMat);
    arm.position.set(side * 0.4, 1.1, 0);
    arm.castShadow = true;
    group.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), skinMat);
    hand.position.set(side * 0.4, 0.75, 0);
    group.add(hand);
  }

  // Legs
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.22), pantsMat);
    leg.position.set(side * 0.17, 0.55, 0);
    leg.castShadow = true;
    group.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.3), shoeMat);
    shoe.position.set(side * 0.17, 0.2, 0.05);
    group.add(shoe);
  }

  return group;
}

export function createPlayerState() {
  return {
    x: 0, y: 0.1, z: -100,
    vx: 0, vy: 0, vz: 0,
    angle: 0,
    onGround: true,
    running: false,
    health: 100,
    armor: 0,
    money: 500,
    mesh: null,
  };
}

export function updatePlayerOnFoot(player, dt, buildings) {
  const yaw = getYaw();
  let moveX = 0, moveZ = 0;

  if (isDown('KeyW') || isDown('ArrowUp')) { moveX += Math.sin(yaw + Math.PI); moveZ += Math.cos(yaw + Math.PI); }
  if (isDown('KeyS') || isDown('ArrowDown')) { moveX -= Math.sin(yaw + Math.PI); moveZ -= Math.cos(yaw + Math.PI); }
  if (isDown('KeyA') || isDown('ArrowLeft')) { moveX += Math.sin(yaw + Math.PI / 2); moveZ += Math.cos(yaw + Math.PI / 2); }
  if (isDown('KeyD') || isDown('ArrowRight')) { moveX -= Math.sin(yaw + Math.PI / 2); moveZ -= Math.cos(yaw + Math.PI / 2); }

  player.running = isDown('ShiftLeft') || isDown('ShiftRight');
  const speed = player.running ? RUN_SPEED : WALK_SPEED;

  const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
  if (len > 0) {
    moveX /= len; moveZ /= len;
    player.angle = Math.atan2(moveX, moveZ);
  }

  const newX = player.x + moveX * speed * dt;
  const newZ = player.z + moveZ * speed * dt;

  // Building collision
  if (buildings) {
    const hit = getBuildingCollisions(buildings, newX, newZ, 0.5);
    if (!hit) {
      player.x = newX;
      player.z = newZ;
    }
  } else {
    player.x = newX;
    player.z = newZ;
  }

  // Jump
  if ((wasPressed('Space')) && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }

  // Gravity
  player.vy -= GRAVITY * dt;
  player.y += player.vy * dt;
  if (player.y <= 0.1) {
    player.y = 0.1;
    player.vy = 0;
    player.onGround = true;
  }

  // Bounds
  const BOUND = 390;
  player.x = Math.max(-BOUND, Math.min(BOUND, player.x));
  player.z = Math.max(-BOUND, Math.min(BOUND, player.z));

  // Update mesh
  if (player.mesh) {
    player.mesh.position.set(player.x, player.y, player.z);
    player.mesh.rotation.y = player.angle;

    // Simple walk animation — bob legs
    if (len > 0) {
      const bobSpeed = player.running ? 12 : 8;
      const bob = Math.sin(performance.now() / 1000 * bobSpeed) * 0.15;
      const leftLeg = player.mesh.children[7]; // leg
      const rightLeg = player.mesh.children[9]; // leg
      if (leftLeg) leftLeg.rotation.x = bob;
      if (rightLeg) rightLeg.rotation.x = -bob;
      // Arms swing
      const leftArm = player.mesh.children[4];
      const rightArm = player.mesh.children[5];
      if (leftArm) leftArm.rotation.x = -bob * 0.7;
      if (rightArm) rightArm.rotation.x = bob * 0.7;
    }
  }
}
