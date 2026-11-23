/* Coralport — main game entry point. An original open-world crime game set in the sunny
   coastal city of Coralport. Built with three.js, procedural geometry and WebAudio. */
import * as THREE from 'three';

import { initInput, isDown, wasPressed, endFrame, isPointerLocked } from './core/input.js';
import { updateCamera, resetCamera, getYaw, setYaw } from './core/camera.js';
import { startLoop } from './core/gameLoop.js';

import { getDistrictName, HALF, generateRoadGrid } from './world/cityLayout.js';
import { createRoads, createTrafficLights, updateTrafficLights } from './world/roads.js';
import { createBuildings, getBuildingCollisions } from './world/buildings.js';
import { createProps } from './world/props.js';
import { createWater, updateWater } from './world/water.js';
import { createSky, createLighting } from './world/sky.js';
import { createTerrain } from './world/terrain.js';
import { createAtmosphere, updateAtmosphere } from './world/atmosphere.js';

import { createCarModel } from './vehicles/vehicle.js';
import { createCarState, updateCarPhysics, MAX_SPEED } from './vehicles/carPhysics.js';
import { emitDriftSmoke, updateEffects } from './vehicles/effects.js';

import { createPlayerModel, createPlayerState, updatePlayerOnFoot } from './player/playerOnFoot.js';
import { handleEnterExit, getEnterPrompt } from './player/enterExitVehicle.js';

import { createTrafficSystem, updateTraffic, getAllVehicles } from './traffic/trafficSystem.js';
import { createPedestrianSystem, updatePedestrians } from './peds/pedestrians.js';

import { createWantedState, updateWantedLevel } from './police/wantedLevel.js';
import { createPoliceSystem, updatePolice, getPoliceCarPositions } from './police/policeAI.js';

import { WEAPONS, createWeaponState, updateWeapons, getCurrentWeapon, getAmmo } from './combat/weapons.js';
import { createMissionSystem, updateMissions, updateMissionMarkers } from './missions/missionManager.js';
import { setupStoryMissions, checkMissionTriggers, getNextMissionLocation } from './missions/storyMissions.js';

import { createHUD, updateHUD, hideHUD, showHUD } from './ui/hud.js';
import { createMinimap, updateMinimap, createFullMap } from './ui/minimap.js';
import { createMenus, showPauseMenu, showPhoneScreen, showGameOver, hideMenu, isMenuOpen, getMenuState } from './ui/menus.js';
import { saveGame, loadGame, hasSave, applySave } from './ui/saveLoad.js';

import { initAudio, resumeAudio, playGunshot, playEngineLoop, playSiren, playImpact } from './audio/sfx.js';
import { startRadio, stopRadio, getStationName, switchStation } from './audio/radio.js';

import { isScreenshotMode, getShotName, setupShot } from './shots.js';

/* ---- Setup Three.js ---- */
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.5, 600);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---- Build World ---- */
const loadBar = document.getElementById('load-bar');
function setLoad(pct) { if (loadBar) loadBar.style.width = pct + '%'; }

setLoad(10);
createTerrain(scene);
setLoad(20);
const { roadGroup, roads } = createRoads(scene);
setLoad(30);
const trafficLights = createTrafficLights(scene, roads);
setLoad(40);
const { buildingGroup, buildings } = createBuildings(scene);
setLoad(50);
createProps(scene);
setLoad(60);
const waterObj = createWater(scene);
setLoad(70);
createSky(scene);
const lighting = createLighting(scene);
const atmosphere = createAtmosphere(scene);
setLoad(80);

/* ---- Player ---- */
const player = createPlayerState();
const playerMesh = createPlayerModel();
playerMesh.position.set(player.x, player.y, player.z);
scene.add(playerMesh);
player.mesh = playerMesh;

