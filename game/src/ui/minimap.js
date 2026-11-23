/* Minimap — rotates with camera, shows roads, player arrow, mission blips, police blips */
import { HALF, CELL, ROAD_WIDTH, generateRoadGrid } from '../world/cityLayout.js';

const MAP_SIZE = 160;
const MAP_SCALE = 0.18; // world units to pixels

let mapCanvas = null;
let mapCtx = null;
let bgCanvas = null;

export function createMinimap() {
  const ui = document.getElementById('ui-layer');
  const container = document.createElement('div');
  container.id = 'minimap-container';
  container.style.cssText = `
    position:absolute; bottom:16px; left:200px;
    width:${MAP_SIZE}px; height:${MAP_SIZE}px;
    border-radius:50%; overflow:hidden;
    border:3px solid rgba(255,255,255,0.3);
    box-shadow:0 2px 12px rgba(0,0,0,0.5);
  `;

  mapCanvas = document.createElement('canvas');
  mapCanvas.width = MAP_SIZE;
  mapCanvas.height = MAP_SIZE;
  mapCanvas.style.cssText = 'width:100%;height:100%;';
  container.appendChild(mapCanvas);
  ui.appendChild(container);
  mapCtx = mapCanvas.getContext('2d');

  // Pre-render background map
  bgCanvas = document.createElement('canvas');
  bgCanvas.width = 512;
  bgCanvas.height = 512;
  renderMapBackground();
}

function renderMapBackground() {
  const ctx = bgCanvas.getContext('2d');
  const scale = 512 / (HALF * 2);

  // Ground
  ctx.fillStyle = '#2a3a2a';
  ctx.fillRect(0, 0, 512, 512);

  // Water (south)
  ctx.fillStyle = '#1a2a3a';
  ctx.fillRect(0, 0, 512, 60 * scale);

  // Roads
  ctx.fillStyle = '#555555';
  const roads = generateRoadGrid();
  for (const rz of roads.horizontal) {
    const y = (rz + HALF) * scale;
    ctx.fillRect(0, y - ROAD_WIDTH * scale / 2, 512, ROAD_WIDTH * scale);
  }
  for (const rx of roads.vertical) {
    const x = (rx + HALF) * scale;
    ctx.fillRect(x - ROAD_WIDTH * scale / 2, 0, ROAD_WIDTH * scale, 512);
  }

  // Beach
  ctx.fillStyle = '#8a7a5a';
  ctx.fillRect(0, 25 * scale, 512, 40 * scale);
}

export function updateMinimap(playerX, playerZ, playerAngle, wantedLevel, policePositions, missionLocation, inVehicle) {
  if (!mapCtx) return;

  const ctx = mapCtx;
  const half = MAP_SIZE / 2;

  ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);

  // Clip to circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(half, half, half, 0, Math.PI * 2);
  ctx.clip();

  // Draw background centered on player
  const bgScale = 512 / (HALF * 2);
  const bgX = (playerX + HALF) * bgScale;
  const bgZ = (playerZ + HALF) * bgScale;
  const drawScale = MAP_SCALE * (1 / bgScale) * 512;

  ctx.drawImage(bgCanvas,
    bgX - half / MAP_SCALE, bgZ - half / MAP_SCALE,
    MAP_SIZE / MAP_SCALE, MAP_SIZE / MAP_SCALE,
    0, 0, MAP_SIZE, MAP_SIZE
  );

  // Mission blip
  if (missionLocation) {
    const mx = half + (missionLocation.x - playerX) * MAP_SCALE;
    const mz = half + (missionLocation.z - playerZ) * MAP_SCALE;
    if (mx > 0 && mx < MAP_SIZE && mz > 0 && mz < MAP_SIZE) {
      ctx.fillStyle = '#ffdd44';
      ctx.beginPath();
      ctx.arc(mx, mz, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Police blips
  if (wantedLevel > 0) {
    for (const cop of policePositions) {
      const cx = half + (cop.x - playerX) * MAP_SCALE;
      const cz = half + (cop.z - playerZ) * MAP_SCALE;
      if (cx > -10 && cx < MAP_SIZE + 10 && cz > -10 && cz < MAP_SIZE + 10) {
        ctx.fillStyle = '#4466ff';
        ctx.beginPath();
        ctx.arc(cx, cz, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Player arrow (always center)
  ctx.save();
  ctx.translate(half, half);
  ctx.rotate(playerAngle);
  ctx.fillStyle = inVehicle ? '#44ff44' : '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-4, 5);
  ctx.lineTo(4, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Compass
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', half, 12);

  ctx.restore();
}

export function createFullMap() {
  // Returns a larger version of the map for the phone/map screen
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bgCanvas, 0, 0);
  return canvas;
}
