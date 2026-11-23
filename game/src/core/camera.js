/* Third-person and chase camera for Coralport */
import * as THREE from 'three';
import { getMouseDelta, isPointerLocked } from './input.js';

const CAM_FOOT_DIST = 8;
const CAM_FOOT_HEIGHT = 4;
const CAM_CAR_DIST = 14;
const CAM_CAR_HEIGHT = 5;
const CAM_SMOOTH = 0.08;

let yaw = Math.PI;
let pitch = 0.3;
let currentPos = new THREE.Vector3();
let currentLookAt = new THREE.Vector3();
let initialized = false;

export function resetCamera(pos) {
  if (pos) {
    currentPos.copy(pos).add(new THREE.Vector3(0, CAM_FOOT_HEIGHT, CAM_FOOT_DIST));
    currentLookAt.copy(pos).add(new THREE.Vector3(0, 1.5, 0));
  }
  initialized = false;
}

export function updateCamera(camera, targetPos, inVehicle, dt, vehicleAngle) {
  if (!isPointerLocked() && !window.__shotMode) return;

  const md = getMouseDelta();
  const sens = 0.002;
  yaw -= md.x * sens;
  pitch -= md.y * sens;
  pitch = Math.max(-0.5, Math.min(1.2, pitch));

  const dist = inVehicle ? CAM_CAR_DIST : CAM_FOOT_DIST;
  const height = inVehicle ? CAM_CAR_HEIGHT : CAM_FOOT_HEIGHT;

  let camYaw = yaw;
  if (inVehicle && vehicleAngle !== undefined) {
    const diff = vehicleAngle + Math.PI - yaw;
    const wrapped = ((diff + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    camYaw = yaw + wrapped * 0.03;
    yaw = camYaw;
  }

  const idealX = targetPos.x + Math.sin(camYaw) * Math.cos(pitch) * dist;
  const idealZ = targetPos.z + Math.cos(camYaw) * Math.cos(pitch) * dist;
  const idealY = targetPos.y + height + Math.sin(pitch) * dist * 0.5;

  const idealPos = new THREE.Vector3(idealX, idealY, idealZ);
  const lookTarget = new THREE.Vector3(targetPos.x, targetPos.y + 1.5, targetPos.z);

  const t = initialized ? Math.min(1, CAM_SMOOTH * 60 * dt) : 1;
  currentPos.lerp(idealPos, t);
  currentLookAt.lerp(lookTarget, t);
  initialized = true;

  // Keep camera above ground
  if (currentPos.y < 1.5) currentPos.y = 1.5;

  camera.position.copy(currentPos);
  camera.lookAt(currentLookAt);
}

export function getYaw() { return yaw; }
export function setYaw(v) { yaw = v; }

export function setCameraForShot(camera, pos, lookAt) {
  camera.position.copy(pos);
  camera.lookAt(lookAt);
  currentPos.copy(pos);
  currentLookAt.copy(lookAt);
  initialized = true;
}
