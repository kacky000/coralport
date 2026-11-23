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
  // Police chase along a boulevard: player in a red car, 4 wanted stars,
  // police cars with sirens chasing, buildings framing the road
  // Road at z = -192 (horizontal), camera looks along it eastward
  const roadZ = -192;
  gs.player.x = 10;
  gs.player.z = roadZ;
  gs.inVehicle = true;
  gs.wantedLevel = 4;
  gs.player.money = 3200;

  // Player's car — red, driving east along the road
  const playerCar = createCarModel(0);
  playerCar.position.set(10, 0.3, roadZ - 2);
  playerCar.rotation.y = Math.PI / 2;
  scene.add(playerCar);

  // Police car 1 — close behind
  const cop1 = createPoliceCarModel();
  cop1.position.set(-4, 0.3, roadZ - 2);
  cop1.rotation.y = Math.PI / 2 + 0.05;
  scene.add(cop1);

  // Police car 2 — beside cop1
  const cop2 = createPoliceCarModel();
  cop2.position.set(-6, 0.3, roadZ + 2);
  cop2.rotation.y = Math.PI / 2 - 0.03;
  scene.add(cop2);

  // Police car 3 — further back
  const cop3 = createPoliceCarModel();
  cop3.position.set(-18, 0.3, roadZ - 1);
  cop3.rotation.y = Math.PI / 2 + 0.08;
  scene.add(cop3);

  // Traffic: a car swerving out of the way
  const traf1 = createCarModel(3);
  traf1.position.set(25, 0.3, roadZ + 3);
  traf1.rotation.y = -Math.PI / 2 - 0.3;
  scene.add(traf1);

  // Another car ahead
  const traf2 = createCarModel(7);
  traf2.position.set(40, 0.3, roadZ + 2);
  traf2.rotation.y = -Math.PI / 2;
  scene.add(traf2);

  // Camera: behind and slightly above the chase, looking forward along the road
  setCameraForShot(camera,
    new THREE.Vector3(-10, 6, roadZ + 8),
    new THREE.Vector3(15, 1.0, roadZ - 2)
  );

  gs.missionSystem.objectiveText = 'Escape the police! Lose your wanted level.';
  gs.missionSystem.dialogueSpeaker = '';
  gs.missionSystem.dialogueText = '';

  // Siren lights on
  for (const cop of [cop1, cop2, cop3]) {
    const red = cop.getObjectByName('sirenRed');
    const blue = cop.getObjectByName('sirenBlue');
    if (red) red.material.color.setHex(0xff0000);
    if (blue) blue.material.color.setHex(0x0066ff);
  }

  gs.currentVehicle = { x: 10, z: roadZ, speed: 28, angle: Math.PI / 2 };
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
  // Combat/shootout at the harbor district with cranes visible, HUD showing weapon
  gs.player.x = 250;
  gs.player.z = -210;
  gs.inVehicle = false;
  gs.wantedLevel = 2;
  gs.player.money = 1800;

  // Player figure aiming forward
  const playerFig = createPlayerModel();
  playerFig.position.set(250, 0, -210);
  playerFig.rotation.y = Math.PI * 0.6;
  scene.add(playerFig);
  gs.player.mesh.visible = false;

  // Muzzle flash
  const flashGeo = new THREE.SphereGeometry(0.25, 8, 8);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.set(250.5, 1.3, -209.4);
  scene.add(flash);

  // Impact sparks in the distance
  for (let i = 0; i < 4; i++) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0xffcc44 })
    );
    spark.position.set(255 + Math.random() * 3, 0.3 + Math.random() * 1, -215 + Math.random() * 2);
    scene.add(spark);
  }

  // Cars as cover — crashed and angled
  const cover1 = createCarModel(5);
  cover1.position.set(246, 0.3, -207);
  cover1.rotation.y = 0.8;
  cover1.rotation.z = 0.05;
  scene.add(cover1);

  const cover2 = createCarModel(8);
  cover2.position.set(255, 0.3, -215);
  cover2.rotation.y = -0.4;
  scene.add(cover2);

  // Police car parked nearby
  const cop = createPoliceCarModel();
  cop.position.set(243, 0.3, -204);
  cop.rotation.y = 1.2;
  scene.add(cop);

  setCameraForShot(camera,
    new THREE.Vector3(244, 3.5, -205),
    new THREE.Vector3(253, 1.2, -212)
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
