/* Sky dome with golden-hour gradient and sun for Coralport */
import * as THREE from 'three';

export function createSky(scene) {
  const skyGeo = new THREE.SphereGeometry(500, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      sunDir: { value: new THREE.Vector3(0.4, 0.3, -0.5).normalize() },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 sunDir;
      varying vec3 vWorldPos;
      void main() {
        vec3 dir = normalize(vWorldPos);
        float y = dir.y;
        // Sky gradient from warm horizon to deep blue zenith
        vec3 zenith = vec3(0.15, 0.35, 0.65);
        vec3 horizon = vec3(0.95, 0.65, 0.35);
        vec3 ground = vec3(0.2, 0.18, 0.15);
        vec3 col;
        if (y > 0.0) {
          float t = pow(y, 0.4);
          col = mix(horizon, zenith, t);
        } else {
          col = mix(horizon, ground, min(-y * 4.0, 1.0));
        }
        // Sun glow
        float sunDot = max(dot(dir, sunDir), 0.0);
        col += vec3(1.0, 0.8, 0.4) * pow(sunDot, 64.0) * 2.0;
        col += vec3(1.0, 0.6, 0.2) * pow(sunDot, 8.0) * 0.4;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);
  return sky;
}

export function createLighting(scene) {
  const sunDir = new THREE.Vector3(0.4, 0.3, -0.5).normalize();
  const sun = new THREE.DirectionalLight(0xffe8c0, 2.0);
  sun.position.copy(sunDir.clone().multiplyScalar(200));
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -120;
  sun.shadow.camera.near = 50;
  sun.shadow.camera.far = 500;
  sun.shadow.bias = -0.001;
  scene.add(sun);
  scene.add(sun.target);

  const ambient = new THREE.AmbientLight(0x667799, 0.5);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x88aadd, 0x445533, 0.3);
  scene.add(hemi);

  // Warm golden-hour fog
  scene.fog = new THREE.FogExp2(0xd4a574, 0.0015);

  return { sun, ambient, hemi, sunDir };
}
