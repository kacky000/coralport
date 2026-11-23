/* Mission manager — handles mission flow, markers, objectives, rewards */
import * as THREE from 'three';

export const MISSION_STATE = {
  AVAILABLE: 'available',
  ACTIVE: 'active',
  COMPLETED: 'completed',
};

export function createMissionSystem() {
  return {
    missions: [],
    activeMission: null,
    missionMarkers: [],
    objectiveText: '',
    dialogueText: '',
    dialogueSpeaker: '',
    dialogueTimer: 0,
    completedIds: new Set(),
  };
}

export function registerMission(missionSystem, mission) {
  missionSystem.missions.push(mission);
}

export function startMission(missionSystem, missionId, gameState) {
  const mission = missionSystem.missions.find(m => m.id === missionId);
  if (!mission || missionSystem.activeMission) return false;
  if (missionSystem.completedIds.has(missionId)) return false;

  missionSystem.activeMission = {
    ...mission,
    step: 0,
    timer: mission.timeLimit || 0,
    data: {},
  };
  missionSystem.objectiveText = mission.steps[0].objective;

  if (mission.steps[0].dialogue) {
    showDialogue(missionSystem, mission.steps[0].speaker, mission.steps[0].dialogue);
  }

  return true;
}

export function updateMissions(missionSystem, dt, gameState) {
  missionSystem.dialogueTimer -= dt;
  if (missionSystem.dialogueTimer <= 0) {
    missionSystem.dialogueText = '';
    missionSystem.dialogueSpeaker = '';
  }

  const active = missionSystem.activeMission;
  if (!active) return;

  // Timer countdown
  if (active.timer > 0) {
    active.timer -= dt;
    if (active.timer <= 0) {
      failMission(missionSystem, gameState);
      return;
    }
  }

  // Check current step completion
  const step = active.steps[active.step];
  if (step.checkComplete(gameState, active.data)) {
    active.step++;
    if (active.step >= active.steps.length) {
      completeMission(missionSystem, gameState);
    } else {
      const nextStep = active.steps[active.step];
      missionSystem.objectiveText = nextStep.objective;
      if (nextStep.dialogue) {
        showDialogue(missionSystem, nextStep.speaker, nextStep.dialogue);
      }
      if (nextStep.onStart) nextStep.onStart(gameState, active.data);
    }
  }
}

function completeMission(missionSystem, gameState) {
  const mission = missionSystem.activeMission;
  gameState.player.money += mission.reward;
  missionSystem.completedIds.add(mission.id);
  showDialogue(missionSystem, 'System', `Mission Complete! +$${mission.reward}`);
  missionSystem.objectiveText = '';
  missionSystem.activeMission = null;
}

function failMission(missionSystem, gameState) {
  showDialogue(missionSystem, 'System', 'Mission Failed — Time ran out!');
  missionSystem.objectiveText = '';
  missionSystem.activeMission = null;
}

function showDialogue(missionSystem, speaker, text) {
  missionSystem.dialogueSpeaker = speaker;
  missionSystem.dialogueText = text;
  missionSystem.dialogueTimer = 5;
}

export function createMissionMarker(scene, x, z, color) {
  const markerGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
  const markerMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
  const marker = new THREE.Mesh(markerGeo, markerMat);
  marker.position.set(x, 0.15, z);

  // Floating arrow above
  const arrowGeo = new THREE.ConeGeometry(0.4, 1.0, 8);
  const arrowMat = new THREE.MeshBasicMaterial({ color });
  const arrow = new THREE.Mesh(arrowGeo, arrowMat);
  arrow.position.set(x, 3.5, z);
  arrow.rotation.x = Math.PI; // point down

  const group = new THREE.Group();
  group.add(marker);
  group.add(arrow);
  scene.add(group);

  return { group, x, z, arrow };
}

export function updateMissionMarkers(markers, time) {
  for (const m of markers) {
    m.arrow.position.y = 3.5 + Math.sin(time * 3) * 0.5;
    m.arrow.rotation.y = time * 2;
  }
}

export function distToMission(px, pz, mx, mz) {
  return Math.sqrt((px - mx) ** 2 + (pz - mz) ** 2);
}
