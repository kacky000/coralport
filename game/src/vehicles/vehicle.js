/* Vehicle factory — creates procedural 3D car models for Coralport */
import * as THREE from 'three';

const CAR_COLORS = [
  0xcc2222, 0x2255cc, 0x22aa44, 0xdddd33,
  0xffffff, 0x222222, 0x888888, 0xdd6622,
  0xcc44aa, 0x44cccc, 0x6633aa, 0xaa8833,
];

export function createCarModel(colorIndex) {
  const group = new THREE.Group();
  const color = CAR_COLORS[colorIndex % CAR_COLORS.length];
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.6,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88aacc,
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.6,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffeecc });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });

  // Body
  const bodyGeo = new THREE.BoxGeometry(2.0, 0.7, 4.2);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.55;
  body.castShadow = true;
  group.add(body);

  // Cabin
  const cabinGeo = new THREE.BoxGeometry(1.7, 0.6, 2.2);
  const cabin = new THREE.Mesh(cabinGeo, bodyMat);
  cabin.position.set(0, 1.2, -0.2);
  cabin.castShadow = true;
  group.add(cabin);

  // Windshield
  const windGeo = new THREE.PlaneGeometry(1.5, 0.55);
  const wind = new THREE.Mesh(windGeo, glassMat);
  wind.position.set(0, 1.25, 0.9);
  wind.rotation.x = -0.3;
  group.add(wind);

  // Rear window
  const rearGeo = new THREE.PlaneGeometry(1.5, 0.5);
  const rear = new THREE.Mesh(rearGeo, glassMat);
  rear.position.set(0, 1.25, -1.3);
  rear.rotation.x = 0.3;
  group.add(rear);

  // Side windows
  for (const side of [-1, 1]) {
    const sideGeo = new THREE.PlaneGeometry(1.8, 0.45);
    const sideWin = new THREE.Mesh(sideGeo, glassMat);
    sideWin.position.set(side * 0.86, 1.25, -0.2);
    sideWin.rotation.y = side * Math.PI / 2;
    group.add(sideWin);
  }

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 12);
  const rimGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.26, 8);
  const wheelPositions = [
    [-0.85, 0.32, 1.3], [0.85, 0.32, 1.3],
    [-0.85, 0.32, -1.3], [0.85, 0.32, -1.3],
  ];
  for (const [wx, wy, wz] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, tireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, wy, wz);
    group.add(wheel);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(wx, wy, wz);
    group.add(rim);
  }

  // Headlights
  for (const side of [-0.65, 0.65]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), lightMat);
    hl.position.set(side, 0.6, 2.1);
    group.add(hl);
  }

  // Tail lights
  for (const side of [-0.7, 0.7]) {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.05), tailMat);
    tl.position.set(side, 0.6, -2.1);
    group.add(tl);
  }

  return group;
}

export function createPoliceCarModel() {
  const group = createCarModel(7); // white-ish base

  // Override body color to white/blue
  group.children[0].material = new THREE.MeshStandardMaterial({
    color: 0xeeeeff,
    roughness: 0.3,
    metalness: 0.5,
  });
  group.children[1].material = group.children[0].material;

  // Blue stripe
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.05, 0.15, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x2244aa, roughness: 0.4 })
  );
  stripe.position.set(0, 0.78, 0.3);
  group.add(stripe);

  // Light bar
  const barGeo = new THREE.BoxGeometry(1.2, 0.2, 0.5);
  const barMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const bar = new THREE.Mesh(barGeo, barMat);
  bar.position.set(0, 1.55, -0.1);
  group.add(bar);

  // Red and blue siren lights
  const redLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  redLight.position.set(-0.35, 1.7, -0.1);
  redLight.name = 'sirenRed';
  group.add(redLight);

  const blueLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x0044ff })
  );
  blueLight.position.set(0.35, 1.7, -0.1);
  blueLight.name = 'sirenBlue';
  group.add(blueLight);

  group.userData.isPolice = true;
  return group;
}

export { CAR_COLORS };
