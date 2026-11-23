/* Arcade car physics — acceleration, braking, steering, drift, collision */
import * as THREE from 'three';
import { getBuildingCollisions } from '../world/buildings.js';

const MAX_SPEED = 35;
const ACCELERATION = 18;
const BRAKE_FORCE = 25;
const FRICTION = 0.98;
const TURN_SPEED = 2.5;
const DRIFT_FACTOR = 0.92;
const REVERSE_MAX = 10;

export function createCarState() {
  return {
    x: 0, z: 0, y: 0.3,
    angle: 0,
    speed: 0,
    steerAngle: 0,
    drifting: false,
    health: 100,
    mesh: null,
  };
}

export function updateCarPhysics(car, accel, brake, steerInput, handbrake, dt, buildings) {
  // Steering
  const speedFactor = Math.min(Math.abs(car.speed) / 15, 1);
  const turnRate = TURN_SPEED * speedFactor * (1 + (handbrake ? 0.5 : 0));
  car.steerAngle = steerInput * turnRate;

  // Acceleration / braking
  if (accel) {
    car.speed += ACCELERATION * dt;
    if (car.speed > MAX_SPEED) car.speed = MAX_SPEED;
  }
  if (brake) {
    if (car.speed > 0.5) {
      car.speed -= BRAKE_FORCE * dt;
    } else {
      car.speed -= ACCELERATION * 0.5 * dt;
      if (car.speed < -REVERSE_MAX) car.speed = -REVERSE_MAX;
    }
  }

  // Handbrake drift
  car.drifting = handbrake && Math.abs(car.speed) > 5;
  const driftMult = car.drifting ? DRIFT_FACTOR : 1.0;

  // Friction
  if (!accel && !brake) {
    car.speed *= FRICTION;
    if (Math.abs(car.speed) < 0.1) car.speed = 0;
  }

  // Update angle
  if (Math.abs(car.speed) > 0.5) {
    car.angle += car.steerAngle * dt * Math.sign(car.speed) * driftMult;
  }

  // Move
  const dx = Math.sin(car.angle) * car.speed * dt;
  const dz = Math.cos(car.angle) * car.speed * dt;
  const newX = car.x + dx;
  const newZ = car.z + dz;

  // Building collision
  if (buildings) {
    const hit = getBuildingCollisions(buildings, newX, newZ, 1.8);
    if (hit) {
      car.speed *= -0.3;
      car.health -= Math.abs(car.speed) * 0.5;
      return;
    }
  }

  car.x = newX;
  car.z = newZ;

  // Keep in city bounds
  const BOUND = 380;
  if (car.x < -BOUND) { car.x = -BOUND; car.speed *= 0.3; }
  if (car.x > BOUND) { car.x = BOUND; car.speed *= 0.3; }
  if (car.z < -BOUND) { car.z = -BOUND; car.speed *= 0.3; }
  if (car.z > BOUND) { car.z = BOUND; car.speed *= 0.3; }

  // Update mesh
  if (car.mesh) {
    car.mesh.position.set(car.x, car.y, car.z);
    car.mesh.rotation.y = car.angle;
    // Slight body roll during turns
    car.mesh.rotation.z = -car.steerAngle * 0.03 * speedFactor;
  }
}

export function getCarForward(car) {
  return new THREE.Vector3(Math.sin(car.angle), 0, Math.cos(car.angle));
}

export { MAX_SPEED };
