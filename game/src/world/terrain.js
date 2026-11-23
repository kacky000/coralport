/* Ground terrain — flat city ground, beach sand, grass areas */
import * as THREE from 'three';
import { HALF } from './cityLayout.js';

function makeGroundTexture(color1, color2, size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color1;
  ctx.fillRect(0, 0, size, size);
  // Add noise/variation
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = color2;
    ctx.globalAlpha = 0.1 + Math.random() * 0.15;
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillRect(x, y, 2 + Math.random() * 4, 2 + Math.random() * 4);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(40, 40);
  return tex;
}

export function createTerrain(scene) {
  // Main ground
  const groundTex = makeGroundTexture('#4a6b3a', '#3a5a2a', 128);
  const groundGeo = new THREE.PlaneGeometry(HALF * 2 + 100, HALF * 2 + 100);
  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTex,
    roughness: 0.95,
    color: 0x557744,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  scene.add(ground);

  // Beach sand strip
  const sandTex = makeGroundTexture('#e8d5a8', '#d4c090', 64);
  sandTex.repeat.set(20, 4);
  const sandGeo = new THREE.PlaneGeometry(HALF * 2, 80);
  const sandMat = new THREE.MeshStandardMaterial({
    map: sandTex,
    roughness: 0.95,
    color: 0xeeddaa,
  });
  const sand = new THREE.Mesh(sandGeo, sandMat);
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, 0.01, -HALF + 10);
  sand.receiveShadow = true;
  scene.add(sand);

  // Sidewalks along roads — lighter concrete
  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x999988,
    roughness: 0.85,
  });

  return { ground, sand };
}
