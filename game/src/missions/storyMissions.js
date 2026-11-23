/* Story missions for Coralport — 6 missions following Marco Reyes's story */
import { registerMission, startMission, createMissionMarker, distToMission } from './missionManager.js';

// Characters:
// Marco Reyes — protagonist, drifter from out of town
// Lucia Vega — runs the Sunset Shack beach bar, Marco's first contact
// Don Salazar — crime boss controlling Coralport's harbor operations
// Detective Cruz — corrupt cop playing both sides
// Tommy Kai — street racer, potential ally

const MISSION_LOCATIONS = {
  sunsetShack: { x: 20, z: -280 },     // Beach bar
  downtown: { x: 50, z: -150 },         // Downtown meeting
  harbor: { x: 250, z: -200 },          // Harbor district
  raceStart: { x: -100, z: -180 },      // Canal district race start
  mansion: { x: 0, z: 180 },            // Coral Heights mansion
  docks: { x: 280, z: -250 },           // Shipping docks
};

export function setupStoryMissions(missionSystem, scene) {
  const markers = [];

  // Mission 1: Welcome to Coralport
  registerMission(missionSystem, {
    id: 'welcome',
    title: 'Welcome to Coralport',
    reward: 200,
    steps: [
      {
        objective: 'Drive to the Sunset Shack on Palm Beach',
        speaker: 'Marco',
        dialogue: "I just got into town. Lucia said to meet her at the Sunset Shack on the beach...",
        checkComplete: (gs) => distToMission(gs.player.x, gs.player.z, MISSION_LOCATIONS.sunsetShack.x, MISSION_LOCATIONS.sunsetShack.z) < 8,
      },
      {
        objective: 'Talk to Lucia at the bar',
        speaker: 'Lucia Vega',
        dialogue: "Marco! You made it. Welcome to Coralport — it's paradise, if you know the right people. I've got work for you, but first, here's some cash to get settled.",
        checkComplete: (gs) => {
          gs._welcomeTimer = (gs._welcomeTimer || 0) + 0.016;
          return gs._welcomeTimer > 3;
        },
      },
    ],
  });
  markers.push(createMissionMarker(scene, MISSION_LOCATIONS.sunsetShack.x, MISSION_LOCATIONS.sunsetShack.z, 0x44aaff));

  // Mission 2: Package Run
  registerMission(missionSystem, {
    id: 'package',
    title: 'Package Run',
    reward: 500,
    timeLimit: 90,
    steps: [
      {
        objective: 'Pick up the package downtown',
        speaker: 'Lucia Vega',
        dialogue: "I need you to pick up a package from my contact downtown and bring it to the harbor before the boat leaves. Clock's ticking, Marco.",
        checkComplete: (gs, data) => {
          if (distToMission(gs.player.x, gs.player.z, MISSION_LOCATIONS.downtown.x, MISSION_LOCATIONS.downtown.z) < 8) {
            data.hasPackage = true;
            return true;
          }
          return false;
        },
      },
      {
        objective: 'Deliver the package to the harbor docks',
        speaker: 'Marco',
        dialogue: "Got the package. Now I need to get to the harbor before the ship departs.",
        checkComplete: (gs, data) => data.hasPackage && distToMission(gs.player.x, gs.player.z, MISSION_LOCATIONS.docks.x, MISSION_LOCATIONS.docks.z) < 10,
      },
      {
        objective: 'Package delivered!',
        speaker: 'Lucia Vega',
        dialogue: "Perfect delivery, Marco. Don Salazar will be pleased. He wants to meet you.",
        checkComplete: (gs) => {
          gs._packageTimer = (gs._packageTimer || 0) + 0.016;
          return gs._packageTimer > 3;
        },
      },
    ],
  });
  markers.push(createMissionMarker(scene, MISSION_LOCATIONS.downtown.x, MISSION_LOCATIONS.downtown.z, 0x44aaff));

  // Mission 3: Street Race
  registerMission(missionSystem, {
    id: 'race',
    title: "Tommy's Challenge",
    reward: 800,
    timeLimit: 60,
    steps: [
      {
        objective: 'Get in a car and drive to the race start in Canal District',
        speaker: 'Tommy Kai',
        dialogue: "Hey new guy! I heard you can drive. Prove it — race me through the canals. First one to the harbor wins.",
        checkComplete: (gs) => gs.inVehicle && distToMission(gs.player.x, gs.player.z, MISSION_LOCATIONS.raceStart.x, MISSION_LOCATIONS.raceStart.z) < 15,
      },
      {
        objective: 'Race to the Harbor!',
        speaker: 'Tommy Kai',
        dialogue: "GO! First one to the harbor wins!",
        checkComplete: (gs) => gs.inVehicle && distToMission(gs.player.x, gs.player.z, MISSION_LOCATIONS.harbor.x, MISSION_LOCATIONS.harbor.z) < 15,
        onStart: (gs) => { gs._raceStartTime = performance.now(); },
      },
    ],
  });
  markers.push(createMissionMarker(scene, MISSION_LOCATIONS.raceStart.x, MISSION_LOCATIONS.raceStart.z, 0xffaa00));

  // Mission 4: Harbor Heist
  registerMission(missionSystem, {
    id: 'heist',
    title: 'The Harbor Job',
    reward: 1500,
    steps: [
      {
        objective: 'Meet Don Salazar at the harbor',
        speaker: 'Don Salazar',
        dialogue: "Marco. Lucia speaks highly of you. I have a container coming in tonight that my... competitors want. Secure the docks.",
        checkComplete: (gs) => distToMission(gs.player.x, gs.player.z, MISSION_LOCATIONS.harbor.x, MISSION_LOCATIONS.harbor.z) < 10,
      },
      {
        objective: 'Eliminate the rival crew at the docks (shoot them!)',
        speaker: 'Marco',
        dialogue: "There they are. Time to clear them out.",
        checkComplete: (gs) => {
          gs._heistKills = (gs._heistKills || 0);
          if (gs.weaponState && gs.weaponState.fireTimer === gs.weaponState.fireTimer) {
            gs._heistTimer = (gs._heistTimer || 0) + 0.016;
          }
          return gs._heistTimer > 15;
        },
      },
      {
        objective: 'Drive the cargo to the warehouse downtown',
        speaker: 'Don Salazar',
        dialogue: "Good work. Now get that cargo to my warehouse downtown before the police arrive.",
        checkComplete: (gs) => gs.inVehicle && distToMission(gs.player.x, gs.player.z, MISSION_LOCATIONS.downtown.x, MISSION_LOCATIONS.downtown.z) < 12,
      },
    ],
  });
  markers.push(createMissionMarker(scene, MISSION_LOCATIONS.harbor.x, MISSION_LOCATIONS.harbor.z, 0xff4444));

  // Mission 5: Double Cross
  registerMission(missionSystem, {
    id: 'doublecross',
    title: 'Double Cross',
    reward: 2000,
    steps: [
      {
        objective: 'Answer the phone (press P)',
        speaker: 'Detective Cruz',
        dialogue: "This is Detective Cruz. I know what you did at the harbor. Meet me downtown or I'll put you away forever. Your choice.",
        checkComplete: (gs) => {
          gs._cruzTimer = (gs._cruzTimer || 0) + 0.016;
          return gs._cruzTimer > 4;
        },
      },
      {
        objective: 'Meet Detective Cruz downtown',
        speaker: 'Marco',
        dialogue: "A dirty cop... this can't be good. But I don't have a choice.",
        checkComplete: (gs) => distToMission(gs.player.x, gs.player.z, MISSION_LOCATIONS.downtown.x + 20, MISSION_LOCATIONS.downtown.z + 20) < 10,
      },
      {
        objective: 'Escape the police ambush! Lose your wanted level.',
        speaker: 'Detective Cruz',
        dialogue: "You're a loose end, Reyes. Take him out, boys!",
        checkComplete: (gs) => {
          if (!gs._ambushSet) {
            gs.wantedLevel = 3;
            gs._ambushSet = true;
          }
          return gs.wantedLevel === 0;
        },
      },
    ],
  });
  markers.push(createMissionMarker(scene, MISSION_LOCATIONS.downtown.x + 20, MISSION_LOCATIONS.downtown.z + 20, 0xff8800));

  // Mission 6: Final Showdown
  registerMission(missionSystem, {
    id: 'showdown',
    title: 'The Coral Crown',
    reward: 5000,
    steps: [
      {
        objective: 'Drive to the Coral Heights mansion',
        speaker: 'Lucia Vega',
        dialogue: "Marco, Cruz was working for a rival family. Don Salazar wants you to finish this — head to the mansion in Coral Heights. This is it.",
        checkComplete: (gs) => distToMission(gs.player.x, gs.player.z, MISSION_LOCATIONS.mansion.x, MISSION_LOCATIONS.mansion.z) < 12,
      },
      {
        objective: 'Clear the mansion grounds',
        speaker: 'Marco',
        dialogue: "This is for Coralport. No more running.",
        checkComplete: (gs) => {
          gs._showdownTimer = (gs._showdownTimer || 0) + 0.016;
          return gs._showdownTimer > 20;
        },
      },
      {
        objective: 'Return to the Sunset Shack to celebrate',
        speaker: 'Don Salazar',
        dialogue: "It's over. Coralport is ours now, Marco. You've earned your place here. Go celebrate.",
        checkComplete: (gs) => distToMission(gs.player.x, gs.player.z, MISSION_LOCATIONS.sunsetShack.x, MISSION_LOCATIONS.sunsetShack.z) < 10,
      },
    ],
  });
  markers.push(createMissionMarker(scene, MISSION_LOCATIONS.mansion.x, MISSION_LOCATIONS.mansion.z, 0xaa44ff));

  return markers;
}

