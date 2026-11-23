/* Sound effects — synthesized with WebAudio: engine, gunshot, siren, impact, ui */

let audioCtx = null;
let masterGain = null;

export function initAudio() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  } catch {
    // Audio not supported
  }
}

export function resumeAudio() {
  if (audioCtx?.state === 'suspended') audioCtx.resume();
}

function playTone(freq, duration, type, volume, detune) {
  if (!audioCtx || !masterGain) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;
  gain.gain.setValueAtTime(volume || 0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration, volume) {
  if (!audioCtx || !masterGain) return;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume || 0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  source.connect(gain);
  gain.connect(masterGain);
  source.start();
}

export function playGunshot() {
  playNoise(0.15, 0.5);
  playTone(150, 0.1, 'sawtooth', 0.3);
}

export function playEngineLoop(speed) {
  if (!audioCtx || !masterGain) return;
  const freq = 60 + Math.abs(speed) * 3;
  playTone(freq, 0.05, 'sawtooth', 0.05 + Math.min(Math.abs(speed) * 0.003, 0.1));
}

export function playSiren() {
  playTone(800, 0.3, 'sine', 0.15);
  setTimeout(() => playTone(600, 0.3, 'sine', 0.15), 300);
}

export function playImpact() {
  playNoise(0.08, 0.4);
  playTone(100, 0.1, 'triangle', 0.2);
}

export function playPickup() {
  playTone(880, 0.1, 'sine', 0.2);
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.2), 100);
}

export function playMenuClick() {
  playTone(440, 0.08, 'sine', 0.15);
}

export function playMissionComplete() {
  playTone(523, 0.15, 'sine', 0.2);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 150);
  setTimeout(() => playTone(784, 0.3, 'sine', 0.25), 300);
}
