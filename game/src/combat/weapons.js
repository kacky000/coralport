/* Weapons system — fists, pistol, SMG with muzzle flash and hit effects */
import * as THREE from 'three';
import { isMouseDown, isRightDown, wasPressed } from '../core/input.js';
import { scareNearbyPeds } from '../peds/pedestrians.js';

export const WEAPONS = [
  { name: 'Fists', damage: 10, range: 2.5, rate: 0.4, ammo: Infinity, auto: false, icon: '👊' },
  { name: 'Pistol', damage: 25, range: 80, rate: 0.3, ammo: 60, auto: false, icon: '🔫' },
  { name: 'SMG', damage: 15, range: 60, rate: 0.08, ammo: 120, auto: true, icon: '🔫' },
];

export function createWeaponState() {
  return {
    currentIndex: 0,
    ammo: [Infinity, 60, 120],
    fireTimer: 0,
    muzzleFlash: null,
  };
}

export function updateWeapons(weaponState, dt, playerPos, playerAngle, scene, gameState) {
  weaponState.fireTimer -= dt;

  // Weapon switching with scroll or 1-3 keys
  if (wasPressed('Digit1')) weaponState.currentIndex = 0;
  if (wasPressed('Digit2') && weaponState.ammo[1] > 0) weaponState.currentIndex = 1;
  if (wasPressed('Digit3') && weaponState.ammo[2] > 0) weaponState.currentIndex = 2;

  const weapon = WEAPONS[weaponState.currentIndex];

  // Firing
  const shouldFire = weapon.auto ? isMouseDown() : wasPressed('click');
  if (isMouseDown() && weaponState.fireTimer <= 0 && weaponState.ammo[weaponState.currentIndex] > 0) {
    fire(weaponState, playerPos, playerAngle, scene, gameState);
  }

  // Update muzzle flash
  if (weaponState.muzzleFlash) {
    weaponState.muzzleFlash.timer -= dt;
    if (weaponState.muzzleFlash.timer <= 0) {
      scene.remove(weaponState.muzzleFlash.mesh);
      weaponState.muzzleFlash = null;
    }
  }
}

function fire(weaponState, playerPos, playerAngle, scene, gameState) {
  const weapon = WEAPONS[weaponState.currentIndex];
  weaponState.fireTimer = weapon.rate;

  if (weapon.ammo !== Infinity) {
    weaponState.ammo[weaponState.currentIndex]--;
  }

  if (weaponState.currentIndex === 0) {
    // Fists — melee
    return;
  }

  // Muzzle flash
  const flashGeo = new THREE.SphereGeometry(0.3, 6, 6);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  const fwd = new THREE.Vector3(Math.sin(playerAngle), 0, Math.cos(playerAngle));
  flash.position.set(
    playerPos.x + fwd.x * 1.2,
    playerPos.y + 1.2,
    playerPos.z + fwd.z * 1.2
  );
  scene.add(flash);
  weaponState.muzzleFlash = { mesh: flash, timer: 0.05 };

  // Hit effect at range
  const hitPos = new THREE.Vector3(
    playerPos.x + fwd.x * weapon.range * 0.8,
    0.5,
    playerPos.z + fwd.z * weapon.range * 0.8
  );
  createHitEffect(scene, hitPos);

  // Increase wanted level for shooting
  if (!gameState.wantedCooldown) {
    if (gameState.wantedLevel < 2) gameState.wantedLevel = 2;
    gameState.wantedCooldown = 3;
  }

  // Scare peds
  if (gameState.pedSystem) {
    scareNearbyPeds(gameState.pedSystem, playerPos.x, playerPos.z, 40);
  }
}

function createHitEffect(scene, pos) {
  const particles = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0xffcc44 })
    );
    p.position.copy(pos).add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      Math.random() * 0.5,
      (Math.random() - 0.5) * 0.5
    ));
    particles.add(p);
  }
  scene.add(particles);
  setTimeout(() => scene.remove(particles), 100);
}

export function getCurrentWeapon(weaponState) {
  return WEAPONS[weaponState.currentIndex];
}

export function getAmmo(weaponState) {
  return weaponState.ammo[weaponState.currentIndex];
}