export function checkMissionTriggers(missionSystem, gameState) {
  if (missionSystem.activeMission) return;

  // Auto-start first available mission based on progression
  const order = ['welcome', 'package', 'race', 'heist', 'doublecross', 'showdown'];
  for (const id of order) {
    if (!missionSystem.completedIds.has(id) && !missionSystem.activeMission) {
      const mission = missionSystem.missions.find(m => m.id === id);
      if (!mission) continue;

      // Check if player is near the mission start marker
      const loc = getMissionStartLocation(id);
      if (loc) {
        const dist = Math.sqrt(
          (gameState.player.x - loc.x) ** 2 + (gameState.player.z - loc.z) ** 2
        );
        if (dist < 8) {
          startMission(missionSystem, id, gameState);
          return;
        }
      }
      break; // Only check the next available mission
    }
  }
}

function getMissionStartLocation(id) {
  const starts = {
    welcome: MISSION_LOCATIONS.sunsetShack,
    package: MISSION_LOCATIONS.downtown,
    race: MISSION_LOCATIONS.raceStart,
    heist: MISSION_LOCATIONS.harbor,
    doublecross: MISSION_LOCATIONS.downtown,
    showdown: MISSION_LOCATIONS.mansion,
  };
  return starts[id];
}

export function getNextMissionLocation(missionSystem) {
  const order = ['welcome', 'package', 'race', 'heist', 'doublecross', 'showdown'];
  for (const id of order) {
    if (!missionSystem.completedIds.has(id)) {
      return getMissionStartLocation(id);
    }
  }
  return null;
}

export { MISSION_LOCATIONS };
