/* Ocean and canal water for Coralport — animated plane with reflective shader */
import * as THREE from 'three';
import { HALF } from './cityLayout.js';

export function createWater(scene) {
  const waterGeo = new THREE.PlaneGeometry(1200, 400, 64, 32);
  const waterMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      time: { value: 0 },
      sunDir: { value: new THREE.Vector3(0.4, 0.3, -0.5).normalize() },
    },
    vertexShader: `
      uniform float time;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float wave1 = sin(pos.x * 0.05 + time * 0.8) * 0.6;
        float wave2 = sin(pos.y * 0.08 + time * 1.1) * 0.4;
        float wave3 = sin((pos.x + pos.y) * 0.03 + time * 0.5) * 0.8;
        pos.z += wave1 + wave2 + wave3;
        vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
        vNormal = normalize(normalMatrix * vec3(
          -cos(pos.x * 0.05 + time * 0.8) * 0.05 * 0.6 - cos((pos.x+pos.y)*0.03+time*0.5)*0.03*0.8,
          1.0,
          -cos(pos.y * 0.08 + time * 1.1) * 0.08 * 0.4 - cos((pos.x+pos.y)*0.03+time*0.5)*0.03*0.8
        ));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 sunDir;
      uniform float time;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUv;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        vec3 N = normalize(vNormal);
        // Fresnel
        float fresnel = pow(1.0 - max(dot(viewDir, N), 0.0), 3.0);
        vec3 deepColor = vec3(0.02, 0.15, 0.3);
        vec3 shallowColor = vec3(0.1, 0.4, 0.5);
        vec3 waterColor = mix(deepColor, shallowColor, fresnel);
        // Sun reflection
        vec3 refl = reflect(-sunDir, N);
        float spec = pow(max(dot(viewDir, refl), 0.0), 128.0);
        waterColor += vec3(1.0, 0.9, 0.7) * spec * 2.0;
        // Sparkle
        float sparkle = pow(max(dot(viewDir, refl), 0.0), 512.0) * 3.0;
        waterColor += vec3(1.0, 0.95, 0.8) * sparkle;
        float alpha = 0.75 + fresnel * 0.2;
        gl_FragColor = vec4(waterColor, alpha);
      }
    `,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.5, -HALF - 180);
  scene.add(water);

  // Canal water strips
  const canalGeo = new THREE.PlaneGeometry(10, 300, 8, 32);
  const canalPositions = [
    { x: -180, z: -HALF + 275 },
    { x: -220, z: -HALF + 275 },
  ];
  const canals = [];
  for (const cp of canalPositions) {
    const c = new THREE.Mesh(canalGeo, waterMat);
    c.rotation.x = -Math.PI / 2;
    c.position.set(cp.x, -0.2, cp.z);
    scene.add(c);
    canals.push(c);
  }

  return { water, canals, material: waterMat };
}

export function updateWater(waterObj, time) {
  waterObj.material.uniforms.time.value = time;
}
