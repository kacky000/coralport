// Coralport — entry program for make.fun gta6-01 bounty.
// Copies the 3D open-world crime game (game/) and its 4 screenshots to the output directory,
// then writes dossier.json with the vendored buildDossier function. The game is set in the
// fictional coastal city of Coralport with five districts, six story missions, police chases,
// and a full HUD. Everything is procedural: geometry, textures, and audio — no external assets.
//
// Play locally:   node serve.ts     (opens at http://localhost:8080)
// Build output:   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

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
