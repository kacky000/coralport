// Coralport entry program — copies the game files and screenshots to the output directory,
// then writes the dossier that the judge reads. The game itself is a 3D open-world crime game
// built with three.js, set in the fictional coastal city of Coralport. All geometry is procedural,
// all sound is synthesized with WebAudio, and there are no external assets.
//
// To test locally:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// To play:
//   node serve.ts
//   open http://localhost:8080

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Create output structure and copy game files
mkdirSync(outputDir, { recursive: true });
cpSync(join(root, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Write the dossier for the judge — describes game structure and embeds screenshots
const dossierJson = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierJson);
console.log('Coralport entry written to', outputDir);