/* ---- Spawn some driveable cars ---- */
const spawnedCars = [];
const carSpawnPositions = [
  { x: 10, z: -120, angle: 0 },
  { x: -60, z: -180, angle: Math.PI / 2 },
  { x: 100, z: -100, angle: Math.PI },
  { x: -30, z: -60, angle: 0 },
  { x: 200, z: -200, angle: Math.PI / 4 },
  { x: -150, z: -120, angle: Math.PI },
  { x: 50, z: 50, angle: Math.PI / 2 },
  { x: -80, z: 100, angle: 0 },
  // More cars throughout the city
  { x: -200, z: -250, angle: Math.PI / 3 },
  { x: 150, z: -50, angle: 0 },
  { x: -100, z: 50, angle: Math.PI },
  { x: 250, z: -100, angle: Math.PI / 2 },
  { x: 0, z: -250, angle: Math.PI / 4 },
  { x: -180, z: 0, angle: 0 },
  { x: 80, z: 150, angle: Math.PI },
  { x: 300, z: -180, angle: Math.PI / 2 },
];
for (let i = 0; i < carSpawnPositions.length; i++) {
  const sp = carSpawnPositions[i];
  const mesh = createCarModel(i);
  mesh.position.set(sp.x, 0.3, sp.z);
  mesh.rotation.y = sp.angle;
  scene.add(mesh);
  const carState = createCarState();
  carState.x = sp.x; carState.z = sp.z; carState.angle = sp.angle;
  carState.mesh = mesh;
  carState.isPolice = false;
  carState.isPlayerOwned = false;
  spawnedCars.push(carState);
}

/* ---- Systems ---- */
const trafficSystem = createTrafficSystem(scene);
const pedSystem = createPedestrianSystem(scene);
const policeSystem = createPoliceSystem(scene);
const weaponState = createWeaponState();
const wantedState = createWantedState();
const missionSystem = createMissionSystem();
const missionMarkers = setupStoryMissions(missionSystem, scene);

setLoad(90);

/* ---- Game State ---- */
const gameState = {
  player,
  inVehicle: false,
  currentVehicle: null,
  allVehicles: [...spawnedCars, ...getAllVehicles(trafficSystem)],
  wantedLevel: 0,
  wantedTimer: 0,
  wantedCooldown: 0,
  wanted: wantedState,
  weaponState,
  weapons: WEAPONS,
  missionSystem,
  pedSystem,
  policeSystem,
  districtName: 'Palm Beach',
  promptText: null,
  paused: false,
  gameStarted: false,
  time: 0,
  showPhone: false,
};

/* ---- UI ---- */
initInput(canvas);
createHUD();
createMinimap();
hideHUD();

initAudio();

let fullMapCanvas = null;

/* ---- Save/Load ---- */
window.__saveGame = () => saveGame(gameState);
window.__respawnPlayer = () => {
  player.x = 0; player.z = -100; player.y = 0.1;
  player.health = 100;
  gameState.wantedLevel = 0;
  gameState.inVehicle = false;
  gameState.currentVehicle = null;
  player.mesh.visible = true;
  gameState.gameStarted = true;
  hideMenu();
  showHUD();
};

createMenus({
  onStart: (fromSave) => {
    gameState.gameStarted = true;
    gameState.paused = false;
    showHUD();
    resumeAudio();
    if (!fromSave) {
      player.x = 0; player.z = -100; player.y = 0.1;
      player.health = 100; player.money = 500;
      missionSystem.completedIds.clear();
    }
  },
  onLoad: () => {
    const save = loadGame();
    if (save) {
      applySave(save, gameState);
    }
    gameState.gameStarted = true;
    gameState.paused = false;
    showHUD();
    resumeAudio();
  },
  onResume: () => {
    gameState.paused = false;
    showHUD();
  },
});

/* ---- Hide loading ---- */
setLoad(100);
setTimeout(() => {
  const loadEl = document.getElementById('loading');
  if (loadEl) loadEl.style.display = 'none';
}, 300);

