/* City layout — defines the grid, districts, block types for Coralport.
   The city is roughly 800x800 units centered at origin, with a coastline to the south.
   Districts: Palm Beach (south), Downtown (center), Harbor (east), Canal District (west), Coral Heights (north hills). */
import * as THREE from 'three';

export const CITY_SIZE = 800;
export const HALF = CITY_SIZE / 2;
export const BLOCK_SIZE = 40;
export const ROAD_WIDTH = 12;
export const CELL = BLOCK_SIZE + ROAD_WIDTH;

// District definitions
export const DISTRICTS = {
  palmBeach: { name: 'Palm Beach', color: '#f4c542', zMin: -HALF, zMax: -HALF + 200, xMin: -HALF, xMax: HALF },
  downtown: { name: 'Downtown', color: '#5588cc', zMin: -HALF + 200, zMax: -HALF + 450, xMin: -120, xMax: 180 },
  harbor: { name: 'Harbor District', color: '#cc7744', zMin: -HALF + 150, zMax: -HALF + 400, xMin: 180, xMax: HALF },
  canal: { name: 'Canal District', color: '#44aa88', zMin: -HALF + 150, zMax: -HALF + 400, xMin: -HALF, xMax: -120 },
  coralHeights: { name: 'Coral Heights', color: '#aa66cc', zMin: -HALF + 400, zMax: HALF, xMin: -HALF, xMax: HALF },
};

export function getDistrict(x, z) {
  if (z < -HALF + 200) return DISTRICTS.palmBeach;
  if (z >= -HALF + 400) return DISTRICTS.coralHeights;
  if (x > 180) return DISTRICTS.harbor;
  if (x < -120) return DISTRICTS.canal;
  return DISTRICTS.downtown;
}

export function getDistrictName(x, z) {
  return getDistrict(x, z).name;
}

// Generate road grid intersections
export function generateRoadGrid() {
  const roads = { horizontal: [], vertical: [] };
  for (let z = -HALF; z <= HALF; z += CELL) {
    roads.horizontal.push(z);
  }
  for (let x = -HALF; x <= HALF; x += CELL) {
    roads.vertical.push(x);
  }
  return roads;
}

// Is position on a road?
export function isOnRoad(x, z) {
  const roads = generateRoadGrid();
  for (const rz of roads.horizontal) {
    if (Math.abs(z - rz) < ROAD_WIDTH / 2) return true;
  }
  for (const rx of roads.vertical) {
    if (Math.abs(x - rx) < ROAD_WIDTH / 2) return true;
  }
  return false;
}

// Get nearest road position for spawning
export function nearestRoadPos(x, z) {
  const roads = generateRoadGrid();
  let bestDist = Infinity, bestX = x, bestZ = z;
  for (const rz of roads.horizontal) {
    const d = Math.abs(z - rz);
    if (d < bestDist) { bestDist = d; bestX = x; bestZ = rz; }
  }
  for (const rx of roads.vertical) {
    const d = Math.abs(x - rx);
    if (d < bestDist) { bestDist = d; bestX = rx; bestZ = z; }
  }
  return { x: bestX, z: bestZ };
}

// Get building height based on district
export function getBuildingHeight(x, z, seed) {
  const dist = getDistrict(x, z);
  const rng = mulberry32(seed);
  if (dist === DISTRICTS.downtown) return 15 + rng() * 55;
  if (dist === DISTRICTS.harbor) return 6 + rng() * 14;
  if (dist === DISTRICTS.canal) return 8 + rng() * 18;
  if (dist === DISTRICTS.coralHeights) return 4 + rng() * 10;
  return 3 + rng() * 8; // Palm Beach - low buildings
}

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export { mulberry32 };
