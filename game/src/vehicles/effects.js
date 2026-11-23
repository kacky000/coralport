/* Vehicle visual effects — tire smoke, skid marks, dust, sparks */
import * as THREE from 'three';

const skidMarks = [];
const MAX_SKID = 200;

const smokeMat = new THREE.MeshBasicMaterial({
  color: 0xcccccc,
  transparent: true,
  opacity: 0.4,
});

export function spawnTireSmoke(scene, x, y, z) {
  const size = 0.3 + Math.random() * 0.4;
  const geo = new THREE.SphereGeometry(size, 6, 6);
  const puff = new THREE.Mesh(geo, smokeMat.clone());
  puff.position.set(x + (Math.random() - 0.5) * 0.5, y + 0.2, z + (Math.random() - 0.5) * 0.5);
  scene.add(puff);

  return {
    mesh: puff,
    life: 0.6,
    vy: 0.8 + Math.random() * 0.5,
    scale: size,
  };
}

export function addSkidMark(scene, x, z, angle) {
  if (skidMarks.length >= MAX_SKID) {
    const old = skidMarks.shift();
    scene.remove(old);
  }
  const geo = new THREE.PlaneGeometry(0.3, 1.5);
  const mat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.6 });
  const mark = new THREE.Mesh(geo, mat);
  mark.rotation.x = -Math.PI / 2;
  mark.rotation.z = angle;
  mark.position.set(x, 0.03, z);
  scene.add(mark);
  skidMarks.push(mark);
}

const activeSmoke = [];

export function updateEffects(dt, scene) {
  for (let i = activeSmoke.length - 1; i >= 0; i--) {
    const p = activeSmoke[i];
    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      activeSmoke.splice(i, 1);
      continue;
    }
    p.mesh.position.y += p.vy * dt;
    p.mesh.scale.multiplyScalar(1 + dt * 2);
    p.mesh.material.opacity = p.life * 0.5;
  }
}

export function emitDriftSmoke(scene, car) {
  const rear1X = car.x - Math.sin(car.angle + 0.3) * 1.5;
  const rear1Z = car.z - Math.cos(car.angle + 0.3) * 1.5;
  const rear2X = car.x - Math.sin(car.angle - 0.3) * 1.5;
  const rear2Z = car.z - Math.cos(car.angle - 0.3) * 1.5;

  const s1 = spawnTireSmoke(scene, rear1X, 0.1, rear1Z);
  const s2 = spawnTireSmoke(scene, rear2X, 0.1, rear2Z);
  activeSmoke.push(s1, s2);

  addSkidMark(scene, rear1X, rear1Z, car.angle);
  addSkidMark(scene, rear2X, rear2Z, car.angle);
}
