/* Atmospheric effects — golden dust particles, lens flare hints, light shafts */
import * as THREE from 'three';

export function createAtmosphere(scene) {
  // Floating dust particles lit by golden hour sun — visible specks in the air
  const dustCount = 300;
  const dustGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(dustCount * 3);
  const sizes = new Float32Array(dustCount);

  for (let i = 0; i < dustCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = 1 + Math.random() * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    sizes[i] = 0.08 + Math.random() * 0.15;
  }

  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  dustGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const dustMat = new THREE.PointsMaterial({
    color: 0xffddaa,
    size: 0.15,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
  });

  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  return { dust, positions };
}

export function updateAtmosphere(atmo, playerX, playerZ, time) {
  // Move dust particles to follow the player
  const positions = atmo.dust.geometry.attributes.position.array;
  for (let i = 0; i < positions.length / 3; i++) {
    // Slow floating drift
    positions[i * 3 + 1] += Math.sin(time + i * 0.3) * 0.003;

    // Keep particles near the player
    const dx = positions[i * 3] - playerX;
    const dz = positions[i * 3 + 2] - playerZ;
    if (Math.abs(dx) > 100) positions[i * 3] = playerX + (Math.random() - 0.5) * 200;
    if (Math.abs(dz) > 100) positions[i * 3 + 2] = playerZ + (Math.random() - 0.5) * 200;
  }
  atmo.dust.geometry.attributes.position.needsUpdate = true;
}
