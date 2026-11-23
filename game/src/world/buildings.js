/* Procedural buildings for Coralport — glass towers, low-rises, warehouses, beach shops */
import * as THREE from 'three';
import { CITY_SIZE, HALF, BLOCK_SIZE, ROAD_WIDTH, CELL, getDistrict, DISTRICTS, mulberry32, getBuildingHeight } from './cityLayout.js';

function makeCanvasTexture(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function buildingTexture(baseColor, windowColor, floors, columns) {
  return makeCanvasTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);
    const floorH = h / floors;
    const colW = w / columns;
    ctx.fillStyle = windowColor;
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < columns; c++) {
        const wx = c * colW + colW * 0.15;
        const wy = f * floorH + floorH * 0.2;
        const ww = colW * 0.7;
        const wh = floorH * 0.55;
        ctx.fillRect(wx, wy, ww, wh);
      }
    }
  });
}

function emissiveWindowTexture(baseColor, windowColor, floors, columns) {
  return makeCanvasTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    const floorH = h / floors;
    const colW = w / columns;
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < columns; c++) {
        const lit = Math.random() > 0.3;
        ctx.fillStyle = lit ? windowColor : '#111111';
        const wx = c * colW + colW * 0.15;
        const wy = f * floorH + floorH * 0.2;
        ctx.fillRect(wx, wy, colW * 0.7, floorH * 0.55);
      }
    }
  });
}

const materialCache = {};
function getDistrictMaterial(districtName, height, seed) {
  const rng = mulberry32(seed * 7 + 13);
  let baseColor, windowColor, floors, columns;

  if (districtName === 'Downtown') {
    const blues = ['#445566', '#3a4f66', '#4a5570', '#384858'];
    baseColor = blues[Math.floor(rng() * blues.length)];
    windowColor = rng() > 0.5 ? '#88bbee' : '#aaddff';
    floors = Math.max(4, Math.floor(height / 3.5));
    columns = 4 + Math.floor(rng() * 4);
  } else if (districtName === 'Harbor District') {
    const grays = ['#665544', '#776655', '#887766', '#554433'];
    baseColor = grays[Math.floor(rng() * grays.length)];
    windowColor = '#998866';
    floors = Math.max(2, Math.floor(height / 4));
    columns = 3 + Math.floor(rng() * 3);
  } else if (districtName === 'Canal District') {
    const warm = ['#aa8866', '#bb9977', '#cc9988', '#997755'];
    baseColor = warm[Math.floor(rng() * warm.length)];
    windowColor = '#ddbb88';
    floors = Math.max(2, Math.floor(height / 3));
    columns = 3 + Math.floor(rng() * 2);
  } else if (districtName === 'Coral Heights') {
    const whites = ['#ddccbb', '#ccbbaa', '#eeddcc', '#bbaa99'];
    baseColor = whites[Math.floor(rng() * whites.length)];
    windowColor = '#aaccdd';
    floors = Math.max(1, Math.floor(height / 3));
    columns = 2 + Math.floor(rng() * 3);
  } else {
    // Palm Beach
    const tropical = ['#eeddbb', '#ffeecc', '#ddccaa', '#ccbb99'];
    baseColor = tropical[Math.floor(rng() * tropical.length)];
    windowColor = '#88ddee';
    floors = Math.max(1, Math.floor(height / 3));
    columns = 2 + Math.floor(rng() * 2);
  }

  const tex = buildingTexture(baseColor, windowColor, floors, columns);
  const emTex = emissiveWindowTexture(baseColor, windowColor, floors, columns);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissiveMap: emTex,
    emissive: new THREE.Color(0xffeebb),
    emissiveIntensity: 0.3,
    roughness: 0.7,
    metalness: districtName === 'Downtown' ? 0.4 : 0.1,
  });
  return mat;
}

export function createBuildings(scene) {
  const buildingGroup = new THREE.Group();
  const buildings = []; // collision data
  let seed = 42;

  for (let bx = -HALF + ROAD_WIDTH; bx < HALF - ROAD_WIDTH; bx += CELL) {
    for (let bz = -HALF + ROAD_WIDTH; bz < HALF - ROAD_WIDTH; bz += CELL) {
      const cx = bx + BLOCK_SIZE / 2;
      const cz = bz + BLOCK_SIZE / 2;

      // Skip water area (south of beach)
      if (cz < -HALF + 30) continue;

      const district = getDistrict(cx, cz);
      seed++;
      const rng = mulberry32(seed);

      // Some blocks are open space (parks, lots)
      if (rng() < 0.15) continue;

      const numBuildings = district === DISTRICTS.downtown ? 1 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 3);

      for (let i = 0; i < numBuildings; i++) {
        seed++;
        const h = getBuildingHeight(cx, cz, seed);
        const rng2 = mulberry32(seed + i * 100);
        const w = 6 + rng2() * (BLOCK_SIZE / numBuildings - 8);
        const d = 6 + rng2() * (BLOCK_SIZE / numBuildings - 8);
        const ox = (i - (numBuildings - 1) / 2) * (BLOCK_SIZE / numBuildings);

        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = getDistrictMaterial(district.name, h, seed);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cx + ox, h / 2, cz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        buildingGroup.add(mesh);

        buildings.push({
          x: cx + ox, z: cz,
          halfW: w / 2 + 0.5, halfD: d / 2 + 0.5,
          height: h,
        });

        // Rooftop details for tall buildings
        if (h > 20 && rng2() > 0.4) {
          const antGeo = new THREE.CylinderGeometry(0.1, 0.15, 3, 6);
          const antMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
          const ant = new THREE.Mesh(antGeo, antMat);
          ant.position.set(cx + ox + rng2() * 2, h + 1.5, cz + rng2() * 2);
          buildingGroup.add(ant);
        }

        // AC units on rooftops
        if (h > 10) {
          const acGeo = new THREE.BoxGeometry(1.5, 0.8, 1.5);
          const acMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.3 });
          for (let a = 0; a < 2; a++) {
            const ac = new THREE.Mesh(acGeo, acMat);
            ac.position.set(cx + ox - w / 3 + a * w / 2, h + 0.4, cz - d / 3);
            buildingGroup.add(ac);
          }
        }
      }
    }
  }

  scene.add(buildingGroup);
  return { buildingGroup, buildings };
}

// Check collision with buildings
export function checkBuildingCollision(x, z, radius) {
  return null; // Will be populated after buildings are created
}

export function getBuildingCollisions(buildings, x, z, radius) {
  for (const b of buildings) {
    const dx = Math.abs(x - b.x) - b.halfW;
    const dz = Math.abs(z - b.z) - b.halfD;
    if (dx < radius && dz < radius) {
      return b;
    }
  }
  return null;
}
