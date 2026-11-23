/* Screenshot mode — sets up scripted scenes for deterministic screenshots.
   Activated by ?shot=<name>&seed=<n> in the URL.
   Each shot sets camera, scene state, and renders one frame. */
import * as THREE from 'three';
import { setCameraForShot } from './core/camera.js';
import { createCarModel, createPoliceCarModel } from './vehicles/vehicle.js';
import { createPlayerModel } from './player/playerOnFoot.js';

export function isScreenshotMode() {
  const params = new URLSearchParams(window.location.search);
  return params.has('shot');
}

export function getShotName() {
  return new URLSearchParams(window.location.search).get('shot');
}

export function getSeed() {
  return parseInt(new URLSearchParams(window.location.search).get('seed') || '1');
}

export function setupShot(name, camera, gameState, scene) {
  window.__shotMode = true;

  switch (name) {
    case 'cover': return setupCoverShot(camera, gameState, scene);
    case 'onfoot': return setupOnFootShot(camera, gameState, scene);
    case 'combat': return setupCombatShot(camera, gameState, scene);
    case 'map': return setupMapShot(camera, gameState, scene);
    default: return setupCoverShot(camera, gameState, scene);
  }
}

function setupCoverShot(camera, gs, scene) {
  // Police chase on a sunny boulevard: player in a red car, 3+ wanted stars,
  // police cars with sirens chasing, traffic, full HUD with minimap and mission text
  gs.player.x = 10;
  gs.player.z = -150;
  gs.inVehicle = true;
  gs.wantedLevel = 4;
  gs.player.money = 3200;

  // Player's car — a red sports car speeding down the road
  const playerCar = createCarModel(0); // red
  playerCar.position.set(10, 0.3, -150);
  playerCar.rotation.y = -0.15;
  scene.add(playerCar);

  // Police car 1 — close behind
  const cop1 = createPoliceCarModel();
  cop1.position.set(0, 0.3, -135);
  cop1.rotation.y = -0.1;
  scene.add(cop1);

  // Police car 2 — further back, slightly offset
  const cop2 = createPoliceCarModel();
  cop2.position.set(18, 0.3, -128);
  cop2.rotation.y = -0.2;
  scene.add(cop2);

  // Police car 3 — coming from side street
  const cop3 = createPoliceCarModel();
  cop3.position.set(35, 0.3, -145);
  cop3.rotation.y = Math.PI / 2 + 0.3;
  scene.add(cop3);

  // Camera: dramatic chase angle behind and above
  setCameraForShot(camera,
    new THREE.Vector3(-2, 5.5, -138),
    new THREE.Vector3(14, 1.5, -155)
  );

  gs.missionSystem.objectiveText = 'Escape the police! Lose your wanted level.';
  gs.missionSystem.dialogueSpeaker = '';
  gs.missionSystem.dialogueText = '';

  // Activate siren lights on police cars
  for (const cop of [cop1, cop2, cop3]) {
    const red = cop.getObjectByName('sirenRed');
    const blue = cop.getObjectByName('sirenBlue');
    if (red) red.material.color.setHex(0xff0000);
    if (blue) blue.material.color.setHex(0x0066ff);
  }

  gs.currentVehicle = { x: 10, z: -150, speed: 28, angle: -0.15 };
}

function setupOnFootShot(camera, gs, scene) {
  // On foot on Palm Beach with pedestrians, traffic, mission marker and dialogue
  gs.player.x = 20;
  gs.player.z = -270;
  gs.inVehicle = false;
  gs.wantedLevel = 0;
  gs.player.money = 500;

  // Show player model
  const playerFig = createPlayerModel();
  playerFig.position.set(20, 0, -270);
  playerFig.rotation.y = Math.PI * 0.8;
  scene.add(playerFig);
  gs.player.mesh.visible = false;

  // Some parked cars along the road
  for (let i = 0; i < 4; i++) {
    const car = createCarModel(2 + i * 3);
    car.position.set(-10 + i * 25, 0.3, -265);
    car.rotation.y = Math.PI / 2;
    scene.add(car);
  }

  setCameraForShot(camera,
    new THREE.Vector3(12, 3.5, -263),
    new THREE.Vector3(24, 1.2, -273)
  );

  gs.missionSystem.objectiveText = 'Drive to the Sunset Shack on Palm Beach';
  gs.missionSystem.dialogueSpeaker = 'Lucia Vega';
  gs.missionSystem.dialogueText = "Marco! Welcome to Coralport — it's paradise, if you know the right people.";
  gs.missionSystem.dialogueTimer = 10;
}

function setupCombatShot(camera, gs, scene) {
  // Combat/shootout at the harbor with cranes visible, HUD showing weapon
  gs.player.x = 240;
  gs.player.z = -200;
  gs.inVehicle = false;
  gs.wantedLevel = 2;
  gs.player.money = 1800;

  // Player figure aiming
  const playerFig = createPlayerModel();
  playerFig.position.set(240, 0, -200);
  playerFig.rotation.y = Math.PI * 0.4;
  scene.add(playerFig);
  gs.player.mesh.visible = false;

  // Muzzle flash
  const flashGeo = new THREE.SphereGeometry(0.35, 8, 8);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.set(241, 1.3, -199.2);
  scene.add(flash);

  // Some cars as cover
  const cover1 = createCarModel(5);
  cover1.position.set(236, 0.3, -196);
  cover1.rotation.y = 0.5;
  scene.add(cover1);

  const cover2 = createCarModel(8);
  cover2.position.set(245, 0.3, -205);
  cover2.rotation.y = -0.8;
  scene.add(cover2);

  setCameraForShot(camera,
    new THREE.Vector3(233, 4, -194),
    new THREE.Vector3(243, 1.2, -203)
  );

  gs.missionSystem.objectiveText = 'Eliminate the rival crew at the docks';
  gs.weaponState.currentIndex = 1; // Pistol
}

function setupMapShot(camera, gs, scene) {
  // Map/phone screen showing city map with districts and mission list
  gs.player.x = 0;
  gs.player.z = -150;
  gs.inVehicle = false;
  gs.wantedLevel = 0;
  gs.player.money = 4200;

  // Camera: wide overhead view of the city
  setCameraForShot(camera,
    new THREE.Vector3(0, 80, -100),
    new THREE.Vector3(0, 0, -180)
  );

  gs.showPhone = true;
}