/* ---- Screenshot Mode ---- */
if (isScreenshotMode()) {
  const shotName = getShotName();
  gameState.gameStarted = true;
  document.getElementById('loading').style.display = 'none';
  hideMenu();
  showHUD();

  // Set up a default car for the player if needed
  if (spawnedCars.length > 0) {
    gameState.currentVehicle = spawnedCars[0];
  }

  setupShot(shotName, camera, gameState, scene);

  // For the map shot, show phone overlay
  if (shotName === 'map') {
    fullMapCanvas = createFullMap();
    showPhoneScreen(fullMapCanvas, gameState);
  }

  // Update HUD for the shot
  updateHUD(gameState);
  updateMinimap(
    player.x, player.z, player.angle,
    gameState.wantedLevel,
    getPoliceCarPositions(policeSystem),
    getNextMissionLocation(missionSystem),
    gameState.inVehicle
  );

  // Update systems once to populate the scene
  updateTrafficLights(trafficLights, 5.0);
  updateTraffic(trafficSystem, 0.016, 5.0, player.x, player.z, scene);
  updatePedestrians(pedSystem, 0.016, 5.0, player.x, player.z, gameState.wantedLevel, scene);
  if (gameState.wantedLevel > 0) {
    updatePolice(policeSystem, 0.5, gameState.wantedLevel, player.x, player.z, 0, scene);
    updatePolice(policeSystem, 0.5, gameState.wantedLevel, player.x, player.z, 0, scene);
    updatePolice(policeSystem, 0.5, gameState.wantedLevel, player.x, player.z, 0, scene);
  }

  // Update shadow camera to follow player for the shot
  lighting.sun.target.position.set(player.x, 0, player.z);
  lighting.sun.position.copy(lighting.sunDir.clone().multiplyScalar(200).add(new THREE.Vector3(player.x, 0, player.z)));

  // Render the scene
  renderer.render(scene, camera);

  // For headless capture: blit WebGL canvas onto a 2D overlay so Chrome composites it
  const dataUrl = canvas.toDataURL('image/png');
  const overlay = document.createElement('img');
  overlay.src = dataUrl;
  overlay.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;';
  document.body.insertBefore(overlay, document.body.firstChild);
  // Re-draw HUD on top
  document.getElementById('ui-layer').style.zIndex = '10';
} else {
  /* ---- Main Game Loop ---- */
  let engineSoundTimer = 0;
  let sirenSoundTimer = 0;

  startLoop(
    // Update
    (dt) => {
      if (!gameState.gameStarted || gameState.paused) return;
      if (isMenuOpen()) return;

      gameState.time += dt;
      const time = gameState.time;

      // Pause
      if (wasPressed('Escape')) {
        gameState.paused = true;
        showPauseMenu();
        endFrame();
        return;
      }

      // Phone/map toggle
      if (wasPressed('KeyM') || wasPressed('KeyP')) {
        if (getMenuState() === 'phone') {
          hideMenu();
          gameState.showPhone = false;
        } else if (!isMenuOpen()) {
          if (!fullMapCanvas) fullMapCanvas = createFullMap();
          showPhoneScreen(fullMapCanvas, gameState);
          gameState.showPhone = true;
          endFrame();
          return;
        }
      }

      // Wanted cooldown
      if (gameState.wantedCooldown > 0) gameState.wantedCooldown -= dt;

      // Player update
      if (gameState.inVehicle && gameState.currentVehicle) {
        const car = gameState.currentVehicle;
        const accel = isDown('KeyW') || isDown('ArrowUp');
        const brake = isDown('KeyS') || isDown('ArrowDown');
        let steer = 0;
        if (isDown('KeyA') || isDown('ArrowLeft')) steer = 1;
        if (isDown('KeyD') || isDown('ArrowRight')) steer = -1;
        const handbrake = isDown('Space');

        updateCarPhysics(car, accel, brake, steer, handbrake, dt, buildings);
        player.x = car.x;
        player.z = car.z;
        player.y = car.y;

        // Engine sound
        engineSoundTimer -= dt;
        if (engineSoundTimer <= 0) {
          playEngineLoop(car.speed);
          engineSoundTimer = 0.08;
        }

        // Drift effects
        if (car.drifting && Math.abs(car.speed) > 8) {
          emitDriftSmoke(scene, car);
        }

        // Radio
        if (wasPressed('KeyR')) switchStation();
      } else {
        updatePlayerOnFoot(player, dt, buildings);
        // Weapons (only on foot)
        updateWeapons(weaponState, dt,
          new THREE.Vector3(player.x, player.y, player.z),
          player.angle, scene, gameState);
      }

      // Enter/exit vehicle
      handleEnterExit(gameState);
      gameState.promptText = getEnterPrompt(player.x, player.z, gameState.allVehicles, gameState.inVehicle);
      if (gameState.inVehicle) {
        gameState.promptText = `Press F to exit · R switch radio (${getStationName()})`;
      }

      // Traffic
      updateTraffic(trafficSystem, dt, time, player.x, player.z, scene);
      updateTrafficLights(trafficLights, time);

      // Pedestrians
      updatePedestrians(pedSystem, dt, time, player.x, player.z, gameState.wantedLevel, scene);

      // Police
      updatePolice(policeSystem, dt, gameState.wantedLevel, player.x, player.z,
        gameState.currentVehicle?.speed || 0, scene);

      // Wanted level
      updateWantedLevel(wantedState, player.x, player.z, getPoliceCarPositions(policeSystem), dt, false);
      wantedState.level = gameState.wantedLevel;
      gameState.wanted = wantedState;

      // Escape mechanic: if no police nearby for a while, reduce wanted level
      if (gameState.wantedLevel > 0 && !wantedState.inSearchRadius) {
        gameState.wantedTimer += dt;
        if (gameState.wantedTimer > 15) {
          gameState.wantedLevel = Math.max(0, gameState.wantedLevel - 1);
          gameState.wantedTimer = 0;
        }
      } else {
        gameState.wantedTimer = 0;
      }

      // Siren sound
      if (gameState.wantedLevel > 0) {
        sirenSoundTimer -= dt;
        if (sirenSoundTimer <= 0) {
          playSiren();
          sirenSoundTimer = 1.2;
        }
      }

      // Missions
      checkMissionTriggers(missionSystem, gameState);
      updateMissions(missionSystem, dt, gameState);
      updateMissionMarkers(missionMarkers, time);

      // District name
      gameState.districtName = getDistrictName(player.x, player.z);

      // Vehicle effects
      updateEffects(dt, scene);

      // Player death
      if (player.health <= 0) {
        showGameOver();
        gameState.gameStarted = false;
      }

      // Shadow follow
      lighting.sun.target.position.set(player.x, 0, player.z);
      lighting.sun.position.copy(lighting.sunDir.clone().multiplyScalar(200).add(new THREE.Vector3(player.x, 0, player.z)));

      endFrame();
    },

    // Render
    (dt) => {
      if (!gameState.gameStarted && !isScreenshotMode()) {
        renderer.render(scene, camera);
        return;
      }

      // Camera
      if (!isMenuOpen() || gameState.showPhone) {
        const targetPos = new THREE.Vector3(player.x, player.y, player.z);
        updateCamera(camera, targetPos, gameState.inVehicle, dt,
          gameState.currentVehicle?.angle);
      }

      // Water animation
      updateWater(waterObj, gameState.time);

      // Atmospheric particles
      updateAtmosphere(atmosphere, player.x, player.z, gameState.time);

      // Render scene
      renderer.render(scene, camera);

      // HUD
      if (!isMenuOpen()) {
        updateHUD(gameState);
        updateMinimap(
          player.x, player.z, player.angle,
          gameState.wantedLevel,
          getPoliceCarPositions(policeSystem),
          getNextMissionLocation(missionSystem),
          gameState.inVehicle
        );
      }
    }
  );
}
