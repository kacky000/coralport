/* In-car radio — procedural music with WebAudio (ambient beats and basslines) */

let radioCtx = null;
let radioGain = null;
let isPlaying = false;
let currentStation = 0;
let loopTimer = null;

const STATIONS = [
  { name: 'Coral FM', bpm: 120, style: 'tropical' },
  { name: 'Harbor Beats', bpm: 100, style: 'chill' },
  { name: 'Downtown Radio', bpm: 140, style: 'electronic' },
];

export function getStationName() {
  return STATIONS[currentStation].name;
}

export function startRadio(audioCtx) {
  radioCtx = audioCtx;
  if (!radioCtx) return;
  radioGain = radioCtx.createGain();
  radioGain.gain.value = 0.08;
  radioGain.connect(radioCtx.destination);
  isPlaying = true;
  playBeat();
}

export function stopRadio() {
  isPlaying = false;
  if (loopTimer) clearTimeout(loopTimer);
}

export function switchStation() {
  currentStation = (currentStation + 1) % STATIONS.length;
}

function playBeat() {
  if (!isPlaying || !radioCtx || !radioGain) return;

  const station = STATIONS[currentStation];
  const beatInterval = 60000 / station.bpm;

  // Kick drum (low-frequency thump)
  playDrum(radioCtx, radioGain, 60, 0.1, 0.15);

  // Hi-hat on offbeats
  setTimeout(() => {
    if (isPlaying) playHiHat(radioCtx, radioGain, 0.05);
  }, beatInterval / 2);

  // Bass note every other beat
  if (Math.random() > 0.5) {
    const notes = station.style === 'tropical' ? [65, 73, 82, 98] : [55, 65, 73, 87];
    const note = notes[Math.floor(Math.random() * notes.length)];
    playBass(radioCtx, radioGain, note, beatInterval / 1000 * 0.8);
  }

  loopTimer = setTimeout(() => playBeat(), beatInterval);
}

function playDrum(ctx, dest, freq, duration, volume) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 2, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 0.03);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(dest);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playHiHat(ctx, dest, volume) {
  const bufSize = ctx.sampleRate * 0.03;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(hp);
  hp.connect(gain);
  gain.connect(dest);
  src.start();
}

function playBass(ctx, dest, freq, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 200;
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(lp);
  lp.connect(gain);
  gain.connect(dest);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}
